import { useState, useEffect, useMemo, useCallback } from 'react';

// Constants for fixed UI elements
const HEADER_HEIGHT = 56; // AppBar height
const BOTTOM_NAV_HEIGHT = 52; // Bottom navigation height
const SAFE_AREA_PADDING = 16; // Padding for safe area

/**
 * Custom hook to calculate optimal layout based on viewport dimensions
 * Handles different phone aspect ratios (16:9, 18:9, 19.5:9, 20:9, 21:9, etc.)
 */
const useViewportLayout = () => {
	const [dimensions, setDimensions] = useState({
		width: typeof window !== 'undefined' ? window.innerWidth : 375,
		height: typeof window !== 'undefined' ? window.innerHeight : 667,
	});

	// Update CSS custom properties when viewport changes
	const updateCSSVariables = useCallback((width, height, availableHeight, heightMultiplier) => {
		const root = document.documentElement;
		const vh = height * 0.01;
		const vw = width * 0.01;
		
		// Set viewport units
		root.style.setProperty('--vh', `${vh}px`);
		root.style.setProperty('--vw', `${vw}px`);
		root.style.setProperty('--viewport-height', `${height}px`);
		root.style.setProperty('--viewport-width', `${width}px`);
		root.style.setProperty('--available-height', `${availableHeight}px`);
		root.style.setProperty('--height-multiplier', heightMultiplier);
		
		// Set calculated spacing values
		root.style.setProperty('--dynamic-spacing-xs', `${Math.round(4 * heightMultiplier)}px`);
		root.style.setProperty('--dynamic-spacing-sm', `${Math.round(8 * heightMultiplier)}px`);
		root.style.setProperty('--dynamic-spacing-md', `${Math.round(12 * heightMultiplier)}px`);
		root.style.setProperty('--dynamic-spacing-lg', `${Math.round(16 * heightMultiplier)}px`);
		
		// Set calculated font sizes
		const fontScale = Math.max(0.85, Math.min(1.1, heightMultiplier));
		root.style.setProperty('--dynamic-font-xs', `${Math.round(10 * fontScale)}px`);
		root.style.setProperty('--dynamic-font-sm', `${Math.round(12 * fontScale)}px`);
		root.style.setProperty('--dynamic-font-md', `${Math.round(14 * fontScale)}px`);
		root.style.setProperty('--dynamic-font-lg', `${Math.round(16 * fontScale)}px`);
	}, []);

	useEffect(() => {
		const handleResize = () => {
			// Use visualViewport API for accurate measurements (handles keyboard, etc.)
			const viewport = window.visualViewport;
			const width = viewport?.width || window.innerWidth;
			const height = viewport?.height || window.innerHeight;
			
			setDimensions({ width, height });
			
			// Calculate available height and update CSS variables
			const availableHeight = height - HEADER_HEIGHT - BOTTOM_NAV_HEIGHT - SAFE_AREA_PADDING;
			const heightMultiplier = Math.max(0.7, Math.min(1.3, availableHeight / 550));
			updateCSSVariables(width, height, availableHeight, heightMultiplier);
		};

		// Use visualViewport API if available (handles virtual keyboard, etc.)
		const viewport = window.visualViewport;
		if (viewport) {
			viewport.addEventListener('resize', handleResize);
			viewport.addEventListener('scroll', handleResize);
		} else {
			window.addEventListener('resize', handleResize);
		}
		
		// Also handle orientation change
		window.addEventListener('orientationchange', () => {
			setTimeout(handleResize, 100);
		});

		// Initial calculation
		handleResize();

		return () => {
			if (viewport) {
				viewport.removeEventListener('resize', handleResize);
				viewport.removeEventListener('scroll', handleResize);
			} else {
				window.removeEventListener('resize', handleResize);
			}
		};
	}, [updateCSSVariables]);

	const layout = useMemo(() => {
		const { width, height } = dimensions;

		// Calculate available content height
		const availableHeight = height - HEADER_HEIGHT - BOTTOM_NAV_HEIGHT - SAFE_AREA_PADDING;

		// Calculate aspect ratio
		const aspectRatio = height / width;

		// Determine device category based on width
		const isMobile = width < 600;
		const isTablet = width >= 600 && width < 1024;
		const isDesktop = width >= 1024;

		// Determine screen density category
		// Short screens: 16:9 ratio (~1.78) - older phones, landscape tablets
		// Standard screens: 18:9 ratio (~2.0) - most modern phones
		// Tall screens: 19.5:9+ ratio (~2.17+) - newer flagship phones
		let screenType = 'standard';
		if (aspectRatio < 1.85) {
			screenType = 'short';
		} else if (aspectRatio > 2.1) {
			screenType = 'tall';
		}

		// Calculate optimal spacing multiplier based on available height
		// Base reference: 667px (iPhone SE height)
		const heightMultiplier = Math.max(0.7, Math.min(1.3, availableHeight / 550));

		// Calculate dynamic values
		const spacing = {
			// Gap between sections
			sectionGap: Math.round(8 * heightMultiplier),
			// Padding inside cards
			cardPadding: Math.round(12 * heightMultiplier),
			// Margin for container
			containerPadding: Math.round(12 * heightMultiplier),
			// Progress bar margin bottom
			progressMargin: Math.round(12 * heightMultiplier),
		};

		// Calculate font size multipliers
		const fontScale = Math.max(0.85, Math.min(1.1, heightMultiplier));

		const fontSize = {
			// For labels and captions
			caption: Math.round(10 * fontScale),
			// For body text
			body: Math.round(12 * fontScale),
			// For subtitles
			subtitle: Math.round(13 * fontScale),
			// For titles
			title: Math.round(14 * fontScale),
			// For large numbers (cash display)
			display: Math.round(24 * fontScale),
			// For percentage display
			percentage: Math.round(20 * fontScale),
		};

		// Calculate icon sizes
		const iconScale = Math.max(0.8, Math.min(1.2, heightMultiplier));
		const iconSize = {
			small: Math.round(16 * iconScale),
			medium: Math.round(20 * iconScale),
			large: Math.round(28 * iconScale),
		};

		// Calculate component-specific heights
		const componentHeight = {
			// Height for icon boxes
			iconBox: Math.round(28 * heightMultiplier),
			// Height for buttons
			button: Math.round(32 * heightMultiplier),
			// Height for list items (py)
			listItemPy: Math.max(4, Math.round(6 * heightMultiplier)),
			// Progress bar height
			progressBar: Math.round(8 * heightMultiplier),
			// Cash display padding
			cashDisplayPy: Math.round(12 * heightMultiplier),
		};

		// Determine if we should use compact mode
		// Compact mode when available height is less than 500px
		const isCompact = availableHeight < 500;
		// Ultra compact when available height is less than 400px
		const isUltraCompact = availableHeight < 400;

		return {
			// Raw dimensions
			width,
			height,
			availableHeight,
			aspectRatio,

			// Device categories
			isMobile,
			isTablet,
			isDesktop,
			screenType,

			// Multipliers
			heightMultiplier,
			fontScale,
			iconScale,

			// Calculated values
			spacing,
			fontSize,
			iconSize,
			componentHeight,

			// Mode flags
			isCompact,
			isUltraCompact,

			// CSS custom properties for use in sx props
			cssVars: {
				'--vh': `${height * 0.01}px`,
				'--available-height': `${availableHeight}px`,
				'--spacing-multiplier': heightMultiplier,
			},
		};
	}, [dimensions]);

	return layout;
};

export default useViewportLayout;
