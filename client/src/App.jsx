import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { darkTheme, lightTheme } from './theme';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import ProfessionSelectPage from './pages/ProfessionSelectPage';
import GamePage from './pages/GamePage';

function DiscordScaler({ children }) {
	const [scaleInfo, setScaleInfo] = useState({ scale: 1, needsScale: false });
	const location = useLocation();

	useEffect(() => {
		const handleResize = () => {
			const isDiscord = document.referrer.includes('discord') ||
				window.location.search.includes('discord') ||
				window.location.hostname.endsWith('.discordsays.com');

			const targetWidth = 1280;
			const targetHeight = 720;
			const windowWidth = window.innerWidth;
			const windowHeight = window.innerHeight;

			// Only apply fixed scaling when viewport is smaller than target
			// or when inside Discord (which uses iframe with limited space)
			const needsScale = isDiscord || windowWidth < targetWidth || windowHeight < targetHeight;

			if (!needsScale) {
				setScaleInfo({ scale: 1, needsScale: false });
				return;
			}

			const scaleX = windowWidth / targetWidth;
			const scaleY = windowHeight / targetHeight;
			const newScale = Math.min(scaleX, scaleY);
			setScaleInfo({ scale: newScale, needsScale: true });
		};

		window.addEventListener('resize', handleResize);
		handleResize();
		return () => window.removeEventListener('resize', handleResize);
	}, [location]);

	// Normal viewport: transparent passthrough, let GamePage use full 100dvh
	if (!scaleInfo.needsScale) {
		return (
			<Box sx={{ width: '100%', height: '100%' }}>
				{children}
			</Box>
		);
	}

	// Small viewport or Discord: apply CSS scale transform
	return (
		<Box
			sx={{
				width: '100vw',
				height: '100vh',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				overflow: 'hidden',
			}}
		>
			<Box
				sx={{
					width: 1280,
					height: 720,
					transform: `scale(${scaleInfo.scale})`,
					transformOrigin: 'center center',
					flexShrink: 0,
					overflow: 'hidden',
				}}
			>
				{children}
			</Box>
		</Box>
	);
}

function App() {
	const [theme] = useState(() => {
		return localStorage.getItem('boombust-game-theme') || 'dark';
	});

	const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

	return (
		<ThemeProvider theme={currentTheme}>
			<CssBaseline />
			<DiscordScaler>
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/lobby/:roomCode" element={<LobbyPage />} />
					<Route path="/select/:roomCode" element={<ProfessionSelectPage />} />
					<Route path="/game/:roomCode" element={<GamePage />} />
				</Routes>
			</DiscordScaler>
		</ThemeProvider>
	);
}

export default App;
