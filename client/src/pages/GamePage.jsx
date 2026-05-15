import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	Alert,
	Avatar,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Collapse,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	Drawer,
	IconButton,
	Snackbar,
	TextField,
	Typography,
} from '@mui/material';
import {
	AccountBalanceWallet,
	ArrowBack,
	Close,
	EmojiEvents,
	ExpandLess,
	ExpandMore,
	Groups,
	History,
	Menu,
	WarningAmber,
} from '@mui/icons-material';
import { Client } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { BoombustGame } from '../game/BoombustGame';
import GameBoard from '../components/Board/GameBoard';
import DiceRoller from '../components/Dice/DiceRoller';
import DealModal from '../components/Deals/DealModal';
import DealSelectModal from '../components/Deals/DealSelectModal';
import MarketCard from '../components/Deals/MarketCard';
import DoodadCard from '../components/Deals/DoodadCard';
import TurnTimer from '../components/HUD/TurnTimer';
import GlobalNews from '../components/HUD/GlobalNews';
import MoneyEventOverlay from '../components/HUD/MoneyEventOverlay';
import GameFinancialPanel from '../components/FinancialStatement/GameFinancialPanel';
import {
	ContextModal,
	StageContextPanel,
	StockMarketPanel,
} from '../components/Boombust/BoombustPanels';
import useViewportLayout from '../hooks/useViewportLayout';
import { getRoomInfo } from '../services/apiService';
import { colors } from '../theme';
import { soundFX } from '../utils/soundEffects';
import { getProfessionImage } from '../utils/professionImages';
import { getStageDefinition } from '../game/boombust/stageEngine';

const PLAYER_COLORS = ['#556B2F', '#8B6F47', '#2D3325', '#7C2D12', '#4A5568', '#B8B6AE'];
const LOG_TYPE_COLORS = {
	victory: 'var(--bb-text-primary)',
	downsize: 'var(--bb-text-primary)',
	error: '#7C2D12',
	payday: 'var(--bb-text-primary)',
	deal: 'var(--bb-text-primary)',
	doodad: '#7C2D12',
	loan: 'var(--bb-text-primary)',
	debt: 'var(--bb-text-primary)',
	move: 'var(--bb-text-primary)',
	market: 'var(--bb-text-primary)',
	dream: 'var(--bb-text-primary)',
	bankrupt: '#7C2D12',
};

const assetMatchesMarketKey = (asset, key) => {
	if (!asset || !key) return false;
	if (asset.key === key) return true;

	switch (key) {
		case 'PLEX':
			return ['DUPLEX', '4PLEX', '8PLEX'].includes(asset.key);
		case 'APTHOUSE':
			return asset.key === 'APTHOUSE';
		case 'rental':
			return ['2/1CONDO', '3/2HOUSE', 'DUPLEX', '4PLEX', '8PLEX', 'APTHOUSE', 'BED'].includes(asset.key);
		case 'gold':
			return asset.key === 'gold';
		case 'coin':
			return asset.key === 'coin';
		case 'cd':
			return asset.key === 'cd';
		default:
			return false;
	}
};

const PlayerRosterCard = ({ players, currentPlayerId, selfPlayerId }) => {
	const [open, setOpen] = useState(false);

	return (
		<Card
			sx={{
				bgcolor: 'var(--gb-shell)',
				color: '#1D2118',
				border: '2px solid var(--gb-shell-dark)',
				borderRadius: 1,
				boxShadow: '0 10px 0 var(--gb-shadow)',
			}}
		>
			<CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: open ? 1 : 0 }}>
					<Groups sx={{ fontSize: 16, color: 'var(--gb-screen-glow)' }} />
					<Typography variant="subtitle2" fontWeight={800} sx={{ flex: 1, fontSize: 13 }}>
						Table Roster
					</Typography>
					<IconButton size="small" onClick={() => setOpen((current) => !current)} sx={{ color: 'var(--bb-text-secondary)', p: 0.25 }}>
						{open ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
					</IconButton>
				</Box>

				<Collapse in={open}>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
						{players.map((player, index) => {
							const isCurrentTurn = player.id === String(currentPlayerId);
							const isSelf = player.id === String(selfPlayerId);

							return (
								<Box
									key={player.id}
									sx={{
										display: 'flex',
										alignItems: 'center',
										gap: 1,
										px: 1,
										py: 0.6,
										borderRadius: 2,
										bgcolor: isCurrentTurn ? 'rgba(85, 107, 47, 0.18)' : 'rgba(45, 51, 37, 0.08)',
										border: `1px solid ${isCurrentTurn ? 'rgba(85, 107, 47, 0.42)' : 'rgba(29, 33, 24, 0.12)'}`,
									}}
								>
									{(() => {
										const profImg = getProfessionImage(player.professionId || player.profession);
										return (
											<Avatar
												src={profImg || undefined}
												sx={{
													width: 38,
													height: 38,
													bgcolor: profImg ? 'transparent' : PLAYER_COLORS[index % PLAYER_COLORS.length],
													border: `2px solid ${isCurrentTurn ? 'rgba(16, 185, 129, 0.6)' : PLAYER_COLORS[index % PLAYER_COLORS.length]}`,
													boxShadow: isCurrentTurn ? `0 0 10px ${PLAYER_COLORS[index % PLAYER_COLORS.length]}44` : 'none',
													fontSize: 14,
													fontWeight: 800,
													objectFit: 'cover',
													p: profImg ? 0.3 : 0,
												}}
											>
												{!profImg && (player.name?.[0]?.toUpperCase() || `${index + 1}`)}
											</Avatar>
										);
									})()}
									<Box sx={{ flex: 1, minWidth: 0 }}>
										<Typography variant="body2" fontWeight={700} noWrap>
											{player.name}
										</Typography>
										<Typography variant="caption" sx={{ color: 'var(--bb-text-secondary)', fontWeight: 700 }} noWrap>
											{player.profession || `Player ${parseInt(player.id, 10) + 1}`}
										</Typography>
									</Box>
									<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
										{isSelf && (
											<Chip
												label="You"
												size="small"
												sx={{
													height: 19,
													fontSize: 10,
													fontWeight: 700,
													bgcolor: 'var(--gb-screen)',
													color: 'var(--bb-text-on-screen-strong)',
												}}
											/>
										)}
										{isCurrentTurn && (
											<Chip
												label="Active"
												size="small"
												sx={{
													height: 19,
													fontSize: 10,
													fontWeight: 700,
													bgcolor: 'var(--gb-screen-glow)',
													color: 'var(--gb-shell)',
												}}
											/>
										)}
										{player.downsizeTurns > 0 && (
											<Chip
												label={`Downsize ${player.downsizeTurns}`}
												size="small"
												sx={{
													height: 19,
													fontSize: 10,
													fontWeight: 700,
													bgcolor: 'var(--gb-shell-dark)',
													color: '#7C2D12',
												}}
											/>
										)}
										{player.charityTurns > 0 && (
											<Chip
												label={`Charity ${player.charityTurns}`}
												size="small"
												sx={{
													height: 19,
													fontSize: 10,
													fontWeight: 700,
													bgcolor: 'var(--gb-shell-dark)',
													color: 'var(--bb-text-primary)',
												}}
											/>
										)}
									</Box>
								</Box>
							);
						})}
					</Box>
				</Collapse>
			</CardContent>
		</Card>
	);
};

