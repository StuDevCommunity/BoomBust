import { useEffect, useRef, useState } from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

const TurnTimer = ({ duration = 30, isActive, onTimeout, deadlineAt = null }) => {
	const [timeLeft, setTimeLeft] = useState(duration);
	const [now, setNow] = useState(() => (deadlineAt ? deadlineAt - duration * 1000 : 0));
	const didTimeoutRef = useRef(false);
	const onTimeoutRef = useRef(onTimeout);

	useEffect(() => {
		onTimeoutRef.current = onTimeout;
	}, [onTimeout]);

	useEffect(() => {
		if (deadlineAt) {
			didTimeoutRef.current = false;
			const timer = setInterval(() => {
				setNow(Date.now());
			}, 250);
			return () => clearInterval(timer);
		}

		if (!isActive || didTimeoutRef.current) return undefined;

		const timer = setInterval(() => {
			setTimeLeft((previous) => {
				if (previous <= 1) {
					if (!didTimeoutRef.current) {
						didTimeoutRef.current = true;
						onTimeoutRef.current?.();
					}
					return 0;
				}
				return previous - 1;
			});
		}, 1000);
		return () => clearInterval(timer);
	}, [deadlineAt, isActive]);

	const effectiveTimeLeft = deadlineAt
		? Math.ceil(Math.max(0, deadlineAt - now) / 1000)
		: timeLeft;

	useEffect(() => {
		if (!deadlineAt || effectiveTimeLeft > 0 || didTimeoutRef.current) return;
		didTimeoutRef.current = true;
		onTimeoutRef.current?.();
	}, [deadlineAt, effectiveTimeLeft]);

	const totalDuration = Math.max(1, duration);
	const progress = (effectiveTimeLeft / totalDuration) * 100;
	const isLow = effectiveTimeLeft <= 10;
	const isCritical = effectiveTimeLeft <= 5;

	return (
		<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
			<Typography
				variant="caption"
				sx={{
					fontWeight: 700,
					fontVariantNumeric: 'tabular-nums',
					fontSize: 13,
					color: isCritical ? '#7C2D12' : isLow ? 'var(--gb-screen-glow)' : 'var(--bb-text-secondary)',
					minWidth: 28,
					textAlign: 'right',
				}}
			>
				{effectiveTimeLeft}s
			</Typography>
			<LinearProgress
				variant="determinate"
				value={progress}
				sx={{
					flex: 1,
					height: 4,
					borderRadius: 2,
					bgcolor: 'rgba(45, 51, 37, 0.16)',
					'& .MuiLinearProgress-bar': {
						borderRadius: 2,
						background: isCritical
							? '#7C2D12'
							: isLow
								? 'var(--gb-screen-glow)'
								: 'var(--gb-screen-glow)',
						transition: 'transform 1s linear',
					},
				}}
			/>
		</Box>
	);
};

export default TurnTimer;
