import { Server, Socket } from "socket.io";
import { Logger } from "../logger";

export function setupRTCConnectionHandlers(io: Server, socket: Socket): void {
    // RTC offer
    socket.on("rtc-offer", (offer, target) => {
        Logger.info(`Sending RTC offer from ${socket.id} to ${target}`);
        io.to(target).emit("rtc-offer", offer, socket.id);
    });

    // RTC answer
    socket.on("rtc-answer", (answer, target) => {
        Logger.info(`Sending RTC answer from ${socket.id} to ${target}`);
        io.to(target).emit("rtc-answer", answer, socket.id);
    });

    // ICE candidate
    socket.on("ice-candidate", (candidate, target) => {
        Logger.info(`Sending ICE candidate from ${socket.id} to ${target}`);
        io.to(target).emit("ice-candidate", candidate, socket.id);
    });

    socket.on("disconnect", () => {
        Logger.info("user disconnected");
    });
}
