/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, LinearProgress, Typography } from '@mui/material';
import {
	AccountBalance,
	ArrowDownward,
	ArrowUpward,
	Business,
	GppBad,
	Handshake,
	Home,
	MoneyOff,
	Savings,
	ShowChart,
	TrendingDown,
	TrendingUp,
} from '@mui/icons-material';

const TIMEOUT_MS = 10000;
const MotionDiv = motion.div;

// Map log type to visual config (no emoji in source)
function resolveEventConfig(log) {
	const msg = log.message || '';
	const type = log.type;

	switch (type) {
		case 'payday':
			return {
				variant: 'positive',
				label: 'Payday',
				color: 'var(--gb-screen-glow)',
				bg: 'var(--gb-shell)',
				border: 'var(--gb-shell-dark)',
				Icon: Savings,
			};
		case 'deal': {
			const isSell = msg.toLowerCase().includes('sold') || msg.toLowerCase().includes('liquidat');
			return {
				variant: isSell ? 'positive' : 'negative',
				label: isSell ? 'Asset Sold' : 'Deal Acquired',
				color: 'var(--gb-screen-glow)',
				bg: 'var(--gb-shell)',
				border: 'var(--gb-shell-dark)',
				Icon: isSell ? ShowChart : Handshake,
			};
		}
		case 'doodad':
			return {
				variant: 'negative',
				label: 'Doodad Expense',
				color: '#7C2D12',
				bg: 'var(--gb-shell)',
				border: 'var(--gb-shell-dark)',
				Icon: MoneyOff,
			};
		case 'downsize':
			return {
				variant: 'negative',
				label: 'Downsized',
				color: '#7C2D12',
				bg: 'var(--gb-shell)',
				border: 'var(--gb-shell-dark)',
				Icon: TrendingDown,
			};
		case 'loan':
			return {
				variant: 'neutral',
				label: 'Bank Loan',
				color: 'var(--gb-screen-glow)',
				bg: 'var(--gb-shell)',
				border: 'var(--gb-shell-dark)',
				Icon: AccountBalance,
			};
		case 'market':
			return {
				variant: 'neutral',
				label: 'Market Event',
				color: 'var(--gb-screen-glow)',
				bg: 'var(--gb-shell)',
				border: 'var(--gb-shell-dark)',
				Icon: Business,
			};
		case 'baby':
			return {
				variant: 'neutral',
				label: 'New Child',
				color: 'var(--bb-text-secondary)',
				bg: 'var(--gb-shell)',
				border: 'var(--gb-shell-dark)',
				Icon: Home,
			};
		case 'bankrupt':
			return {
				variant: 'negative',
				label: 'Bankruptcy',
				color: '#7C2D12',
				bg: 'var(--gb-shell)',
				border: 'var(--gb-shell-dark)',
				Icon: GppBad,
			};
		case 'victory':
			return {
				variant: 'positive',
				label: 'Fast Track',
				color: 'var(--gb-screen-glow)',
				bg: 'var(--gb-shell)',
				border: 'var(--gb-shell-dark)',
				Icon: TrendingUp,
			};
		default:
			return null;
	}
}

// Extract money amount from log message for display
function extractAmount(message) {
	if (!message) return null;
	const match = message.match(/\$[\d,]+/);
	return match ? match[0] : null;
}

