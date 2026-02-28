import pool from "../server.js";
import bcrypt from 'bcrypt';

export const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database with test data...');

    // Check if tenants already exist
    const tenantCheck = await pool.query('SELECT COUNT(*) FROM tenants');
    if (parseInt(tenantCheck.rows[0].count) > 0) {
      console.log('✓ Test data already exists, skipping seed');
      return;
    }

    // Insert test tenants
    const tenantQueries = [
      {
        company_name: 'Print Pro Demo',
        address: '123 Demo Street, Demo City',
        phone_number: '+1-555-0101'
      },
      {
        company_name: 'Jersey Design Studio',
        address: '456 Jersey Ave, Sportstown',
        phone_number: '+1-555-0202'
      },
      {
        company_name: 'Custom Print Solutions',
        address: '789 Print Lane, Designville',
        phone_number: '+1-555-0303'
      }
    ];

    const tenantIds: number[] = [];

    for (const tenant of tenantQueries) {
      const result = await pool.query(
        'INSERT INTO tenants (company_name, address, phone_number) VALUES ($1, $2, $3) RETURNING id',
        [tenant.company_name, tenant.address, tenant.phone_number]
      );
      tenantIds.push(result.rows[0].id);
    }

    console.log('✓ Test tenants created');

    // Hash passwords
    const saltRounds = 10;
    const hashedPasswords = {
      admin: await bcrypt.hash('admin123', saltRounds),
      operator: await bcrypt.hash('operator123', saltRounds),
      manager: await bcrypt.hash('manager123', saltRounds)
    };

    // Insert test users
    const userQueries = [
      {
        tenant_id: tenantIds[0],
        full_name: 'Admin User',
        email: 'admin@printpro.com',
        password_hash: hashedPasswords.admin,
        role: 'admin'
      },
      {
        tenant_id: tenantIds[0],
        full_name: 'Operator User',
        email: 'operator@printpro.com',
        password_hash: hashedPasswords.operator,
        role: 'operator'
      },
      {
        tenant_id: tenantIds[1],
        full_name: 'Manager User',
        email: 'manager@printpro.com',
        password_hash: hashedPasswords.manager,
        role: 'manager'
      },
      {
        tenant_id: tenantIds[2],
        full_name: 'Demo Admin',
        email: 'demo@printpro.com',
        password_hash: hashedPasswords.admin,
        role: 'admin'
      }
    ];

    for (const user of userQueries) {
      await pool.query(
        'INSERT INTO users (tenant_id, full_name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
        [user.tenant_id, user.full_name, user.email, user.password_hash, user.role]
      );
    }

    console.log('✓ Test users created');
    console.log('🌱 Database seeding completed successfully');

    // Display test credentials
    console.log('\n📋 TEST LOGIN CREDENTIALS:');
    console.log('==========================');
    console.log('Admin:     admin@printpro.com     / admin123');
    console.log('Operator:  operator@printpro.com  / operator123');
    console.log('Manager:   manager@printpro.com   / manager123');
    console.log('Demo:      demo@printpro.com      / admin123');
    console.log('==========================');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};
