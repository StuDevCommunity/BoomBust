import { Fragment, useState } from 'react';
import {
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
	IconButton,
	LinearProgress,
	Slider,
	TextField,
	Typography,
} from '@mui/material';
import {
	AccountBalance,
	Bolt,
	Close,
	CreditCard,
	ExpandLess,
	ExpandMore,
	Payments,
	TrendingDown,
	TrendingUp,
	WarningAmber,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { colors } from '../../theme';
import { selectFinancialStatement } from '../../selectors/financialStatementSelectors';

const SectionToggle = ({ title, icon, children, defaultOpen = false, badge }) => {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<Box>
			<Box
				onClick={() => setOpen((current) => !current)}
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					cursor: 'pointer',
					py: 0.8,
					px: 0.5,
					borderRadius: 1.5,
					'&:hover': {
						bgcolor: 'rgba(255,255,255,0.03)',
					},
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					{icon}
					<Typography
						variant="caption"
						sx={{
							textTransform: 'uppercase',
							letterSpacing: 0.8,
							fontWeight: 800,
							fontSize: 10,
								color: 'var(--bb-text-secondary)',
						}}
					>
						{title}
					</Typography>
					{badge && (
						<Chip
							label={badge}
							size="small"
							sx={{
								height: 18,
								fontSize: 9,
								fontWeight: 700,
									bgcolor: 'var(--gb-shell-dark)',
									color: 'var(--bb-text-primary)',
							}}
						/>
					)}
				</Box>
				<IconButton size="small" sx={{ p: 0.25 }}>
					{open ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
				</IconButton>
			</Box>
			<Collapse in={open}>
				<Box sx={{ px: 0.5, pb: 0.6 }}>{children}</Box>
			</Collapse>
		</Box>
	);
};

const SummaryMetric = ({ label, value, color, suffix = '' }) => (
	<Box
		sx={{
			p: 1,
			borderRadius: 2,
			bgcolor: alpha(color, 0.08),
			border: `1px solid ${alpha(color, 0.18)}`,
		}}
	>
		<Typography variant="caption" sx={{ display: 'block', fontSize: 9.5, color: 'var(--bb-text-secondary)', fontWeight: 700 }}>
			{label}
		</Typography>
		<Typography
			variant="body2"
			fontWeight={800}
			sx={{
				color,
				fontVariantNumeric: 'tabular-nums',
				lineHeight: 1.2,
				wordBreak: 'break-word',
				fontSize: 13,
			}}
		>
			${(value || 0).toLocaleString()}
			{suffix}
		</Typography>
	</Box>
);

const FinanceRow = ({ label, value, color = 'text.primary', action }) => (
	<Box
		sx={{
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'space-between',
			gap: 1,
			py: 0.6,
		}}
	>
		<Typography variant="body2" sx={{ fontSize: 12, color: 'var(--bb-text-secondary)', minWidth: 0, fontWeight: 700 }}>
			{label}
		</Typography>
		<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
			<Typography
				variant="body2"
				sx={{
					fontWeight: 700,
					color,
					fontVariantNumeric: 'tabular-nums',
					fontSize: 12,
					whiteSpace: 'nowrap',
				}}
			>
				${Math.abs(value || 0).toLocaleString()}
			</Typography>
			{action}
		</Box>
	</Box>
);

// ---------- Sell Confirm Dialog ----------
const SellConfirmDialog = ({ open, asset, onClose, onConfirm }) => {
	if (!asset) return null;
	const liquidationValue = Math.floor((asset.purchasePrice || 0) * 0.5);
	return (
		<Dialog
			open={open}
			onClose={onClose}
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
			<DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
				<WarningAmber sx={{ color: 'var(--gb-screen-glow)', fontSize: 22 }} />
				<Typography variant="subtitle1" fontWeight={700}>Sell Asset?</Typography>
			</DialogTitle>
			<DialogContent sx={{ pt: '8px !important' }}>
				<Typography variant="body2" sx={{ mb: 1.5 }}>
					You are about to liquidate <strong>{asset.name}</strong> at 50% of purchase price.
				</Typography>
				<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
					<Box sx={{ p: 1, borderRadius: 1, bgcolor: 'var(--gb-screen)', color: 'var(--bb-text-on-screen-strong)', border: '2px solid var(--gb-screen-glow)' }}>
						<Typography variant="caption" sx={{ display: 'block', fontSize: 10, color: 'var(--bb-text-on-screen-muted)' }}>Purchase Price</Typography>
						<Typography variant="body2" fontWeight={700}>${(asset.purchasePrice || 0).toLocaleString()}</Typography>
					</Box>
					<Box sx={{ p: 1, borderRadius: 1, bgcolor: 'var(--gb-screen)', color: 'var(--bb-text-on-screen-strong)', border: '2px solid var(--gb-screen-glow)' }}>
						<Typography variant="caption" sx={{ display: 'block', fontSize: 10, color: 'var(--bb-text-on-screen-muted)' }}>You Receive (~50%)</Typography>
						<Typography variant="body2" fontWeight={700} sx={{ color: 'var(--gb-screen-glow)' }}>${liquidationValue.toLocaleString()}</Typography>
					</Box>
				</Box>
				{(asset.mortgage || 0) > 0 && (
					<Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'var(--gb-screen-glow)' }}>
						⚠ Mortgage of ${(asset.mortgage || 0).toLocaleString()} will be paid off from the sale proceeds.
					</Typography>
				)}
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
				<Button onClick={onClose} variant="outlined" color="inherit" sx={{ flex: 1 }}>Cancel</Button>
				<Button
					onClick={onConfirm}
					variant="contained"
					sx={{ flex: 1, fontWeight: 700, background: 'var(--gb-screen-glow)' }}
				>
					Confirm Sell
				</Button>
			</DialogActions>
		</Dialog>
	);
};

