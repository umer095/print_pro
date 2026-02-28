import type { Request, Response } from "express";
import pool from "../../server.js";

// QC Status type
type QCStatus = "PENDING" | "PASSED" | "PARTIAL_HOLD";

// Receiving Status type
type ReceivingStatus = "COMPLETED" | "PARTIAL" | "PENDING";

// GRN Item interface
interface GRNItem {
  item_id: number;
  ordered_qty: number;
  received_qty: number;
  rejected_qty: number;
}

// Helper function to compute receiving status
function computeReceivingStatus(items: any[]): ReceivingStatus {
  if (!items || items.length === 0) return "PENDING";
  
  let hasPartial = false;
  let hasCompleted = false;
  
  for (const item of items) {
    const { ordered_qty, received_qty } = item;
    if (ordered_qty > 0 && received_qty < ordered_qty) {
      hasPartial = true;
    }
    if (ordered_qty > 0 && received_qty >= ordered_qty) {
      hasCompleted = true;
    }
  }
  
  if (hasPartial) return "PARTIAL";
  if (hasCompleted) return "COMPLETED";
  return "PENDING";
}

// Helper function to format GRN number
function formatGRNNumber(id: number): string {
  const year = new Date().getFullYear();
  return `GRN-${year}-${id.toString().padStart(4, '0')}`;
}

// Helper function to calculate total value
function calculateTotalValue(items: any[], itemsDetails: any[]): number {
  if (!itemsDetails || itemsDetails.length === 0) return 0;
  
  let total = 0;
  for (const item of itemsDetails) {
    const receivedQty = item.received_qty || 0;
    const unitPrice = item.unit_price || 0;
    total += receivedQty * unitPrice;
  }
  return total;
}

