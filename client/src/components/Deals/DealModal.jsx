import { useState } from 'react';
import {
	Box,
	Typography,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Divider,
	Chip,
	IconButton,
	Slider,
} from '@mui/material';
import { Close, Check, Clear, Warning } from '@mui/icons-material';
import { colors } from '../../theme';

const DealModal = ({ deal, onAccept, onDecline, onBorrow, playerCash }) => {
	const [quantity, setQuantity] = useState(1);

	if (!deal) return null;

	const isCharity = deal.dealType === 'charity' || deal.isCharity;
	
	// deal cards from JSON use `type` field: 'anystock', 'stock', 'realestate', 'coin', etc.
	// assetType is the mapped field if set explicitly
	const dealType = deal.assetType || deal.type || '';
	const isAsset = dealType === 'anystock' || dealType === 'stock' || dealType === 'mutual_fund' || dealType === 'coin' || dealType.includes('stock') || dealType.includes('coin');
	
	const unitCost = deal.cost || 0;
	// For assets, max shares we can afford:
	const maxAffordable = isAsset && unitCost > 0 ? Math.floor(playerCash / unitCost) : 1;
	
	// If it's an asset, we multiply by quantity, else just 1.
	const activeQty = isAsset ? quantity : 1;

	const canAfford = isAsset ? (maxAffordable > 0) : (playerCash >= (deal.downPayment || deal.cost || 0));
	const downPayment = (deal.downPayment || deal.cost || 0) * activeQty;
	const totalCost = (deal.cost || 0) * activeQty;
	const shortfall = Math.max(0, downPayment - playerCash);
	const cashFlow = (deal.cashFlow || 0) * activeQty;
	const roi = downPayment > 0 ? ((cashFlow * 12) / downPayment * 100).toFixed(1) : '∞';

	const dealTypeColors = {
		small: { bg: 'rgba(85, 107, 47, 0.16)', color: '#556B2F', label: 'Small Deal' },
		big: { bg: 'rgba(85, 107, 47, 0.16)', color: '#556B2F', label: 'Big Deal' },
		charity: { bg: 'rgba(85, 107, 47, 0.16)', color: '#556B2F', label: 'Charity' },
	};

	const typeStyle = dealTypeColors[deal.dealType] || dealTypeColors.small;

	return (
		<Dialog
			open={!!deal}
			maxWidth="xs"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 2,
					bgcolor: 'var(--gb-shell)',
					color: 'var(--bb-text-primary)',
					border: '4px solid var(--gb-shell-dark)',
					overflow: 'hidden',
				}
			}}
		>
			<Box sx={{
				background: 'var(--gb-shell)',
				borderBottom: '2px solid var(--gb-shell-dark)',
				p: 2.5,
			}}>
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
					<Chip
						label={typeStyle.label}
						size="small"
						sx={{ bgcolor: typeStyle.bg, color: typeStyle.color, fontWeight: 700 }}
					/>
					<IconButton onClick={onDecline} size="small" sx={{ color: 'var(--bb-text-secondary)' }}>
						<Close fontSize="small" />
					</IconButton>
				</Box>
				<Typography variant="h6" fontWeight={800} sx={{ color: 'var(--bb-text-primary)' }}>
					{deal.title || deal.description || 'Deal Opportunity'}
				</Typography>
			</Box>

			<DialogContent sx={{ py: 3 }}>
				{deal.description && deal.description !== deal.title && (
					<Typography variant="body2" sx={{ mb: 2.5, lineHeight: 1.6, color: 'var(--bb-text-primary)', fontWeight: 700 }}>
						{deal.description}
					</Typography>
				)}

				{!isCharity && (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<Typography variant="body2" sx={{ color: 'var(--bb-text-secondary)', fontWeight: 700 }}>Cost</Typography>
							<Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
								${totalCost.toLocaleString()}
							</Typography>
						</Box>

						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<Typography variant="body2" sx={{ color: 'var(--bb-text-secondary)', fontWeight: 700 }}>Down Payment</Typography>
							<Typography variant="body2" fontWeight={700} sx={{
								color: canAfford ? colors.income.main : colors.expense.main,
								fontVariantNumeric: 'tabular-nums',
							}}>
								${downPayment.toLocaleString()}
							</Typography>
						</Box>

						<Divider sx={{ borderColor: 'rgba(29, 33, 24, 0.18)' }} />

						{isAsset && maxAffordable > 0 && (
							<Box sx={{ mt: 1, mb: 2 }}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
									<Typography variant="body2" sx={{ color: 'var(--bb-text-secondary)', fontWeight: 700 }}>Shares to Buy</Typography>
									<Typography variant="body2" fontWeight={700} color="primary">{quantity}</Typography>
								</Box>
								<Slider
									value={quantity}
									onChange={(e, v) => setQuantity(v)}
									min={1}
									max={Math.max(1, maxAffordable)}
									valueLabelDisplay="auto"
									sx={{
										color: 'var(--gb-screen-glow)',
										'& .MuiSlider-thumb': {
												boxShadow: '0 0 10px rgba(85, 107, 47, 0.45)',
										}
									}}
								/>
							</Box>
						)}

						{cashFlow > 0 && (
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<Typography variant="body2" sx={{ color: 'var(--bb-text-secondary)', fontWeight: 700 }}>Monthly Cash Flow</Typography>
								<Typography variant="body2" fontWeight={700} sx={{
									color: colors.income.main,
									fontVariantNumeric: 'tabular-nums',
								}}>
									+${cashFlow.toLocaleString()}/mo
								</Typography>
							</Box>
						)}

						{cashFlow > 0 && (
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<Typography variant="body2" sx={{ color: 'var(--bb-text-secondary)', fontWeight: 700 }}>Annual ROI</Typography>
								<Typography variant="body2" fontWeight={700} sx={{
									color: parseFloat(roi) > 0 ? '#556B2F' : colors.warning.main,
								}}>
									{roi}%
								</Typography>
							</Box>
						)}

						<Divider sx={{ borderColor: 'rgba(29, 33, 24, 0.18)' }} />

						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<Typography variant="body2" sx={{ color: 'var(--bb-text-secondary)', fontWeight: 700 }}>Your Cash</Typography>
							<Typography variant="body2" fontWeight={700} sx={{
								color: canAfford ? 'var(--bb-text-primary)' : colors.expense.main,
								fontVariantNumeric: 'tabular-nums',
							}}>
								${playerCash.toLocaleString()}
							</Typography>
						</Box>
					</Box>
				)}

				{isCharity && (
					<Box sx={{
						p: 2,
						borderRadius: 2,
						bgcolor: 'var(--gb-screen)',
						border: '3px solid var(--gb-screen-glow)',
					}}>
						<Typography variant="body2" sx={{ color: 'var(--bb-text-on-screen-strong)', lineHeight: 1.6, fontWeight: 700 }}>
							{deal.description}
						</Typography>
					</Box>
				)}

				{!canAfford && !isCharity && (
					<Box sx={{
						mt: 2,
						p: 1.5,
						borderRadius: 2,
						bgcolor: 'rgba(124, 45, 18, 0.08)',
						border: '1px solid rgba(124, 45, 18, 0.28)',
					}}>
						<Typography variant="body2" sx={{ color: colors.expense.main, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
						<Warning sx={{ fontSize: 16 }} /> Insufficient funds - need ${shortfall.toLocaleString()} more
						</Typography>
					</Box>
				)}
			</DialogContent>

			<DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
				<Button
					onClick={onDecline}
					variant="outlined"
					startIcon={<Clear />}
					sx={{
						flex: 1,
							borderRadius: 1.5,
							borderColor: 'var(--gb-screen)',
							bgcolor: 'var(--gb-shell-dark)',
							color: 'var(--bb-text-primary)',
						fontWeight: 600,
					}}
				>
					Pass
				</Button>
				<Button
					onClick={() => {
						if (canAfford) {
							onAccept(activeQty);
							return;
						}
						onBorrow?.({
							requiredCash: downPayment,
							shortfall,
							reason: isCharity ? 'charity donation' : `buy ${deal.title}`,
						});
					}}
					variant="contained"
					disabled={!canAfford && !onBorrow}
					startIcon={<Check />}
					sx={{
						flex: 1,
							borderRadius: 1.5,
							fontWeight: 700,
							background: canAfford ? 'var(--gb-screen-glow)' : undefined,
							color: 'var(--gb-shell)',
					}}
				>
					{canAfford ? (isCharity ? 'Donate' : 'Buy') : 'Borrow Cash'}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default DealModal;
