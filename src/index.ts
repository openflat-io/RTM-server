import http from 'http';
import { Server } from 'socket.io';
import { Logger } from './logger';
import { setupRTMConnectionHandlers } from './rtm/connectionHandlers';
import { setupRTCConnectionHandlers } from './rtc/connectionHandlers';

const server = http.createServer();
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

io.on('connection', socket => {
    Logger.info(`New connection: ${socket.id}`);

    // setup connection handlers for RTM & RTC
    setupRTMConnectionHandlers(io, socket);
    setupRTCConnectionHandlers(io, socket);
});

const PORT = 3001;
server.listen(PORT, () => {
    Logger.info(`Server is running on http://localhost:${PORT}`);
});
