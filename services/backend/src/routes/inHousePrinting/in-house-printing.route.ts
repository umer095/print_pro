import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware } from "../../middleware/tenant.middleware.js";
import { createPrintingJob,getAllPrintingJobs } from "../../controller/inHousePrinting/InHousePrinting.controller.js";

const router  = Router(); 


router.post("/printing-jobs",authMiddleware,tenantMiddleware,createPrintingJob);
router.get("/",authMiddleware,tenantMiddleware,getAllPrintingJobs)

export default router;