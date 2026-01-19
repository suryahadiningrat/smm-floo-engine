const express = require('express');
require('dotenv').config();
const analyticsRoutes = require('./routes/analyticsRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Route
app.get('/', (req, res) => {
    res.json({
        message: 'Metricool Analytics Middleware API is running.',
        version: '1.0.0',
        documentation: 'See README or source code for endpoints.'
    });
});

// Mount Routes
app.use('/api/v1', analyticsRoutes); // Changed base path to separate concerns
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);

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
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Endpoints available at http://localhost:${PORT}/api/v1/...`);
});
