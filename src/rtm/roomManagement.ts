import { Socket, Server } from "socket.io";
import { Logger } from "../logger";
import { PeerMessageData, RoomMessageData } from "./types";

// userUUID -> socket.id
export const userToSocket = new Map<string, string>();

// roomUUID -> Set<userUUID>
export const roomToUsers = new Map<string, Set<string>>();

export async function addUserToRoom(
    socket: Socket,
    roomUUID: string,
    userUUID: string,
): Promise<void> {
    try {
        await socket.join(roomUUID);

        if (!roomToUsers.has(roomUUID)) {
            roomToUsers.set(roomUUID, new Set());
        }
        roomToUsers.get(roomUUID)?.add(userUUID);
        userToSocket.set(userUUID, socket.id);

        // send message to the user who joined
        socket.emit("member-joined", { userUUID });

        // send message to other users in the room
        socket.to(roomUUID).emit("member-joined", { userUUID });

        Logger.info(`User ${userUUID} joined room ${roomUUID}`);
    } catch (error) {
        Logger.error("Error adding user to room", error as Error);
    }
}

export function removeUserFromRoom(socket: Socket, roomUUID: string, userUUID: string): void {
    try {
        socket.leave(roomUUID);

        // remove user from room
        const users = roomToUsers.get(roomUUID);
        if (users) {
            users.delete(userUUID);
            if (users.size === 0) {
                roomToUsers.delete(roomUUID);
            }
        }

        // remove user from socket id map
        userToSocket.delete(userUUID);

        // send message to the user who left
        socket.emit("self-left", { success: true });

        // send message to other users in the room
        socket.to(roomUUID).emit("member-left", { userUUID });

        Logger.info(`User ${userUUID} left room ${roomUUID}`);
    } catch (error) {
        Logger.error("Error removing user from room", error as Error);
    }
}

export function sendMessageToPeer(
    io: Server,
    socket: Socket,
    data: PeerMessageData,
    peerID: string,
): void {
    try {
        const currentUserUUID = Array.from(userToSocket.entries()).find(
            ([key, value]) => value === socket.id,
        )?.[0];

        if (currentUserUUID) {
            // get receiver's socket id
            const users = roomToUsers.get(data.roomUUID);
            if (users && users.has(peerID)) {
                const receiverSocketId = userToSocket.get(peerID);
                if (receiverSocketId) {
                    // send message to the receiver
                    io.to(receiverSocketId).emit("peer-message", {
                        roomUUID: data.roomUUID,
                        message: data.message,
                        type: data.type,
                        senderID: currentUserUUID,
                    });

                    // send success message to the sender
                    socket.emit("peer-message-sent");
                }
            }
        }
    } catch (error) {
        Logger.error("Error sending message to peer", error as Error);
    }
}

export function sendMessage(socket: Socket, data: RoomMessageData): void {
    try {
        const currentUserUUID = Array.from(userToSocket.entries()).find(
            ([key, value]) => value === socket.id,
        )?.[0];

        if (currentUserUUID) {
            // send message to all users in the room
            socket.to(data.roomUUID).emit("room-message", {
                roomUUID: data.roomUUID,
                message: data.message,
                type: data.type,
                senderID: currentUserUUID,
            });

            // send success message to the sender
            socket.emit("room-message-sent");
        }
    } catch (error) {
        Logger.error("Error sending message to room", error as Error);
    }
}

export function getRoomUsers(socket: Socket, roomUUID: string): void {
    try {
        const users = roomToUsers.get(roomUUID) || new Set();
        socket.emit("room-users", { users: Array.from(users) });

        Logger.info(`Getting users in room ${roomUUID} - ${JSON.stringify(Array.from(users))}`);
    } catch (error) {
        Logger.error("Error getting room users", error as Error);
    }
}