const EventFeedCard = ({ gameLog }) => (
	<Card
		sx={{
				bgcolor: 'var(--gb-shell)',
				color: '#1D2118',
				border: '2px solid var(--gb-shell-dark)',
				borderRadius: 1,
		}}
	>
		<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
				<History sx={{ fontSize: 18, color: 'var(--gb-screen-glow)' }} />
				<Typography variant="subtitle2" fontWeight={800}>
					Game Events
				</Typography>
			</Box>

			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.85, maxHeight: 260, overflow: 'auto' }}>
				{(gameLog || []).slice().reverse().slice(0, 10).map((log, index) => (
					<Box
						key={`${log.timestamp}-${index}`}
						sx={{
							p: 1.15,
							borderRadius: 2,
							bgcolor: 'rgba(45, 51, 37, 0.08)',
							border: '1px solid rgba(29, 33, 24, 0.14)',
						}}
					>
						<Typography
							variant="caption"
							sx={{
								fontSize: 11,
								lineHeight: 1.5,
									color: LOG_TYPE_COLORS[log.type] || 'var(--bb-text-primary)',
									fontWeight: 700,
							}}
						>
							{log.message}
						</Typography>
					</Box>
				))}

				{(!gameLog || gameLog.length === 0) && (
					<Typography variant="caption" sx={{ color: 'var(--bb-text-secondary)', fontStyle: 'italic', fontWeight: 700 }}>
						No events yet. Roll to begin the round.
					</Typography>
				)}
			</Box>
		</CardContent>
	</Card>
);

const SummaryCard = ({ label, value, color }) => (
	<Box
		sx={{
			p: 1.15,
			borderRadius: 2,
			bgcolor: 'rgba(85, 107, 47, 0.12)',
			border: '1px solid rgba(85, 107, 47, 0.24)',
			textAlign: 'center',
		}}
	>
		<Typography variant="caption" sx={{ display: 'block', fontSize: 10, color: 'var(--bb-text-secondary)', fontWeight: 700 }}>
			{label}
		</Typography>
		<Typography variant="body1" fontWeight={800} sx={{ color, fontVariantNumeric: 'tabular-nums' }}>
			${value.toLocaleString()}
		</Typography>
	</Box>
);

const BorrowDialog = ({ open, request, onClose, onConfirm }) => {
	const [amount, setAmount] = useState(() => Math.max(1000, Math.ceil((request?.shortfall || 0) / 1000) * 1000));

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="xs"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 2,
					bgcolor: 'var(--gb-shell)',
					color: 'var(--bb-text-primary)',
					border: '4px solid var(--gb-shell-dark)',
				},
			}}
		>
			<DialogTitle>Borrow From Bank</DialogTitle>
			<DialogContent sx={{ pt: '12px !important' }}>
				<Typography variant="body2" sx={{ mb: 2, color: 'var(--bb-text-primary)', fontWeight: 700 }}>
					You are short by ${request?.shortfall?.toLocaleString() || 0} for {request?.reason || 'this action'}.
					Borrowing only adds cash. The original action will not auto-complete.
				</Typography>
				<TextField
					fullWidth
					type="number"
					label="Loan amount"
					value={amount}
					onChange={(event) => {
						const nextValue = Math.max(1000, Math.ceil((Number(event.target.value) || 0) / 1000) * 1000);
						setAmount(nextValue);
					}}
					inputProps={{ min: 1000, step: 1000 }}
				/>
				<Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
					<Button size="small" variant="outlined" onClick={() => setAmount(Math.max(1000, Math.ceil((request?.shortfall || 0) / 1000) * 1000))}>
						Minimum
					</Button>
					<Button size="small" variant="outlined" onClick={() => setAmount((current) => current + 1000)}>
						+1000
					</Button>
				</Box>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button onClick={onClose} variant="outlined" color="inherit">
					Cancel
				</Button>
				<Button
					onClick={() => onConfirm(amount)}
					variant="contained"
					sx={{
						fontWeight: 700,
						background: 'var(--gb-screen-glow)',
						color: 'var(--gb-shell)',
					}}
				>
					Borrow ${amount.toLocaleString()}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

