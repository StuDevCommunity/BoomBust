const appPrefix = process.env.PM2_APP_NAME || 'boombust';
const apiPort = process.env.PORT || process.env.API_PORT || '3001';
const webPort = process.env.WEB_PORT || '5174';
const webHost = process.env.WEB_HOST || '0.0.0.0';
const publicOrigin = process.env.PUBLIC_ORIGIN || 'https://boombust.studev.id.vn';
const corsOrigins = process.env.CORS_ORIGINS || '';

export const apps = [
	{
		name: `${appPrefix}-api`,
		cwd: './',
		script: 'server/src/server.js',
		interpreter: 'node',
		instances: 1,
		exec_mode: 'fork',
		watch: false,
		max_memory_restart: '512M',
		time: true,
		env: {
			NODE_ENV: 'production',
			PORT: apiPort,
			PUBLIC_ORIGIN: publicOrigin,
			CLIENT_ORIGIN: publicOrigin,
			CORS_ORIGINS: corsOrigins,
		},
		error_file: `./logs/${appPrefix}-api-error.log`,
		out_file: `./logs/${appPrefix}-api-out.log`,
		log_file: `./logs/${appPrefix}-api-combined.log`,
		merge_logs: true,
		autorestart: true,
		restart_delay: 2000,
		kill_timeout: 5000,
	},
	{
		name: `${appPrefix}-web`,
		cwd: './',
		script: 'pnpm',
		args: `--filter ./client preview --host ${webHost} --port ${webPort} --strictPort`,
		instances: 1,
		exec_mode: 'fork',
		watch: false,
		max_memory_restart: '256M',
		time: true,
		env: {
			NODE_ENV: 'production',
			WEB_HOST: webHost,
			WEB_PORT: webPort,
			PUBLIC_ORIGIN: publicOrigin,
			VITE_API_URL: process.env.VITE_API_URL || `http://localhost:${apiPort}`,
		},
		error_file: `./logs/${appPrefix}-web-error.log`,
		out_file: `./logs/${appPrefix}-web-out.log`,
		log_file: `./logs/${appPrefix}-web-combined.log`,
		merge_logs: true,
		autorestart: true,
		restart_delay: 2000,
		kill_timeout: 5000,
	},
];
