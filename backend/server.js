import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import importRoutes from './routes/importRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Setup JSON body parser with increased limit for batch processing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY
  });
});

// Main routes mapping
app.use('/api', importRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`GrowEasy Backend Server running on port ${PORT}`);
  const hasKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
  if (!hasKey) {
    console.warn('WARNING: Neither GROQ_API_KEY nor GEMINI_API_KEY is defined in the environment variables (.env file).');
  } else {
    console.log('API Key configured successfully (Groq/Gemini).');
  }
});
