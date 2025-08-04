require('dotenv').config()
const express = require('express')
const mongoose = require("mongoose")
const path = require('path')
const workoutRoutes = require('./routes/workouts')
const exerciseRoutes = require('./routes/exercises');

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
    res.status(200).json({ 
        status: "OK", 
        message: "Service is healthy",
        dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
})

// Database connection middleware for workout routes
app.use('/api/workouts', async (req, res, next) => {
    // Check if database URL is configured
    if (!process.env.MONGODB_URL && !process.env.MONGO_URI) {
        return res.status(503).json({ error: 'Database configuration pending' })
    }
    
    // Check if database is connected (readyState 1 = connected)
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database connection not ready' })
    }
    next()
}, workoutRoutes)

// Database connection middleware for exercise routes
app.use('/api/exercises', async (req, res, next) => {
    // Check if database URL is configured
    if (!process.env.MONGODB_URL && !process.env.MONGO_URI) {
        return res.status(503).json({ error: 'Database configuration pending' })
    }
    
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database connection not ready' })
    }
    next()
}, exerciseRoutes);

// Database connection function
const connectDatabase = async () => {
    try {
        // Get connection string from environment variables
        const mongoUri = process.env.MONGODB_URL || process.env.MONGO_URI;
        
        if (!mongoUri) {
            console.log('No database configuration found - waiting for environment variables');
            return;
        }

        console.log('Attempting to connect to database...');
        
        // Connect to MongoDB
        await mongoose.connect(mongoUri, {
            // These options are now defaults in Mongoose 6+, but including for clarity
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        });

        console.log('✅ Connected to database successfully');

        // Initialize default exercises after successful connection
        try {
            const { initializeDefaultExercises } = require('./controllers/exerciseController');
            await initializeDefaultExercises({}, { 
                status: (code) => ({ 
                    json: (data) => console.log('Exercise initialization:', data) 
                })
            });
            console.log('✅ Default exercises initialized');
        } catch (error) {
            console.error('❌ Failed to initialize default exercises:', error.message);
        }

    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        
        // Retry connection after 10 seconds
        console.log('🔄 Retrying database connection in 10 seconds...');
        setTimeout(connectDatabase, 10000);
    }
};

// Connection event listeners
mongoose.connection.on('connected', () => {
    console.log('🟢 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('🔴 Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('🟡 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down server...');
    try {
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

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

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port: ${PORT}`)
    console.log(`📍 Server address: http://localhost:${PORT}`)
    
    // Connect to database after server starts
    connectDatabase();
})

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
});

module.exports = app;