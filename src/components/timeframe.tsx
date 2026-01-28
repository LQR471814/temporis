import {
	and,
	createCollection,
	gte,
	liveQueryCollectionOptions,
	lte,
	useLiveQuery,
} from "@tanstack/solid-db";
import { For, useContext } from "solid-js";
import { CurrentTaskContext } from "~/context/current-task";
import { tasksCollection } from "~/lib/db";
import type { Timescale } from "~/lib/timescales";
import { cn } from "~/lib/utils";
import { Chip } from "./task";
import { Button } from "./ui/button";

export function Timeframe(props: {
	class?: string;
	timescale: Timescale;
	time: Temporal.ZonedDateTime;
	collapsible?: boolean;
	accented?: boolean;
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
	const currentTaskCtx = useContext(CurrentTaskContext);

	return (
		<button
			type="button"
			class={cn(
				"flex flex-col min-h-[100px] overflow-y-auto group relative",
				"border border-muted rounded-lg",
				"transition-colors hover:border-primary/30 cursor-default",
				props.class,
			)}
			onDblClick={() => {
				if (!currentTaskCtx) {
					return;
				}
				currentTaskCtx.newChildAt(instance);
			}}
		>
			<div
				classList={{
					"flex justify-between items-center sticky top-0": true,
					"bg-background border-b border-muted px-2 py-1": true,
					"transition-colors group-hover:border-primary/30": true,
				}}
			>
				<p
					classList={{
						"text-sm": true,
						"font-bold": props.accented,
					}}
				>
					{instance.name}
				</p>
				<Button
					class="px-1 py-0 h-min aspect-square text-primary/30"
					variant="ghost"
					onClick={() => {
						if (!currentTaskCtx) {
							return;
						}
						currentTaskCtx.newChildAt(instance);
					}}
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
		</button>
	);
}
