import { createFileRoute } from "@tanstack/solid-router";
import { useLiveQuery } from "@tanstack/solid-db";
import { createEffect } from "solid-js";
import { tasksCollection } from "~/lib/collections";

export const Route = createFileRoute("/")({
	component: Home,
});

function Home() {
	const tasks_ = useLiveQuery((q) => q.from({ task: tasksCollection }));
	createEffect(() => {
		console.log("updated", tasks_());
	});
	return (
		<div class="flex flex-col gap-3">
			<p>index route</p>
		</div>
	);
}
