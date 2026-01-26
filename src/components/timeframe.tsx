import {
	and,
	createCollection,
	gte,
	liveQueryCollectionOptions,
	lte,
	useLiveQuery,
} from "@tanstack/solid-db";
import { For } from "solid-js";
import { tasksCollection } from "~/lib/db";
import type { Timescale } from "~/lib/timescales";
import { cn } from "~/lib/utils";
import { Chip } from "./task";
import { Button } from "./ui/button";

export function Timeframe(props: {
	class?: string;
	timescale: Timescale;
	time: Temporal.ZonedDateTime;
}) {
	const instance = props.timescale.instance(props.time);

	const timeframeTasks = createCollection(
		liveQueryCollectionOptions({
			query: (q) =>
				q
					.from({ task: tasksCollection })
					.select(({ task }) => ({
						id: task.id,
						name: task.name,
						status: task.status,
						blocked: task.blocked_by !== null,
					}))
					.where(({ task }) =>
						and(
							gte(task.timeframe_start, instance.start),
							lte(task.timeframe_start, instance.end),
						),
					),
		}),
	);

	const query = useLiveQuery((q) => q.from({ timeframeTasks }));

	return (
		<div
			class={cn(
				"group relative border border-muted rounded-lg flex flex-col min-h-[100px] overflow-y-auto transition-colors hover:border-primary/30",
				props.class,
			)}
		>
			<div class="sticky top-0 bg-background border-b border-muted px-2 py-1 transition-colors group-hover:border-primary/30 flex justify-between items-center">
				<p class="text-sm">{instance.name}</p>
				<Button
					class="px-1 py-0 h-min aspect-square text-primary/30 group-hover:text-primary"
					variant="ghost"
				>
					＋
				</Button>
			</div>
			<div class="flex flex-col gap-2 px-2 py-1 pb-8">
				<For each={query()}>
					{(task) => (
						<Chip
							{...task}
							onClick={() => {
								console.log("clicked!");
							}}
						/>
					)}
				</For>
			</div>
		</div>
	);
}
