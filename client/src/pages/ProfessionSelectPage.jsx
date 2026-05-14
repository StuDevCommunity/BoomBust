import { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const ProfessionSelectPage = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { roomCode } = useParams();

	useEffect(() => {
		const targetRoom = roomCode?.toLowerCase() === 'local' ? 'local' : roomCode;
		navigate(`/game/${targetRoom || 'local'}`, {
			replace: true,
			state: {
				...location.state,
			},
		});
	}, [location.state, navigate, roomCode]);

	return (
		<Box
			sx={{
				minHeight: '100vh',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flexDirection: 'column',
				gap: 2,
			}}
		>
			<CircularProgress color="primary" />
			<Typography variant="body2" color="text.secondary">
				Opening your table...
			</Typography>
		</Box>
	);
};

export default ProfessionSelectPage;
