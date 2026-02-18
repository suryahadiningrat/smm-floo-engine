const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const prisma = require('./utils/prisma');
const analyticsRoutes = require('./routes/analyticsRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const aiService = require('./services/aiService');

const app = express();
const PORT = process.env.PORT || 3018;

// Trust Proxy (Required for rate-limiter behind Nginx)
app.set('trust proxy', 1);

// Enable CORS
app.use(cors());

// Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again after 15 minutes'
    }
});

// Apply rate limiting to all requests
app.use(limiter);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth Middleware
const authMiddleware = async (req, res, next) => {
    const authToken = req.headers['auth-token-key'];
    
    if (!authToken) {
        return res.status(401).json({
            status: 'error',
            message: 'Unauthorized: Missing AUTH-TOKEN-KEY header'
        });
    }

    try {
        // Validate token using JWT
        const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
        req.user = decoded; // Attach decoded user context (usually contains userId/email)
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error.message);
        res.status(401).json({
            status: 'error',
            message: 'Unauthorized: Invalid or expired token'
        });
    }
};

// Basic Route (Public)
app.get('/', (req, res) => {
    res.json({
        message: 'Metricool Analytics Middleware API is running.',
        version: '1.0.0',
        documentation: 'See README or source code for endpoints.'
    });
});

// Mount Routes (Protected)
app.use('/api', authMiddleware, analyticsRoutes); // Changed base path to separate concerns
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Endpoints available at http://0.0.0.0:${PORT}/api/...`);
    
    // Warmup AI Model
    aiService.warmup();
});
