import { Router } from "express";
 import { forgetPassword, login, logout, resetPassword } from "../../controller/auth/auth.controller.js";


const router = Router();

 router.post("/login",login);
 router.post("logout",logout);
 router.post("/forgot-password",forgetPassword);
 router.post("/reset-password",resetPassword)


export default router;