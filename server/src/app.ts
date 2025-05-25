import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import fileUpload from 'express-fileupload';
import { config } from './config';
import { socketAuth } from './middleware/auth';
import { CustomServer, CustomSocket } from './types/socket';
import { mkdirSync } from 'fs';
import { join } from 'path';

// Import routes
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import messageRoutes from './routes/message.routes';

// Create Express app
const app = express();
const httpServer = createServer(app);

// Set up Socket.IO with types
const io: CustomServer = new Server(httpServer, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: config.maxFileSize },
  abortOnLimit: true,
}));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
try {
  mkdirSync(join(__dirname, '..', config.uploadDir), { recursive: true });
} catch (error) {
  console.warn('Upload directory already exists or could not be created');
}

// Connect to MongoDB with retry logic
const connectWithRetry = () => {
  const mongooseOpts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4, skip trying IPv6
    directConnection: true,
  };

  mongoose.connect(config.mongoUri, mongooseOpts)
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error);
      console.log('Retrying connection in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    });
};

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectWithRetry();
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

// Initial connection attempt
connectWithRetry();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

// Socket.IO middleware
io.use(socketAuth);

// Socket.IO connection handler
io.on('connection', (socket: CustomSocket) => {
  console.log('User connected:', socket.data.user._id);

  // Join user's personal room
  socket.join(socket.data.user._id.toString());

  // Handle user status
  socket.broadcast.emit('user:status', {
    userId: socket.data.user._id.toString(),
    status: 'online'
  });

  // Handle chat messages
  socket.on('message:send', async (data) => {
    const { chatId, message } = data;
    
    // Broadcast to all users in the chat
    socket.to(chatId).emit('message:receive', {
      chatId,
      message
    });
  });

  // Handle typing status
  socket.on('typing:start', (chatId) => {
    socket.to(chatId).emit('typing:update', {
      chatId,
      userId: socket.data.user._id.toString(),
      isTyping: true
    });
  });

  socket.on('typing:stop', (chatId) => {
    socket.to(chatId).emit('typing:update', {
      chatId,
      userId: socket.data.user._id.toString(),
      isTyping: false
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.data.user._id);
    
    socket.broadcast.emit('user:status', {
      userId: socket.data.user._id.toString(),
      status: 'offline'
    });
  });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

export { app, httpServer };
