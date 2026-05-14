import { createTheme, alpha } from '@mui/material/styles';

const commonTypography = {
	fontFamily: '"IBM Plex Sans", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
	h1: { fontWeight: 700 },
	h2: { fontWeight: 700 },
	h3: { fontWeight: 600 },
	h4: { fontWeight: 600 },
	h5: { fontWeight: 600 },
	h6: { fontWeight: 600 },
	button: { fontWeight: 600, textTransform: 'none' },
};

const commonComponents = {
	MuiCssBaseline: {
		styleOverrides: {
			'*': {
				boxSizing: 'border-box',
			},
			html: {
				WebkitFontSmoothing: 'antialiased',
				MozOsxFontSmoothing: 'grayscale',
			},
			body: {
				scrollBehavior: 'smooth',
			},
			'::-webkit-scrollbar': {
				width: '8px',
				height: '8px',
			},
			'::-webkit-scrollbar-track': {
				background: 'transparent',
			},
		},
	},
	MuiButton: {
		styleOverrides: {
			root: {
				borderRadius: 12,
				padding: '10px 20px',
			},
			sizeSmall: {
				padding: '6px 12px',
				borderRadius: 8,
			},
		},
		defaultProps: {
			disableElevation: true,
		},
	},
	MuiCard: {
		styleOverrides: {
			root: {
				borderRadius: 16,
				backgroundImage: 'none',
			},
		},
	},
	MuiPaper: {
		styleOverrides: {
			root: {
				backgroundImage: 'none',
			},
		},
	},
	MuiChip: {
		styleOverrides: {
			root: {
				fontWeight: 500,
			},
		},
	},
	MuiDialog: {
		styleOverrides: {
			paper: {
				borderRadius: 16,
			},
		},
	},
	MuiTextField: {
		defaultProps: {
			variant: 'outlined',
			size: 'small',
		},
	},
	MuiLinearProgress: {
		styleOverrides: {
			root: {
				borderRadius: 4,
				height: 8,
			},
		},
	},
	MuiBottomNavigation: {
		styleOverrides: {
			root: {
				height: 64,
			},
		},
	},
	MuiBottomNavigationAction: {
		styleOverrides: {
			root: {
				minWidth: 'auto',
				padding: '6px 12px',
			},
		},
	},
};

export const darkTheme = createTheme({
	palette: {
		mode: 'dark',
		primary: {
			main: '#556B2F',
			light: '#718A43',
			dark: '#2D3325',
			contrastText: '#ffffff',
		},
		secondary: {
			main: '#B8B6AE',
			light: '#D8D6CF',
			dark: '#8E8C84',
			contrastText: '#1D2118',
		},
		error: {
			main: '#7C2D12',
			light: '#9A4B2C',
			dark: '#6B2412',
		},
		warning: {
			main: '#556B2F',
			light: '#718A43',
			dark: '#3D4532',
		},
		info: {
			main: '#556B2F',
			light: '#718A43',
			dark: '#2D3325',
		},
		success: {
			main: '#556B2F',
			light: '#718A43',
			dark: '#2D3325',
		},
		background: {
			default: '#2D3325',
			paper: '#D8D6CF',
		},
		text: {
			primary: '#D8D6CF',
			secondary: '#B8B6AE',
			disabled: '#8E8C84',
		},
		divider: 'rgba(26, 26, 26, 0.22)',
		action: {
			hover: alpha('#ffffff', 0.08),
			selected: alpha('#556B2F', 0.24),
		},
	},
	typography: commonTypography,
	shape: {
		borderRadius: 4,
	},
	components: {
		...commonComponents,
		MuiCssBaseline: {
			styleOverrides: {
				...commonComponents.MuiCssBaseline.styleOverrides,
				'::-webkit-scrollbar-thumb': {
					background: '#B8B6AE',
					borderRadius: '4px',
				},
				'::-webkit-scrollbar-thumb:hover': {
					background: '#D8D6CF',
				},
			},
		},
		MuiCard: {
			styleOverrides: {
				root: {
					...commonComponents.MuiCard.styleOverrides.root,
					border: '2px solid rgba(26, 26, 26, 0.18)',
					backgroundColor: '#D8D6CF',
				},
			},
		},
		MuiAppBar: {
			styleOverrides: {
				root: {
					backgroundColor: alpha('#2D3325', 0.92),
					backdropFilter: 'blur(12px)',
					borderBottom: '2px solid rgba(26, 26, 26, 0.22)',
				},
			},
		},
		MuiBottomNavigation: {
			styleOverrides: {
				root: {
					...commonComponents.MuiBottomNavigation.styleOverrides.root,
					backgroundColor: alpha('#2D3325', 0.95),
					backdropFilter: 'blur(12px)',
					borderTop: '1px solid #556B2F',
				},
			},
		},
	},
});

