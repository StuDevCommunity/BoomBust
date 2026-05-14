import { Box, Typography } from '@mui/material';
import boardTiles, { TILE_COLORS, TILE_TYPES } from '../../game/boardTiles';
import { BOARD_LAYOUT, getRectBoardPosition } from './boardLayout';
import { getProfessionImage } from '../../utils/professionImages';

const PLAYER_COLORS = ['#556B2F', '#8B6F47', '#2D3325', '#7C2D12', '#4A5568', '#B8B6AE'];

const TILE_SHORT_LABEL = {
	[TILE_TYPES.START]: 'START',
	[TILE_TYPES.DEAL]: 'OPP',
	[TILE_TYPES.MARKET]: 'MKT',
	[TILE_TYPES.DOODAD]: 'DOD',
	[TILE_TYPES.CHARITY]: 'CHR',
	[TILE_TYPES.STORY]: 'STY',
	[TILE_TYPES.DOWNSIZE]: 'DOWN',
	[TILE_TYPES.FED_MEETING]: 'FED',
	[TILE_TYPES.BANKRUPTCY]: 'COURT',
	[TILE_TYPES.EMPTY]: 'SAFE',
};

const TILE_TYPE_LABEL = {
	[TILE_TYPES.START]: 'Payday',
	[TILE_TYPES.DEAL]: 'Opportunity',
	[TILE_TYPES.MARKET]: 'Market',
	[TILE_TYPES.DOODAD]: 'Doodad',
	[TILE_TYPES.CHARITY]: 'Charity',
	[TILE_TYPES.STORY]: 'Story',
	[TILE_TYPES.DOWNSIZE]: 'Downsize',
	[TILE_TYPES.FED_MEETING]: 'Fed Meeting',
	[TILE_TYPES.BANKRUPTCY]: 'Bankruptcy',
	[TILE_TYPES.EMPTY]: 'Safe',
};

const TOKEN_OFFSETS = [
	{ x: 0, y: 0 },
	{ x: 11, y: 0 },
	{ x: 0, y: 11 },
	{ x: 11, y: 11 },
	{ x: -11, y: 0 },
	{ x: 0, y: -11 },
];

function getPlayersByTile(players) {
	return Object.entries(players || {}).reduce((map, [id, player]) => {
		const position = player.position ?? 0;
		if (!map[position]) map[position] = [];
		map[position].push({ id, player });
		return map;
	}, {});
}

function BoardTile({ tile, players, currentTurnPlayerID, playerID }) {
	const isCorner = [0, 11, 22, 33].includes(tile.index);
	const tileColor = TILE_COLORS[tile.type] || 'var(--gb-shell)';

	return (
		<Box
			title={`${tile.index}: ${tile.label.replace('\n', ' ')}`}
			sx={{
				position: 'relative',
				gridColumn: getRectBoardPosition(tile.index).gridColumn,
				gridRow: getRectBoardPosition(tile.index).gridRow,
				minWidth: 0,
				minHeight: 0,
				p: { xs: 0.35, md: 0.55 },
				borderRadius: isCorner ? 1.2 : 0.8,
				bgcolor: tileColor,
				border: '2px solid rgba(29, 33, 24, 0.42)',
				boxShadow: players.length ? '0 0 0 2px var(--gb-screen-glow), inset 0 0 0 1px rgba(255,255,255,0.25)' : 'inset 0 0 0 1px rgba(255,255,255,0.18)',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				overflow: 'hidden',
			}}
		>
			<Typography
				component="span"
				sx={{
					fontSize: { xs: 7, md: isCorner ? 10 : 8 },
					fontWeight: 900,
					lineHeight: 1.05,
					color: '#1D2118',
					whiteSpace: 'pre-line',
				}}
			>
				{isCorner ? tile.label : TILE_SHORT_LABEL[tile.type]}
			</Typography>
			<Typography
				component="span"
				sx={{
					display: { xs: 'none', md: 'block' },
					fontSize: 7,
					fontWeight: 800,
					color: 'rgba(29, 33, 24, 0.72)',
					textTransform: 'uppercase',
				}}
				noWrap
			>
				{TILE_TYPE_LABEL[tile.type]}
			</Typography>
			<Typography
				component="span"
				sx={{
					position: 'absolute',
					right: 3,
					bottom: 2,
					fontSize: 7,
					fontWeight: 900,
					color: 'rgba(29, 33, 24, 0.52)',
				}}
			>
				{String(tile.index).padStart(2, '0')}
			</Typography>
			<Box sx={{ position: 'absolute', left: '50%', top: '50%' }}>
				{players.slice(0, 6).map(({ id, player }, tokenIndex) => {
					const offset = TOKEN_OFFSETS[tokenIndex] || TOKEN_OFFSETS[0];
					const isCurrent = id === String(currentTurnPlayerID);
					const isSelf = id === String(playerID);
					const professionImage = getProfessionImage(player.profession?.id || player.professionId || player.profession);
					return (
						<Box
							key={id}
							sx={{
								position: 'absolute',
								width: { xs: 19, md: 28 },
								height: { xs: 19, md: 28 },
								borderRadius: '50%',
								transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
								bgcolor: 'var(--gb-shell)',
								border: isCurrent ? '3px solid var(--gb-screen-glow)' : '2px solid var(--gb-screen)',
								boxShadow: isCurrent
									? '0 0 0 3px rgba(85, 107, 47, 0.35), 0 0 18px rgba(85, 107, 47, 0.65)'
									: '0 3px 6px var(--gb-shadow)',
								zIndex: isCurrent ? 4 : 3,
								overflow: 'hidden',
								display: 'grid',
								placeItems: 'center',
								'&::after': isSelf
									? professionImage ? {} : {
										content: '""',
										position: 'absolute',
										inset: 4,
										borderRadius: '50%',
										bgcolor: 'var(--gb-screen-glow)',
									}
									: {},
							}}
						>
							{professionImage ? (
								<Box
									component="img"
									src={professionImage}
									alt=""
									sx={{ width: '100%', height: '100%', objectFit: 'cover', p: 0.15 }}
								/>
							) : (
								<Typography sx={{ fontSize: 10, fontWeight: 900, color: PLAYER_COLORS[Number(id) % PLAYER_COLORS.length] }}>
									{Number(id) + 1}
								</Typography>
							)}
						</Box>
					);
				})}
			</Box>
		</Box>
	);
}

