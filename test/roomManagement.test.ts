import { Server as HttpServer } from "http";
import { Server as IOServer, Socket } from "socket.io";
import io, { Socket as IOClient } from "socket.io-client";
import {
    addUserToRoom,
    removeUserFromRoom,
    sendMessageToPeer,
    sendMessage,
    getRoomUsers,
    roomToUsers,
} from "../roomManagement";

let ioServer: IOServer;
let httpServer: HttpServer;
let httpServerAddr: string;

const testRoomUUID = "testRoomUUID";
const testMsg = "testMsg";

let ioClient1: IOClient;
let ioClient2: IOClient;
const userUUID1 = "testUserUUID1";
const userUUID2 = "testUserUUID2";

beforeAll(done => {
    httpServer = new HttpServer();
    ioServer = new IOServer(httpServer);
    httpServer.listen(() => {
        const port = (httpServer.address() as any).port;
        httpServerAddr = `http://localhost:${port}`;
        ioClient1 = io(httpServerAddr, { query: { userUUID: userUUID1 } });
        ioClient2 = io(httpServerAddr, { query: { userUUID: userUUID2 } });

        let clientsConnected = 0;
        const checkDone = () => {
            clientsConnected++;
            if (clientsConnected === 2) done();
        };

        ioServer.on("connection", (socket: Socket) => {
            // check if userUUID is in query & add userUUID1 to room
            const userUUID = socket.handshake.query.userUUID as string;
            addUserToRoom(socket, testRoomUUID, userUUID);
        });

        ioClient1.on("connect", checkDone);
        ioClient2.on("connect", checkDone);
    });
});

afterAll(() => {
    ioServer.close();
    ioClient1.close();
    ioClient2.close();
    httpServer.close();
});

test("addUserToRoom should add user to room", done => {
    if (ioClient2.id === undefined || ioClient1.id === undefined) {
        return;
    }

    // userUUID2 joins room
    const socket = ioServer.sockets.sockets.get(ioClient2.id) as Socket;
    addUserToRoom(socket, testRoomUUID, userUUID2);

    expect(roomToUsers.get(testRoomUUID)?.has(userUUID1)).toBeTruthy();

    // userUUID1 listens for member-joined
    ioClient2.on("member-joined", () => {
        expect(roomToUsers.get(testRoomUUID)?.has(userUUID2)).toBeTruthy();
    });

    // userUUID2 listens for member-joined
    ioClient1.on("member-joined", (data: any) => {
        expect(data.userUUID).toBe(userUUID2);
    });

    done();
});

test("sendMessageToPeer should send message to peer", done => {
    if (ioClient1.id === undefined || ioClient2.id === undefined) return;
    const socket1 = ioServer.sockets.sockets.get(ioClient1.id) as Socket;

    // userUUID1 sends message to userUUID2
    sendMessageToPeer(
        ioServer,
        socket1,
        {
            roomUUID: testRoomUUID,
            message: testMsg,
            type: "RAW",
        },
        userUUID2,
    );

    // user1 listens for peer-message-sent
    ioClient1.on("peer-message-sent", () => {
        done();
    });

    // user2 listens for peer-message
    ioClient2.on("peer-message", (data: any) => {
        expect(data.message).toBe(testMsg);
        expect(data.roomUUID).toBe(testRoomUUID);
        expect(data.senderID).toBe(userUUID1);
        expect(data.type).toBe("RAW");
        done();
    });
});

test("sendMessage should send message to room", done => {
    if (ioClient1.id === undefined || ioClient2.id === undefined) return;
    const socket1 = ioServer.sockets.sockets.get(ioClient1.id) as Socket;

    // userUUID1 sends message to room
    sendMessage(socket1, {
        roomUUID: testRoomUUID,
        message: testMsg,
        type: "Text",
    });

    // userUUID1 listens for room-message-sent
    ioClient1.on("room-message-sent", () => {
        done();
    });

    // userUUID2 listens for room-message
    ioClient2.on("room-message", (data: any) => {
        expect(data.message).toBe(testMsg);
        expect(data.roomUUID).toBe(testRoomUUID);
        expect(data.senderID).toBe(userUUID1);
        expect(data.type).toBe("Text");
        done();
    });
});

test("getRoomUsers should return users in room", done => {
    if (ioClient1.id === undefined || ioClient2.id === undefined) return;
    const socket1 = ioServer.sockets.sockets.get(ioClient1.id) as Socket;
    getRoomUsers(socket1, testRoomUUID);

    ioClient1.on("room-users", (data: any) => {
        expect(data.users).toEqual([userUUID1, userUUID2]);
        done();
    });
});

test("removeUserFromRoom should remove user from room", done => {
    if (ioClient1.id === undefined) return;
    const socket = ioServer.sockets.sockets.get(ioClient1.id) as Socket;
    removeUserFromRoom(socket, testRoomUUID, userUUID1);
    expect(roomToUsers.get(testRoomUUID)?.has(userUUID1)).toBeFalsy();
    addUserToRoom(socket, testRoomUUID, userUUID1);
    done();
});
