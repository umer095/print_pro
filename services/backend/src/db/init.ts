import pool from "../server.js";

export const initDatabase = async () => {
  try {
    

    // Example: Create tenants table
    await pool.query(`
  CREATE TABLE IF NOT EXISTS tenants
(
    id SERIAL NOT NULL,
    company_name text NOT NULL,
    address text,
    phone_number text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT tenants_pkey PRIMARY KEY (id)
)
`);

    // Example: Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users
(
    id SERIAL NOT NULL,
    tenant_id integer NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL DEFAULT 'user',
    created_at timestamp without time zone DEFAULT now(),
    password_reset_otp character varying(6),
    password_reset_otp_expires timestamp without time zone,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)
    `);

    // 1.  "Printing Job Creation"
    await pool.query(`
      CREATE TABLE IF NOT EXISTS printing_jobs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    product_name TEXT,
    shirt_type TEXT,
    print_type TEXT,
    design_name TEXT,
    color_count INTEGER,
    quantity_printed INTEGER,
    machine_name TEXT,
    operator_id INTEGER REFERENCES users(id), 
    print_date DATE,
    status VARCHAR(20)
);
    `);

    // 2. Table for "Version Control" (Tracks history of changes)
    await pool.query(`
     CREATE TABLE IF NOT EXISTS version_control (
    id SERIAL PRIMARY KEY,
    print_job_id INTEGER REFERENCES printing_jobs(id) ON DELETE CASCADE,
    change_description TEXT,
    updated_by_id INTEGER REFERENCES users(id), -- Linked to users.id
    updated_date DATE
);
    `);

    // 3. Table for Printing Output"
    await pool.query(`
     CREATE TABLE IF NOT EXISTS printing_output (
    id SERIAL PRIMARY KEY,
    print_job_id INTEGER REFERENCES printing_jobs(id),
    printed_quantity INTEGER,
    rejected_quantity INTEGER,
    operator_name TEXT,
    print_date DATE
);
    `);
    await pool.query(
      `
      CREATE TABLE IF NOT EXISTS artwork_jobs (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL, 
        sheet_width FLOAT,
        dpi INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
      `
    )
    
    await pool.query(
      `
      CREATE TABLE IF NOT EXISTS generated_sheets (
        id SERIAL PRIMARY KEY,
        job_id INT REFERENCES artwork_jobs(id) ON DELETE CASCADE,
        file_name TEXT,
        file_path TEXT, 
        utilization_percent FLOAT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
    )
    
    // 4. Table for daily Printing Output
    await pool.query(`
     CREATE TABLE IF NOT EXISTS daily_printing_output (
    id SERIAL PRIMARY KEY,
    print_job_id INTEGER REFERENCES printing_jobs(id),
    report_date DATE,
    total_planned_qty INTEGER,
    total_printed_qty INTEGER,
    total_rejected_qty INTEGER
);
    `);
    
    // 5. Table for Pending Printing Jobs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pending_printing_jobs (
    id SERIAL PRIMARY KEY,
    print_job_id INTEGER REFERENCES printing_jobs(id),
    product_name TEXT,
    shirt_type TEXT,
    print_type TEXT,
    planned_quantity INTEGER,
    pending_quantity INTEGER,
    job_status VARCHAR(20),
    created_date DATE
);
      
      `)

  // 6. Table for printing rejection 

      await pool.query(`
        CREATE TABLE IF NOT EXISTS printing_rejections (
    id SERIAL PRIMARY KEY,
    print_job_id INTEGER REFERENCES printing_jobs(id),
    rejection_reason TEXT,
    rejected_quantity INTEGER,
    reported_by TEXT,
    report_date DATE
);
        
        `)

        // 7. Create inventory table
await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory
    (
        id SERIAL NOT NULL,
        tenant_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        sku VARCHAR(50) NOT NULL,
        hsn_no VARCHAR(50),
        item_gst NUMERIC(5,2) DEFAULT 0,
        quantity INTEGER NOT NULL DEFAULT 0,
        unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        
        CONSTRAINT inventory_pkey PRIMARY KEY (id),
        CONSTRAINT inventory_tenant_id_fkey FOREIGN KEY (tenant_id)
            REFERENCES tenants (id) MATCH SIMPLE
            ON UPDATE NO ACTION
            ON DELETE CASCADE,
        CONSTRAINT inventory_created_by_fkey FOREIGN KEY (created_by)
            REFERENCES users (id) MATCH SIMPLE
            ON UPDATE NO ACTION
            ON DELETE SET NULL,
        CONSTRAINT inventory_sku_tenant_unique UNIQUE (sku, tenant_id),
        CONSTRAINT inventory_quantity_check CHECK (quantity >= 0),
        CONSTRAINT inventory_unit_price_check CHECK (unit_price >= 0),
        CONSTRAINT inventory_item_gst_check CHECK (item_gst >= 0 AND item_gst <= 100)
    )
`);
 
// 8. create vendors table

