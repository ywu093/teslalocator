import express from 'express';
import cors from 'cors';
import path from 'path';
import session from 'express-session';
import dotenv from 'dotenv';
import vehicleRoutes from './routes/vehicles';
import settingsRoutes from './routes/settings';
import authRoutes from './routes/auth';
import { handleCallback } from './controllers/settingsController';
import { errorHandler } from './middleware/errorHandler';
import { requireAuth } from './middleware/auth';
import keyService from './services/keyService';

// Load environment variables
dotenv.config();

// Generate EC key pair on startup (required by Tesla Fleet API)
keyService.ensureKeyPair();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Needed for login form POST

// Session middleware (used for login state)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // ngrok handles HTTPS termination, so this stays false
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Always-public: Tesla's required public key
app.get('/.well-known/appspecific/com.tesla.3p.public-key.pem', (req, res) => {
  const publicKey = keyService.getPublicKey();
  res.type('application/x-pem-file').send(publicKey);
});

// Always-public: Tesla OAuth callback (Tesla redirects here after login)
app.get('/api/auth/tesla/callback', handleCallback);

// Always-public: health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tesla Location Tracker API' });
});

// Auth routes: login page (GET /login), login POST (POST /api/login), logout (POST /api/logout)
app.use(authRoutes);

// Apply auth gate to all remaining routes
app.use(requireAuth);

// Protected API routes
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/settings', settingsRoutes);

// Serve frontend build (for production / ngrok access)
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/.well-known/') || req.path === '/health') {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚗 Tesla Location Tracker server running on port ${PORT}`);
  if (process.env.APP_PASSWORD) {
    console.log('🔒 Password protection enabled');
  } else {
    console.log('⚠️  No APP_PASSWORD set — app is open to anyone');
  }
});
