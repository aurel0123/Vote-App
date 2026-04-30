import "./lib/load-env.js"
import { createServer } from "http";
import { initSocket } from "./lib/socket.js";
import { env } from "./lib/env.js";
import app from "./app.js";


const httpServer = createServer(app);

// Initialisation Socket.io
initSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`🚀 VoteApp Backend running on port http://localhost:${env.PORT}`);
  console.log(`📦 Environment: ${env.NODE_ENV}`);
});