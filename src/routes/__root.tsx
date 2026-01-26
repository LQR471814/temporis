import { createRootRoute, Link, Outlet } from "@tanstack/solid-router";
import { createEffect } from "solid-js";

export const Route = createRootRoute({
	component: () => (
		<div class="h-full">
			<nav class="bg-gray-800 p-4">
				<div class="flex gap-4 justify-center">
					<Link to="/" class="text-white hover:text-gray-300">
						Home
					</Link>
					<Link to="/task-data-table" class="text-white hover:text-gray-300">
						Data Table
					</Link>
				</div>
			</nav>
			<main>
				<Outlet />
			</main>
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
