import { Box, Container, IconButton, Typography, Chip, alpha } from '@mui/material';
import { LightMode, DarkMode, Refresh, Description, Rocket } from '@mui/icons-material';
import { colors } from '../../theme';

const AppHeader = ({
	theme,
	toggleTheme,
	variant = 'default',
	onShowLogs,
	onReset,
	showReset = false,
	rightContent,
	maxWidth = 'xl',
}) => {
	const isFastTrack = variant === 'fasttrack';

	return (
		<Box
			component="header"
			sx={{
				position: 'sticky',
				top: 0,
				zIndex: 20,
				backdropFilter: 'blur(12px)',
				borderBottom: 1,
				borderColor: 'divider',
				bgcolor: (muiTheme) =>
					muiTheme.palette.mode === 'dark' ? alpha('#0a0f1a', 0.8) : alpha('#ffffff', 0.9),
			}}
		>
			<Container maxWidth={maxWidth}>
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						height: 56,
					}}
				>
					{/* Left: Logo and Title */}
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
						{isFastTrack ? (
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									width: 36,
									height: 36,
									borderRadius: 1.5,
									bgcolor: colors.gold.bg,
									color: colors.gold.main,
								}}
							>
								<Rocket fontSize="small" />
							</Box>
						) : (
							<Box sx={{ width: 36, height: 36, borderRadius: 2, overflow: 'hidden' }}>
								<img
									src="/Logo.png"
									alt="Logo"
									style={{ width: '100%', height: '100%', objectFit: 'contain' }}
								/>
							</Box>
						)}
						<Box>
							<Typography
								fontWeight={700}
								sx={{
									fontSize: 14,
									lineHeight: 1.2,
									color: isFastTrack ? colors.gold.main : 'text.primary',
								}}
							>
								{isFastTrack ? 'Fast Track' : 'Boombust'}
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 10 }}
							>
								{isFastTrack ? 'Wealth Unlocked' : 'Calculator Helper'}
							</Typography>
						</Box>
					</Box>

					{/* Right: Actions */}
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
						{rightContent}
						{onShowLogs && (
							<IconButton onClick={onShowLogs} title="Game Logs" size="small">
								<Description fontSize="small" />
							</IconButton>
						)}
						<IconButton
							onClick={toggleTheme}
							title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
							size="small"
						>
							{theme === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
						</IconButton>
						{showReset && onReset && (
							<IconButton onClick={onReset} title="Reset Game" size="small" color="error">
								<Refresh fontSize="small" />
							</IconButton>
						)}
					</Box>
				</Box>
			</Container>
		</Box>
	);
};

export default AppHeader;