// ---------- Bankruptcy Confirm Dialog ----------
const BankruptcyDialog = ({ open, onClose, onConfirm }) => (
	<Dialog
		open={open}
		onClose={onClose}
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
		<DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
			<WarningAmber sx={{ color: '#7C2D12', fontSize: 22 }} />
			<Box>
				<Typography variant="overline" sx={{ color: 'var(--gb-screen-glow)', fontWeight: 900, letterSpacing: 1.2 }}>
					BANKRUPTCY
				</Typography>
				<Typography variant="subtitle1" fontWeight={900} sx={{ color: 'var(--bb-text-primary)' }}>Declare Bankruptcy</Typography>
			</Box>
		</DialogTitle>
		<DialogContent sx={{ pt: '8px !important' }}>
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
					You are about to permanently leave the game. Your negative cash flow means you cannot recover without drastic action.
				</Typography>
				<Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: 'var(--bb-text-on-screen-muted)', fontWeight: 700 }}>
					Consider selling assets or taking a bank loan before giving up.
				</Typography>
			</Box>
		</DialogContent>
		<DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
			<Button onClick={onClose} variant="outlined" color="inherit" sx={{ flex: 1 }}>Go Back</Button>
			<Button
				onClick={onConfirm}
				variant="contained"
				sx={{ flex: 1, fontWeight: 700, background: 'var(--gb-screen-glow)' }}
			>
				Declare Bankruptcy
			</Button>
		</DialogActions>
	</Dialog>
);

