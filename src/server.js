const app = require('./app');
const http = require('http');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const logger = require('./config/logger');

const app = require('./app');
const http = require('http');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const logger = require('./config/logger');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: './frontend' });
const handle = nextApp.getRequestHandler();

const server = http.createServer(app);

const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

require('./socket/events')(io);

const PORT = process.env.PORT || 3005;

nextApp
  .prepare()
  .then(() => {
    // Handle all other routes with Next.js
    app.all('*', (req, res) => {
      return handle(req, res);
    });

    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Next.js failed to start:', err);
    process.exit(1);
  });

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received: closing HTTP server and Database connection`);

  server.close(() => {
    logger.info('HTTP server closed');
  });

  io.close(() => {
    logger.info('Socket.IO closed');
  });

  try {
    await mongoose.connection.close(false);
    logger.info('MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    logger.error('Error during graceful shutdown', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = { server, io };