// Create GRN with items
export const createGRN = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    const { purchase_order_id, vendor_id, received_date, remarks, items } = req.body;
    const tenantId = req.user?.tenantId;

    // Validation
    if (!purchase_order_id || !vendor_id || !received_date || !items || !Array.isArray(items)) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: purchase_order_id, vendor_id, received_date, items (array)"
      });
      return;
    }

    if (items.length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one item is required"
      });
      return;
    }

    // Validate each item
    for (const item of items) {
      if (!item.item_id || item.received_qty === undefined) {
        res.status(400).json({
          success: false,
          message: "Each item must have item_id and received_qty"
        });
        return;
      }
    }

    await client.query("BEGIN");

    // Insert GRN header
    const grnResult = await client.query(
      `INSERT INTO grns 
        (tenant_id, purchase_order_id, vendor_id, received_date, qc_status, remarks)
       VALUES ($1, $2, $3, $4, 'PENDING', $5)
       RETURNING *`,
      [tenantId, purchase_order_id, vendor_id, received_date, remarks || null]
    );

    const grn = grnResult.rows[0];

    // Insert GRN items
    const insertedItems = [];
    for (const item of items) {
      const itemResult = await client.query(
        `INSERT INTO grn_items 
          (grn_id, item_id, ordered_qty, received_qty, rejected_qty)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [grn.id, item.item_id, item.ordered_qty || 0, item.received_qty, item.rejected_qty || 0]
      );
      insertedItems.push(itemResult.rows[0]);
    }

    await client.query("COMMIT");

    // Fetch item details for response
    const itemsWithDetails = [];
    for (const item of insertedItems) {
      const itemDetailResult = await pool.query(
        `SELECT i.id, i.name, i.sku, i.unit, i.unit_price 
         FROM items i WHERE i.id = $1`,
        [item.item_id]
      );
      itemsWithDetails.push({
        ...item,
        item_name: itemDetailResult.rows[0]?.name,
        item_sku: itemDetailResult.rows[0]?.sku,
        unit: itemDetailResult.rows[0]?.unit,
        unit_price: itemDetailResult.rows[0]?.unit_price
      });
    }

    // Compute receiving status
    const receivingStatus = computeReceivingStatus(insertedItems);
    const totalValue = calculateTotalValue(insertedItems, itemsWithDetails);

    res.status(201).json({
      success: true,
      message: "GRN created successfully",
      data: {
        id: grn.id,
        grn_number: formatGRNNumber(grn.id),
        purchase_order_id: grn.purchase_order_id,
        vendor_id: grn.vendor_id,
        received_date: grn.received_date,
        qc_status: grn.qc_status,
        receiving_status: receivingStatus,
        remarks: grn.remarks,
        total_items: insertedItems.length,
        total_value: totalValue,
        items: itemsWithDetails,
        created_at: grn.created_at,
        updated_at: grn.updated_at
      }
    });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Create GRN error:", error);
    
    if (error.code === "23503") {
      res.status(400).json({
        success: false,
        message: "Referenced purchase_order_id or vendor_id does not exist"
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to create GRN",
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Get all GRNs with computed fields
export const getAllGRNs = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const { 
      page = 1, 
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      start_date,
      end_date,
      vendor_id,
      qc_status,
      search
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build WHERE clause
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (tenantId) {
      whereConditions.push(`g.tenant_id = $${paramIndex}`);
      queryParams.push(tenantId);
      paramIndex++;
    }

    // Date range filter
    if (start_date) {
      whereConditions.push(`g.received_date >= $${paramIndex}`);
      queryParams.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereConditions.push(`g.received_date <= $${paramIndex}`);
      queryParams.push(end_date);
      paramIndex++;
    }

    // Vendor filter
    if (vendor_id) {
      whereConditions.push(`g.vendor_id = $${paramIndex}`);
      queryParams.push(Number(vendor_id));
      paramIndex++;
    }

    // QC status filter
    if (qc_status) {
      whereConditions.push(`g.qc_status = $${paramIndex}`);
      queryParams.push(qc_status);
      paramIndex++;
    }

    // Search filter (GRN number or vendor name)
    if (search) {
      whereConditions.push(`(
        CONCAT('GRN-', EXTRACT(YEAR FROM g.created_at), '-', LPAD(g.id::TEXT, 4, '0')) ILIKE $${paramIndex} OR
        v.name ILIKE $${paramIndex} OR
        po.order_number ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Main query with computed fields
    const query = `
      SELECT 
        g.id,
        g.purchase_order_id,
        g.vendor_id,
        g.received_date,
        g.qc_status,
        g.remarks,
        g.created_at,
        g.updated_at,
        po.order_number as purchase_order_number,
        v.name as vendor_name,
        (
          SELECT COUNT(*) 
          FROM grn_items gi 
          WHERE gi.grn_id = g.id
        ) as total_items,
        (
          SELECT COALESCE(SUM(gi.received_qty * i.unit_price), 0)
          FROM grn_items gi
          LEFT JOIN items i ON gi.item_id = i.id
          WHERE gi.grn_id = g.id
        ) as total_value
      FROM grns g
      LEFT JOIN purchase_orders po ON g.purchase_order_id = po.id
      LEFT JOIN vendors v ON g.vendor_id = v.id
      ${whereClause}
    `;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM grns g
      LEFT JOIN vendors v ON g.vendor_id = v.id
      LEFT JOIN purchase_orders po ON g.purchase_order_id = po.id
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Sorting
    const allowedSortFields = ['id', 'received_date', 'qc_status', 'created_at', 'total_value'];
    const sortField = allowedSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    
    const sortedQuery = `${query} ORDER BY g.${sortField} ${order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(Number(limit), offset);

    const result = await pool.query(sortedQuery, queryParams);

    // Transform rows to include computed fields
    const transformedData = result.rows.map(row => {
      const total_items = parseInt(row.total_items) || 0;
      const total_value = parseFloat(row.total_value) || 0;
      
      // Compute receiving status based on items
      const receiving_status = computeReceivingStatus([row]);
      
      return {
        id: row.id,
        grn_number: formatGRNNumber(row.id),
        grn_date: row.received_date,
        vendor_name: row.vendor_name,
        purchase_order_number: row.purchase_order_number,
        qc_status: row.qc_status,
        receiving_status: receiving_status,
        total_items: total_items,
        total_value: parseFloat(total_value.toFixed(2)),
        remarks: row.remarks,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    });

    res.status(200).json({
      success: true,
      message: "GRNs retrieved successfully",
      data: transformedData,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error("Get all GRNs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve GRNs",
      error: error.message
    });
  }
};

// Get GRN by ID with computed receiving status
export const getGRNById = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const { grnId } = req.params;

    // Get GRN header with vendor and PO details
    const grnResult = await pool.query(
      `SELECT 
        g.id,
        g.purchase_order_id,
        g.vendor_id,
        g.received_date,
        g.qc_status,
        g.remarks,
        g.created_at,
        g.updated_at,
        po.order_number as purchase_order_number,
        po.order_date as purchase_order_date,
        po.expected_date as purchase_order_expected_date,
        v.name as vendor_name,
        v.contact_person as vendor_contact,
        v.phone as vendor_phone,
        v.email as vendor_email,
        v.address as vendor_address
      FROM grns g
      LEFT JOIN purchase_orders po ON g.purchase_order_id = po.id
      LEFT JOIN vendors v ON g.vendor_id = v.id
      WHERE g.id = $1 AND g.tenant_id = $2`,
      [grnId, tenantId]
    );

    if (grnResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "GRN not found"
      });
      return;
    }

    const grn = grnResult.rows[0];

    // Get GRN items with item details
    const itemsResult = await pool.query(
      `SELECT 
        gi.id,
        gi.item_id,
        gi.ordered_qty,
        gi.received_qty,
        gi.rejected_qty,
        i.name as item_name,
        i.sku as item_sku,
        i.unit,
        i.unit_price
      FROM grn_items gi
      LEFT JOIN items i ON gi.item_id = i.id
      WHERE gi.grn_id = $1`,
      [grnId]
    );

    const items = itemsResult.rows.map(item => ({
      id: item.id,
      item_id: item.item_id,
      item_name: item.item_name,
      item_sku: item.item_sku,
      unit: item.unit,
      unit_price: parseFloat(item.unit_price) || 0,
      ordered_qty: item.ordered_qty,
      received_qty: item.received_qty,
      rejected_qty: item.rejected_qty,
      line_value: parseFloat((item.received_qty * item.unit_price).toFixed(2))
    }));

    // Compute receiving status
    const receiving_status = computeReceivingStatus(items);

    // Calculate total value
    const total_value = items.reduce((sum, item) => sum + item.line_value, 0);
    const total_items = items.length;

    res.status(200).json({
      success: true,
      message: "GRN retrieved successfully",
      data: {
        id: grn.id,
        grn_number: formatGRNNumber(grn.id),
        grn_date: grn.received_date,
        qc_status: grn.qc_status,
        receiving_status: receiving_status,
        remarks: grn.remarks,
        created_at: grn.created_at,
        updated_at: grn.updated_at,
        header: {
          purchase_order_id: grn.purchase_order_id,
          purchase_order_number: grn.purchase_order_number,
          purchase_order_date: grn.purchase_order_date,
          purchase_order_expected_date: grn.purchase_order_expected_date,
          vendor: {
            id: grn.vendor_id,
            name: grn.vendor_name,
            contact_person: grn.vendor_contact,
            phone: grn.vendor_phone,
            email: grn.vendor_email,
            address: grn.vendor_address
          }
        },
        items: items,
        summary: {
          total_items: total_items,
          total_received_qty: items.reduce((sum, item) => sum + item.received_qty, 0),
          total_rejected_qty: items.reduce((sum, item) => sum + item.rejected_qty, 0),
          total_value: parseFloat(total_value.toFixed(2))
        }
      }
    });
  } catch (error: any) {
    console.error("Get GRN by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve GRN",
      error: error.message
    });
  }
};

// Update QC status with validation
export const updateGRNQC = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const { grnId } = req.params;
    const { qc_status, remarks, items } = req.body;

    // Validate QC status
    const validStatuses: QCStatus[] = ["PENDING", "PASSED", "PARTIAL_HOLD"];
    
    // Check if status is provided
    if (!qc_status) {
      res.status(400).json({
        success: false,
        message: "QC status is required"
      });
      return;
    }

    // Validate status value
    if (!validStatuses.includes(qc_status)) {
      res.status(400).json({
        success: false,
        message: "Invalid QC status. Must be PENDING, PASSED, or PARTIAL_HOLD"
      });
      return;
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Check if GRN exists and belongs to tenant
      const grnCheck = await client.query(
        `SELECT id, qc_status FROM grns WHERE id = $1 AND tenant_id = $2`,
        [grnId, tenantId]
      );

      if (grnCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(404).json({
          success: false,
          message: "GRN not found"
        });
        return;
      }

      const currentStatus = grnCheck.rows[0].qc_status;

      // Validate status transitions
      const statusTransitions: Record<string, QCStatus[]> = {
        "PENDING": ["PASSED", "PARTIAL_HOLD"],
        "PASSED": ["PARTIAL_HOLD"],
        "PARTIAL_HOLD": ["PASSED"]
      };

      if (currentStatus !== qc_status) {
        const allowedTransitions = statusTransitions[currentStatus] || [];
        if (!allowedTransitions.includes(qc_status)) {
          await client.query("ROLLBACK");
          res.status(400).json({
            success: false,
            message: `Invalid status transition from ${currentStatus} to ${qc_status}. Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`
          });
          return;
        }
      }

      // Update GRN header
      await client.query(
        `UPDATE grns 
         SET qc_status = $1, remarks = COALESCE($2, remarks), updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [qc_status, remarks || null, grnId]
      );

      // Update items if provided
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          if (item.grn_item_id || item.id) {
            const itemId = item.grn_item_id || item.id;
            await client.query(
              `UPDATE grn_items 
               SET rejected_qty = $1, updated_at = CURRENT_TIMESTAMP
               WHERE id = $2 AND grn_id = $3`,
              [item.rejected_qty || 0, itemId, grnId]
            );
          }
        }
      }

      await client.query("COMMIT");

      // Fetch updated GRN with computed fields
      const updatedGRNResult = await pool.query(
        `SELECT 
          g.id,
          g.purchase_order_id,
          g.vendor_id,
          g.received_date,
          g.qc_status,
          g.remarks,
          g.created_at,
          g.updated_at,
          po.order_number as purchase_order_number,
          v.name as vendor_name
        FROM grns g
        LEFT JOIN purchase_orders po ON g.purchase_order_id = po.id
        LEFT JOIN vendors v ON g.vendor_id = v.id
        WHERE g.id = $1`,
        [grnId]
      );

      const updatedGRN = updatedGRNResult.rows[0];

      // Fetch updated items
      const itemsResult = await pool.query(
        `SELECT 
          gi.id,
          gi.item_id,
          gi.ordered_qty,
          gi.received_qty,
          gi.rejected_qty,
          i.name as item_name,
          i.unit_price
        FROM grn_items gi
        LEFT JOIN items i ON gi.item_id = i.id
        WHERE gi.grn_id = $1`,
        [grnId]
      );

      const itemsWithDetails = itemsResult.rows.map(item => ({
        id: item.id,
        item_id: item.item_id,
        item_name: item.item_name,
        ordered_qty: item.ordered_qty,
        received_qty: item.received_qty,
        rejected_qty: item.rejected_qty,
        unit_price: parseFloat(item.unit_price) || 0,
        line_value: parseFloat((item.received_qty * item.unit_price).toFixed(2))
      }));

      const receiving_status = computeReceivingStatus(itemsWithDetails);
      const total_value = itemsWithDetails.reduce((sum, item) => sum + item.line_value, 0);

      res.status(200).json({
        success: true,
        message: "GRN QC status updated successfully",
        data: {
          id: updatedGRN.id,
          grn_number: formatGRNNumber(updatedGRN.id),
          grn_date: updatedGRN.received_date,
          vendor_name: updatedGRN.vendor_name,
          purchase_order_number: updatedGRN.purchase_order_number,
          qc_status: updatedGRN.qc_status,
          receiving_status: receiving_status,
          remarks: updatedGRN.remarks,
          total_items: itemsWithDetails.length,
          total_value: parseFloat(total_value.toFixed(2)),
          items: itemsWithDetails,
          created_at: updatedGRN.created_at,
          updated_at: updatedGRN.updated_at
        }
      });
    } catch (error: any) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Update GRN QC error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update GRN QC status",
      error: error.message
    });
  }
};

