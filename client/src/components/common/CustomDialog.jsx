import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Typography,
	Box,
	IconButton,
} from '@mui/material';
import { Close, Warning, Info, Error as ErrorIcon, CheckCircle } from '@mui/icons-material';

const typeConfig = {
	info: {
		Icon: Info,
		color: 'var(--gb-screen-glow)',
	},
	warning: {
		Icon: Warning,
		color: '#7C2D12',
	},
	danger: {
		Icon: ErrorIcon,
		color: '#7C2D12',
	},
	success: {
		Icon: CheckCircle,
		color: 'var(--gb-screen-glow)',
	},
};

const CustomDialog = ({
	isOpen,
	title,
	message,
	onConfirm,
	onCancel,
	confirmText = 'OK',
	cancelText = 'Cancel',
	type = 'info',
}) => {
	const config = typeConfig[type] || typeConfig.info;
	const { Icon, color } = config;

	const handleConfirm = () => {
		if (onConfirm) onConfirm();
	};

	const handleCancel = () => {
		if (onCancel) onCancel();
	};

	return (
		<Dialog
			open={isOpen}
			onClose={onCancel ? handleCancel : handleConfirm}
			maxWidth="xs"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 2,
					bgcolor: 'var(--gb-shell)',
					color: 'var(--bb-text-primary)',
					border: '4px solid var(--gb-shell-dark)',
					overflow: 'hidden',
				},
			}}
		>
			<DialogTitle
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 2,
					pb: 1,
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: 40,
							height: 40,
							borderRadius: 1,
							bgcolor: color,
							color: 'var(--gb-shell)',
						}}
					>
						<Icon fontSize="small" />
					</Box>
					<Typography variant="h6" component="span" fontWeight={600}>
						{title}
					</Typography>
				</Box>
				{onCancel && (
					<IconButton onClick={handleCancel} size="small" sx={{ color: 'var(--bb-text-secondary)' }}>
						<Close fontSize="small" />
					</IconButton>
				)}
			</DialogTitle>

			<DialogContent>
				<Typography variant="body1" sx={{ mt: 1, color: 'var(--bb-text-primary)', fontWeight: 700 }}>
					{message}
				</Typography>
			</DialogContent>

			<DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
				{onCancel && (
					<Button
						onClick={handleCancel}
						variant="outlined"
						color="inherit"
						sx={{ flex: 1, py: 1.25, color: 'var(--bb-text-primary)', borderColor: 'var(--gb-screen)' }}
					>
						{cancelText}
					</Button>
				)}
				<Button
					onClick={handleConfirm}
					variant="contained"
					sx={{ flex: 1, py: 1.25, bgcolor: 'var(--gb-screen-glow)', color: 'var(--gb-shell)', '&:hover': { bgcolor: 'var(--gb-screen)' } }}
					autoFocus
				>
					{confirmText}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default CustomDialog;
