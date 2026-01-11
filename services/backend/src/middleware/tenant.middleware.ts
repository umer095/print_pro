import type { Request, Response, NextFunction } from "express";

export const tenantMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.tenantId) {
    return res.status(401).json({ message: "Tenant not found" });
  }

  next();
};