// Create vendors table
await pool.query(`
  CREATE TABLE IF NOT EXISTS vendors
  (
      id SERIAL NOT NULL,
      tenant_id integer NOT NULL,
      vendor_code text NOT NULL,
      vendor_name text NOT NULL,
      contact_person text,
      email text,
      phone_number text,
      address text,
      gst_number text,
      rating decimal(2,1) DEFAULT 0,
      credit_days integer DEFAULT 30,
      payment_terms text,
      status text NOT NULL DEFAULT 'active',
      notes text,
      created_at timestamp without time zone DEFAULT now(),
      updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
      created_by integer,
      CONSTRAINT vendors_pkey PRIMARY KEY (id),
      CONSTRAINT vendors_vendor_code_tenant_unique UNIQUE (vendor_code, tenant_id),
      CONSTRAINT vendors_gst_number_unique UNIQUE (gst_number),
      CONSTRAINT vendors_tenant_id_fkey FOREIGN KEY (tenant_id)
          REFERENCES tenants (id) MATCH SIMPLE
          ON UPDATE NO ACTION
          ON DELETE CASCADE,
      CONSTRAINT vendors_created_by_fkey FOREIGN KEY (created_by)
          REFERENCES users (id) MATCH SIMPLE
          ON UPDATE NO ACTION
          ON DELETE SET NULL,
      CONSTRAINT vendors_rating_check CHECK (rating >= 0 AND rating <= 5)
  )
`);

// Create vendor_orders table to track orders
await pool.query(`
  CREATE TABLE IF NOT EXISTS vendor_orders
  (
      id SERIAL NOT NULL,
      vendor_id integer NOT NULL,
      tenant_id integer NOT NULL,
      order_number text NOT NULL,
      order_date timestamp without time zone DEFAULT now(),
      order_status text NOT NULL DEFAULT 'pending',
      order_amount decimal(12,2),
      payment_status text DEFAULT 'unpaid',
      delivery_date timestamp without time zone,
      notes text,
      created_at timestamp without time zone DEFAULT now(),
      updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
      created_by integer,
      CONSTRAINT vendor_orders_pkey PRIMARY KEY (id),
      CONSTRAINT vendor_orders_order_number_unique UNIQUE (order_number, tenant_id),
      CONSTRAINT vendor_orders_vendor_id_fkey FOREIGN KEY (vendor_id)
          REFERENCES vendors (id) MATCH SIMPLE
          ON UPDATE NO ACTION
          ON DELETE CASCADE,
      CONSTRAINT vendor_orders_tenant_id_fkey FOREIGN KEY (tenant_id)
          REFERENCES tenants (id) MATCH SIMPLE
          ON UPDATE NO ACTION
          ON DELETE CASCADE,
      CONSTRAINT vendor_orders_created_by_fkey FOREIGN KEY (created_by)
          REFERENCES users (id) MATCH SIMPLE
          ON UPDATE NO ACTION
          ON DELETE SET NULL
  )
`);

// Create vendor_performance table to track performance metrics
await pool.query(`
  CREATE TABLE IF NOT EXISTS vendor_performance
  (
      id SERIAL NOT NULL,
      vendor_id integer NOT NULL,
      tenant_id integer NOT NULL,
      month integer NOT NULL,
      year integer NOT NULL,
      total_orders integer DEFAULT 0,
      completed_orders integer DEFAULT 0,
      total_amount decimal(12,2) DEFAULT 0,
      on_time_delivery_rate decimal(5,2),
      quality_rating decimal(2,1),
      created_at timestamp without time zone DEFAULT now(),
      updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT vendor_performance_pkey PRIMARY KEY (id),
      CONSTRAINT vendor_performance_unique UNIQUE (vendor_id, tenant_id, month, year),
      CONSTRAINT vendor_performance_vendor_id_fkey FOREIGN KEY (vendor_id)
          REFERENCES vendors (id) MATCH SIMPLE
          ON UPDATE NO ACTION
          ON DELETE CASCADE,
      CONSTRAINT vendor_performance_tenant_id_fkey FOREIGN KEY (tenant_id)
          REFERENCES tenants (id) MATCH SIMPLE
          ON UPDATE NO ACTION
          ON DELETE CASCADE
  )
`);

    // ==================== GRN (Goods Receipt Note) Tables ====================
    
    // GRNs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS grns
      (
          id SERIAL NOT NULL,
          tenant_id INTEGER NOT NULL,
          purchase_order_id INTEGER,
          vendor_id INTEGER,
          received_date DATE NOT NULL,
          qc_status TEXT NOT NULL DEFAULT 'PENDING',
          remarks TEXT,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT grns_pkey PRIMARY KEY (id),
          CONSTRAINT grns_tenant_id_fkey FOREIGN KEY (tenant_id)
              REFERENCES tenants (id) MATCH SIMPLE
              ON UPDATE NO ACTION
              ON DELETE CASCADE,
          CONSTRAINT grns_qc_status_check CHECK (qc_status IN ('PENDING', 'PASSED', 'PARTIAL_HOLD'))
      )
    `);

    // GRN Items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS grn_items
      (
          id SERIAL NOT NULL,
          grn_id INTEGER NOT NULL,
          item_id INTEGER NOT NULL,
          ordered_qty INTEGER NOT NULL DEFAULT 0,
          received_qty INTEGER NOT NULL DEFAULT 0,
          rejected_qty INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT grn_items_pkey PRIMARY KEY (id),
          CONSTRAINT grn_items_grn_id_fkey FOREIGN KEY (grn_id)
              REFERENCES grns (id) MATCH SIMPLE
              ON UPDATE NO ACTION
              ON DELETE CASCADE,
          CONSTRAINT grn_items_ordered_qty_check CHECK (ordered_qty >= 0),
          CONSTRAINT grn_items_received_qty_check CHECK (received_qty >= 0),
          CONSTRAINT grn_items_rejected_qty_check CHECK (rejected_qty >= 0)
      )
    `);

    console.log('✓ Database tables initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};
