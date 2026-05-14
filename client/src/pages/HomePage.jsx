import { useState } from 'react';
import {
	Box,
	Container,
	Typography,
	Button,
	TextField,
	Card,
	CardContent,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	InputAdornment,
	IconButton,
	Chip,
} from '@mui/material';
import {
	Add,
	Login,
	Casino,
	Close,
	Person,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createRoom, joinRoom } from '../services/apiService';

const MotionDiv = motion.div;

const HomePage = () => {
	const navigate = useNavigate();
	const [joinDialogOpen, setJoinDialogOpen] = useState(false);
	const [roomCode, setRoomCode] = useState('');
	const [playerName, setPlayerName] = useState('');
	const [error, setError] = useState('');
	const [isCreating, setIsCreating] = useState(false);

	const isNameValid = playerName.trim().length > 0;

	const handleCreateRoom = async () => {
		if (!isNameValid) return;
		setIsCreating(true);
		try {
			const room = await createRoom(playerName.trim());
			navigate(`/lobby/${room.id}`, { state: { playerId: '0', playerName: playerName.trim(), isHost: true } });
		} catch (err) {
			setError(err.message);
		} finally {
			setIsCreating(false);
		}
	};

	const handleJoinRoom = async () => {
		if (!isNameValid) return;
		if (!roomCode || roomCode.length < 4) {
			setError('Enter a valid 4-character room code');
			return;
		}
		try {
			const { room, player } = await joinRoom(roomCode.toUpperCase(), playerName.trim());
			setJoinDialogOpen(false);
			navigate(`/lobby/${room.id}`, { state: { playerId: player.id, playerName: player.name } });
		} catch (err) {
			setError(err.message);
		}
	};

	return (
		<Box sx={{
			minHeight: '100vh',
			background: 'var(--gb-screen)',
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			px: 2,
			position: 'relative',
			overflow: 'hidden',
		}}>
			<Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
				<MotionDiv
					initial={{ y: -30, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ duration: 0.6 }}
				>
					{/* Logo */}
					<Box sx={{ textAlign: 'center', mb: 6 }}>
						<Box
							component="img"
							src="/favicon.svg"
							alt="Boombust"
							sx={{
								width: 96,
								height: 96,
								mx: 'auto',
								mb: 3,
								filter: 'drop-shadow(0 10px 0 rgba(0,0,0,0.18))',
							}}
						/>
						<Typography
							variant="h3"
							sx={{
								fontWeight: 900,
								color: '#F7F1E3',
								mb: 1,
							}}
						>
							Boombust
						</Typography>
						<Typography
							sx={{ fontSize: '1.1rem', maxWidth: 420, mx: 'auto', color: '#D8D6CF' }}
						>
							Escape the market shocks.
						</Typography>
					</Box>
				</MotionDiv>

				{/* Player Name Input */}
				<MotionDiv
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ duration: 0.6, delay: 0.2 }}
				>
					<Card sx={{
						mb: 3,
						bgcolor: '#D8D6CF',
						border: '2px solid rgba(26, 26, 26, 0.18)',
						borderRadius: 1,
						boxShadow: '0 10px 0 rgba(0,0,0,0.18)',
					}}>
						<CardContent sx={{ p: 3 }}>
							<TextField
								fullWidth
								label="Your Nickname"
								value={playerName}
								onChange={(e) => setPlayerName(e.target.value)}
								placeholder="Enter your name..."
								variant="outlined"
								error={playerName.length > 0 && !isNameValid}
								helperText={!isNameValid ? "Please enter your name to start" : "Ready to play!"}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start"><Person sx={{ color: isNameValid ? 'var(--gb-screen-glow)' : 'var(--gb-screen)' }} /></InputAdornment>
									),
								}}
								sx={{
									'& .MuiInputBase-input': {
										color: 'var(--bb-text-primary)',
										fontWeight: 800,
									},
									'& .MuiInputBase-input::placeholder': {
										color: 'var(--bb-text-muted)',
										opacity: 1,
									},
									'& .MuiFormLabel-root': {
										color: 'var(--bb-text-secondary)',
									},
									'& .MuiFormHelperText-root': {
										color: 'var(--bb-text-muted)',
									},
									'& .MuiOutlinedInput-root': {
										borderRadius: 1,
										borderWidth: isNameValid ? 2 : 1,
										borderColor: isNameValid ? 'var(--gb-screen-glow)' : 'var(--gb-shell-dark)',
										bgcolor: '#F7F1E3',
									},
								}}
							/>
						</CardContent>
					</Card>
				</MotionDiv>

				{/* Action Buttons */}
				<MotionDiv
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ duration: 0.6, delay: 0.4 }}
				>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						<Button
							variant="contained"
							size="large"
							onClick={handleCreateRoom}
							disabled={isCreating || !isNameValid}
							startIcon={<Add />}
							sx={{
								py: 2,
								borderRadius: 3,
								fontSize: '1.1rem',
								fontWeight: 700,
								background: 'var(--gb-screen)',
								color: 'var(--gb-shell)',
								boxShadow: '0 6px 0 rgba(0,0,0,0.22)',
								'&:hover': {
									background: 'var(--gb-screen-glow)',
									transform: 'translateY(-2px)',
								},
								'&.Mui-disabled': {
									background: 'rgba(255,255,255,0.05)',
									color: 'rgba(255,255,255,0.2)',
								},
								transition: 'all 0.2s ease',
							}}
						>
							Create Room
						</Button>

						<Button
							variant="outlined"
							size="large"
							onClick={() => setJoinDialogOpen(true)}
							disabled={!isNameValid}
							startIcon={<Login />}
							sx={{
								py: 2,
								borderRadius: 3,
								fontSize: '1.1rem',
								fontWeight: 700,
								borderColor: '#D8D6CF',
								color: '#F7F1E3',
								'&:hover': {
									borderColor: 'var(--gb-screen-glow)',
									bgcolor: 'rgba(216, 214, 207, 0.08)',
									transform: 'translateY(-2px)',
								},
								'&.Mui-disabled': {
									borderColor: 'rgba(255,255,255,0.1)',
									color: 'rgba(255,255,255,0.2)',
								},
								transition: 'all 0.2s ease',
							}}
						>
							Join Room
						</Button>

						<Button
							variant="text"
							size="large"
							disabled={!isNameValid}
							onClick={() => navigate('/game/local', {
								state: {
									playerId: '0',
									playerName: playerName.trim() || 'Player 1',
									isHost: true,
									players: [{ id: '0', name: playerName.trim() || 'Player 1', isHost: true, isReady: true }],
								},
							})}
							startIcon={<Casino />}
							sx={{
								py: 1.5,
								borderRadius: 3,
								color: 'text.secondary',
								'&:hover': {
									bgcolor: 'rgba(255,255,255,0.05)',
								},
								'&.Mui-disabled': {
									color: 'rgba(255,255,255,0.1)',
								},
							}}
						>
							Play Locally
						</Button>
					</Box>
				</MotionDiv>

				{/* Version tag */}
				<Box sx={{ textAlign: 'center', mt: 4 }}>
					<Chip
						label="v1.0"
						size="small"
						sx={{
							bgcolor: 'var(--gb-screen)',
							color: '#D8D6CF',
							fontSize: 11,
						}}
					/>
				</Box>
			</Container>

			{/* Join Room Dialog */}
			<Dialog
				open={joinDialogOpen}
				onClose={() => { setJoinDialogOpen(false); setError(''); }}
				maxWidth="xs"
				fullWidth
				PaperProps={{
					sx: {
						borderRadius: 1,
						bgcolor: 'var(--gb-shell)',
						color: 'var(--bb-text-primary)',
						border: '4px solid var(--gb-shell-dark)',
					}
				}}
			>
				<DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					<Typography variant="h6" fontWeight={700}>Join Room</Typography>
					<IconButton onClick={() => setJoinDialogOpen(false)} size="small">
						<Close />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					<TextField
						fullWidth
						label="Room Code"
						value={roomCode}
						onChange={(e) => {
							setRoomCode(e.target.value.toUpperCase().slice(0, 4));
							setError('');
						}}
						placeholder="ABCD"
						error={!!error}
						helperText={error}
						sx={{
							mt: 1,
							'& .MuiOutlinedInput-root': { borderRadius: 1, bgcolor: 'var(--gb-shell)', color: 'var(--bb-text-primary)' },
							'& input': {
								textAlign: 'center',
								fontSize: '1.5rem',
								fontWeight: 800,
								letterSpacing: '0.3em',
								color: 'var(--bb-text-primary)',
							},
						}}
						inputProps={{ maxLength: 4 }}
					/>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 3 }}>
					<Button
						fullWidth
						variant="contained"
						onClick={handleJoinRoom}
						disabled={roomCode.length < 4}
						sx={{
							py: 1.5,
							borderRadius: 3,
							fontWeight: 700,
							background: 'var(--gb-screen)',
							color: 'var(--gb-shell)',
						}}
					>
						Join Game
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default HomePage;
