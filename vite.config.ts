import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { join } from "path";
import devtools from "solid-devtools/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
	plugins: [
		tanstackRouter({ target: "solid", autoCodeSplitting: true }),
		devtools(),
		solidPlugin(),
	],
	server: {
		port: 3000,
	},
	build: {
		target: "esnext",
	},
	resolve: {
		alias: {
			"~": join(__dirname, "./src"),
		},
	},
});