export const lightTheme = createTheme({
	palette: {
		mode: 'light',
		primary: {
			main: '#556B2F',
			light: '#718A43',
			dark: '#2D3325',
			contrastText: '#ffffff',
		},
		secondary: {
			main: '#8b5cf6',
			light: '#B8B6AE',
			dark: '#7c3aed',
			contrastText: '#ffffff',
		},
		error: {
			main: '#7C2D12',
			light: '#9A4B2C',
			dark: '#6B2412',
		},
		warning: {
			main: '#556B2F',
			light: '#718A43',
			dark: '#3D4532',
		},
		info: {
			main: '#556B2F',
			light: '#718A43',
			dark: '#2D3325',
		},
		success: {
			main: '#556B2F',
			light: '#718A43',
			dark: '#2D3325',
		},
		background: {
			default: '#f8fafc',
			paper: '#ffffff',
		},
		text: {
			primary: '#1D2118',
			secondary: '#475569',
			disabled: '#94a3b8',
		},
		divider: '#e2e8f0',
		action: {
			hover: alpha('#000000', 0.04),
			selected: alpha('#556B2F', 0.12),
		},
	},
	typography: commonTypography,
	shape: {
		borderRadius: 4,
	},
	components: {
		...commonComponents,
		MuiCssBaseline: {
			styleOverrides: {
				...commonComponents.MuiCssBaseline.styleOverrides,
				'::-webkit-scrollbar-thumb': {
					background: '#B8B6AE',
					borderRadius: '4px',
				},
				'::-webkit-scrollbar-thumb:hover': {
					background: '#94a3b8',
				},
			},
		},
		MuiCard: {
			styleOverrides: {
				root: {
					...commonComponents.MuiCard.styleOverrides.root,
					border: '1px solid #e2e8f0',
					boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
				},
			},
		},
		MuiAppBar: {
			styleOverrides: {
				root: {
					backgroundColor: alpha('#ffffff', 0.9),
					backdropFilter: 'blur(12px)',
					borderBottom: '1px solid #e2e8f0',
					color: '#1D2118',
				},
			},
		},
		MuiBottomNavigation: {
			styleOverrides: {
				root: {
					...commonComponents.MuiBottomNavigation.styleOverrides.root,
					backgroundColor: alpha('#ffffff', 0.95),
					backdropFilter: 'blur(12px)',
					borderTop: '1px solid #e2e8f0',
				},
			},
		},
	},
});

// Custom color helpers for consistent styling
export const colors = {
	income: {
		main: '#556B2F',
		bg: alpha('#556B2F', 0.1),
		bgStrong: alpha('#556B2F', 0.2),
	},
	expense: {
		main: '#7C2D12',
		bg: alpha('#7C2D12', 0.1),
		bgStrong: alpha('#7C2D12', 0.2),
	},
	warning: {
		main: '#556B2F',
		bg: alpha('#556B2F', 0.1),
	},
	info: {
		main: '#556B2F',
		bg: alpha('#556B2F', 0.1),
	},
	purple: {
		main: '#8b5cf6',
		bg: alpha('#8b5cf6', 0.1),
	},
	gold: {
		main: '#718A43',
		bg: alpha('#718A43', 0.15),
	},
	orange: {
		main: '#556B2F',
		bg: alpha('#556B2F', 0.1),
	},
	blue: {
		main: '#556B2F',
		bg: alpha('#556B2F', 0.1),
	},
};

export default darkTheme;
