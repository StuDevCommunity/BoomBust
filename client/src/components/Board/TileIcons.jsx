/* eslint-disable react-refresh/only-export-components */
import { SvgIcon } from '@mui/material';

/**
 * SVG icon components for each board tile type.
 * Replaces all emoji usage with clean SVG icons.
 */

export const StartIcon = (props) => (
	<SvgIcon {...props} viewBox="0 0 24 24">
		<path d="M5 3v18l7-4.5L19 21V3c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2zm12 14.97l-5-3.22-5 3.22V5h10v12.97z" fill="currentColor" />
		<path d="M7 5h10v12.97l-5-3.22-5 3.22V5z" fill="currentColor" opacity="0.3" />
	</SvgIcon>
);

export const PaydayIcon = (props) => (
	<SvgIcon {...props} viewBox="0 0 24 24">
		<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor" />
		<path d="M12.31 11.14c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H11.5v1.7c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.65c.1 1.7 1.36 2.66 2.85 2.97V19h1.73v-1.68c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.65-3.41z" fill="currentColor" />
	</SvgIcon>
);

export const SmallDealIcon = (props) => (
	<SvgIcon {...props} viewBox="0 0 24 24">
		<path d="M16.48 10.41c-.39.39-1.04.39-1.43 0l-4.47-4.46-7.05 7.04-.66-.63 3.7-3.7-1.43-1.42L1.44 11c-.59.59-.59 1.54 0 2.12l5.66 5.66c.59.59 1.54.59 2.12 0l7.07-7.07c.59-.59.59-1.54 0-2.12l-1.24-1.24z" fill="currentColor" />
		<path d="M18.01 12.17l-5.66-5.66c-.59-.59-1.54-.59-2.12 0l-1.42 1.42 8.49 8.49c.59-.59.59-1.54 0-2.12l.71-2.13z" fill="currentColor" opacity="0.3" />
		<path d="M22.56 12.59l-5.66-5.66c-.59-.59-1.54-.59-2.12 0l-7.07 7.07c-.59.59-.59 1.54 0 2.12l5.66 5.66c.59.59 1.54.59 2.12 0l7.07-7.07c.59-.59.59-1.54 0-2.12zM13 17.17l-2.83-2.83 1.41-1.41L13 14.34l3.54-3.54 1.41 1.42L13 17.17z" fill="currentColor" />
	</SvgIcon>
);

export const BigDealIcon = (props) => (
	<SvgIcon {...props} viewBox="0 0 24 24">
		<path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" fill="currentColor" />
	</SvgIcon>
);

export const MarketIcon = (props) => (
	<SvgIcon {...props} viewBox="0 0 24 24">
		<path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" fill="currentColor" />
	</SvgIcon>
);

export const DoodadIcon = (props) => (
	<SvgIcon {...props} viewBox="0 0 24 24">
		<path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" fill="currentColor" />
	</SvgIcon>
);

export const CharityIcon = (props) => (
	<SvgIcon {...props} viewBox="0 0 24 24">
		<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" />
	</SvgIcon>
);

export const BabyIcon = (props) => (
	<SvgIcon {...props} viewBox="0 0 24 24">
		<circle cx="12" cy="6" r="2" fill="currentColor" />
		<path d="M14.17 11.71c-.33-.17-.67-.29-1.01-.38L12 10l-1.16 1.33c-.34.09-.68.21-1.01.38C8.71 12.27 8 13.42 8 14.69V18c0 .55.45 1 1 1h1v2h4v-2h1c.55 0 1-.45 1-1v-3.31c0-1.27-.71-2.42-1.83-2.98z" fill="currentColor" />
	</SvgIcon>
);

export const DownsizeIcon = (props) => (
	<SvgIcon {...props} viewBox="0 0 24 24">
		<path d="M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z" fill="currentColor" />
	</SvgIcon>
);

// Map tile types to icon components
const TILE_ICON_MAP = {
	Start: StartIcon,
	Payday: PaydayIcon,
	SmallDeal: SmallDealIcon,
	BigDeal: BigDealIcon,
	Market: MarketIcon,
	Doodad: DoodadIcon,
	Charity: CharityIcon,
	Baby: BabyIcon,
	Downsize: DownsizeIcon,
};

export const getTileIcon = (tileType) => TILE_ICON_MAP[tileType] || MarketIcon;

export default TILE_ICON_MAP;
