import { useState, useEffect } from 'react';
import {
	Box,
	Container,
	Typography,
	Button,
	Card,
	CardContent,
	Chip,
	Avatar,
	IconButton,
	Tooltip,
} from '@mui/material';
import {
	ContentCopy,
	PlayArrow,
	Check,
	ArrowBack,
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getRoomInfo, setPlayerReady, startGame } from '../services/apiService';
import { colors } from '../theme';

const PLAYER_COLORS = ['#556B2F', '#8B6F47', '#283593', '#7C2D12', '#4A5568', '#B8B6AE'];
const MotionDiv = motion.div;

const LobbyPage = () => {
	const navigate = useNavigate();
	const { roomCode } = useParams();
	const location = useLocation();
	const { playerId = '0', playerName = 'Player 1', isHost = false } = location.state || {};
	const [room, setRoom] = useState(null);
	const [copied, setCopied] = useState(false);
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		const loadRoom = async () => {
			const info = await getRoomInfo(roomCode);
			if (info) {
				setRoom(info);
				// If host started the game, navigate everyone to select screen!
				if (info.status === 'PLAYING') {
					navigate(`/game/${roomCode}`, {
						state: { playerId, playerName, isHost, players: info.players || [] }
					});
				}
			}
		};
		loadRoom();

		// Poll every 2 seconds for lobby updates (replaces broken SSE mock)
		const pollInterval = setInterval(loadRoom, 2000);

		return () => {
			clearInterval(pollInterval);
		};
	}, [isHost, navigate, playerId, playerName, roomCode]);

	const handleCopyCode = () => {
		navigator.clipboard.writeText(roomCode);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleToggleReady = async () => {
		const newReady = !isReady;
		setIsReady(newReady);
		await setPlayerReady(roomCode, playerId, newReady);
		const info = await getRoomInfo(roomCode);
		if (info) setRoom(info);
	};

	const handleStartGame = async () => {
		try {
			await startGame(roomCode);
			navigate(`/game/${roomCode}`, {
				state: { playerId, playerName, isHost, players: room?.players || [] }
			});
		} catch (err) {
			console.error("Failed to start game:", err);
		}
	};

	const canStart = (room?.players?.length || 0) >= 1;

	return (
		<Box sx={{
			minHeight: '100vh',
			background: 'var(--gb-screen)',
			display: 'flex',
			flexDirection: 'column',
		}}>
			{/* Header */}
			<Box sx={{
				display: 'flex',
				alignItems: 'center',
				gap: 2,
				p: 2,
				borderBottom: '1px solid rgba(45, 58, 79, 0.5)',
			}}>
				<IconButton onClick={() => navigate('/')} sx={{ color: 'text.secondary' }}>
					<ArrowBack />
				</IconButton>
				<Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
					Game Lobby
				</Typography>
				{isHost && (
					<Chip label="Host" size="small" sx={{ bgcolor: colors.income.bg, color: colors.income.main }} />
				)}
			</Box>

			<Container maxWidth="sm" sx={{ flex: 1, py: 4 }}>
				{/* Room Code Display */}
				<MotionDiv
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ duration: 0.4 }}
				>
					<Card sx={{
						mb: 4,
						bgcolor: 'var(--gb-shell)',
						backdropFilter: 'blur(16px)',
						border: '4px solid var(--gb-shell-dark)',
						textAlign: 'center',
					}}>
						<CardContent sx={{ py: 4 }}>
							<Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 2, mb: 1, display: 'block' }}>
								Room Code
							</Typography>
							<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
								<Typography
									variant="h2"
									sx={{
										fontWeight: 900,
										letterSpacing: '0.3em',
										color: 'var(--gb-screen-glow)',
										fontFamily: 'monospace',
									}}
								>
									{roomCode}
								</Typography>
								<Tooltip title={copied ? 'Copied!' : 'Copy code'}>
									<IconButton onClick={handleCopyCode} sx={{ color: copied ? 'var(--gb-screen-glow)' : 'text.secondary' }}>
										{copied ? <Check /> : <ContentCopy />}
									</IconButton>
								</Tooltip>
							</Box>
							<Typography variant="body2" color="text.secondary">
								Share this code with friends to join
							</Typography>
						</CardContent>
					</Card>
				</MotionDiv>

				{/* Players List */}
				<Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
					Players ({room?.players?.length || 1} / {room?.maxPlayers || 6})
				</Typography>

				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
					<AnimatePresence>
						{(room?.players || [{ id: '0', name: playerName, isHost: true, isReady: false }]).map((player, index) => (
							<MotionDiv
								key={player.id}
								initial={{ x: -20, opacity: 0 }}
								animate={{ x: 0, opacity: 1 }}
								transition={{ delay: index * 0.1 }}
							>
								<Card sx={{
									bgcolor: player.id === playerId ? 'rgba(16, 185, 129, 0.08)' : 'rgba(26, 35, 50, 0.6)',
									border: `1px solid ${player.id === playerId ? 'rgba(16, 185, 129, 0.3)' : 'rgba(45, 58, 79, 0.4)'}`,
								}}>
									<CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
											<Avatar sx={{
												width: 40,
												height: 40,
												bgcolor: PLAYER_COLORS[index % PLAYER_COLORS.length],
												fontWeight: 700,
												fontSize: 16,
											}}>
												{player.name?.[0]?.toUpperCase() || 'P'}
											</Avatar>
											<Box sx={{ flex: 1 }}>
												<Typography fontWeight={600}>{player.name}</Typography>
												{player.isHost && (
													<Chip label="Host" size="small" sx={{ height: 20, fontSize: 10, bgcolor: 'rgba(245, 158, 11, 0.15)', color: 'var(--gb-screen-glow)' }} />
												)}
											</Box>
											<Chip
												label={player.isReady || player.isHost ? 'Ready' : 'Waiting'}
												size="small"
												sx={{
													bgcolor: (player.isReady || player.isHost) ? colors.income.bg : 'rgba(255,255,255,0.05)',
													color: (player.isReady || player.isHost) ? colors.income.main : 'text.secondary',
													fontWeight: 600,
												}}
											/>
										</Box>
									</CardContent>
								</Card>
							</MotionDiv>
						))}
					</AnimatePresence>
				</Box>

				{/* Action Buttons */}
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					{!isHost && (
						<Button
							variant={isReady ? 'outlined' : 'contained'}
							size="large"
							onClick={handleToggleReady}
							sx={{
								py: 2,
								borderRadius: 3,
								fontWeight: 700,
								fontSize: '1rem',
								...(isReady ? {
									borderColor: 'var(--gb-screen-glow)',
									color: 'var(--gb-screen-glow)',
								} : {
									background: 'var(--gb-screen-glow)',
								}),
							}}
						>
							{isReady ? 'Ready' : 'Ready Up'}
						</Button>
					)}

					{isHost && (
						<Button
							variant="contained"
							size="large"
							onClick={handleStartGame}
							disabled={!canStart}
							startIcon={<PlayArrow />}
							sx={{
								py: 2,
								borderRadius: 3,
								fontWeight: 700,
								fontSize: '1.1rem',
								background: 'var(--gb-screen-glow)',
								boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
								'&:hover': {
									background: '#6F843A',
									transform: 'translateY(-2px)',
								},
								transition: 'all 0.2s ease',
							}}
						>
							Start Game
						</Button>
					)}

					{!isHost && (
						<Box sx={{
							textAlign: 'center',
							p: 3,
							borderRadius: 3,
							bgcolor: 'rgba(16, 185, 129, 0.06)',
							border: '1px solid rgba(16, 185, 129, 0.15)',
						}}>
							<Typography variant="body1" sx={{ color: 'var(--gb-screen-glow)', fontWeight: 600, mb: 0.5 }}>
								Waiting for Host to start the game…
							</Typography>
							<Typography variant="caption" color="text.secondary">
								You will be automatically redirected when the game starts.
							</Typography>
						</Box>
					)}
				</Box>
			</Container>
		</Box>
	);
};

export default LobbyPage;
