require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const driverRoutes = require('./routes/driver.routes');
const studentRoutes = require('./routes/student.routes');
const socketHandler = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Expose io to route controllers via req.io
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => res.send('🚀 Smart Bus Tracker API is running!'));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/student', studentRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: err.message || 'Internal server error.' });
});

// Socket.IO handler
socketHandler(io);

// MongoDB + Server start
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

// ── Prevent crashes from uncaught async errors ──────────────────────────────
process.on('unhandledRejection', (reason) => {
    console.error('⚠️  Unhandled Promise Rejection:', reason);
    // Do NOT crash — just log it
});

process.on('uncaughtException', (err) => {
    console.error('⚠️  Uncaught Exception:', err.message);
    // Do NOT crash — just log it
});