const DebtPaymentDialog = ({ open, onClose, liability, onConfirm, playerCash }) => {
	const [amount, setAmount] = useState(liability?.amount || 0);

	const maxAmount = liability?.amount || 0;
	const step = maxAmount <= 1000 ? Math.max(1, maxAmount) : 1000;
	const canAfford = amount > 0 && playerCash >= amount;
	const getRoundedPayment = (value) => {
		if (value >= maxAmount) return maxAmount;
		if (maxAmount <= 1000) return Math.max(0, Math.min(maxAmount, value));
		return Math.max(0, Math.floor(value / 1000) * 1000);
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
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
			<DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<Typography variant="subtitle1" fontWeight={700}>
					Pay Off Debt
				</Typography>
				<IconButton onClick={onClose} size="small">
					<Close fontSize="small" />
				</IconButton>
			</DialogTitle>
			<DialogContent sx={{ pt: '12px !important' }}>
				<Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'var(--bb-text-secondary)', fontWeight: 700 }}>
					{liability?.label}
				</Typography>
				<Typography variant="h5" fontWeight={800} sx={{ mb: 2, fontVariantNumeric: 'tabular-nums' }}>
					${amount.toLocaleString()}
				</Typography>
				<Slider
					value={Math.min(amount, maxAmount)}
					onChange={(_, value) => setAmount(getRoundedPayment(value))}
					min={0}
					max={maxAmount}
					step={step}
					valueLabelDisplay="auto"
					sx={{ color: 'var(--gb-screen-glow)', mb: 2 }}
				/>
				<Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
					<Button
						size="small"
						variant="outlined"
						onClick={() => setAmount(getRoundedPayment(Math.min(maxAmount, playerCash)))}
					>
						Max Affordable
					</Button>
					<Button
						size="small"
						variant="outlined"
						onClick={() => setAmount(getRoundedPayment(Math.ceil(maxAmount / 2 / 1000) * 1000))}
					>
						Half
					</Button>
					<Button size="small" variant="outlined" onClick={() => setAmount(maxAmount)}>
						Full
					</Button>
				</Box>
				<TextField
					fullWidth
					type="number"
					label="Custom amount"
					value={amount}
					onChange={(event) => setAmount(getRoundedPayment(Number(event.target.value) || 0))}
					inputProps={{ min: 0, max: maxAmount, step }}
				/>
				<Typography
					variant="caption"
					sx={{
						display: 'block',
						mt: 1.5,
						color: canAfford ? 'text.secondary' : colors.expense.main,
					}}
				>
					Available cash: ${playerCash.toLocaleString()}
				</Typography>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
				<Button onClick={onClose} variant="outlined" color="inherit" sx={{ flex: 1 }}>
					Cancel
				</Button>
				<Button
					onClick={() => onConfirm(amount)}
					variant="contained"
					disabled={!canAfford}
					sx={{
						flex: '0 0 auto',
						fontWeight: 700,
						background: 'var(--gb-screen-glow)',
						color: 'var(--gb-shell)',
					}}
				>
					Pay
				</Button>
			</DialogActions>
		</Dialog>
	);
};

