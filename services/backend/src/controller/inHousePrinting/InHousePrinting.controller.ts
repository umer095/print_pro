import type{ Request,Response } from "express"
import pool from "../../server.js";

// POST /printing-jobs - Create a new printing job for the authenticated tenant
export const createPrintingJob = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const {
      product_name,
      shirt_type,
      print_type,
      design_name,
      color_count,
      quantity_printed,
      machine_name,
      operator_id,
      print_date,
      status,
    } = req.body;

    if (!tenantId) {
      return res.status(401).json({ message: "Tenant not found" });
    }

    if (
      !product_name ||
      !shirt_type ||
      !print_type ||
      !design_name ||
      color_count === undefined ||
      quantity_printed === undefined ||
      !machine_name ||
      !operator_id ||
      !print_date ||
      !status
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Optional: Verify operator_id belongs to the same tenant
    const operatorCheck = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND tenant_id = $2`,
      [operator_id, tenantId]
    );
    if (operatorCheck.rowCount === 0) {
      return res.status(400).json({ message: "Invalid operator ID" });
    }

    const result = await pool.query(
      `INSERT INTO printing_jobs (
        tenant_id, product_name, shirt_type, print_type, design_name,
        color_count, quantity_printed, machine_name, operator_id,
        print_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        tenantId,
        product_name,
        shirt_type,
        print_type,
        design_name,
        color_count,
        quantity_printed,
        machine_name,
        operator_id,
        print_date,
        status,
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating printing job:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// GET /printing-jobs - Fetch all printing jobs for the authenticated tenant
export const getAllPrintingJobs = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: "Tenant not found" });
    }

    const result = await pool.query(
      `SELECT * FROM printing_jobs WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    console.error("Error fetching printing jobs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};