import { generateRoomCode } from "../utils/generateCode.js";

// Lưu trữ các phòng active (memory state)
const activeRooms = new Map();

export const createdRoom = (req, res) => {
    let roomID;
    do {
        roomID = generateRoomCode();
        // check trùng roomID
    } while (activeRooms.has(roomID));

    const newRoom = {
        id: roomID,
        players: [],
        status: "WAITING",
        createdAt: new Date()
    };

    activeRooms.set(roomID, newRoom);

    // TODO: init instance boardgame.io ở đây

    return res.status(201).json({
        success: true,
        message: 'Room created successfully',
        room: newRoom
    });
}

export const checkRoom = (req, res) => {
    const { id } = req.params;
    const room = activeRooms.get(id.toUpperCase());

    if (!room) {
        return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.status !== 'WAITING') {
        return res.status(400).json({ success: false, message: 'Room is already playing or full'});
    }

    return req.status(200).json({ success: true, room });
}