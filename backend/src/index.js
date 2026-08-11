import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🌿 MigraineGuardian Express API Gateway Running`);
  console.log(`📡 Server Address: http://localhost:${PORT}`);
  console.log(`🏥 Health Check:   http://localhost:${PORT}/api/health`);
  console.log(`🔐 Environment:    ${process.env.NODE_ENV || 'development'}`);
  console.log(`=======================================================`);
});
