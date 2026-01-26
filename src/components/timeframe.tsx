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
import { Chip } from "./task";

export function Timeframe(props: {
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
		<div class="border border-solid border-muted rounded-xl min-h-[200px] p-3 flex flex-col gap-3">
			<p>{instance.name}</p>
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
	);
}
