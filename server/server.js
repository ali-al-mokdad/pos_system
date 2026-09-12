require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

require('./lib/asyncErrors')();
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CORS_ORIGIN === '*' ? true : (process.env.CORS_ORIGIN || '').split(',') }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/shifts', require('./routes/shiftRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/printer', require('./routes/printerRoutes'));

// Serve the built React app in production (single-box market deployment).
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get(/^\/(?!api|uploads).*/, (req, res, next) => {
  res.sendFile(path.join(clientDist, 'index.html'), (err) => (err ? next() : undefined));
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
// 0.0.0.0 so other POS computers on the local network can reach this server.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Market POS server listening on http://0.0.0.0:${PORT}`);
});
