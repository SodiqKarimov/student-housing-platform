require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectDatabase } = require('./src/config/database');
const logger = require('./src/config/logger');
const { maskSensitiveData } = require('./src/middleware/dataProtection.middleware');

// Routes
const authRoutes = require('./src/routes/auth.routes');
const devRoutes = (process.env.NODE_ENV !== 'production' || process.env.USE_MOCK === 'true') ? require('./src/routes/dev.routes') : null;
const studentRoutes = require('./src/routes/student.routes');
const dormitoryRoutes = require('./src/routes/dormitory.routes');
const rentalRoutes = require('./src/routes/rental.routes');
const commuterRoutes = require('./src/routes/commuter.routes');

const app = express();
const PORT = process.env.PORT || 5000;
const API = `/api/${process.env.API_VERSION || 'v1'}`;

// ========================
// Xavfsizlik middleware
// ========================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS || '*';
app.use(cors({
  origin: allowedOrigins === '*' ? '*' : allowedOrigins.split(','),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: allowedOrigins !== '*',
}));

// Rate Limiting (DDoS himoyasi)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { success: false, message: 'Juda ko\'p so\'rov. Iltimos, keyinroq urinib ko\'ring.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Kirish urinishlari cheklandi. 15 daqiqadan so\'ng urinib ko\'ring.' },
});

app.use(API, limiter);
app.use(`${API}/auth`, authLimiter);

// ========================
// Umumiy middleware
// ========================
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(maskSensitiveData);

// Trust proxy (Nginx orqasida)
app.set('trust proxy', 1);

// ========================
// API Routes
// ========================
app.use(`${API}/auth`, authRoutes);
if (devRoutes) {
  app.use(`${API}/dev`, devRoutes);
  logger.warn('DEV routes faol! Production\'da o\'chiring.');
}
app.use(`${API}/students`, studentRoutes);
app.use(`${API}/dormitories`, dormitoryRoutes);
app.use(`${API}/rentals`, rentalRoutes);
app.use(`${API}/commuters`, commuterRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Talabalar Turar Joyi Boshqaruv Tizimi',
    version: process.env.API_VERSION || 'v1',
    timestamp: new Date().toISOString(),
  });
});

// API hujjatlari
app.get(API, (req, res) => {
  res.json({
    success: true,
    message: 'Talabalar Turar Joyi Boshqaruv Tizimi API',
    version: process.env.API_VERSION || 'v1',
    endpoints: {
      auth: `${API}/auth`,
      students: `${API}/students`,
      dormitories: `${API}/dormitories`,
      rentals: `${API}/rentals`,
      commuters: `${API}/commuters`,
    },
    standards: [
      "O'RQ-547 - Shaxsiy ma'lumotlar to'g'risida (2019)",
      'OneID - Yagona identifikatsiya tizimi',
      'HEMIS - Oliy ta\'lim axborot tizimi',
      'E-hukumat standartlari',
    ],
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'So\'ralgan manzil topilmadi' });
});

// Global xato handler
app.use((err, req, res, next) => {
  logger.error('Server xato', { error: err.message, stack: err.stack, url: req.originalUrl });
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Server xatosi' : err.message,
  });
});

// ========================
// Server ishga tushirish
// ========================
async function bootstrap() {
  await connectDatabase();

  app.listen(PORT, () => {
    logger.info(`Server ishga tushdi`, {
      port: PORT,
      env: process.env.NODE_ENV,
      api: `http://localhost:${PORT}${API}`,
    });
  });
}

bootstrap().catch((err) => {
  logger.error('Server ishga tushishda xato', { error: err.message });
  process.exit(1);
});

module.exports = app;
