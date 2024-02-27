export interface JoinRoomData {
    roomUUID: string;
    userUUID: string;
}

export interface LeaveRoomData {
    roomUUID: string;
    userUUID: string;
}

export interface PeerMessageData {
    roomUUID: string;
    message: string;
    type: string;
}

export interface GetRoomUsers {
    roomUUID: string;
}

export interface RoomMessageData extends PeerMessageData {}