const GameFinancialPanel = ({
	player,
	financialStatement: providedFinancialStatement,
	isCurrentTurn = false,
	onTakeLoan,
	onPayDebt,
	onSellAsset,
	onDeclareBankruptcy,
}) => {
	const [loanInput, setLoanInput] = useState('');
	const [selectedLiability, setSelectedLiability] = useState(null);
	const [pendingLoanAmount, setPendingLoanAmount] = useState(null);
	const [sellConfirmAsset, setSellConfirmAsset] = useState(null);
	const [showBankruptcyDialog, setShowBankruptcyDialog] = useState(false);

	if (!player || !player.isSetup) return null;

	const financialStatement = providedFinancialStatement || selectFinancialStatement(player);
	const {
		assets,
		assetMortgages,
		assetRows,
		canEscapeRatRace,
		cashFlow,
		escapeProgress,
		expenseRows,
		incomeRows,
		liabilityRows,
		passiveIncome,
		totalExpenses,
		totalIncome,
		totalLiabilities,
	} = financialStatement;

	const quickLoanOptions = [1000, 5000, 10000];
	const roundedLoanAmount = Math.floor((Number(loanInput) || 0) / 1000) * 1000;

	const handleTakeLoan = (amount) => {
		if (!onTakeLoan || !isCurrentTurn) return;
		setPendingLoanAmount(amount);
	};

	const confirmTakeLoan = () => {
		if (pendingLoanAmount > 0) {
			onTakeLoan(pendingLoanAmount);
			setPendingLoanAmount(null);
			setLoanInput('');
		}
	};

	const handleTakeCustomLoan = () => {
		const parsedAmount = roundedLoanAmount;
		if (parsedAmount > 0) {
			handleTakeLoan(parsedAmount);
		}
	};

	return (
		<>
				<Card
					sx={{
						bgcolor: 'var(--gb-shell)',
						color: '#1D2118',
						border: '2px solid var(--gb-shell-dark)',
						borderRadius: 1,
						boxShadow: '0 10px 0 var(--gb-shadow)',
					display: 'flex',
					flexDirection: 'column',
					flex: 1,
					minHeight: 0,
				}}
			>
				<CardContent sx={{ p: 1.2, '&:last-child': { pb: 1.2 }, flex: 1, minHeight: 0, overflowY: 'auto' }}>
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
						<Box>
							<Typography
								variant="caption"
								sx={{ textTransform: 'uppercase', letterSpacing: 1.1, fontWeight: 800, color: 'var(--bb-text-secondary)' }}
							>
								Financial Statement
							</Typography>
							<Typography variant="body2" fontWeight={700}>
								{player.profession?.title || 'Player'}
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 0.75 }}>
							<Chip
								label={isCurrentTurn ? 'Your Turn' : 'Waiting'}
								size="small"
								sx={{
									fontWeight: 700,
										bgcolor: isCurrentTurn ? 'var(--gb-screen)' : 'var(--gb-shell-dark)',
										color: isCurrentTurn ? 'var(--gb-shell)' : '#1D2118',
								}}
							/>
							{player.isFastTrack && (
								<Chip
									label="Fast Track"
									size="small"
									sx={{
										fontWeight: 700,
										bgcolor: colors.gold.bg,
										color: colors.gold.main,
									}}
								/>
							)}
						</Box>
					</Box>

					<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
						<SummaryMetric label="Total Income" value={totalIncome} color={colors.income.main} />
						<SummaryMetric label="Total Expenses" value={totalExpenses} color={colors.expense.main} />
						<SummaryMetric label="Cash On Hand" value={player.cash || 0} color={colors.blue.main} />
						<SummaryMetric label="Cash Flow" value={cashFlow} color={cashFlow >= 0 ? colors.income.main : colors.expense.main} suffix="/mo" />
					</Box>

					<Box
						sx={{
							mt: 1,
							p: 1,
							borderRadius: 2,
								bgcolor: 'rgba(45, 51, 37, 0.08)',
								border: '1px solid rgba(45, 51, 37, 0.16)',
						}}
					>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
								<Typography variant="caption" sx={{ fontSize: 10, color: 'var(--bb-text-secondary)', fontWeight: 700 }}>
								Rat Race Escape
							</Typography>
							<Typography
								variant="caption"
								sx={{
									fontSize: 10,
									fontWeight: 800,
									color: escapeProgress >= 100 ? colors.income.main : colors.warning.main,
								}}
							>
								{escapeProgress.toFixed(0)}%
							</Typography>
						</Box>
						<LinearProgress
							variant="determinate"
							value={escapeProgress}
							sx={{
								height: 6,
								borderRadius: 999,
									bgcolor: 'rgba(45, 51, 37, 0.16)',
								'& .MuiLinearProgress-bar': {
									borderRadius: 999,
										background: 'var(--gb-screen-glow)',
								},
							}}
						/>
						{/* Passive Income breakdown */}
						<Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.6, alignItems: 'center' }}>
								<Typography variant="caption" sx={{ fontSize: 9.5, color: 'var(--bb-text-secondary)', fontWeight: 700 }}>
								Passive Income
							</Typography>
							<Typography variant="caption" sx={{
								fontSize: 9.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
									color: passiveIncome >= totalExpenses ? colors.income.main : passiveIncome > 0 ? 'var(--bb-text-primary)' : 'var(--bb-text-secondary)',
							}}>
								${passiveIncome.toLocaleString()} / ${totalExpenses.toLocaleString()}
							</Typography>
						</Box>
					</Box>

					<Box
						sx={{
							mt: 1,
							p: 1,
							borderRadius: 2,
								bgcolor: 'var(--gb-screen)',
								border: '2px solid var(--gb-screen-glow)',
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
							<Box>
									<Typography variant="overline" sx={{ letterSpacing: 1.2, color: 'var(--bb-text-on-screen-muted)', fontWeight: 800 }}>
									Status
								</Typography>
								{/* <Typography variant="body2" fontWeight={700}>
									{player.isFastTrack ? 'Managing your Fast Track runway' : 'Rat Race cash management'}
								</Typography> */}
							</Box>
							<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
								{player.charityTurns > 0 && (
									<Chip
										icon={<TrendingUp sx={{ fontSize: 14 }} />}
										label={`Charity ×${player.charityTurns}`}
									size="small"
										sx={{ bgcolor: 'var(--gb-shell-dark)', color: 'var(--bb-text-primary)', fontWeight: 700 }}
									/>
								)}
								{player.downsizeTurns > 0 && (
									<Chip
										icon={<TrendingDown sx={{ fontSize: 14 }} />}
										label={`Downsize ${player.downsizeTurns}`}
										size="small"
										sx={{ bgcolor: colors.warning.bg, color: colors.warning.main, fontWeight: 700 }}
									/>
								)}
								{player.isFastTrack && (
									<Chip
										icon={<Bolt sx={{ fontSize: 14 }} />}
										label={`FT Cash $${(player.fastTrackCash || 0).toLocaleString()}`}
										size="small"
										sx={{ bgcolor: colors.gold.bg, color: colors.gold.main, fontWeight: 700 }}
									/>
								)}
							</Box>
						</Box>

						{player.isFastTrack && (
							<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1, mt: 1.2 }}>
								<SummaryMetric label="Fast Track Cash" value={player.fastTrackCash || 0} color={colors.gold.main} />
								<SummaryMetric label="FT Passive Income" value={player.fastTrackPassiveIncome || 0} color="var(--gb-screen-glow)" />
							</Box>
						)}

						{!player.isFastTrack && canEscapeRatRace && (
							<Box
								sx={{
									mt: 1.2,
									p: 1.15,
									borderRadius: 2,
									bgcolor: alpha(colors.gold.main, 0.12),
									border: `1px solid ${alpha(colors.gold.main, 0.24)}`,
								}}
							>
								<Typography variant="caption" sx={{ color: colors.gold.main, fontWeight: 800, letterSpacing: 0.4 }}>
									FAST TRACK READY
								</Typography>
								<Typography variant="body2" sx={{ mt: 0.35, color: 'var(--bb-text-on-screen-strong)' }}>
									Your passive income already beats expenses. Fast Track will unlock when your turn closes.
								</Typography>
							</Box>
						)}

						{!player.isFastTrack && (
							<Box sx={{ mt: 1 }}>
									<Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'var(--bb-text-on-screen-muted)', fontWeight: 800 }}>
									Quick Loan Actions
								</Typography>
								<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
									{quickLoanOptions.map((amount) => (
										<Button
											key={`loan-${amount}`}
											size="small"
											variant="outlined"
											onClick={() => handleTakeLoan(amount)}
											disabled={!isCurrentTurn || !onTakeLoan}
											sx={{
												minHeight: 32,
												fontWeight: 700,
												fontSize: 12,
												borderWidth: 1,
												borderColor: 'var(--gb-screen-glow)',
												color: 'var(--bb-text-on-screen-strong)',
											}}
										>
											+${amount.toLocaleString()}
										</Button>
									))}
								</Box>
								<Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, alignItems: 'stretch' }}>
									<TextField
										fullWidth
										size="small"
										type="number"
										label="Custom loan"
										value={loanInput}
										onChange={(event) => setLoanInput(event.target.value)}
										disabled={!isCurrentTurn || !onTakeLoan}
										inputProps={{ min: 0, step: 1000 }}
										sx={{
											'& .MuiOutlinedInput-root': {
												minHeight: 36,
												height: '100%',
												borderRadius: 2,
											},
										}}
									/>
									<Button
										variant="contained"
										onClick={handleTakeCustomLoan}
										disabled={!isCurrentTurn || !onTakeLoan || roundedLoanAmount <= 0}
										startIcon={<Payments />}
										sx={{
											minHeight: 36,
											fontWeight: 700,
											px: 1.5,
											borderRadius: 2,
											border: '1px solid var(--gb-screen-glow)',
											background: 'var(--gb-screen-glow)',
										}}
									>
										Loan
									</Button>
								</Box>
							</Box>
						)}
					</Box>

					{/* Declare Bankruptcy — only when cashFlow is negative */}
					{isCurrentTurn && onDeclareBankruptcy && cashFlow < 0 && !player.isFastTrack && (
						<Box sx={{ mt: 1.5 }}>
							<Button
								fullWidth
								variant="outlined"
								onClick={() => setShowBankruptcyDialog(true)}
								startIcon={<WarningAmber />}
								sx={{
									fontWeight: 700,
									fontSize: 12,
									borderColor: '#7C2D12',
									color: '#7C2D12',
									'&:hover': { bgcolor: 'rgba(124, 45, 18, 0.08)', borderColor: '#7C2D12' },
								}}
							>
								Declare Bankruptcy (Lose Game)
							</Button>
						</Box>
					)}

					<Divider sx={{ borderColor: 'rgba(45, 58, 79, 0.45)', my: 1 }} />

					<SectionToggle
						title="Income"
						icon={<TrendingUp sx={{ fontSize: 15, color: colors.income.main }} />}
						defaultOpen={false}
					>
						{incomeRows.map((row) => (
							<Fragment key={row.key}>
								{row.isTotal && <Divider sx={{ my: 0.5, borderColor: 'rgba(45, 58, 79, 0.3)' }} />}
								<FinanceRow
									label={row.label}
									value={row.value}
									color={row.isTotal || row.key === 'salary' ? colors.income.main : 'var(--gb-screen-glow)'}
								/>
							</Fragment>
						))}
					</SectionToggle>

					<Divider sx={{ borderColor: 'rgba(45, 58, 79, 0.3)' }} />

					<SectionToggle
						title="Expenses"
						icon={<CreditCard sx={{ fontSize: 15, color: colors.expense.main }} />}
					>
						{expenseRows.map((row) => (
							<FinanceRow
								key={row.key}
								label={row.label}
								value={row.value}
								color={row.isPaidOff ? 'var(--bb-text-muted)' : row.isChildExpense ? colors.blue.main : colors.expense.main}
							/>
						))}
					</SectionToggle>

					<Divider sx={{ borderColor: 'rgba(45, 58, 79, 0.3)' }} />

					<SectionToggle
						title="Assets"
						icon={<AccountBalance sx={{ fontSize: 15, color: colors.blue.main }} />}
						badge={assets.length > 0 ? `${assets.length}` : undefined}
					>
						{assets.length === 0 && (
								<Typography variant="caption" sx={{ fontStyle: 'italic', fontSize: 11, color: 'var(--bb-text-secondary)', fontWeight: 700 }}>
								No assets yet.
							</Typography>
						)}
						{assetRows.map((asset) => (
									<Box key={asset.id} sx={{ py: 0.65 }}>
										<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
											<Typography variant="body2" sx={{ fontSize: 12, fontWeight: 600 }}>
												{asset.name}{asset.units > 1 ? ` ×${asset.units}` : ''}
											</Typography>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
												<Typography
													variant="body2"
													sx={{
														fontSize: 12,
														fontWeight: 800,
														color: (asset.cashFlow || 0) >= 0 ? colors.income.main : colors.expense.main,
														fontVariantNumeric: 'tabular-nums',
													}}
												>
														{(asset.cashFlow || 0) >= 0 ? '+' : ''}${(asset.cashFlow || 0).toLocaleString()}
													</Typography>
												{isCurrentTurn && onSellAsset && !player.isFastTrack && !asset.isStock && (
													<Button
														size="small"
														variant="outlined"
														onClick={() => setSellConfirmAsset(asset)}
														sx={{
															minWidth: 0, px: 1, fontSize: 10, fontWeight: 700,
															borderColor: 'rgba(239, 68, 68, 0.3)',
															color: colors.expense.main,
														}}
													>
														Sell
													</Button>
												)}
											</Box>
										</Box>
											<Typography variant="caption" sx={{ fontSize: 10, color: 'var(--bb-text-secondary)', fontWeight: 700 }}>
											Cost ${(asset.purchasePrice || 0).toLocaleString()}
											{!asset.isStock && asset.downPayment ? ` | Down $${asset.downPayment.toLocaleString()}` : ''}
											{asset.mortgage ? ` | Debt $${asset.mortgage.toLocaleString()}` : ''}
										</Typography>
									</Box>
						))}
					</SectionToggle>

					<Divider sx={{ borderColor: 'rgba(45, 58, 79, 0.3)' }} />

					<SectionToggle
						title="Liabilities"
						icon={<TrendingDown sx={{ fontSize: 15, color: colors.warning.main }} />}
					>
						{liabilityRows.map((row) => (
								<FinanceRow
									key={row.key}
									label={row.label}
									value={row.value}
										color={row.isPaidOff ? 'var(--bb-text-muted)' : colors.warning.main}
									action={!row.isPaidOff && row.value > 0 ? (
										<Button
											size="small"
											variant="outlined"
											onClick={() => setSelectedLiability({ key: row.key, label: row.rawLabel, amount: row.value })}
											disabled={!isCurrentTurn || !onPayDebt}
											sx={{
												minWidth: 0,
												px: 1,
												fontSize: 10,
												fontWeight: 700,
												borderColor: 'rgba(245, 158, 11, 0.3)',
												color: colors.warning.main,
											}}
										>
											Pay
											</Button>
									) : null}
								/>
						))}

						{assetMortgages.length > 0 && (
							<>
								<Divider sx={{ my: 0.5, borderColor: 'rgba(45, 58, 79, 0.3)' }} />
								{assetMortgages.map((asset) => (
									<FinanceRow
										key={`mortgage-${asset.id}`}
										label={`${asset.name} debt`}
										value={asset.mortgage || 0}
										color={colors.warning.main}
									/>
								))}
							</>
						)}

						{totalLiabilities > 0 && (
							<>
								<Divider sx={{ my: 0.5, borderColor: 'rgba(45, 58, 79, 0.3)' }} />
								<FinanceRow label="Total Liabilities" value={totalLiabilities} color={colors.warning.main} />
							</>
						)}
					</SectionToggle>
				</CardContent>
			</Card>

			<SellConfirmDialog
				open={!!sellConfirmAsset}
				asset={sellConfirmAsset}
				onClose={() => setSellConfirmAsset(null)}
				onConfirm={() => {
					if (sellConfirmAsset) onSellAsset?.(sellConfirmAsset.id);
					setSellConfirmAsset(null);
				}}
			/>

			<BankruptcyDialog
				open={showBankruptcyDialog}
				onClose={() => setShowBankruptcyDialog(false)}
				onConfirm={() => {
					setShowBankruptcyDialog(false);
					onDeclareBankruptcy?.();
				}}
			/>

			<DebtPaymentDialog
				key={selectedLiability?.key || 'debt-dialog'}
				open={!!selectedLiability}
				onClose={() => setSelectedLiability(null)}
				liability={selectedLiability}
				playerCash={player.cash || 0}
				onConfirm={(amount) => {
					if (selectedLiability && amount > 0 && onPayDebt) {
						onPayDebt(selectedLiability.key, amount);
					}
					setSelectedLiability(null);
				}}
			/>

			<Dialog
				open={!!pendingLoanAmount}
				onClose={() => setPendingLoanAmount(null)}
				maxWidth="xs"
				fullWidth
				PaperProps={{
						sx: { borderRadius: 4, bgcolor: 'var(--gb-shell)', color: 'var(--bb-text-primary)', border: '4px solid var(--gb-shell-dark)' },
				}}
			>
				<DialogTitle>Confirm Loan Request</DialogTitle>
				<DialogContent sx={{ pt: '12px !important' }}>
					<Typography variant="body2" sx={{ mb: 2, color: 'var(--bb-text-primary)', fontWeight: 700 }}>
						Are you sure you want to borrow <strong>${(pendingLoanAmount || 0).toLocaleString()}</strong>?
					</Typography>
					<Typography variant="caption" sx={{ color: colors.warning.main, display: 'block' }}>
						Keep in mind that bank loans increase your total expenses by 10% of the loan amount per month.
						Taking a loan of ${(pendingLoanAmount || 0).toLocaleString()} will add ${((pendingLoanAmount || 0) * 0.1).toLocaleString()}/mo to your expenses.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
					<Button onClick={() => setPendingLoanAmount(null)} variant="outlined" color="inherit" sx={{ flex: 1 }}>
						Cancel
					</Button>
					<Button
						onClick={confirmTakeLoan}
						variant="contained"
						sx={{ flex: 1, fontWeight: 700, background: 'var(--gb-screen-glow)' }}
					>
						Confirm Loan
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default GameFinancialPanel;
