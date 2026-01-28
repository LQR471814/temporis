import { join } from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import devtools from "solid-devtools/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
	plugins: [
		tanstackRouter({
			target: "solid",
			autoCodeSplitting: true,
			generatedRouteTree: "./src/routeTree.gen.ts",
		}),
		devtools(),
		solidPlugin(),
	],
	build: {
		target: "esnext",
	},
	resolve: {
		alias: {
			src: join(__dirname, "./src"),
			"~": join(__dirname, "./src"),
		},
	},
});
