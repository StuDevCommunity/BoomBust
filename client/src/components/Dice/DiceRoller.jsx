import { useCallback } from 'react';
import { Box, Button } from '@mui/material';
import { Casino, SkipNext } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;

import dice1 from '../../assets/Dice/Slice 1.svg';
import dice2 from '../../assets/Dice/Slice 2.svg';
import dice3 from '../../assets/Dice/Slice 3.svg';
import dice4 from '../../assets/Dice/Slice 4.svg';
import dice5 from '../../assets/Dice/Slice 5.svg';
import dice6 from '../../assets/Dice/Slice 6.svg';

const DICE_IMAGES = {
	1: dice1,
	2: dice2,
	3: dice3,
	4: dice4,
	5: dice5,
	6: dice6,
};

/**
 * Image Dice Face — renders dice images from assets
 */
const DiceFace = ({ value, size = 56 }) => {
	const src = DICE_IMAGES[value] || DICE_IMAGES[1];

	return (
		<Box sx={{
			width: size,
			height: size,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			bgcolor: 'var(--gb-shell)',
			border: '3px solid var(--gb-shell-dark)',
			borderRadius: 1,
			boxShadow: '0 8px 18px var(--gb-shadow)',
			p: 0.5,
		}}>
			<img src={src} alt={`Dice ${value}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
		</Box>
	);
};

const DiceRoller = ({
	dice,
	onRoll,
	onEndTurn,
	hasRolled,
	disabled,
	isMyTurn,
	compact = false,
	isEndingTurn = false,
	isRolling = false,
	rollingFace = 1,
	showActionButton = true,
}) => {
	const dieSize = compact ? 46 : 56;

	const handleAction = useCallback(() => {
		if (disabled || isRolling || isEndingTurn || !isMyTurn) return;
		if (hasRolled) {
			// If already rolled, click means End Turn
			if (onEndTurn) onEndTurn();
		} else {
			// Otherwise roll
			onRoll?.();
		}
	}, [isEndingTurn, isRolling, disabled, isMyTurn, hasRolled, onRoll, onEndTurn]);

	const die1Value = dice?.die1 || null;
	const die2Value = dice?.die2 ?? null; // null means single die mode
	const die3Value = dice?.die3 ?? null;
	const hasTwoDice = die2Value !== null;
	const hasThreeDice = die3Value !== null;

	return (
		<Box sx={{
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			gap: compact ? 1.25 : 2,
		}}>
			{/* Dice Display */}
			<Box sx={{ display: 'flex', gap: compact ? 1 : 2, alignItems: 'center' }}>
				<AnimatePresence mode="wait">
					<MotionDiv
						key={isRolling ? 'rolling' : `${die1Value}-${die2Value}`}
						initial={{ rotateX: 0, scale: 0.8 }}
						animate={{
							rotateX: isRolling ? [0, 360, 720] : 0,
							scale: 1,
						}}
						transition={{ duration: isRolling ? 0.6 : 0.3 }}
					>
						<Box sx={{ display: 'flex', gap: compact ? 1 : 1.5 }}>
							<DiceFace value={isRolling ? rollingFace : (die1Value || 1)} size={dieSize} />
							{(isRolling || hasTwoDice) && hasTwoDice && (
								<DiceFace value={isRolling ? ((rollingFace % 6) + 1) : (die2Value || 1)} size={dieSize} />
							)}
							{(isRolling || hasThreeDice) && hasThreeDice && (
								<DiceFace value={isRolling ? (((rollingFace + 1) % 6) + 1) : (die3Value || 1)} size={dieSize} />
							)}
						</Box>
					</MotionDiv>
				</AnimatePresence>
			</Box>

			{/* Total and Doubles indicator */}
			{/* {total && !isRolling && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<Chip
							label={`Total: ${total}`}
							size="small"
							sx={{
								fontWeight: 700,
								bgcolor: 'rgba(16, 185, 129, 0.15)',
								color: 'var(--gb-screen-glow)',
								fontSize: 14,
							}}
						/>
						{isDoubles && (
							<Chip
								icon={<GpsFixed sx={{ fontSize: 14 }} />}
								label="DOUBLES!"
								size="small"
								sx={{
									fontWeight: 700,
									bgcolor: 'rgba(245, 158, 11, 0.15)',
									color: 'var(--gb-screen-glow)',
									animation: 'pulse-glow 2s infinite',
								}}
							/>
						)}
					</Box>
				</motion.div>
			)} */}

			{/* Unified Action Button */}
			{showActionButton && (
				<Box sx={{ display: 'flex', flexDirection: 'row', gap: compact ? 1 : 2, alignItems: 'center', mt: compact ? 0.25 : 1 }}>
					<Button
						variant="contained"
						onClick={handleAction}
						disabled={disabled || isRolling || isEndingTurn || !isMyTurn}
						startIcon={hasRolled ? <SkipNext /> : <Casino />}
						sx={{
							px: compact ? 2.4 : 4,
							py: compact ? 1 : 1.5,
							borderRadius: 1.5,
							fontWeight: 700,
							fontSize: compact ? '0.92rem' : '1rem',
							background: isMyTurn ? 'var(--gb-screen-glow)' : 'var(--gb-shell-dark)',
							color: isMyTurn ? 'var(--gb-shell)' : 'var(--bb-text-muted)',
							border: '2px solid var(--gb-shell)',
							boxShadow: isMyTurn ? '0 8px 18px var(--gb-shadow)' : 'none',
							'&:hover': {
								background: isMyTurn ? '#6F843A' : 'inherit',
								transform: 'translateY(-2px)',
							},
							'&:disabled': {
								background: 'var(--gb-shell-dark)',
								color: 'var(--bb-text-muted)',
							},
							transition: 'all 0.2s ease',
						}}
					>
						{isRolling
							? 'Rolling...'
							: isEndingTurn
								? 'Ending...'
							: !isMyTurn
								? 'Waiting...'
								: hasRolled
									? 'End Turn'
									: 'Roll Dice'
						}
					</Button>
				</Box>
			)}
		</Box>
	);
};

export default DiceRoller;
