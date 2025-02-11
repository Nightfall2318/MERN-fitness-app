require('dotenv').config()
const express = require('express')
const mongoose = require("mongoose")
const path = require('path')
const workoutRoutes = require('./routes/workouts')

// express app init
const app = express()

// middleware
app.use(express.json())
app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})

// Health check that doesn't depend on DB
app.get('/api/health', (req, res) => {
    console.log('Health check hit')
    res.status(200).json({ status: "OK", message: "Service is healthy" });
})

// API routes with DB check
app.use('/api/workouts', async (req, res, next) => {
    if (!process.env.MONGODB_URL && !process.env.MONG_URI) {
        return res.status(503).json({ error: 'Database configuration pending' })
    }
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database connection not ready' })
    }
    next()
}, workoutRoutes)

// Static file serving in production
if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(__dirname, '../frontend/build');
    console.log('Serving React from:', buildPath);

    app.use(express.static(buildPath));

    app.get('*', (req, res) => {
        res.sendFile(path.join(buildPath, 'index.html'), (err) => {
            if (err) {
                console.error('Error serving index.html:', err);
                res.status(500).send('Error loading index.html');
            }
        });
    });
}

// Port configuration
const PORT = process.env.PORT || 4000

// Start server immediately
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('Server starting on port:', PORT)
})

// Try to connect to database if configured
if (process.env.MONGODB_URL || process.env.MONG_URI) {
    mongoose.connect(process.env.MONGODB_URL || process.env.MONG_URI)
        .then(() => {
            console.log('Connected to database')
        })
        .catch((error) => {
            console.log('Database connection error:', error)
        })
} else {
    console.log('No database configuration found - waiting for environment variables')
}