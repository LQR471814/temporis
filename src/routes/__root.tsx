import {
	createRootRoute,
	Link,
	Outlet,
	type RoutePaths,
} from "@tanstack/solid-router";
import { createEffect } from "solid-js";
import { Toaster } from "~/components/ui/toast";
import type { routeTree } from "~/routeTree.gen";

function NavLink(props: {
	to: RoutePaths<typeof routeTree>;
	children: string;
}) {
	return (
		<Link to={props.to} class="text-white hover:text-gray-300">
			{props.children}
		</Link>
	);
}

export const Route = createRootRoute({
	component: () => (
		<div class="grid grid-rows-[min-content,minmax(0,1fr)] h-full">
			<nav class="bg-gray-800 p-4">
				<div class="flex gap-4 justify-center">
					<NavLink to="/">Home</NavLink>
					<NavLink to="/test/horizontal">Horizontal</NavLink>
					<NavLink to="/test/vertical">Vertical</NavLink>
					<NavLink to="/test/task-data-table">Data Table</NavLink>
					<NavLink to="/test/resizable">Resizable</NavLink>
					<NavLink to="/test/dnd">Drag and Drop</NavLink>
				</div>
			</nav>
			<main class="h-full">
				<Outlet />
			</main>
			<Toaster />
			{/* TanStack Router Devtools not yet available for Solid */}
		</div>
	),
	errorComponent: (props) => {
		createEffect(() => {
			console.error(props.error);
		});
		return (
			<div class="h-full">
				<p class="text-red-500">
					{props.error.name}: {props.error.message}
				</p>
			</div>
		);
	},
});
