import type{ Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string || 'your_strong_jwt_secret_here';

interface TokenPayload {
  userId: number;
  tenantId: number;
  role: string;
  email: string;
}



export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token : any = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    // 🔒 Runtime type guard
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      !("userId" in decoded) ||
      !("tenantId" in decoded) ||
      !("role" in decoded) ||
      !("email" in decoded)
    ) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const payload = decoded as TokenPayload;

    req.user = {
      id: payload.userId,
      tenantId: payload.tenantId,
      role: payload.role,
      email: payload.email,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
