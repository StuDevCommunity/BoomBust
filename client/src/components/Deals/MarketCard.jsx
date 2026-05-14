import { useMemo, useState } from 'react';
import {
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	IconButton,
	TextField,
	Typography,
} from '@mui/material';
import { Check, Close, TrendingUp } from '@mui/icons-material';

const MarketCard = ({
	market,
	playerCash,
	matchingAssets = [],
	onResolve,
	onBorrow,
}) => {
	const [selectedAssetId, setSelectedAssetId] = useState(() => matchingAssets[0]?.id || null);
	const [unitsInput, setUnitsInput] = useState('1');
	const resolvedSelectedAssetId = matchingAssets.some((asset) => asset.id === selectedAssetId)
		? selectedAssetId
		: matchingAssets[0]?.id || null;

	const selectedAsset = useMemo(
		() => matchingAssets.find((asset) => asset.id === resolvedSelectedAssetId) || matchingAssets[0] || null,
		[matchingAssets, resolvedSelectedAssetId]
	);

	if (!market) return null;

	const stockLikeAsset = selectedAsset?.isStockLike || ['gold', 'coin', 'cd'].includes(selectedAsset?.key);
	const maxSellUnits = Math.max(1, selectedAsset?.units || 1);
	const parsedUnits = Number.parseInt(unitsInput, 10);
	const requestedUnits = market.allowBuy
		? Math.max(1, Number.isNaN(parsedUnits) ? 1 : parsedUnits)
		: Math.max(1, Math.min(maxSellUnits, Number.isNaN(parsedUnits) ? 1 : parsedUnits));
	const requiredCash = market.allowBuy ? (market.cost || 0) * requestedUnits : market.cost || 0;
	const canAfford = playerCash >= requiredCash;
	const canSell = Boolean(selectedAsset);

	return (
		<Dialog
			open={!!market}
			maxWidth="xs"
			fullWidth
			PaperProps={{ sx: { borderRadius: 2, bgcolor: 'var(--gb-shell)', color: 'var(--bb-text-primary)', border: '4px solid var(--gb-shell-dark)', maxHeight: '85vh' } }}
		>
			<Box
				sx={{
					background: 'var(--gb-shell)',
					borderBottom: '2px solid var(--gb-shell-dark)',
					px: 2, py: 1.2,
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					<Chip
						icon={<TrendingUp sx={{ fontSize: 12 }} />}
						label="Market Event"
						size="small"
						sx={{ bgcolor: 'rgba(85, 107, 47, 0.16)', color: 'var(--gb-screen-glow)', fontWeight: 700, height: 22, fontSize: 11 }}
					/>
					<IconButton onClick={() => onResolve?.({ action: 'pass', pass: true })} size="small" sx={{ color: 'var(--bb-text-secondary)', p: 0.4 }}>
						<Close fontSize="small" />
					</IconButton>
				</Box>
				<Typography variant="subtitle1" fontWeight={800} sx={{ color: 'var(--bb-text-primary)', mt: 0.5, lineHeight: 1.2 }}>
					{market.title || 'Market Event'}
				</Typography>
			</Box>
			<DialogContent sx={{ py: 1.5, px: 2, overflowY: 'auto' }}>
				<Typography variant="body2" sx={{ lineHeight: 1.5, fontSize: 12.5, color: 'var(--bb-text-primary)', fontWeight: 700 }}>
					{market.description || 'A market event has occurred affecting investments.'}
				</Typography>

				{!!market.rule && (
					<Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: 'var(--bb-text-secondary)', fontStyle: 'italic' }}>
						{market.rule}
					</Typography>
				)}

				{market.allowBuy && (
					<Box
						sx={{
							mt: 1.5,
							p: 1.5,
							borderRadius: 2,
							bgcolor: 'var(--gb-screen)',
							color: 'var(--bb-text-on-screen-strong)',
							border: '3px solid var(--gb-screen-glow)',
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
							<Typography variant="caption" sx={{ color: 'var(--bb-text-on-screen-muted)', fontWeight: 800 }}>Buy price</Typography>
							<Typography variant="subtitle1" fontWeight={700} sx={{ color: 'var(--gb-screen-glow)' }}>
								${(market.cost || 0).toLocaleString()} each
							</Typography>
						</Box>
						<TextField
							fullWidth
							size="small"
							type="number"
							label="Units"
							value={unitsInput}
							onChange={(event) => setUnitsInput(event.target.value)}
							inputProps={{ min: 1, step: 1 }}
						/>
						<Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'var(--bb-text-on-screen-muted)', fontWeight: 800 }}>
							Total required: ${requiredCash.toLocaleString()}
						</Typography>
					</Box>
				)}

				{market.allowSell && matchingAssets.length > 0 && (
					<Box
						sx={{
							mt: 2,
							display: 'flex',
							flexDirection: 'column',
							gap: 1,
						}}
					>
						<Typography variant="caption" sx={{ color: 'var(--bb-text-secondary)', fontWeight: 800 }}>
							Choose asset
						</Typography>
						{matchingAssets.map((asset) => (
							<Button
								key={asset.id}
								variant={resolvedSelectedAssetId === asset.id ? 'contained' : 'outlined'}
								onClick={() => {
									setSelectedAssetId(asset.id);
									setUnitsInput('1');
								}}
								sx={{
									justifyContent: 'space-between',
									borderRadius: 1.5,
									fontWeight: 700,
									...(resolvedSelectedAssetId === asset.id
										? { background: 'var(--gb-screen-glow)', color: 'var(--gb-shell)' }
										: { borderColor: 'var(--gb-screen-glow)', color: 'var(--bb-text-primary)' }),
								}}
							>
								<span>{asset.name}{asset.units > 1 ? ` ×${asset.units}` : ''}</span>
								<Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
									{asset.units > 1 && (
										<Box component="span" sx={{
											fontSize: 11, fontWeight: 600, opacity: 0.85,
											bgcolor: 'rgba(0,0,0,0.18)', borderRadius: 1, px: 0.75, py: 0.15,
										}}>
											{asset.units} units
										</Box>
									)}
									<span>${(asset.purchasePrice || 0).toLocaleString()}/unit</span>
								</Box>
							</Button>
						))}

						{stockLikeAsset && (
							<>
								<TextField
									fullWidth
									size="small"
									type="number"
									label="Units to sell"
									value={unitsInput}
									onChange={(event) => setUnitsInput(event.target.value)}
									inputProps={{ min: 1, max: maxSellUnits, step: 1 }}
								/>
								<Typography variant="caption" sx={{ color: 'var(--bb-text-secondary)' }}>
									You own <strong>{maxSellUnits}</strong> unit{maxSellUnits !== 1 ? 's' : ''} · Sale price: <strong>${((market.cost || 0) * Math.min(requestedUnits, maxSellUnits)).toLocaleString()}</strong>
								</Typography>
							</>
						)}
					</Box>
				)}

				{market.marketType === 'fee' && (
					<Box
						sx={{
							mt: 2,
							p: 1.5,
							borderRadius: 2,
							bgcolor: 'rgba(124, 45, 18, 0.08)',
							border: '1px solid rgba(124, 45, 18, 0.28)',
						}}
					>
						<Typography variant="body2" sx={{ color: canAfford ? 'var(--bb-text-primary)' : '#7C2D12', fontWeight: 800 }}>
							Fee due: ${requiredCash.toLocaleString()}
						</Typography>
					</Box>
				)}
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
				<Button
					variant="outlined"
					onClick={() => onResolve?.({ action: 'pass', pass: true })}
					sx={{
						flex: '1 1 auto',
						minWidth: 100,
						borderRadius: 1.5,
						fontWeight: 700,
						borderColor: 'var(--gb-screen)',
						bgcolor: 'var(--gb-shell-dark)',
						color: 'var(--bb-text-primary)',
					}}
				>
					Pass
				</Button>

				{/* SELL button — only when allowSell and has matching assets */}
				{market.allowSell && matchingAssets.length > 0 && (
					<Button
						variant="contained"
						startIcon={<Check />}
						onClick={() => {
							onResolve?.({
								action: 'sell',
								assetId: selectedAsset?.id || null,
								units: requestedUnits,
							});
						}}
						disabled={!canSell}
						sx={{
							flex: '1 1 auto',
							minWidth: 100,
							borderRadius: 1.5,
							fontWeight: 700,
							background: 'var(--gb-screen-glow)',
							color: 'var(--gb-shell)',
						}}
					>
						Sell
					</Button>
				)}

				{/* BUY button — only when allowBuy, or fee payment */}
				{(market.allowBuy || market.marketType === 'fee') && (
					<Button
						variant="contained"
						startIcon={<Check />}
						onClick={() => {
							if (market.allowBuy && !canAfford) {
								onBorrow?.({
									requiredCash,
									shortfall: Math.max(0, requiredCash - playerCash),
									reason: `buy ${market.title}`,
								});
								return;
							}
							if (market.marketType === 'fee' && !canAfford) {
								onBorrow?.({
									requiredCash,
									shortfall: Math.max(0, requiredCash - playerCash),
									reason: `pay ${market.title}`,
								});
								return;
							}
							onResolve?.({
								action: 'buy',
								assetId: selectedAsset?.id || null,
								units: requestedUnits,
							});
						}}
						disabled={!canAfford && !onBorrow}
						sx={{
							flex: '1 1 auto',
							minWidth: 100,
							borderRadius: 1.5,
							fontWeight: 700,
							background: 'var(--gb-screen-glow)',
							color: 'var(--gb-shell)',
						}}
					>
						{market.marketType === 'fee'
							? canAfford ? `Pay $${requiredCash.toLocaleString()}` : 'Borrow Cash'
							: canAfford ? 'Buy' : 'Borrow Cash'}
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
};

export default MarketCard;
