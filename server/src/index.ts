import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import vehicleRoutes from './routes/vehicles';
import settingsRoutes from './routes/settings';
import { handleCallback } from './controllers/settingsController';
import { errorHandler } from './middleware/errorHandler';
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

// Serve Tesla's required public key at the well-known path
app.get('/.well-known/appspecific/com.tesla.3p.public-key.pem', (req, res) => {
  const publicKey = keyService.getPublicKey();
  res.type('application/x-pem-file').send(publicKey);
});

// Routes
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/settings', settingsRoutes);

// Tesla OAuth callback route
app.get('/api/auth/tesla/callback', handleCallback);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tesla Location Tracker API' });
});

// Serve frontend build (for production / ngrok access)
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));
app.get('*', (req, res, next) => {
  // Only serve index.html for non-API routes
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
  console.log(`📍 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
});
