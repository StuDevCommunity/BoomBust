/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react';
import useViewportLayout from '../hooks/useViewportLayout';

const LayoutContext = createContext(null);

export const LayoutProvider = ({ children }) => {
	const layout = useViewportLayout();

	return (
		<LayoutContext.Provider value={layout}>
			{children}
		</LayoutContext.Provider>
	);
};

export const useLayout = () => {
	const context = useContext(LayoutContext);
	if (!context) {
		throw new Error('useLayout must be used within a LayoutProvider');
	}
	return context;
};

// Helper function to generate responsive sx values based on layout
export const getResponsiveSx = (layout, config) => {
	const { isCompact, isUltraCompact, isMobile } = layout;

	if (!isMobile) {
		return config.desktop || config.default || {};
	}

	if (isUltraCompact) {
		return config.ultraCompact || config.compact || config.default || {};
	}

	if (isCompact) {
		return config.compact || config.default || {};
	}

	return config.default || {};
};

export default LayoutContext;
