import http from "http";
import { Server } from "socket.io";
import { Logger } from "./logger";
import { setupRTMConnectionHandlers } from "./connectionHandlers";

const server = http.createServer();
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

io.on("connection", socket => {
    Logger.info(`[Server: New connection: ${socket.id}]`);

    // setup connection handlers for RTM
    setupRTMConnectionHandlers(io, socket);
});

const PORT = 3001;
server.listen(PORT, () => {
    Logger.info(`[RTM Server: Server is running on http://localhost:${PORT}]`);
});
