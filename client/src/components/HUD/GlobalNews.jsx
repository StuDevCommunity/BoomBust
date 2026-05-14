import { useEffect, useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';

const MotionDiv = motion.div;
const NOTIFIABLE_TYPES = new Set(['move', 'payday', 'deal', 'doodad', 'downsize', 'victory', 'loan', 'debt']);
const DESKTOP_LIFETIME_MS = 9000;
const MOBILE_LIFETIME_MS = 7000;

const getNotificationStyles = (type) => {
	switch (type) {
		case 'victory':
			return {
				bgcolor: 'var(--gb-shell)',
				borderColor: 'var(--gb-shell-dark)',
				color: 'var(--bb-text-primary)',
			};
		case 'downsize':
			return {
				bgcolor: 'var(--gb-shell)',
				borderColor: 'var(--gb-shell-dark)',
				color: 'var(--bb-text-primary)',
			};
		case 'deal':
			return {
				bgcolor: 'var(--gb-shell)',
				borderColor: 'var(--gb-shell-dark)',
				color: 'var(--bb-text-primary)',
			};
		default:
			return {
				bgcolor: 'var(--gb-screen)',
				borderColor: 'var(--gb-screen-glow)',
				color: 'var(--bb-text-on-screen-strong)',
			};
	}
};

const GlobalNews = ({ gameLog = [], isMobile = false }) => {
	const [visibleNews, setVisibleNews] = useState([]);
	const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

	useEffect(() => {
		const lifetime = isMobile ? MOBILE_LIFETIME_MS : DESKTOP_LIFETIME_MS;

		const updateVisible = () => {
			const now = Date.now();
			const validItems = gameLog
				.filter((entry) => NOTIFIABLE_TYPES.has(entry.type))
				.filter((entry) => !dismissedAlerts.has(entry.timestamp))
				.filter((entry) => now - entry.timestamp < lifetime)
				.slice(isMobile ? -2 : -3);
			setVisibleNews(validItems);
		};

		updateVisible();
		const intervalId = setInterval(updateVisible, 1000);
		return () => clearInterval(intervalId);
	}, [gameLog, isMobile, dismissedAlerts]);

	if (visibleNews.length === 0) return null;

	return (
		<Box
			sx={{
				position: 'absolute',
				top: isMobile ? 12 : 16,
				left: isMobile ? 12 : 16,
				right: isMobile ? 12 : 'auto',
				bottom: 'auto',
				zIndex: 50,
				display: 'flex',
				flexDirection: 'column',
				gap: 1,
				maxWidth: isMobile ? 'none' : 320,
				pointerEvents: 'none',
			}}
		>
			<AnimatePresence initial={false}>
				{visibleNews.map((news, index) => {
					const styles = getNotificationStyles(news.type);
					return (
						<MotionDiv
							key={`${news.timestamp}-${news.message}`}
							initial={{ opacity: 0, y: isMobile ? 16 : -12, scale: 0.96 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: isMobile ? 18 : -12, scale: 0.96 }}
							transition={{ duration: 0.22, delay: index * 0.05 }}
						>
							<Box
								sx={{
									px: isMobile ? 1.5 : 2,
									py: isMobile ? 1 : 1.15,
									borderRadius: 1.25,
									boxShadow: '0 6px 14px var(--gb-shadow)',
									border: '2px solid',
									pointerEvents: 'auto',
									display: 'flex',
									alignItems: 'flex-start',
									justifyContent: 'space-between',
									gap: 1,
									...styles,
								}}
							>
								<Typography
									variant="caption"
									sx={{
										display: 'block',
										fontSize: isMobile ? 11 : 11.5,
										fontWeight: 800,
										lineHeight: 1.45,
										color: styles.color,
										flex: 1,
									}}
								>
									{news.message}
								</Typography>
								<IconButton 
									size="small" 
									onClick={() => setDismissedAlerts(prev => new Set(prev).add(news.timestamp))}
									sx={{ 
										color: styles.color, 
										p: 0.5, 
										mt: -0.25, 
										mr: -0.5,
										opacity: 0.86, 
										'&:hover': { opacity: 1 } 
									}}
								>
									<Close fontSize="inherit" sx={{ fontSize: 14 }} />
								</IconButton>
							</Box>
						</MotionDiv>
					);
				})}
			</AnimatePresence>
		</Box>
	);
};

export default GlobalNews;
