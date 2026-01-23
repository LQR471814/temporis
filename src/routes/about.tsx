import { createFileRoute, Link } from "@tanstack/solid-router";

export const Route = createFileRoute("/about")({
	component: About,
});

function About() {
	return (
		<div class="p-4">
			<h1 class="text-4xl text-purple-700 text-center py-10">About</h1>
			<p class="text-center text-gray-600">
				This is a SolidJS app with TanStack Router.
			</p>
			<div class="text-center mt-8">
				<Link to="/" class="text-blue-500 hover:underline">
					Go to Home
				</Link>
			</div>
		</div>
	);
}
