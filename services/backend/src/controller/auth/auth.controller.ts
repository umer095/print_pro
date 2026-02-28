// controllers/auth.controller.ts (or wherever your login function is)

import type { Request, Response } from 'express';
import pool from '../../server.js'; // Adjust path as needed
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from "crypto";
import transporter from '../../config/nodemailer.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_strong_jwt_secret_here';

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

export const login = async (
  req: LoginRequest,
  res: Response
): Promise<void> => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  try {
    const client = await pool.connect();

    try {
      // Query user with tenant information
      const result = await client.query(
        `SELECT 
          u.id,
          u.tenant_id,
          u.full_name,
          u.email,
          u.password_hash,
          u.role,
          t.company_name,
          t.address,
          t.phone_number
        FROM users u
        INNER JOIN tenants t ON u.tenant_id = t.id
        WHERE u.email = $1`,
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      const user = result.rows[0];

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          tenantId: user.tenant_id,
          role: user.role,
          email: user.email,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Success response
      res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
        },
        tenant: {
          id: user.tenant_id,
          companyName: user.company_name,
          address: user.address,
          phoneNumber: user.phone_number,
        },
        token,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
};

// logout 
export const logout = async() => {
  
}

// Forgot Password Controller (with proper error handling)
export const forgetPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    // Validate email
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }

    // Check if user exists
    const userResult = await pool.query(
      "SELECT id, email FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Email doesn't exist."
      });
    }

    const user = userResult.rows[0];

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Set OTP expiry (10 minutes from now)
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

    // Store OTP in database
    await pool.query(
      "UPDATE users SET password_reset_otp = $1, password_reset_otp_expires = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
      [otp, expiryTime, user.id]
    );

    // Send email with OTP - wrapped in try-catch
    try {
      const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: "Your Password Reset OTP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset OTP</h2>
            <p>Your password reset OTP is: <strong>${otp}</strong></p>
            <p>It will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);

      console.log(`OTP sent successfully to ${email}`);

      return res.status(200).json({
        success: true,
        message: "Password reset OTP sent to your email."
      });

    } catch (emailError) {
      // Email sending failed - log error but don't crash
      console.error("Email sending failed:", emailError);

       
      
      
      // Clear the OTP from database since email failed
      await pool.query(
        "UPDATE users SET password_reset_otp = NULL, password_reset_otp_expires = NULL WHERE id = $1",
        [user.id]
      );

      return res.status(500).json({
        success: false,
        message: "Failed to send email. Please check your email address or try again later."
      });
    }

  } catch (error) {
    console.error("Forget password error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request"
    });
  }
};


// Reset Password Controller (with proper error handling)
export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  try {
    // Validate inputs
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required"
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long"
      });
    }

    // Find user and verify OTP
    const result = await pool.query(
      `SELECT id, email
       FROM users
       WHERE email = $1 AND password_reset_otp = $2 AND password_reset_otp_expires > CURRENT_TIMESTAMP`,
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP."
      });
    }

    const user = result.rows[0];

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear OTP
    await pool.query(
      `UPDATE users 
       SET password_hash = $1, password_reset_otp = NULL, password_reset_otp_expires = NULL, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    // Send confirmation email - wrapped in try-catch
    try {
      const confirmationMailOptions = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: "Password Reset Successful",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Successful</h2>
            <p>Your password has been successfully reset.</p>
            <p>You can now login with your new password.</p>
            <p>If you did not make this change, please contact support immediately.</p>
          </div>
        `
      };

      await transporter.sendMail(confirmationMailOptions);
      console.log(`Password reset confirmation sent to ${email}`);

    } catch (emailError) {
      // Log error but don't fail the request since password was already reset
      console.error("Confirmation email failed:", emailError);
      // Continue anyway - password was successfully reset
    }

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully."
    });

  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while resetting your password"
    });
  }
};