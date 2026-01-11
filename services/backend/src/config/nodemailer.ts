import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport/index.js";



// Define SMTP configuration with proper typing
const smtpConfig: any = {
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // Use STARTTLS (not SSL)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  // Don't pool connections - create fresh connection for each email
  pool: false,
  // Connection management
  maxConnections: 1,
  maxMessages: Infinity,
  // Timeouts to prevent hanging
  connectionTimeout: 10000, // 10 seconds to connect
  greetingTimeout: 5000,    // 5 seconds for greeting
  socketTimeout: 30000,     // 30 seconds for socket inactivity
  // Logging (disable in production if needed)
  logger: process.env.NODE_ENV === 'development',
  debug: process.env.NODE_ENV === 'development',
};

// Create transporter with typed configuration
const transporter = nodemailer.createTransport(smtpConfig);

// Verify connection on startup (optional)
if (process.env.NODE_ENV === 'development') {
  transporter.verify((error, success) => {
    if (error) {
      console.error("❌ SMTP Connection Error:", error.message);
    } else {
      console.log("✓ SMTP Server ready");
    }
  });
}

export default transporter;