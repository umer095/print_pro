import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        tenantId: number;
        role: string;
        email: string;
        files?: Multer.File[];
      };
    }
  }
}

export interface AuthRequest extends Request {
  user: {
    id: number;
    tenantId: number;
    role: string;
    email: string;
  };
}

export {};
