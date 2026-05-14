import { useState } from 'react';
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
	IconButton,
	Typography,
} from '@mui/material';
import {
	AutoGraph,
	Bolt,
	ExpandLess,
	ExpandMore,
	Public,
	TrendingDown,
	TrendingFlat,
	TrendingUp,
} from '@mui/icons-material';
import { getStockDefinition } from '../../game/boombust/stockMarketEngine';

const panelSx = {
	bgcolor: 'var(--gb-shell)',
	color: 'var(--bb-text-primary)',
	border: '2px solid rgba(26, 26, 26, 0.18)',
	borderRadius: 1,
	boxShadow: '0 10px 0 rgba(0,0,0,0.18)',
};

const lcdSx = {
	bgcolor: 'var(--gb-screen)',
	color: 'var(--bb-text-on-screen-strong)',
	border: '2px solid var(--gb-screen-glow)',
	borderRadius: 1,
	fontFamily: '"IBM Plex Sans", Inter, system-ui, sans-serif',
};

export function ContextModal({ data, onClose }) {
	if (!data) return null;

	return (
		<Dialog open={Boolean(data)} maxWidth="sm" fullWidth>
			<Box sx={{ ...panelSx, overflow: 'hidden' }}>
				<DialogTitle sx={{ pb: 1 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<Bolt sx={{ color: 'var(--gb-screen-glow)' }} />
						<Box>
							<Typography variant="overline" sx={{ color: 'var(--gb-screen-glow)', fontWeight: 900 }}>
								{data.kind === 'stage' ? 'Stage Context' : 'Market Event'}
							</Typography>
							<Typography variant="h5" fontWeight={900} sx={{ color: 'var(--bb-text-primary)' }}>
								{data.title}
							</Typography>
						</Box>
					</Box>
				</DialogTitle>
				<DialogContent>
					<Box sx={{ ...lcdSx, p: 2 }}>
						<Typography variant="subtitle2" fontWeight={900}>
							{data.subtitle}
						</Typography>
						<Typography variant="body2" sx={{ mt: 1, lineHeight: 1.6, color: 'var(--bb-text-on-screen-strong)' }}>
							{data.description}
						</Typography>
						{data.results?.length ? <MarketEventResult results={data.results} /> : null}
					</Box>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 3 }}>
					<Button variant="contained" onClick={onClose} sx={{ bgcolor: 'var(--gb-screen)', color: 'var(--gb-shell)', '&:hover': { bgcolor: 'var(--gb-screen-glow)' } }}>
						Continue
					</Button>
				</DialogActions>
			</Box>
		</Dialog>
	);
}

export function StageContextPanel({ stage }) {
	if (!stage) return null;
	return (
		<Card sx={panelSx}>
			<CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
					<Public sx={{ fontSize: 18, color: 'var(--gb-screen-glow)' }} />
					<Typography variant="subtitle2" fontWeight={900}>
						{stage.title}
					</Typography>
					<Chip label={stage.mood} size="small" sx={{ ml: 'auto', bgcolor: 'var(--gb-screen)', color: 'var(--bb-text-on-screen-strong)', fontWeight: 800 }} />
				</Box>
				<Box sx={{ ...lcdSx, p: 1.2 }}>
					<Typography variant="caption" sx={{ color: 'var(--bb-text-on-screen-strong)', lineHeight: 1.5 }}>
						{stage.subtitle}
					</Typography>
				</Box>
			</CardContent>
		</Card>
	);
}

export function StockMarketPanel({ stockMarket }) {
	const [open, setOpen] = useState(false);
	const stocks = Object.values(stockMarket?.stocks || {});
	return (
		<Card sx={panelSx}>
			<CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: open ? 1 : 0 }}>
					<AutoGraph sx={{ fontSize: 18, color: 'var(--gb-screen-glow)' }} />
					<Typography variant="subtitle2" fontWeight={900} sx={{ flex: 1 }}>
						Stock Tape
					</Typography>
					<IconButton
						size="small"
						onClick={() => setOpen((current) => !current)}
						sx={{ color: 'var(--bb-text-secondary)', p: 0.25 }}
					>
						{open ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
					</IconButton>
				</Box>
				<Collapse in={open}>
					<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.8 }}>
						{stocks.map((stock) => {
							const definition = getStockDefinition(stock.symbol);
							const latest = stock.history?.[stock.history.length - 1];
							const delta = latest ? latest.after - latest.before : 0;
							const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : TrendingFlat;
							return (
								<Box key={stock.symbol} sx={{ ...lcdSx, p: 1 }}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
										<TrendIcon sx={{ fontSize: 15, color: delta < 0 ? 'var(--bb-text-on-screen-strong)' : 'var(--gb-screen-glow)' }} />
										<Typography variant="caption" fontWeight={900}>
											{stock.symbol}
										</Typography>
									</Box>
									<Typography variant="body2" fontWeight={900} sx={{ mt: 0.25 }}>
										${stock.price}
									</Typography>
									<Typography variant="caption" sx={{ color: 'var(--bb-text-on-screen-muted)' }} noWrap>
										{definition?.sector || 'market'}
									</Typography>
								</Box>
							);
						})}
					</Box>
				</Collapse>
			</CardContent>
		</Card>
	);
}

export function MarketEventResult({ results }) {
	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.65, mt: 1.5 }}>
			{results.map((result) => (
				<Box key={result.symbol} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
					<Typography variant="caption" fontWeight={900}>{result.symbol}</Typography>
					<Typography variant="caption">
						{`$${result.before} -> $${result.after}`}
					</Typography>
				</Box>
			))}
		</Box>
	);
}
