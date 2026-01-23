import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { join } from "path";

export default defineConfig({
	plugins: [
		tanstackRouter({ target: 'solid', autoCodeSplitting: true }),
		devtools(),
		solidPlugin(),
	],
	server: {
		port: 3000,
	},
	build: {
		target: 'esnext',
	},
	resolve: {
		alias: {
			"~": join(__dirname, "./src")
		}
	}
});