// Queue-based overlay: shows events one at a time, each auto-dismisses after TIMEOUT_MS
const MoneyEventOverlay = ({ events = [], onDismiss }) => {
	const [current, setCurrent] = useState(null);
	const [progress, setProgress] = useState(100);
	const timerRef = useRef(null);
	const intervalRef = useRef(null);
	const startRef = useRef(null);

	// When new events come in, show the latest one
	useEffect(() => {
		if (events.length === 0) return;
		const latest = events[events.length - 1];
		if (!latest) return;
		setCurrent(latest);
		setProgress(100);
		startRef.current = Date.now();
	}, [events]);

	// Auto-dismiss countdown
	useEffect(() => {
		if (!current) return undefined;

		// Progress bar interval (update every 80ms)
		intervalRef.current = window.setInterval(() => {
			const elapsed = Date.now() - (startRef.current || Date.now());
			const remaining = Math.max(0, 100 - (elapsed / TIMEOUT_MS) * 100);
			setProgress(remaining);
			if (remaining <= 0) {
				window.clearInterval(intervalRef.current);
			}
		}, 80);

		timerRef.current = window.setTimeout(() => {
			setCurrent(null);
			onDismiss?.();
		}, TIMEOUT_MS);

		return () => {
			window.clearInterval(intervalRef.current);
			window.clearTimeout(timerRef.current);
		};
	}, [current, onDismiss]);

	const handleDismiss = () => {
		window.clearInterval(intervalRef.current);
		window.clearTimeout(timerRef.current);
		setCurrent(null);
		onDismiss?.();
	};

	const config = current ? resolveEventConfig(current) : null;
	const amount = current ? extractAmount(current.message) : null;

	return (
		<AnimatePresence>
			{current && config && (
				<MotionDiv
					key={current._uid || current.timestamp || current.message}
					initial={{ opacity: 0, scale: 0.88, y: 40 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.92, y: -28 }}
					transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
					style={{
						position: 'fixed',
						inset: 0,
						zIndex: 1400,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						pointerEvents: 'auto', // Entire screen catches clicks now
						cursor: 'pointer',
					}}
					onClick={handleDismiss}
				>
					{/* Subtle dark scrim */}
					<Box
						sx={{
							position: 'absolute',
							inset: 0,
							bgcolor: 'rgba(29, 33, 24, 0.58)',
							backdropFilter: 'blur(3.5px)',
							zIndex: -1,
						}}
					/>

					{/* Main card */}
					<Box
						sx={{
							position: 'relative',
							maxWidth: 400,
							width: '88%',
							borderRadius: 2,
							bgcolor: config.bg,
							color: 'var(--bb-text-primary)',
							backgroundImage: 'none',
							border: `4px solid ${config.border}`,
							boxShadow: '0 16px 32px var(--gb-shadow)',
							overflow: 'hidden',
							transition: 'transform 0.2s ease',
							'&:hover': {
								transform: 'scale(1.02)',
							},
						}}
					>
						{/* Timeout progress bar */}
						<LinearProgress
							variant="determinate"
							value={progress}
							sx={{
								height: 3,
								bgcolor: 'rgba(45, 51, 37, 0.16)',
								'& .MuiLinearProgress-bar': {
									bgcolor: config.color,
									transition: 'none',
								},
							}}
						/>

						<Box sx={{ p: 3.5, textAlign: 'center' }}>
							{/* Icon */}
							<Box
								sx={{
									display: 'inline-flex',
									alignItems: 'center',
									justifyContent: 'center',
									width: 64,
									height: 64,
									borderRadius: '50%',
									bgcolor: 'var(--gb-screen)',
									border: '3px solid var(--gb-screen-glow)',
									mb: 2,
								}}
							>
								<config.Icon sx={{ fontSize: 32, color: config.color }} />
							</Box>

							{/* Label */}
							<Typography
								variant="overline"
								sx={{
									display: 'block',
									color: config.color,
									fontWeight: 800,
									letterSpacing: 2,
									fontSize: 11,
									mb: 0.5,
								}}
							>
								{config.label}
							</Typography>

							{/* Amount */}
							{amount && (
								<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1.5 }}>
									{config.variant === 'positive' && (
										<ArrowUpward sx={{ color: config.color, fontSize: 26, mt: '-2px' }} />
									)}
									{config.variant === 'negative' && (
										<ArrowDownward sx={{ color: config.color, fontSize: 26, mt: '-2px' }} />
									)}
									<Typography
										sx={{
											fontSize: 42,
											fontWeight: 900,
											color: config.color,
											lineHeight: 1,
											fontVariantNumeric: 'tabular-nums',
											letterSpacing: '-1px',
										}}
									>
										{amount}
									</Typography>
								</Box>
							)}

							{/* Description */}
							<Typography
								variant="body2"
								sx={{
									color: 'var(--bb-text-primary)',
									lineHeight: 1.5,
									fontSize: 14,
									fontWeight: 700,
									maxWidth: 320,
									mx: 'auto',
								}}
							>
								{current.message}
							</Typography>

							{/* Dismiss hint */}
							<Typography
								variant="caption"
								sx={{
									display: 'block',
									color: 'var(--bb-text-secondary)',
									mt: 2,
									fontSize: 10,
									letterSpacing: 0.5,
								}}
							>
								Click anywhere to dismiss
							</Typography>
						</Box>
					</Box>
				</MotionDiv>
			)}
		</AnimatePresence>
	);
};

export default MoneyEventOverlay;
