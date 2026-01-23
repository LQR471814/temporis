import { createRootRoute, Link, Outlet } from "@tanstack/solid-router";

export const Route = createRootRoute({
	component: () => (
		<div class="min-h-screen">
			<nav class="bg-gray-800 p-4">
				<div class="flex gap-4 justify-center">
					<Link to="/" class="text-white hover:text-gray-300">
						Home
					</Link>
					<Link to="/about" class="text-white hover:text-gray-300">
						About
					</Link>
				</div>
			</nav>
			<main>
				<Outlet />
			</main>
			{/* TanStack Router Devtools not yet available for Solid */}
		</div>
	),
});