const ProfessionRevealDialog = ({
	open,
	currentPlayer,
	rosterItems,
	resolvedPlayerId,
	onContinue,
}) => {
	const profImg = getProfessionImage(currentPlayer?.profession?.id);
	return (
		<Dialog
			open={open}
			maxWidth="sm"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 4,
					bgcolor: 'var(--gb-shell)',
					color: 'var(--bb-text-primary)',
					border: '4px solid var(--gb-shell-dark)',
					overflow: 'hidden',
				},
			}}
		>
			<DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 1 }}>
				{/* Profession Avatar */}
				<Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
					<Box sx={{
						width: 80, height: 80,
						borderRadius: '50%',
						bgcolor: 'var(--gb-screen)',
						border: '3px solid var(--gb-screen-glow)',
						boxShadow: '0 8px 18px var(--gb-shadow)',
						display: 'flex', alignItems: 'center', justifyContent: 'center',
						overflow: 'hidden',
						p: profImg ? 0.5 : 0,
					}}>
						{profImg
							? <Box component="img" src={profImg} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
							: <Typography component="span" variant="h4" fontWeight={900} sx={{ color: 'var(--gb-shell)' }}>
								{currentPlayer?.profession?.title?.[0]}
							</Typography>
						}
					</Box>
				</Box>
				<Typography component="span" variant="overline" sx={{ letterSpacing: 2, display: 'block', color: 'var(--bb-text-secondary)', fontWeight: 800 }}>
					Your Profession
				</Typography>
				<Typography component="span" variant="h4" fontWeight={900} sx={{ display: 'block' }}>
					{currentPlayer.profession.title}
				</Typography>
			</DialogTitle>
			<DialogContent sx={{ pt: 1 }}>
				<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
					<SummaryCard label="Salary" value={currentPlayer.salary || 0} color={colors.income.main} />
					<SummaryCard label="Cash" value={currentPlayer.cash || 0} color={colors.blue.main} />
					<SummaryCard
						label="Cash Flow"
						value={(currentPlayer.salary || 0) - Object.values(currentPlayer.expenses || {}).reduce((sum, value) => sum + value, 0)}
						color={colors.income.main}
					/>
				</Box>
				<Divider sx={{ my: 2, borderColor: 'rgba(45,58,79,0.5)' }} />
				<Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, color: 'var(--bb-text-secondary)', fontWeight: 800 }}>
					Turn Order
				</Typography>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1.2 }}>
					{rosterItems.map((player, index) => {
						const pImg = getProfessionImage(player.professionId || player.profession);
						return (
							<Box
								key={`intro-${player.id}`}
								sx={{
									display: 'flex',
									alignItems: 'center',
									gap: 1,
									p: 1,
									borderRadius: 2,
									bgcolor: player.id === resolvedPlayerId ? 'rgba(85,107,47,0.18)' : 'rgba(45,51,37,0.08)',
									border: `1px solid ${player.id === resolvedPlayerId ? 'rgba(85,107,47,0.38)' : 'rgba(29,33,24,0.12)'}`,
								}}
							>
								<Avatar
									src={pImg || undefined}
									sx={{
										width: 32, height: 32,
										bgcolor: pImg ? 'transparent' : PLAYER_COLORS[index % PLAYER_COLORS.length],
										border: `2px solid ${PLAYER_COLORS[index % PLAYER_COLORS.length]}`,
										fontSize: 12, fontWeight: 800,
										p: pImg ? 0.3 : 0,
									}}
								>
									{!pImg && (index + 1)}
								</Avatar>
								<Box sx={{ minWidth: 0 }}>
									<Typography variant="body2" fontWeight={700} noWrap>
										{player.name}
									</Typography>
									<Typography variant="caption" sx={{ color: 'var(--bb-text-secondary)', fontWeight: 700 }} noWrap>
										{player.profession || 'Joining...'}
									</Typography>
								</Box>
							</Box>
						);
					})}
				</Box>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button
					fullWidth
					variant="contained"
					onClick={onContinue}
				sx={{ py: 1.5, fontWeight: 800, background: 'var(--gb-screen-glow)', color: 'var(--gb-shell)' }}
				>
					Start Playing
				</Button>
			</DialogActions>
		</Dialog>
	);
};

const FastTrackSpaceDialog = ({ space, player, onBuy, onPass }) => {
	if (!space || !player) return null;

	const canAfford = (player.fastTrackCash || 0) >= (space.cost || 0);

	return (
		<Dialog
			open={!!space}
			maxWidth="sm"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 4,
					bgcolor: 'var(--gb-shell)',
					color: 'var(--bb-text-primary)',
					border: '4px solid var(--gb-shell-dark)',
				},
			}}
		>
			<DialogTitle>{space.title}</DialogTitle>
			<DialogContent sx={{ pt: '12px !important' }}>
				<Typography variant="body2" sx={{ lineHeight: 1.6, color: 'var(--bb-text-primary)', fontWeight: 700 }}>
					{space.description}
				</Typography>
				<Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
					<SummaryCard label="Cost" value={space.cost || 0} color={colors.gold.main} />
					<SummaryCard label="FT Cash" value={player.fastTrackCash || 0} color={colors.blue.main} />
					<SummaryCard label="FT Income" value={player.fastTrackIncomeCurrent || 0} color="var(--gb-screen-glow)" />
				</Box>
				{space.cashflow ? (
					<Typography variant="body2" sx={{ mt: 2, color: colors.income.main, fontWeight: 700 }}>
						+${space.cashflow.toLocaleString()}/mo Fast Track income
					</Typography>
				) : null}
				{space.reward ? (
					<Typography variant="body2" sx={{ mt: 0.8, color: colors.gold.main, fontWeight: 700 }}>
						Reward: ${space.reward.toLocaleString()}
					</Typography>
				) : null}
				{space.rollmin ? (
					<Typography variant="caption" sx={{ display: 'block', mt: 0.8, color: 'var(--bb-text-secondary)', fontWeight: 700 }}>
						Requires a bonus roll of {space.rollmin}+ after purchase.
					</Typography>
				) : null}
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
				<Button onClick={onPass} variant="outlined" color="inherit">
					Pass
				</Button>
				<Button
					onClick={onBuy}
					variant="contained"
					disabled={!canAfford}
				sx={{ fontWeight: 700, background: 'var(--gb-screen-glow)', color: 'var(--gb-shell)' }}
				>
					Buy
				</Button>
			</DialogActions>
		</Dialog>
	);
};

const DownsizeTurnDialog = ({ prompt, onAcknowledge }) => {
	if (!prompt) return null;

	return (
		<Dialog
			open={!!prompt}
			maxWidth="xs"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 4,
					bgcolor: 'var(--gb-shell)',
					color: 'var(--bb-text-primary)',
					border: '4px solid var(--gb-shell-dark)',
				},
			}}
		>
			<DialogTitle sx={{ pb: 1 }}>
				<Typography component="span" variant="overline" sx={{ display: 'block', color: 'var(--gb-screen-glow)', fontWeight: 900, letterSpacing: 1.2 }}>
					DOWNSIZE
				</Typography>
				<Typography component="span" variant="h6" fontWeight={900} sx={{ display: 'block', color: 'var(--bb-text-primary)' }}>
					Turn Lost
				</Typography>
			</DialogTitle>
			<DialogContent sx={{ pt: '12px !important' }}>
				<Box
					sx={{
						p: 2,
						borderRadius: 1,
						bgcolor: 'var(--gb-screen)',
						color: 'var(--bb-text-on-screen-strong)',
						border: '3px solid var(--gb-screen-glow)',
					}}
				>
					<Typography variant="body2" sx={{ lineHeight: 1.6, fontWeight: 700 }}>
						{prompt.description || 'You lose this turn because you were downsized.'}
					</Typography>
				</Box>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button
					fullWidth
					variant="contained"
					onClick={onAcknowledge}
					sx={{ fontWeight: 700, background: 'var(--gb-screen-glow)', color: 'var(--gb-shell)' }}
				>
					Understood
				</Button>
			</DialogActions>
		</Dialog>
	);
};

