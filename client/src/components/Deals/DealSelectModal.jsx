import { Box, Typography, Button, Paper, Modal, Fade, Backdrop } from '@mui/material';
import { ShowChart, TrendingUp } from '@mui/icons-material';

const DealSelectModal = ({ open, onSelect, playerCash }) => {
	const canAffordBigDeal = playerCash >= 6000;

	return (
		<Modal
			open={open}
			closeAfterTransition
			slots={{ backdrop: Backdrop }}
			slotProps={{
				backdrop: { timeout: 500, sx: { backgroundColor: 'rgba(10, 15, 26, 0.8)', backdropFilter: 'blur(8px)' } }
			}}
		>
			<Fade in={open}>
				<Box sx={{
					position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
					width: { xs: '90vw', sm: 500 },
					outline: 'none',
				}}>
					<Paper elevation={24} sx={{
						p: 4,
						borderRadius: 2,
						background: 'var(--gb-shell)',
						color: 'var(--bb-text-primary)',
						border: '4px solid var(--gb-shell-dark)',
						boxShadow: '0 16px 32px var(--gb-shadow)',
					}}>
						<Box sx={{ textAlign: 'center', mb: 4 }}>
							<Typography variant="h5" fontWeight={800} sx={{
								color: 'var(--bb-text-primary)', mb: 1, textTransform: 'uppercase', letterSpacing: 1
							}}>
								Select Deal Type
							</Typography>
							<Typography variant="body2" sx={{ color: 'var(--bb-text-secondary)', fontWeight: 700 }}>
								Your Cash: <strong style={{ color: '#556B2F' }}>${playerCash.toLocaleString()}</strong>
							</Typography>
						</Box>

						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
							{/* Small Deal Button */}
							<Button
								variant="outlined"
								onClick={() => onSelect('small')}
								startIcon={<TrendingUp />}
								sx={{
									p: 2, justifyContent: 'flex-start',
									borderColor: 'var(--gb-screen-glow)', color: 'var(--bb-text-primary)',
									borderRadius: 1.5, borderWidth: 2,
									bgcolor: 'rgba(85, 107, 47, 0.12)',
									'&:hover': {
										borderColor: 'var(--gb-screen)', borderWidth: 2,
										bgcolor: 'rgba(85, 107, 47, 0.18)'
									}
								}}
							>
								<Box sx={{ textAlign: 'left', ml: 1 }}>
									<Typography variant="subtitle1" fontWeight={700} sx={{ color: 'var(--bb-text-primary)' }}>Small Deal</Typography>
									<Typography variant="caption" sx={{ color: 'var(--bb-text-secondary)', display: 'block', fontWeight: 700 }}>Cost $5,000 or less.</Typography>
								</Box>
							</Button>

							{/* Big Deal Button */}
							<Button
								variant="outlined"
								onClick={() => onSelect('big')}
								disabled={!canAffordBigDeal}
								startIcon={<ShowChart />}
								sx={{
									p: 2, justifyContent: 'flex-start',
									borderColor: canAffordBigDeal ? 'var(--gb-screen-glow)' : 'var(--gb-shell-dark)',
									color: canAffordBigDeal ? 'var(--bb-text-primary)' : 'var(--bb-text-secondary)',
									borderRadius: 1.5, borderWidth: 2,
									'&:hover': {
										borderColor: 'var(--gb-screen)', borderWidth: 2,
										bgcolor: 'rgba(85, 107, 47, 0.12)'
									},
									'&.Mui-disabled': {
										color: 'var(--bb-text-secondary)',
										borderColor: 'var(--gb-shell-dark)',
										opacity: 1,
									},
								}}
							>
								<Box sx={{ textAlign: 'left', ml: 1 }}>
									<Typography variant="subtitle1" fontWeight={700} sx={{ color: canAffordBigDeal ? 'var(--bb-text-primary)' : 'var(--bb-text-secondary)' }}>Big Deal</Typography>
									<Typography variant="caption" sx={{ color: 'var(--bb-text-secondary)', display: 'block', fontWeight: 700 }}>Cost $6,000 or more.</Typography>
									{!canAffordBigDeal && (
										<Typography variant="caption" sx={{ color: '#7C2D12', fontWeight: 800, display: 'block', mt: 0.5 }}>Requires $6,000+ cash</Typography>
									)}
								</Box>
							</Button>
						</Box>
					</Paper>
				</Box>
			</Fade>
		</Modal>
	);
};

export default DealSelectModal;
