import { Typography } from '@mui/material';

const formatCurrency = (amount) => {
	const absAmount = Math.abs(amount || 0);
	return absAmount.toLocaleString('en-US');
};

const Currency = ({ amount, variant = 'inherit', component = 'span', sx = {}, ...props }) => {
	return (
		<Typography
			variant={variant}
			component={component}
			sx={{
				fontVariantNumeric: 'tabular-nums',
				fontFeatureSettings: '"tnum"',
				...sx,
			}}
			{...props}
		>
			${formatCurrency(amount)}
		</Typography>
	);
};

export default Currency;