const GamePage = () => {
	const navigate = useNavigate();
	const { roomCode } = useParams();
	const location = useLocation();
	const layout = useViewportLayout();
	const isMobile = layout.width < 900;
	const isLandscape = layout.width > layout.height;
	const routeState = location.state || {};
	const resolvedPlayerId = String(routeState.playerId ?? '0');
	const resolvedPlayerName = routeState.playerName || 'Player 1';
	const isRemote = roomCode && roomCode !== 'local';
	const initialLocalRoster = useMemo(() => {
		if (isRemote) return [];
		if (routeState.players?.length > 1) return routeState.players;
		return [
			{ id: '0', name: resolvedPlayerName, isHost: true, isReady: true },
			{ id: '1', name: 'Player 2', isHost: false, isReady: true },
		];
	}, [isRemote, resolvedPlayerName, routeState.players]);

	const clientRef = useRef(null);
	const [gameState, setGameState] = useState(null);
	const [roster, setRoster] = useState(() => {
		if (!isRemote) return initialLocalRoster;
		if (routeState.players?.length) return routeState.players;
		return [];
	});
	const [showFinancials, setShowFinancials] = useState(false);
	const [showLog, setShowLog] = useState(false);
	const [introAcknowledged, setIntroAcknowledged] = useState(false);
	const [borrowRequest, setBorrowRequest] = useState(null);
	const [selectedFastTrackDice, setSelectedFastTrackDice] = useState(2);
	const [isEndingTurn, setIsEndingTurn] = useState(false);
	const [isDiceRolling, setIsDiceRolling] = useState(false);
	const [rollingFace, setRollingFace] = useState(1);
	const [marketNotice, setMarketNotice] = useState(null);
	const [moneyEvents, setMoneyEvents] = useState([]);
	const rollIntervalRef = useRef(null);
	const rollTimeoutRef = useRef(null);
	const prevLogLengthRef = useRef(0);

	useEffect(() => {
		if (!isRemote) return undefined;

		let isCancelled = false;
		const hydrateRoster = async () => {
			const room = await getRoomInfo(roomCode);
			if (!isCancelled && room?.players?.length) {
				setRoster(room.players);
			}
		};

		hydrateRoster();
		const intervalId = window.setInterval(hydrateRoster, 5000);

		return () => {
			isCancelled = true;
			window.clearInterval(intervalId);
		};
	}, [isRemote, roomCode]);

	const resolvedNumPlayers = Math.max(roster.length || 0, isRemote ? 1 : 2);

	useEffect(() => {
		if (isRemote && roster.length === 0) return undefined;

		const client = Client({
			game: BoombustGame,
			numPlayers: resolvedNumPlayers,
			multiplayer: isRemote ? SocketIO({ server: import.meta.env.VITE_BGA_SERVER_URL || window.location.origin }) : undefined,
			matchID: isRemote ? roomCode : 'local',
			playerID: isRemote ? resolvedPlayerId : '0',
			debug: false,
		});

		client.start();
		clientRef.current = client;

		const unsubscribe = client.subscribe((state) => {
			if (state) setGameState({ ...state });
		});

		queueMicrotask(() => {
			const initialState = client.getState();
			if (initialState) setGameState({ ...initialState });
		});

		return () => {
			unsubscribe?.();
			client.stop();
		};
	}, [isRemote, resolvedNumPlayers, resolvedPlayerId, roomCode, roster.length]);

	const refreshState = useCallback((delays = [40]) => {
		if (!clientRef.current) return;
		const pendingDelays = Array.isArray(delays) ? delays : [delays];
		pendingDelays.forEach((delay) => {
			window.setTimeout(() => {
				const nextState = clientRef.current?.getState();
				if (nextState) setGameState({ ...nextState });
			}, delay);
		});
	}, []);

	const G = gameState?.G;
	const ctx = gameState?.ctx;
	const currentTurnPlayerId = ctx?.currentPlayer;
	const effectivePlayerId = isRemote ? resolvedPlayerId : String(currentTurnPlayerId ?? '0');
	const currentPlayer = G?.players?.[effectivePlayerId];
	const isMainPlay = ctx?.phase === 'mainPlay';
	const isMyTurn = isMainPlay && currentTurnPlayerId === effectivePlayerId;
	const currentPrompt = currentPlayer?.pendingPrompts?.[0] || null;
	const marketPrompt = currentPrompt?.kind === 'market' ? currentPrompt : null;
	const doodadPrompt = currentPrompt?.kind === 'doodad' ? currentPrompt : null;
	const downsizePrompt = currentPrompt?.kind === 'downsizeSkip' ? currentPrompt : null;
	const fastTrackPrompt = isMyTurn ? G?.currentFastTrackSpace : null;
	const hasRolled = isMyTurn && Boolean(G?.dice?.value);
	const hasDeal = Boolean(G?.currentDeal) && isMyTurn && hasRolled;
	const isSelectingDeal = Boolean(G?.isSelectingDeal) && isMyTurn && hasRolled;
	const hasMarket = Boolean(marketPrompt);
	const hasDoodad = Boolean(doodadPrompt);
	const hasDownsize = Boolean(downsizePrompt);
	const hasFastTrackPrompt = Boolean(fastTrackPrompt);
	const hasContextModal = Boolean(G?.contextModal);
	const hasModal = hasContextModal || hasDeal || isSelectingDeal || hasMarket || hasDoodad || hasDownsize || hasFastTrackPrompt;
	const tableLocked = !isMainPlay || hasModal || !introAcknowledged;
	const currentStageDefinition = useMemo(
		() => getStageDefinition(G?.stage?.currentStageId),
		[G?.stage?.currentStageId]
	);

	useEffect(() => {
		const currentLogs = G?.gameLog || [];
		const currentLength = currentLogs.length;
		const prevLength = prevLogLengthRef.current;

		if (currentLength > prevLength) {
			const newLogs = currentLogs.slice(prevLength);
			newLogs.forEach(log => {
				// Payday sound for everyone, victory only for current player
				if (log.type === 'payday') soundFX.playPayday();
				if (log.type === 'victory' && String(log.playerID) === effectivePlayerId) soundFX.playWin();
				// Market notification snackbar
				if (log.type === 'market' && log.message) {
					setMarketNotice(log.message);
				}
				
				// Full-screen money event overlay - ONLY for affected player
				const OVERLAY_TYPES = ['payday', 'deal', 'doodad', 'downsize', 'loan', 'bankrupt', 'victory'];
				const isOverlayType = OVERLAY_TYPES.includes(log.type);
				const isForCurrentPlayer = !log.playerID || String(log.playerID) === effectivePlayerId;
				
				// For deal/doodad: only show overlay when there's actual money change (has $ in message)
				// This filters out "revealed", "passed", "resolved" which don't involve money
				let shouldShowOverlay = isOverlayType && isForCurrentPlayer;
				if ((log.type === 'deal' || log.type === 'doodad') && log.message) {
					// Only show overlay if message contains money amount ($)
					const hasMoneyAmount = /\$[\d,]+/.test(log.message);
					if (!hasMoneyAmount) {
						shouldShowOverlay = false;
					}
				}
				
				if (shouldShowOverlay) {
					setMoneyEvents((prev) => [...prev, { ...log, _uid: `${log.type}-${Date.now()}-${Math.random()}` }]);
				}
			});
			prevLogLengthRef.current = currentLength;
		}
	}, [G?.gameLog, effectivePlayerId]);

	useEffect(() => {
		if (!isEndingTurn) return undefined;
		const resetId = window.setTimeout(
			() => setIsEndingTurn(false),
			!hasRolled || !isMyTurn ? 0 : 1200
		);
		return () => window.clearTimeout(resetId);
	}, [hasRolled, isEndingTurn, isMyTurn]);

	useEffect(() => () => {
		window.clearInterval(rollIntervalRef.current);
		window.clearTimeout(rollTimeoutRef.current);
	}, []);

	useEffect(() => {
		if (isRemote || !clientRef.current || currentTurnPlayerId == null) return;
		clientRef.current.updatePlayerID(String(currentTurnPlayerId));
	}, [currentTurnPlayerId, isRemote]);

	// Track which playerIDs have already had their name registered (per-player, not a single boolean)
	const nameRegisteredRef = useRef(new Set());
	useEffect(() => {
		if (!isMyTurn || !clientRef.current || currentTurnPlayerId == null) return;
		const pid = String(currentTurnPlayerId);
		if (nameRegisteredRef.current.has(pid)) return;
		// Look up the correct name for this specific player
		const nameToRegister = roster.find((r) => String(r.id) === pid)?.name
			|| (String(resolvedPlayerId) === pid ? resolvedPlayerName : null)
			|| `Player ${parseInt(pid, 10) + 1}`;
		if (nameToRegister) {
			clientRef.current.moves.setPlayerName(nameToRegister);
			nameRegisteredRef.current.add(pid);
		}
	}, [isMyTurn, currentTurnPlayerId, resolvedPlayerId, resolvedPlayerName, roster]);

	const roomPlayersById = Object.fromEntries((roster || []).map((player) => [String(player.id), player]));
	const orderedPlayerIds = ctx?.playOrder || G?.turnOrder || Object.keys(G?.players || {});

	const rosterItems = orderedPlayerIds.map((id, index) => {
		const player = G?.players?.[id];
		const roomPlayer = roomPlayersById[id];
		return {
			id,
			index,
			name: roomPlayer?.name || `Player ${parseInt(id, 10) + 1}`,
			profession: player?.profession?.title || null,
			professionId: player?.profession?.id || null,
			downsizeTurns: player?.downsizeTurns || 0,
			charityTurns: player?.charityTurns || 0,
		};
	});

	const matchingMarketAssets = useMemo(() => {
		if (!marketPrompt || !currentPlayer) return [];
		return (currentPlayer.assets || []).filter((asset) => assetMatchesMarketKey(asset, marketPrompt.key));
	}, [currentPlayer, marketPrompt]);

	const openBorrowDialog = useCallback((request) => {
		if (!request || !currentPlayer) return;
		const shortfall = Math.max(0, (request.requiredCash || 0) - (currentPlayer.cash || 0));
		if (shortfall <= 0) return;
		setBorrowRequest({ ...request, shortfall });
	}, [currentPlayer]);

	const syncLocalHotseatPlayer = useCallback(() => {
		if (isRemote || !clientRef.current || currentTurnPlayerId == null) return;
		clientRef.current.updatePlayerID(String(currentTurnPlayerId));
	}, [currentTurnPlayerId, isRemote]);

	const handleRollDice = useCallback(() => {
		if (!clientRef.current || !isMyTurn || hasRolled || tableLocked || isDiceRolling) return;
		syncLocalHotseatPlayer();
		const requestedDice = currentPlayer?.isFastTrack && currentPlayer?.fastTrackCharityActive ? selectedFastTrackDice : undefined;
		window.clearInterval(rollIntervalRef.current);
		window.clearTimeout(rollTimeoutRef.current);

		soundFX.playDiceRoll();

		setIsDiceRolling(true);
		rollIntervalRef.current = window.setInterval(() => {
			setRollingFace(Math.floor(Math.random() * 6) + 1);
		}, 60);
		rollTimeoutRef.current = window.setTimeout(() => {
			window.clearInterval(rollIntervalRef.current);
			clientRef.current?.moves.rollDice(requestedDice);
			setIsDiceRolling(false);
			refreshState([40, 140, 280]);
		}, 660);
	}, [currentPlayer, hasRolled, isDiceRolling, isMyTurn, refreshState, selectedFastTrackDice, syncLocalHotseatPlayer, tableLocked]);

	const handleAcceptDeal = (quantity = 1) => {
		if (!clientRef.current || !G?.currentDeal || !currentPlayer) return;
		syncLocalHotseatPlayer();
		const requiredCash = (G.currentDeal.downPayment || G.currentDeal.cost || 0) * quantity;
		if ((currentPlayer.cash || 0) < requiredCash) {
			openBorrowDialog({
				requiredCash,
				reason: G.currentDeal.isCharity ? 'charity donation' : `buy ${G.currentDeal.title}`,
			});
			return;
		}

		clientRef.current.moves.acceptDeal(quantity);
		refreshState();
	};

	const handleSelectDealType = useCallback((type) => {
		if (!clientRef.current) return;
		syncLocalHotseatPlayer();
		clientRef.current.moves.selectDealType(type);
		refreshState();
	}, [refreshState, syncLocalHotseatPlayer]);

	const handleDeclineDeal = useCallback(() => {
		if (!clientRef.current) return;
		syncLocalHotseatPlayer();
		clientRef.current.moves.declineDeal();
		refreshState();
	}, [refreshState, syncLocalHotseatPlayer]);

	const handlePayDoodad = useCallback((options = { mode: 'cash' }) => {
		if (!clientRef.current || !doodadPrompt || !currentPlayer) return;
		syncLocalHotseatPlayer();
		const requiredCash = options.mode === 'finance'
			? Number(doodadPrompt.downPayment || 0)
			: options.mode === 'credit'
				? 0
				: Number(doodadPrompt.cost || 0);

		if ((currentPlayer.cash || 0) < requiredCash) {
			openBorrowDialog({ requiredCash, reason: `pay ${doodadPrompt.title}` });
			return;
		}

		clientRef.current.moves.payDoodad(options);
		refreshState();
	}, [currentPlayer, doodadPrompt, openBorrowDialog, refreshState, syncLocalHotseatPlayer]);

	const handleResolveMarket = useCallback((payload) => {
		if (!clientRef.current || !marketPrompt || !currentPlayer) return;
		syncLocalHotseatPlayer();

		const requiredCash = payload?.action === 'buy'
			? Number(marketPrompt.cost || 0) * Math.max(1, Number(payload.units) || 1)
			: marketPrompt.marketType === 'fee'
				? Number(marketPrompt.cost || 0)
				: 0;

		if (requiredCash > 0 && (currentPlayer.cash || 0) < requiredCash) {
			openBorrowDialog({
				requiredCash,
				reason: payload?.action === 'buy' ? `buy ${marketPrompt.title}` : `pay ${marketPrompt.title}`,
			});
			return;
		}

		clientRef.current.moves.resolveMarketOffer(payload);
		refreshState();
	}, [currentPlayer, marketPrompt, openBorrowDialog, refreshState, syncLocalHotseatPlayer]);

	const handleEndTurn = useCallback(() => {
		if (!clientRef.current || isEndingTurn) return;
		syncLocalHotseatPlayer();
		setIsEndingTurn(true);
		clientRef.current.moves.endTurn();
		refreshState([40, 160, 320]);
	}, [isEndingTurn, refreshState, syncLocalHotseatPlayer]);

	// Auto-handler when 60s timer expires: roll dice first if not yet rolled, then end turn
	const handleTimeout = useCallback(() => {
		if (!clientRef.current || !isMyTurn || isEndingTurn) return;
		if (!hasRolled && !isDiceRolling && !hasModal && !currentPlayer?.isBankrupt) {
			// Auto-roll silently then end turn after roll completes
			syncLocalHotseatPlayer();
			clientRef.current.moves.rollDice();
			refreshState([40, 140]);
			// End turn after state settles
			window.setTimeout(() => {
				if (!clientRef.current || isEndingTurn) return;
				clientRef.current.moves.endTurn();
				refreshState([40, 160, 320]);
				setIsEndingTurn(true);
			}, 800);
		} else if (hasRolled && !hasModal) {
			handleEndTurn();
		}
	}, [currentPlayer?.isBankrupt, handleEndTurn, hasModal, hasRolled, isDiceRolling, isEndingTurn, isMyTurn, refreshState, syncLocalHotseatPlayer]);

	const handleTakeLoan = useCallback((amount) => {
		if (!clientRef.current) return;
		syncLocalHotseatPlayer();
		clientRef.current.moves.takeLoan(amount);
		refreshState([40, 140]);
	}, [refreshState, syncLocalHotseatPlayer]);

	const handlePayDebt = useCallback((liabilityKey, amount) => {
		if (!clientRef.current) return;
		syncLocalHotseatPlayer();
		clientRef.current.moves.payDebt(liabilityKey, amount);
		refreshState([40, 140]);
	}, [refreshState, syncLocalHotseatPlayer]);

	const handleSellAsset = useCallback((assetId) => {
		if (!clientRef.current) return;
		syncLocalHotseatPlayer();
		clientRef.current.moves.sellAsset(assetId);
		refreshState([40, 140]);
	}, [refreshState, syncLocalHotseatPlayer]);

	const handleDeclareBankruptcy = useCallback(() => {
		if (!clientRef.current) return;
		syncLocalHotseatPlayer();
		clientRef.current.moves.declareBankruptcy();
		refreshState([40, 140]);
	}, [refreshState, syncLocalHotseatPlayer]);

	const handleBuyFastTrackSpace = useCallback(() => {
		if (!clientRef.current) return;
		syncLocalHotseatPlayer();
		clientRef.current.moves.buyFastTrackSpace();
		refreshState([40, 140]);
	}, [refreshState, syncLocalHotseatPlayer]);

	const handleDeclineFastTrackSpace = useCallback(() => {
		if (!clientRef.current) return;
		syncLocalHotseatPlayer();
		clientRef.current.moves.declineFastTrackSpace();
		refreshState([40, 140]);
	}, [refreshState, syncLocalHotseatPlayer]);

	const handleResolveDownsizeTurn = useCallback(() => {
		if (!clientRef.current) return;
		syncLocalHotseatPlayer();
		clientRef.current.moves.resolveDownsizeTurn();
		refreshState([40, 140, 260]);
	}, [refreshState, syncLocalHotseatPlayer]);

	const handleDismissContextModal = useCallback(() => {
		if (!clientRef.current) return;
		syncLocalHotseatPlayer();
		clientRef.current.moves.dismissContextModal();
		refreshState([40]);
	}, [refreshState, syncLocalHotseatPlayer]);

	if (!G || !currentPlayer) {
		return (
			<Box
				sx={{
					minHeight: '100vh',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					flexDirection: 'column',
					gap: 1.5,
				}}
			>
				<Typography variant="h5" fontWeight={800} sx={{ color: colors.income.main }}>
					Loading table...
				</Typography>
				<Typography color="text.secondary">Syncing with the game state.</Typography>
			</Box>
		);
	}

	if (ctx?.gameover) {
		return (
			<Box
				sx={{
					minHeight: '100vh',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					flexDirection: 'column',
					textAlign: 'center',
					p: 3,
					gap: 2,
				}}
			>
				<EmojiEvents sx={{ fontSize: 64, color: colors.gold.main }} />
				<Typography variant="h3" fontWeight={900}>
					You Win
				</Typography>
				<Typography color="text.secondary">Your table reached financial freedom.</Typography>
				<Button
					variant="contained"
					onClick={() => navigate('/')}
					sx={{ px: 4, py: 1.4, fontWeight: 700, background: 'var(--gb-screen-glow)' }}
				>
					Return Home
				</Button>
			</Box>
		);
	}

	const activePlayerName = rosterItems.find((item) => item.id === currentTurnPlayerId)?.name || 'Opponent';
	const turnTimerResetKey = `${currentTurnPlayerId}-${effectivePlayerId}-${String(Boolean(G?.dice?.value))}-${String(hasModal)}`;
	const boardCenterDice = (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				p: 0,
				bgcolor: 'transparent',
				border: 'none',
				boxShadow: 'none',
			}}
		>
			<DiceRoller
				dice={G.dice}
				onRoll={handleRollDice}
				onEndTurn={handleEndTurn}
				hasRolled={hasRolled}
				disabled={tableLocked || currentPlayer.isBankrupt}
				isMyTurn={isMyTurn}
				compact
				isEndingTurn={isEndingTurn}
				isRolling={isDiceRolling}
				rollingFace={rollingFace}
			/>
		</Box>
	);

	// Board area — used in all layouts
	const boardInner = (
		<>
			<GlobalNews gameLog={G.gameLog || []} isMobile={isMobile} bottomOffset={isMobile ? 98 : 18} />
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: isMobile && !isLandscape ? 0.75 : 1.25 }}>
				<Box sx={{ minWidth: 0 }}>
					<Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.2, fontSize: isMobile ? 9 : 10 }}>
						Current Turn
					</Typography>
					<Typography variant="body2" fontWeight={800} noWrap>
						{activePlayerName}
					</Typography>
				</Box>
				{isMyTurn && (
					<Box sx={{ minWidth: isMobile ? 80 : 120 }}>
						<TurnTimer
							key={turnTimerResetKey}
							duration={60}
							isActive={isMyTurn && !hasModal && !currentPlayer.isBankrupt && !isEndingTurn && !isDiceRolling}
							onTimeout={handleTimeout}
						/>
					</Box>
				)}
			</Box>

			{currentPlayer.isFastTrack && currentPlayer.fastTrackCharityActive && !hasRolled && (
				<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
					{[1, 2, 3].map((count) => (
						<Button
							key={`ft-dice-${count}`}
							size="small"
							variant={selectedFastTrackDice === count ? 'contained' : 'outlined'}
							onClick={() => setSelectedFastTrackDice(count)}
							sx={{ fontWeight: 700, borderColor: 'var(--gb-screen-glow)', color: selectedFastTrackDice === count ? 'var(--gb-shell)' : 'var(--gb-screen-glow)', background: selectedFastTrackDice === count ? 'var(--gb-screen-glow)' : undefined }}
						>
							{count} die{count > 1 ? 's' : ''}
						</Button>
					))}
				</Box>
			)}

			{currentPlayer.notice?.message && (
				<Box sx={{ mb: 1, p: 1, borderRadius: 2, bgcolor: currentPlayer.notice.type === 'error' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)', border: `1px solid ${currentPlayer.notice.type === 'error' ? 'rgba(239, 68, 68, 0.18)' : 'rgba(245, 158, 11, 0.18)'}`, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
					<WarningAmber sx={{ fontSize: 16, color: currentPlayer.notice.type === 'error' ? colors.expense.main : colors.warning.main, mt: 0.15 }} />
					<Typography variant="body2" sx={{ fontSize: 12, color: currentPlayer.notice.type === 'error' ? colors.expense.main : colors.warning.main }}>
						{currentPlayer.notice.message}
					</Typography>
				</Box>
			)}

			{currentPlayer.isBankrupt && (
				<Box sx={{ mb: 1, p: 1, borderRadius: 2, bgcolor: 'rgba(251, 113, 133, 0.08)', border: '1px solid rgba(251, 113, 133, 0.18)' }}>
					<Typography variant="body2" sx={{ fontSize: 12, color: '#7C2D12', fontWeight: 700 }}>
						Bankruptcy: Sell assets or take a loan to continue.
					</Typography>
				</Box>
			)}
		</>
	);

	// boardSize for mobile portrait: take min(viewport width - 2*padding, viewport height * 0.48)
	const mobileBoardSize = isMobile && !isLandscape
		? Math.min(layout.width - 24, Math.round(layout.height * 0.50))
		: null;

	const boardSection = (
		<Card
			sx={{
				position: 'relative',
				bgcolor: 'transparent',
				border: 'none',
				borderRadius: 0,
				overflow: 'hidden',
				// On desktop/landscape: stretch to fill column. On portrait: auto height.
				...(isMobile && !isLandscape ? {} : { flex: 1 }),
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<CardContent sx={{ p: isMobile ? 1 : 1.5, '&:last-child': { pb: isMobile ? 1 : 1.5 }, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
				<Box sx={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
					{boardInner}
					{/* Board canvas — use explicit px on portrait mobile, cqh on desktop */}
					<Box
						{...(isMobile && !isLandscape ? {} : { style: { containerType: 'size' } })}
						sx={{
							// Portrait mobile: explicit fixed square; desktop/landscape: flex fill
							...(isMobile && !isLandscape
								? { width: mobileBoardSize, height: mobileBoardSize, mx: 'auto', flexShrink: 0 }
								: { flex: 1, minHeight: 0 }
							),
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							position: 'relative',
							overflow: 'hidden',
						}}
					>
						<GameBoard
							G={G}
							playerID={effectivePlayerId}
							currentTurnPlayerID={currentTurnPlayerId}
							isMobile={isMobile}
							centerOverlay={boardCenterDice}
						/>
					</Box>
				</Box>
			</CardContent>
		</Card>
	);

	const rightRail = (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minHeight: 0, '& > *': { flexShrink: 0 } }}>
			<GameFinancialPanel
				player={currentPlayer}
				isCurrentTurn={isMyTurn}
				onTakeLoan={handleTakeLoan}
				onPayDebt={handlePayDebt}
				onSellAsset={handleSellAsset}
				onDeclareBankruptcy={handleDeclareBankruptcy}
			/>
			<StageContextPanel stage={currentStageDefinition} />
			<PlayerRosterCard players={rosterItems} currentPlayerId={currentTurnPlayerId} selfPlayerId={effectivePlayerId} />
			<StockMarketPanel stockMarket={G.stockMarket} />
		</Box>
	);
	return (
		<Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
			<Box
				sx={{
					position: 'sticky',
					top: 0,
					zIndex: 20,
					display: 'flex',
					alignItems: 'center',
					gap: 0.75,
					px: 1,
					py: 0.6,
					borderBottom: '1px solid',
					borderColor: 'var(--gb-screen-glow)',
					bgcolor: 'var(--gb-screen)',
					color: 'var(--gb-shell)',
				}}
			>
				<IconButton onClick={() => navigate('/')} size="small" sx={{ color: 'text.secondary' }}>
					<ArrowBack fontSize="small" />
				</IconButton>
				<Box sx={{ flex: 1, minWidth: 0 }}>
					<Typography variant="subtitle2" fontWeight={800} noWrap>
						{currentPlayer.profession?.title || 'Boombust'}
					</Typography>
					<Typography variant="caption" color="text.secondary" noWrap>
						Room {isRemote ? roomCode : 'LOCAL'} • {rosterItems.length} players
					</Typography>
				</Box>
				<Chip
					icon={<AccountBalanceWallet sx={{ fontSize: 14 }} />}
					label={`$${(currentPlayer.cash || 0).toLocaleString()}`}
					size="small"
					sx={{
						fontWeight: 800,
						bgcolor: colors.income.bg,
						color: colors.income.main,
						fontVariantNumeric: 'tabular-nums',
					}}
				/>
				<IconButton onClick={() => setShowLog(true)} size="small" sx={{ color: 'text.secondary' }}>
					<History fontSize="small" />
				</IconButton>
				{isMobile && (
					<IconButton onClick={() => setShowFinancials(true)} size="small" sx={{ color: 'text.secondary' }}>
						<Menu fontSize="small" />
					</IconButton>
				)}
			</Box>


			{isMobile ? (
				isLandscape ? (
					/* Mobile Landscape: board left + financial right, no scroll on left */
					<Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(220px, 280px)', minHeight: 0, overflow: 'hidden' }}>
						<Box sx={{ overflow: 'hidden', px: 1, py: 0.75, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
							{boardSection}
						</Box>
					<Box sx={{ overflowY: 'auto', px: 1, py: 0.75, display: 'flex', flexDirection: 'column', gap: 1, borderLeft: '1px solid rgba(85, 107, 47, 0.35)', minHeight: 0 }}>
							{rightRail}
						</Box>
					</Box>
				) : (
					/* Mobile Portrait: fixed board on top, scrollable panel below */
					<Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
						{/* Board area — fixed height, no scroll */}
						<Box sx={{ flexShrink: 0, px: 1, pt: 1, pb: 0.5 }}>
							{boardSection}
						</Box>
						{/* Financial panel — scrollable */}
						<Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, px: 1, pb: 'calc(16px + env(safe-area-inset-bottom, 0px))', pt: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
							{rightRail}
						</Box>
					</Box>
				)
			) : (
				/* Desktop: two independent scroll columns */
				<Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) clamp(320px, 24vw, 420px)', columnGap: 'clamp(12px, 1.4vw, 22px)', minHeight: 0, overflow: 'hidden' }}>
					{/* Left column: board — pinned, no scroll */}
					<Box sx={{ overflow: 'hidden', px: { xs: 1, lg: 1.25 }, py: 1, display: 'flex', flexDirection: 'column', gap: 1, minHeight: 0 }}>
						{boardSection}
					</Box>
					{/* Right column: roster + financial panel — independent scroll */}
					<Box sx={{ display: 'flex', flexDirection: 'column', px: 1, py: 1, gap: 1.5, borderLeft: '1px solid rgba(85, 107, 47, 0.35)', minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
						{rightRail}
					</Box>
				</Box>
			)}


			<Drawer
				anchor="bottom"
				open={showLog}
				onClose={() => setShowLog(false)}
				PaperProps={{ sx: { maxHeight: '68vh', borderRadius: '18px 18px 0 0', bgcolor: 'var(--gb-shell)', color: 'var(--bb-text-primary)', border: '4px solid var(--gb-shell-dark)' } }}
			>
				<Box sx={{ p: 2 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
						<Typography variant="subtitle1" fontWeight={800}>
							Game Log
						</Typography>
						<IconButton onClick={() => setShowLog(false)} size="small">
							<Close fontSize="small" />
						</IconButton>
					</Box>
					<EventFeedCard gameLog={G.gameLog || []} />
				</Box>
			</Drawer>

			<Drawer
				anchor="right"
				open={showFinancials}
				onClose={() => setShowFinancials(false)}
				PaperProps={{
					sx: {
						width: 'min(92vw, 420px)',
						bgcolor: 'var(--gb-screen)',
						borderLeft: '1px solid rgba(85, 107, 47, 0.55)',
						display: 'flex',
						flexDirection: 'column',
					},
				}}
			>
				{/* Sticky header */}
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						px: 1.5,
						py: 1,
						borderBottom: '1px solid rgba(45, 58, 79, 0.5)',
						bgcolor: 'rgba(10, 15, 26, 0.9)',
						backdropFilter: 'blur(12px)',
						flexShrink: 0,
					}}
				>
					<Typography variant="subtitle1" fontWeight={800}>
						Table Details
					</Typography>
					<IconButton onClick={() => setShowFinancials(false)} size="small">
						<Close fontSize="small" />
					</IconButton>
				</Box>
				{/* Scrollable content */}
				<Box
					sx={{
						flex: 1,
						overflowY: 'auto',
						p: 1.5,
						display: 'flex',
						flexDirection: 'column',
						gap: 1.5,
						pb: 'calc(12px + env(safe-area-inset-bottom, 0px))',
					}}
				>
					{rightRail}
				</Box>
			</Drawer>

			<DealSelectModal open={isSelectingDeal} onSelect={handleSelectDealType} onDecline={handleDeclineDeal} playerCash={currentPlayer.cash || 0} />
			{hasDeal && (
				<DealModal
					key={G.currentDeal?.id || G.currentDeal?.title}
					deal={G.currentDeal}
					onAccept={handleAcceptDeal}
					onDecline={handleDeclineDeal}
					onBorrow={openBorrowDialog}
					playerCash={currentPlayer.cash || 0}
				/>
			)}
			{hasMarket && !hasDeal && (
				<MarketCard
					key={marketPrompt?.id || marketPrompt?.title}
					market={marketPrompt}
					playerCash={currentPlayer.cash || 0}
					matchingAssets={matchingMarketAssets}
					onResolve={handleResolveMarket}
					onBorrow={openBorrowDialog}
				/>
			)}
			{hasDoodad && !hasDeal && !hasMarket && (
				<DoodadCard doodad={doodadPrompt} onPay={handlePayDoodad} onBorrow={openBorrowDialog} playerCash={currentPlayer.cash || 0} />
			)}
			{hasDownsize && !hasDeal && !hasMarket && !hasDoodad && (
				<DownsizeTurnDialog prompt={downsizePrompt} onAcknowledge={handleResolveDownsizeTurn} />
			)}
			{hasFastTrackPrompt && (
				<FastTrackSpaceDialog space={fastTrackPrompt} player={currentPlayer} onBuy={handleBuyFastTrackSpace} onPass={handleDeclineFastTrackSpace} />
			)}
			<ContextModal data={G.contextModal} onClose={handleDismissContextModal} />

			<ProfessionRevealDialog
				open={Boolean(currentPlayer?.profession) && !introAcknowledged && !hasContextModal}
				currentPlayer={currentPlayer}
				rosterItems={rosterItems}
				resolvedPlayerId={resolvedPlayerId}
				onContinue={() => setIntroAcknowledged(true)}
			/>

			<BorrowDialog
				key={borrowRequest ? `${borrowRequest.reason}-${borrowRequest.requiredCash}` : 'borrow-dialog'}
				open={!!borrowRequest}
				request={borrowRequest}
				onClose={() => setBorrowRequest(null)}
				onConfirm={(amount) => {
					handleTakeLoan(amount);
					setBorrowRequest(null);
				}}
			/>

			{/* Market event global notification */}
			<Snackbar
				open={!!marketNotice}
				autoHideDuration={5500}
				onClose={() => setMarketNotice(null)}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				sx={{ top: { xs: 56, sm: 64 } }}
			>
				<Alert
					onClose={() => setMarketNotice(null)}
					severity="warning"
					variant="filled"
					icon={false}
					sx={{
						fontWeight: 700,
						fontSize: 13,
						bgcolor: 'var(--gb-shell)',
						color: 'var(--bb-text-primary)',
						border: '2px solid var(--gb-shell-dark)',
						boxShadow: '0 8px 18px var(--gb-shadow)',
						maxWidth: 420,
					}}
				>
					<strong style={{ color: 'var(--gb-screen-glow)' }}>Market Event:</strong> {marketNotice}
				</Alert>
			</Snackbar>
			{/* Full-screen money event overlay */}
			<MoneyEventOverlay
				events={moneyEvents}
				onDismiss={() => setMoneyEvents((prev) => prev.slice(1))}
			/>

		</Box>
	);
};

export default GamePage;
