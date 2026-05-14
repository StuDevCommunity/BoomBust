/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react';

const BoardGameContext = createContext(null);

export const useBoardGame = () => {
	const context = useContext(BoardGameContext);
	if (!context) {
		throw new Error('useBoardGame must be used within a BoardGameProvider');
	}
	return context;
};

export const BoardGameProvider = ({ children, value }) => {
	return (
		<BoardGameContext.Provider value={value}>
			{children}
		</BoardGameContext.Provider>
	);
};

export default BoardGameContext;
