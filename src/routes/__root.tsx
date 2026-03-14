import { createRootRoute, Outlet } from "@tanstack/solid-router";
import { createEffect } from "solid-js";
import { Toaster } from "src/components/ui/toast";

export const Route = createRootRoute({
	component: () => (
		<div class="grid grid-rows-[min-content,minmax(0,1fr)] h-full">
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
