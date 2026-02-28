import { Router } from "express";
import { createGRN, getAllGRNs, getGRNById, updateGRNQC } from "../../controller/purchase/grn.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// POST /purchase/grn - Create GRN with items
router.post("/grn", createGRN);

// GET /purchase/grn - Get all GRNs with pagination and filters
router.get("/grn", getAllGRNs);

// GET /purchase/grn/:grnId - Get GRN by ID with items
router.get("/grn/:grnId", getGRNById);

// PUT /purchase/grn/:grnId/qc - Update QC status
router.put("/grn/:grnId/qc", updateGRNQC);

export default router;

