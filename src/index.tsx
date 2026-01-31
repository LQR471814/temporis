/* @refresh reload */
import "./index.css";
import "temporal-polyfill/global";
import { render } from "solid-js/web";
import "solid-devtools";
import { createRouter, RouterProvider } from "@tanstack/solid-router";
import { routeTree } from "./routeTree.gen";
import "solid-devtools";
import { attachDevtoolsOverlay } from "@solid-devtools/overlay";
import { QueryClientProvider } from "@tanstack/solid-query";
import type { Draggable, Droppable } from "@thisbeyond/solid-dnd";
import { createDraggable, createDroppable } from "@thisbeyond/solid-dnd";
import { queryClient } from "./lib/query";

// prevent tree shaking of directives
false && createDroppable;
false && createDraggable;

declare module "solid-js" {
	namespace JSX {
		interface DirectiveFunctions {
			draggable: Draggable;
			droppable: Droppable;
		}
	}
}

attachDevtoolsOverlay();

if (import.meta.env.DEV) {
	// @ts-expect-error: add query client for devtools
	window.__TANSTACK_QUERY_CLIENT__ = queryClient;
}

const router = createRouter({
	routeTree,
	context: {
		queryClient,
	},
});

declare module "@tanstack/solid-router" {
	interface Register {
		router: typeof router;
	}
}

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
	throw new Error(
		"Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
	);
}

if (root)
	render(
		() => (
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
			</QueryClientProvider>
		),
		root,
	);