const GameBoard = ({
	G,
	playerID,
	currentTurnPlayerID,
	centerOverlay = null,
}) => {
	if (!G?.players) return null;

	const playersByTile = getPlayersByTile(G.players);
	const currentStage = G.stage?.currentStageId || 'opening-bell';
	const latestEvent = G.eventLog?.[G.eventLog.length - 1];

	return (
		<Box
			className="board-shell"
			sx={{
				width: '100%',
				height: '100%',
				maxWidth: 1120,
				maxHeight: 'calc(100vh - 112px)',
				aspectRatio: '16 / 10',
				mx: 'auto',
				p: { xs: 1, md: 2 },
				bgcolor: 'var(--gb-shell)',
				border: '4px solid var(--gb-shell-dark)',
				borderRadius: '18px',
				boxShadow: '0 12px 24px var(--gb-shadow)',
				minWidth: 0,
				minHeight: 0,
			}}
		>
			<Box
				className="board-screen"
				sx={{
					position: 'relative',
					width: '100%',
					height: '100%',
					display: 'grid',
					gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
					gridTemplateRows: 'repeat(12, minmax(0, 1fr))',
					gap: { xs: '3px', md: '4px' },
					bgcolor: 'var(--gb-screen)',
					border: '3px solid var(--gb-screen-glow)',
					borderRadius: '10px',
					p: { xs: 0.5, md: 0.75 },
					overflow: 'hidden',
				}}
			>
				{boardTiles.map((tile) => (
					<BoardTile
						key={tile.id}
						tile={tile}
						players={playersByTile[tile.index] || []}
						currentTurnPlayerID={currentTurnPlayerID}
						playerID={playerID}
					/>
				))}

				<Box
					sx={{
						gridColumn: BOARD_LAYOUT.center.gridColumn,
						gridRow: BOARD_LAYOUT.center.gridRow,
						minWidth: 0,
						minHeight: 0,
						borderRadius: 1.5,
						border: '2px solid rgba(216, 214, 207, 0.22)',
						bgcolor: 'rgba(29, 33, 24, 0.74)',
						color: 'var(--gb-shell)',
						display: 'grid',
						gridTemplateRows: 'auto 1fr auto',
						gap: 1,
						p: { xs: 1, md: 2 },
						overflow: 'hidden',
					}}
				>
					<Box sx={{ minWidth: 0 }}>
						<Typography sx={{ fontSize: { xs: 9, md: 11 }, fontWeight: 900, color: 'var(--gb-screen-glow)', textTransform: 'uppercase' }}>
							Boombust Terminal
						</Typography>
						<Typography sx={{ fontSize: { xs: 10, md: 13 }, fontWeight: 800 }} noWrap>
							Stage: {currentStage.replace(/-/g, ' ')}
						</Typography>
					</Box>

					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
						{centerOverlay}
					</Box>

					<Box sx={{ minWidth: 0 }}>
						<Typography sx={{ fontSize: { xs: 8, md: 10 }, color: 'rgba(216, 214, 207, 0.72)' }} noWrap>
							{latestEvent ? `${latestEvent.title}: ${latestEvent.results.map((result) => `${result.symbol} $${result.before}->${result.after}`).join(' ')}` : 'No market shock recorded.'}
						</Typography>
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default GameBoard;
