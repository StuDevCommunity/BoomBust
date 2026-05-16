import { RoomStore } from './RoomStore.js';

export class InMemoryRoomStore extends RoomStore {
	constructor() {
		super();
		this.rooms = new Map();
	}

	has(id) {
		return this.rooms.has(id);
	}

	get(id) {
		return this.rooms.get(id);
	}

	set(id, room) {
		this.rooms.set(id, room);
		return room;
	}

	create(room) {
		this.rooms.set(room.id, room);
		return room;
	}
}
