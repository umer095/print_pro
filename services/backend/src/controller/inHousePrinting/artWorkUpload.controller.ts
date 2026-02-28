import type { Request, Response } from 'express';
import axios from 'axios';
import FormData from 'form-data';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from '../../server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * UPDATED: This controller now works with the new Python backend
 * Changes:
 * 1. Uses widths_in instead of heights_in
 * 2. Heights are optional (sent as "None" if not provided)
 * 3. Margin is in cm instead of inches
 * 4. Added sheet_height_in parameter
 * 5. Response format changed to include PNG and PDF separately
 */
export const arrangeAndStoreArtwork = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || 1; 

    const { 
        widths_in,      // NEW: Required widths instead of heights
        heights_in,     // NEW: Optional heights
        quantities, 
        sheet_width_in, 
        sheet_height_in, // NEW: Max sheet height
        dpi, 
        spacing_in, 
        margin_cm,      // NEW: Margin in cm instead of inches
    } = req.body;

    console.log("Received request body:", req.body);

    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded. Check if your field name is 'files'" });
    }

    try {
        // Build FormData for Python backend
        const pythonFormData = new FormData();
        
        files.forEach(file => {
            pythonFormData.append('files', file.buffer, {
                filename: file.originalname,
                contentType: file.mimetype,
            });
        });
        
        // NEW: Send widths instead of heights
        pythonFormData.append('widths_in', widths_in);
        pythonFormData.append('heights_in', heights_in || ''); // Optional
        pythonFormData.append('quantities', quantities);
        pythonFormData.append('sheet_width_in', sheet_width_in);
        pythonFormData.append('sheet_height_in', sheet_height_in || '80');
        pythonFormData.append('dpi', dpi);
        pythonFormData.append('spacing_in', spacing_in);
        pythonFormData.append('margin_cm', margin_cm); // NEW: cm instead of inches

        // Call Python Engine
        const engineResponse = await axios.post("http://127.0.0.1:8000/arrange", pythonFormData, {
            headers: pythonFormData.getHeaders(),
        });

        const result = engineResponse.data;

        console.log("Python backend response:", result);

        // START DATABASE TRANSACTION
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const jobRes = await client.query(
                `INSERT INTO artwork_jobs (user_id, sheet_width, dpi) VALUES ($1, $2, $3) RETURNING id`,
                [userId, sheet_width_in, dpi]
            );
            const jobId = jobRes.rows[0].id;

            // NEW: Result format changed - now includes both PNG and PDF
            for (const sheet of result.sheets) {
                // Download both PNG and PDF
                const pngUrl = `http://127.0.0.1:8000${sheet.png}`;
                const pdfUrl = `http://127.0.0.1:8000${sheet.pdf}`;
                
                const pngFilename = sheet.png.split('/').pop();
                const pdfFilename = sheet.pdf.split('/').pop();
                
                const projectRoot = process.cwd(); 
                const uploadDir = join(projectRoot, 'uploads', 'artWorkImages');

                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                // Download PNG
                const pngPath = join(uploadDir, pngFilename);
                const pngRes = await axios.get(pngUrl, { responseType: 'arraybuffer' });
                fs.writeFileSync(pngPath, pngRes.data);

                // Download PDF
                const pdfPath = join(uploadDir, pdfFilename);
                const pdfRes = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
                fs.writeFileSync(pdfPath, pdfRes.data);

                // Store both files in database
                await client.query(
                    `INSERT INTO generated_sheets (job_id, file_name, file_path, file_format, printed_height_in, sheet_number) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [jobId, pngFilename, `/uploads/${pngFilename}`, 'PNG', sheet.printed_height_in, sheet.sheet]
                );

                await client.query(
                    `INSERT INTO generated_sheets (job_id, file_name, file_path, file_format, printed_height_in, sheet_number) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [jobId, pdfFilename, `/uploads/${pdfFilename}`, 'PDF', sheet.printed_height_in, sheet.sheet]
                );
            }

            await client.query('COMMIT');
            
            res.status(200).json({
                status: 'success',
                message: 'Sheets generated and stored',
                jobId,
                total_sheets: result.total_sheets,
                unplaced_logos: result.unplaced_logos,
                sheets: result.sheets
            });

        } catch (dbErr: any) {
            await client.query('ROLLBACK');
            console.error("Database error:", dbErr);
            throw dbErr;
        } finally {
            client.release();
        }

    } catch (error: any) {
        console.error("Error in Artwork Controller:", error.message);
        res.status(500).json({ 
            error: error.message || "Internal Server Error",
            details: error.response?.data || error.stack
        });
    }
};

export const getUserHistory = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || 1; 
    try {
        const query = `
            SELECT 
                j.id as job_id,
                j.sheet_width, 
                j.dpi,
                j.created_at,
                s.file_name, 
                s.file_path as storage_path, 
                s.file_format,
                s.printed_height_in,
                s.sheet_number
            FROM artwork_jobs j
            JOIN generated_sheets s ON j.id = s.job_id
            WHERE j.user_id = $1
            ORDER BY j.created_at DESC, s.sheet_number ASC`;
        
        const history = await pool.query(query, [userId]);
        
        // Group by job
        const groupedHistory = history.rows.reduce((acc: any, row: any) => {
            const jobId = row.job_id;
            if (!acc[jobId]) {
                acc[jobId] = {
                    job_id: jobId,
                    sheet_width: row.sheet_width,
                    dpi: row.dpi,
                    created_at: row.created_at,
                    sheets: []
                };
            }
            acc[jobId].sheets.push({
                file_name: row.file_name,
                storage_path: row.storage_path,
                file_format: row.file_format,
                printed_height_in: row.printed_height_in,
                sheet_number: row.sheet_number
            });
            return acc;
        }, {});

        res.json(Object.values(groupedHistory));
    } catch (err: any) {
        console.error("Error fetching history:", err);
        res.status(500).json({ error: err.message });
    }
};