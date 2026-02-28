import { Router } from "express";
 import { registerTenant } from "../../controller/auth/tenant.controller.js";


const router = Router();

 router.post("/register",registerTenant);



export default router;