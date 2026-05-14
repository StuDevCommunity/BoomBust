export const RECT_BOARD_TILE_COUNT = 44;

export function getRectBoardPosition(index) {
	if (index >= 0 && index <= 11) {
		return { gridColumn: index + 1, gridRow: 1 };
	}

	if (index >= 12 && index <= 21) {
		return { gridColumn: 12, gridRow: index - 10 };
	}

	if (index >= 22 && index <= 33) {
		return { gridColumn: 34 - index, gridRow: 12 };
	}

	if (index >= 34 && index <= 43) {
		return { gridColumn: 1, gridRow: 45 - index };
	}

	throw new RangeError(`Board index ${index} is outside the 0-43 rectangular board range.`);
}

export const BOARD_LAYOUT = {
	tileCount: RECT_BOARD_TILE_COUNT,
	columns: 12,
	rows: 12,
	center: {
		gridColumn: '2 / 12',
		gridRow: '2 / 12',
	},
};
