import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware } from "../../middleware/tenant.middleware.js";
import { createVendor, deleteVendor, getVendors, updateVendor } from "../../controller/purchase/vendor.controller.js";
const router = Router();


router.get("/",authMiddleware,tenantMiddleware,getVendors);
router.post("/create",authMiddleware,tenantMiddleware,createVendor);
router.put("/update",authMiddleware,tenantMiddleware,updateVendor);
router.delete("/delete",authMiddleware,tenantMiddleware,deleteVendor);

export default router;