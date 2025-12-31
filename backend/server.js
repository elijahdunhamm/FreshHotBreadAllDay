const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { initializeDatabase } = require('./models/initDb');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://localhost:5000', process.env.FRONTEND_URL],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, 'admin-dashboard'), {
  index: 'index.html'
}));
app.use('/images', express.static('C:/Users/tandr/Fresh-Hot-Bread/images'));

// Import routes
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const imageRoutes = require('./routes/images');
const orderRoutes = require('./routes/orders');  // NEW!

// Check if payments route exists
let paymentRoutes;
try {
  paymentRoutes = require('./routes/payments');
} catch (e) {
  console.log('⚠️ Payments route not found - skipping');
}

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/orders', orderRoutes);  // NEW!

if (paymentRoutes) {
  app.use('/api/payments', paymentRoutes);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Fresh Bread API is running',
    timestamp: new Date().toISOString(),
    features: {
      orders: true,
      emailNotifications: !!(process.env.EMAIL_USER && process.env.EMAIL_APP_PASS)
    }
  });
});

// Redirect /admin to /admin/index.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard', 'index.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard', 'dashboard.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Initialize database and start server
const PORT = process.env.PORT || 5000;

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log('');
      console.log('🍞 ═══════════════════════════════════════');
      console.log('   FRESH HOT BREAD API SERVER');
      console.log('═══════════════════════════════════════');
      console.log(`📡 API Running:     http://localhost:${PORT}`);
      console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin`);
      console.log(`🔧 Environment:     ${process.env.NODE_ENV || 'development'}`);
      console.log('═══════════════════════════════════════');
      console.log('');
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

module.exports = app;
