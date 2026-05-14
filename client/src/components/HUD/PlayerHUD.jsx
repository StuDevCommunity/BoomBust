import { Box, Typography, Chip, LinearProgress } from '@mui/material';
import { EmojiEvents, ChildCare, Inventory } from '@mui/icons-material';
import { motion } from 'framer-motion';

const MotionDiv = motion.div;

const PlayerHUD = ({ player, isCurrentTurn }) => {
	if (!player || !player.isSetup) return null;

	const passiveIncome = player.assets.reduce((s, a) => s + (a.cashFlow || 0) * (a.units || 1), 0);
	const totalExpenses = Object.values(player.expenses).reduce((s, v) => s + v, 0) + (player.childCount * player.perChildExpense);
	const totalIncome = player.salary + passiveIncome;
	const cashFlow = totalIncome - totalExpenses;
	const progress = totalExpenses > 0 ? Math.min(100, (passiveIncome / totalExpenses) * 100) : 100;

	return (
		<MotionDiv
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
		>
			<Box sx={{
				p: 2,
				borderRadius: 3,
				bgcolor: 'var(--gb-shell)',
				color: 'var(--bb-text-primary)',
				border: `2px solid ${isCurrentTurn ? 'var(--gb-screen-glow)' : 'var(--gb-shell-dark)'}`,
				transition: 'all 0.3s ease',
			}}>
				{/* Header */}
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<Typography variant="subtitle2" fontWeight={700}>
							{player.profession?.title || 'Player'}
						</Typography>
						{isCurrentTurn && (
							<Chip label="Your Turn" size="small" sx={{
								height: 20, fontSize: 10,
								bgcolor: 'var(--gb-screen)', color: 'var(--bb-text-on-screen-strong)',
								fontWeight: 700,
							}} />
						)}
					</Box>
					{player.isFastTrack && (
						<Chip icon={<EmojiEvents sx={{ fontSize: 14 }} />} label="Fast Track" size="small" sx={{
							bgcolor: 'var(--gb-shell-dark)', color: 'var(--bb-text-primary)', fontWeight: 700,
						}} />
					)}
				</Box>

				{/* Finance Grid */}
				<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 1.5 }}>
					<Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'var(--gb-screen)' }}>
						<Typography variant="caption" sx={{ fontSize: 10, color: 'var(--bb-text-on-screen-muted)', fontWeight: 700 }}>Cash</Typography>
						<Typography variant="body2" fontWeight={700} sx={{ color: 'var(--gb-screen-glow)', fontVariantNumeric: 'tabular-nums' }}>
							${(player.cash || 0).toLocaleString()}
						</Typography>
					</Box>
					<Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'var(--gb-screen)' }}>
						<Typography variant="caption" sx={{ fontSize: 10, color: 'var(--bb-text-on-screen-muted)', fontWeight: 700 }}>Cash Flow</Typography>
						<Typography variant="body2" fontWeight={700} sx={{
							color: cashFlow >= 0 ? 'var(--gb-screen-glow)' : '#7C2D12',
							fontVariantNumeric: 'tabular-nums',
						}}>
							${cashFlow.toLocaleString()}/mo
						</Typography>
					</Box>
					<Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'var(--gb-screen)' }}>
						<Typography variant="caption" sx={{ fontSize: 10, color: 'var(--bb-text-on-screen-muted)', fontWeight: 700 }}>Passive Income</Typography>
						<Typography variant="body2" fontWeight={700} sx={{ color: 'var(--gb-screen-glow)', fontVariantNumeric: 'tabular-nums' }}>
							${passiveIncome.toLocaleString()}/mo
						</Typography>
					</Box>
					<Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'var(--gb-screen)' }}>
						<Typography variant="caption" sx={{ fontSize: 10, color: 'var(--bb-text-on-screen-muted)', fontWeight: 700 }}>Expenses</Typography>
						<Typography variant="body2" fontWeight={700} sx={{ color: '#7C2D12', fontVariantNumeric: 'tabular-nums' }}>
							${totalExpenses.toLocaleString()}/mo
						</Typography>
					</Box>
				</Box>

				{/* Escape Progress */}
				<Box>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
						<Typography variant="caption" sx={{ fontSize: 10, color: 'var(--bb-text-secondary)', fontWeight: 700 }}>
							Rat Race Escape Progress
						</Typography>
						<Typography variant="caption" fontWeight={700} sx={{
							color: progress >= 100 ? 'var(--gb-screen-glow)' : 'var(--bb-text-secondary)',
							fontSize: 10,
						}}>
							{progress.toFixed(0)}%
						</Typography>
					</Box>
					<LinearProgress
						variant="determinate"
						value={progress}
						sx={{
							height: 6,
							borderRadius: 3,
							bgcolor: 'rgba(45, 51, 37, 0.16)',
							'& .MuiLinearProgress-bar': {
								borderRadius: 3,
								background: progress >= 100
									? 'var(--gb-screen-glow)'
									: 'var(--gb-screen-glow)',
							},
						}}
					/>
				</Box>

				{/* Children & Assets count */}
				<Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
					{player.childCount > 0 && (
						<Chip icon={<ChildCare sx={{ fontSize: 14 }} />} label={`x${player.childCount}`} size="small" sx={{ height: 22, fontSize: 11, bgcolor: 'var(--gb-shell-dark)', color: 'var(--bb-text-primary)' }} />
					)}
					{player.assets.length > 0 && (
						<Chip icon={<Inventory sx={{ fontSize: 14 }} />} label={`${player.assets.length} assets`} size="small" sx={{ height: 22, fontSize: 11, bgcolor: 'var(--gb-shell-dark)', color: 'var(--bb-text-primary)' }} />
					)}
				</Box>
			</Box>
		</MotionDiv>
	);
};

export default PlayerHUD;
