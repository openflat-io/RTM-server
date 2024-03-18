import { Server, Socket } from "socket.io";
import {
    GetRoomUsers,
    JoinRoomData,
    LeaveRoomData,
    PeerMessageData,
    RoomMessageData,
} from "./types";
import {
    addUserToRoom,
    removeUserFromRoom,
    sendMessageToPeer,
    sendMessage,
    getRoomUsers,
} from "./roomManagement";

export function setupRTMConnectionHandlers(io: Server, socket: Socket): void {
    socket.on("join-room", (data: JoinRoomData) => {
        addUserToRoom(socket, data.roomUUID, data.userUUID);
    });

    socket.on("leave-room", (data: LeaveRoomData) => {
        removeUserFromRoom(socket, data.roomUUID, data.userUUID);
    });

    socket.on("peer-message", (data: PeerMessageData, peerID: string) => {
        sendMessageToPeer(io, socket, data, peerID);
    });

    socket.on("room-message", (data: RoomMessageData) => {
        sendMessage(socket, data);
    });

    socket.on("get-room-users", (data: GetRoomUsers) => {
        getRoomUsers(socket, data.roomUUID);
    });

    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
}
