import { httpServer } from './app';
import { config } from './config';

const PORT = config.port;

// Create uploads directory if it doesn't exist
import { mkdirSync } from 'fs';
import { join } from 'path';

try {
  mkdirSync(join(__dirname, '..', config.uploadDir), { recursive: true });
} catch (error) {
  console.warn('Upload directory already exists or could not be created');
}

// Start the server
httpServer.listen(PORT, () => {
  console.log(`
🚀 Server is running!
📱 REST API: http://localhost:${PORT}
🔌 WebSocket: ws://localhost:${PORT}
📁 Upload directory: ${config.uploadDir}
🔒 Environment: ${config.nodeEnv}
  `);
});
