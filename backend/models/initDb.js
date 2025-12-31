const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../database/freshbread.db');

let db;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Database connection error:', err);
      }
    });
  }
  return db;
}

async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const database = getDb();
    
    database.serialize(() => {
      // ========================================
      // ADMIN USERS TABLE
      // ========================================
      database.run(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // ========================================
      // SITE CONTENT TABLE
      // ========================================
      database.run(`
        CREATE TABLE IF NOT EXISTS site_content (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE NOT NULL,
          value TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // ========================================
      // SITE IMAGES TABLE
      // ========================================
      database.run(`
        CREATE TABLE IF NOT EXISTS site_images (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT NOT NULL,
          filename TEXT NOT NULL,
          url TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // ========================================
      // ORDERS TABLE (NEW!)
      // ========================================
      database.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_name TEXT NOT NULL,
          customer_phone TEXT NOT NULL,
          customer_email TEXT,
          items TEXT NOT NULL,
          total REAL NOT NULL,
          status TEXT DEFAULT 'pending',
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.log('Orders table may already exist');
        } else {
          console.log('✅ Orders table ready');
        }
      });

      // ========================================
      // DEFAULT CONTENT
      // ========================================
      const defaultContent = [
        ['hero_title', 'Señorita'],
        ['hero_subtitle', 'Made Fresh Daily'],
        ['hero_description', 'Our mission is to craft the best-tasting bread using traditional methods and the highest-quality ingredients.'],
        ['special_label', 'Special of the Day'],
        ['special_discount', '20% OFF'],
        ['special_text', 'TODAY'],
        ['product_name', 'Señorita Bread'],
        ['product_description', 'Our signature soft, sweet bread that\'s become a Stockton favorite. Perfect for any occasion.'],
        ['business_hours', 'Tues–Sun: 6AM–6PM<br>Mon: Closed'],
        ['phone', '(209) 420-7925'],
        ['email', 'freshhotbread@gmail.com'],
        ['location', '2233 Grand Canal Blvd UNIT 102, Stockton, CA 95207']
      ];

      const insertContent = database.prepare(`
        INSERT OR IGNORE INTO site_content (key, value) VALUES (?, ?)
      `);

      defaultContent.forEach(([key, value]) => {
        insertContent.run(key, value);
      });
      insertContent.finalize();

      // ========================================
      // DEFAULT ADMIN USER
      // ========================================
      const adminPassword = process.env.ADMIN_PASSWORD || 'FreshBread2025!';
      const hashedPassword = bcrypt.hashSync(adminPassword, 10);
      
      database.run(`
        INSERT OR IGNORE INTO admin_users (username, password) 
        VALUES (?, ?)
      `, [process.env.ADMIN_USERNAME || 'admin', hashedPassword], function(err) {
        if (!err && this.changes > 0) {
          console.log('✅ Default admin user created');
        }
      });

      console.log('✅ Database initialized successfully');
      resolve(database);
    });
  });
}

module.exports = { initializeDatabase, getDb };
