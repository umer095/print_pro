import type { Request, Response } from "express";
import pool from "../server.js"; // Adjust path to your database config

// ==================== CREATE INVENTORY ====================
export const createInventory = async (req: Request, res: Response) => {
  try {
    const { product_name, sku, hsn_no, item_gst, quantity, unit_price } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    // Validation
    if (!product_name || !sku || quantity === undefined || unit_price === undefined) {
      return res.status(400).json({
        message: "Missing required fields: product_name, sku, quantity, unit_price"
      });
    }

    // Check if SKU already exists for this tenant
    const existingItem = await pool.query(
      "SELECT id FROM inventory WHERE sku = $1 AND tenant_id = $2",
      [sku, tenantId]
    );

    if (existingItem.rows.length > 0) {
      return res.status(409).json({
        message: "SKU already exists for your organization"
      });
    }

    // Insert new inventory item
    const result = await pool.query(
      `INSERT INTO inventory 
        (tenant_id, product_name, sku, hsn_no, item_gst, quantity, unit_price, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [tenantId, product_name, sku, hsn_no || null, item_gst || 0, quantity, unit_price, userId]
    );

    return res.status(201).json({
      message: "Inventory item created successfully",
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error("Create inventory error:", error);
    
    if (error.code === "23505") { // Unique violation
      return res.status(409).json({ message: "SKU already exists" });
    }
    
    return res.status(500).json({
      message: "Failed to create inventory item",
      error: error.message
    });
  }
};

// ==================== GET ALL INVENTORY ====================
export const getInventory = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { 
      search, 
      page = 1, 
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        i.id,
        i.product_name,
        i.sku,
        i.hsn_no,
        i.item_gst,
        i.quantity,
        i.unit_price,
        i.created_at,
        i.updated_at,
        u.full_name as created_by_name
      FROM inventory i
      LEFT JOIN users u ON i.created_by = u.id
      WHERE i.tenant_id = $1
    `;

    const queryParams: any[] = [tenantId];
    let paramIndex = 2;

    // Search functionality
    if (search) {
      query += ` AND (
        i.product_name ILIKE $${paramIndex} OR 
        i.sku ILIKE $${paramIndex} OR 
        i.hsn_no ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Sorting
    const allowedSortFields = ['product_name', 'sku', 'quantity', 'unit_price', 'created_at'];
    const sortField = allowedSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY i.${sortField} ${order}`;

    // Pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(Number(limit), offset);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM inventory 
      WHERE tenant_id = $1 
      ${search ? `AND (product_name ILIKE $2 OR sku ILIKE $2 OR hsn_no ILIKE $2)` : ''}
    `;
    const countParams = search ? [tenantId, `%${search}%`] : [tenantId];
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // Get inventory items
    const result = await pool.query(query, queryParams);

    return res.status(200).json({
      message: "Inventory retrieved successfully",
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error("Get inventory error:", error);
    return res.status(500).json({
      message: "Failed to retrieve inventory",
      error: error.message
    });
  }
};