// controllers/tenant.controller.ts

import type { Request, Response } from 'express';
import pool from '../../server.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'your_strong_jwt_secret_here';

// Zod validation schema for tenant registration
const registerTenantSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(100, 'Company name is too long'),
  address: z.string().max(255, 'Address is too long').optional(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name is too long'),
  email: z.string().email('Invalid email format').toLowerCase(),
  phoneNumber: z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number format').optional().or(z.literal('')),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

interface RegisterTenantRequest extends Request {
  body: {
    companyName: string;
    address?: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    password: string;
  };
}

export const registerTenant = async (
  req: RegisterTenantRequest,
  res: Response
): Promise<void> => {
  try {
    // Validate request body with Zod
    const validatedData = registerTenantSchema.parse(req.body);

    const {
      companyName,
      address,
      fullName,
      email,
      phoneNumber,
      password,
    } = validatedData;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if email already exists (across all tenants)
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        await client.query('ROLLBACK');
        res.status(409).json({ message: 'Email already in use' });
        return;
      }

      // Hash the password
      const passwordHash = await bcrypt.hash(password, 10);

      // 1. Create the tenant
      const tenantResult = await client.query(
        `INSERT INTO tenants (
          company_name,
          address,
          phone_number,
          created_at
        ) VALUES ($1, $2, $3, NOW())
        RETURNING id, company_name`,
        [companyName, address || null, phoneNumber || null]
      );

      const tenant = tenantResult.rows[0];

      // 2. Create the admin user (first user of the tenant)
      const userResult = await client.query(
        `INSERT INTO users (
          tenant_id,
          full_name,
          email,
          password_hash,
          role,
          created_at
        ) VALUES ($1, $2, $3, $4, 'admin', NOW())
        RETURNING id, full_name, email`,
        [tenant.id, fullName, email, passwordHash]
      );

      const user = userResult.rows[0];

      // Commit transaction
      await client.query('COMMIT');

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          tenantId: tenant.id,
          role: 'admin',
          email: user.email,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Success response
      res.status(201).json({
        message: 'Tenant registered successfully',
        tenant: {
          id: tenant.id,
          companyName: tenant.company_name,
        },
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
        },
        token,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }

    console.error('Tenant registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration' });
  }
};