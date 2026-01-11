import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { tenantMiddleware } from "../middleware/tenant.middleware.js";
import { createInventory, getInventory } from "../controller/inventory.controller.js";

const router  = Router(); 


router.post("/create",authMiddleware,tenantMiddleware,createInventory);
router.get("/",authMiddleware,tenantMiddleware,getInventory)

export default router;