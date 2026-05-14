import {
	Box,
	Typography,
	Button,
	Dialog,
	DialogContent,
	DialogActions,
	Chip,
} from '@mui/material';
import { CreditCard, DirectionsBoat, Payment, ShoppingCart } from '@mui/icons-material';
import { colors } from '../../theme';

const DoodadCard = ({ doodad, onPay, onBorrow, playerCash }) => {
	if (!doodad) return null;

	const cashCost = doodad.cost || 0;
	const financeDownPayment = doodad.downPayment || 0;
	const canAffordCash = playerCash >= cashCost;
	const canAffordFinance = playerCash >= financeDownPayment;

	const requestBorrow = (requiredCash, reason) => {
		onBorrow?.({
			requiredCash,
			shortfall: Math.max(0, requiredCash - playerCash),
			reason,
		});
	};

	return (
		<Dialog
			open={!!doodad}
			maxWidth="xs"
			fullWidth
			PaperProps={{ sx: { borderRadius: 2, bgcolor: 'var(--gb-shell)', color: 'var(--bb-text-primary)', border: '4px solid var(--gb-shell-dark)' } }}
		>
			<Box
				sx={{
					background: 'var(--gb-shell)',
					borderBottom: '2px solid var(--gb-shell-dark)',
					p: 2.5,
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
					<Chip
						icon={<ShoppingCart sx={{ fontSize: 14 }} />}
						label="Doodad"
						size="small"
						sx={{ bgcolor: 'rgba(85, 107, 47, 0.16)', color: 'var(--gb-screen-glow)', fontWeight: 700 }}
					/>
				</Box>
				<Typography variant="h6" fontWeight={800} sx={{ color: 'var(--bb-text-primary)' }}>
					{doodad.title || 'Expense'}
				</Typography>
			</Box>
			<DialogContent sx={{ py: 3 }}>
				<Typography variant="body2" sx={{ lineHeight: 1.6, mb: 2, color: 'var(--bb-text-primary)', fontWeight: 700 }}>
					{doodad.description || 'An unexpected expense has occurred.'}
				</Typography>
				<Box
					sx={{
						p: 2,
						borderRadius: 2,
						bgcolor: 'rgba(124, 45, 18, 0.08)',
						border: '1px solid rgba(124, 45, 18, 0.24)',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<Typography variant="body2" sx={{ color: 'var(--bb-text-secondary)', fontWeight: 700 }}>
						Amount Due
					</Typography>
					<Typography
						variant="h6"
						fontWeight={700}
						sx={{ color: colors.expense.main, fontVariantNumeric: 'tabular-nums' }}
					>
						-${cashCost.toLocaleString()}
					</Typography>
				</Box>

				{!!doodad.financeChoices?.length && (
					<Box
						sx={{
							mt: 2,
							p: 1.5,
							borderRadius: 2,
						bgcolor: 'var(--gb-screen)',
						color: 'var(--gb-shell)',
						border: '3px solid var(--gb-screen-glow)',
						}}
					>
						<Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'var(--bb-text-on-screen-muted)', fontWeight: 800 }}>
							Finance option
						</Typography>
						<Typography variant="body2" sx={{ color: 'var(--bb-text-on-screen-strong)', fontWeight: 700 }}>
							{doodad.title === 'BUY BIG SCREEN TV'
								? `Use credit card to add $${cashCost.toLocaleString()} debt and $${(doodad.payment || 0).toLocaleString()}/mo expense.`
								: `Finance with $${financeDownPayment.toLocaleString()} down and a new boat loan.`}
						</Typography>
					</Box>
				)}
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
				<Button
					fullWidth={!doodad.financeChoices?.length}
					variant="contained"
					onClick={() => {
						if (canAffordCash) {
							onPay?.({ mode: 'cash' });
							return;
						}
						requestBorrow(cashCost, `pay ${doodad.title}`);
					}}
					startIcon={<Payment />}
					sx={{
						flex: doodad.financeChoices?.length ? 1 : undefined,
						borderRadius: 1.5,
						fontWeight: 700,
						background: 'var(--gb-screen-glow)',
						color: 'var(--gb-shell)',
					}}
				>
					{canAffordCash ? `Pay $${cashCost.toLocaleString()}` : 'Borrow Cash'}
				</Button>

				{doodad.financeChoices?.includes('credit') && (
					<Button
						variant="outlined"
						onClick={() => onPay?.({ mode: 'credit' })}
						startIcon={<CreditCard />}
						sx={{
							flex: 1,
							borderRadius: 1.5,
							fontWeight: 700,
							borderColor: 'var(--gb-screen)',
							color: 'var(--bb-text-primary)',
						}}
					>
						Use Credit Card
					</Button>
				)}

				{doodad.financeChoices?.includes('finance') && (
					<Button
						variant="outlined"
						onClick={() => {
							if (canAffordFinance) {
								onPay?.({ mode: 'finance' });
								return;
							}
							requestBorrow(financeDownPayment, `boat down payment for ${doodad.title}`);
						}}
						startIcon={<DirectionsBoat />}
						sx={{
							flex: 1,
							borderRadius: 1.5,
							fontWeight: 700,
							borderColor: 'var(--gb-screen)',
							color: 'var(--bb-text-primary)',
						}}
					>
						{canAffordFinance ? 'Finance Boat' : 'Borrow Down Payment'}
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
};

export default DoodadCard;
