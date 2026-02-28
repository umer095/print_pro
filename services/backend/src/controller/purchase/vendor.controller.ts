import type { Request, Response } from "express";
import pool from "../../server.js"; // Adjust path as needed

// Get all vendors for a tenant
export const getVendors = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { status, search, page = 1, limit = 10 } = req.query;

    let query = `
      SELECT 
        v.*,
        u.full_name as created_by_name,
        COUNT(vo.id) as total_orders,
        COALESCE(SUM(vo.order_amount), 0) as total_order_amount
      FROM vendors v
      LEFT JOIN users u ON v.created_by = u.id
      LEFT JOIN vendor_orders vo ON v.id = vo.vendor_id AND vo.tenant_id = v.tenant_id
      WHERE v.tenant_id = $1
    `;

    const queryParams: any[] = [tenantId];
    let paramCount = 1;
    
    // Filter by status
    if (status) {
      paramCount++;
      query += ` AND v.status = $${paramCount}`;
      queryParams.push(status);
    }

    // Search by vendor name, contact person, or vendor code
    if (search) {
      paramCount++;
      query += ` AND (v.vendor_name ILIKE $${paramCount} OR v.contact_person ILIKE $${paramCount} OR v.vendor_code ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    query += ` GROUP BY v.id, u.full_name ORDER BY v.created_at DESC`;

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM vendors
      WHERE tenant_id = $1
      ${status ? `AND status = $2` : ""}
      ${search ? `AND (vendor_name ILIKE $${status ? 3 : 2} OR contact_person ILIKE $${status ? 3 : 2} OR vendor_code ILIKE $${status ? 3 : 2})` : ""}
    `;
    const countParams: any[] = [tenantId];
    if (status) countParams.push(status);
    if (search) countParams.push(`%${search}%`);

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.status(200).json({
      vendors: result.rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create vendor
export const createVendor = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    const {
      vendor_code,
      vendor_name,
      contact_person,
      email,
      phone_number,
      address,
      gst_number,
      credit_days,
      payment_terms,
      notes,
    } = req.body;

    // Validation
    if (!vendor_code || !vendor_name) {
      return res.status(400).json({
        message: "Vendor code and vendor name are required",
      });
    }

    // Check if vendor code already exists for this tenant
    const checkQuery = `
      SELECT id FROM vendors 
      WHERE vendor_code = $1 AND tenant_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [vendor_code, tenantId]);

    if (checkResult.rows.length > 0) {
      return res.status(409).json({
        message: "Vendor code already exists",
      });
    }

    // Check if GST number already exists (if provided)
    if (gst_number) {
      const gstCheck = await pool.query(
        `SELECT id FROM vendors WHERE gst_number = $1`,
        [gst_number]
      );
      if (gstCheck.rows.length > 0) {
        return res.status(409).json({
          message: "GST number already exists",
        });
      }
    }

    const query = `
      INSERT INTO vendors (
        tenant_id, vendor_code, vendor_name, contact_person,
        email, phone_number, address, gst_number,
        credit_days, payment_terms, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      tenantId,
      vendor_code,
      vendor_name,
      contact_person || null,
      email || null,
      phone_number || null,
      address || null,
      gst_number || null,
      credit_days || 30,
      payment_terms || null,
      notes || null,
      userId,
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Vendor created successfully",
      vendor: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating vendor:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update vendor
export const updateVendor = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.query;
     // Debug logging
    console.log("=== UPDATE VENDOR DEBUG ===");
    console.log("Vendor ID from params:", id);
    console.log("Tenant ID from user:", tenantId);
    console.log("User object:", req.user);
    console.log("Request body:", req.body);
    const {
      vendor_name,
      contact_person,
      email,
      phone_number,
      address,
      gst_number,
      credit_days,
      payment_terms,
      rating,
      status,
      notes,
    } = req.body;

    // Check if vendor exists and belongs to tenant
    const checkQuery = `
      SELECT id FROM vendors 
      WHERE id = $1 AND tenant_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [id, tenantId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Check if GST number already exists for another vendor (if updating)
    if (gst_number) {
      const gstCheck = await pool.query(
        `SELECT id FROM vendors WHERE gst_number = $1 AND id != $2`,
        [gst_number, id]
      );
      if (gstCheck.rows.length > 0) {
        return res.status(409).json({
          message: "GST number already exists for another vendor",
        });
      }
    }

    const query = `
      UPDATE vendors
      SET 
        vendor_name = COALESCE($1, vendor_name),
        contact_person = COALESCE($2, contact_person),
        email = COALESCE($3, email),
        phone_number = COALESCE($4, phone_number),
        address = COALESCE($5, address),
        gst_number = COALESCE($6, gst_number),
        credit_days = COALESCE($7, credit_days),
        payment_terms = COALESCE($8, payment_terms),
        rating = COALESCE($9, rating),
        status = COALESCE($10, status),
        notes = COALESCE($11, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12 AND tenant_id = $13
      RETURNING *
    `;

    const values = [
      vendor_name,
      contact_person,
      email,
      phone_number,
      address,
      gst_number,
      credit_days,
      payment_terms,
      rating,
      status,
      notes,
      id,
      tenantId,
    ];

    const result = await pool.query(query, values);

    res.status(200).json({
      message: "Vendor updated successfully",
      vendor: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating vendor:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete vendor
export const deleteVendor = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.query;

    // Check if vendor exists and belongs to tenant
    const checkQuery = `
      SELECT id FROM vendors 
      WHERE id = $1 AND tenant_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [id, tenantId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Check if vendor has active orders
    const ordersQuery = `
      SELECT COUNT(*) as count 
      FROM vendor_orders 
      WHERE vendor_id = $1 AND order_status = 'active'
    `;
    const ordersResult = await pool.query(ordersQuery, [id]);

    if (parseInt(ordersResult.rows[0].count) > 0) {
      return res.status(400).json({
        message: "Cannot delete vendor with active orders. Please complete or cancel all orders first.",
      });
    }

    // Soft delete by setting status to inactive (recommended)
    const query = `
      UPDATE vendors
      SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;

    // Or hard delete (use with caution)
    // const query = `DELETE FROM vendors WHERE id = $1 AND tenant_id = $2 RETURNING *`;

    const result = await pool.query(query, [id, tenantId]);

    res.status(200).json({
      message: "Vendor deleted successfully",
      vendor: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

