import { useLiveQuery } from "@tanstack/solid-db";
import { createDroppable } from "@thisbeyond/solid-dnd";
import {
	createEffect,
	createMemo,
	createSignal,
	For,
	Show,
	useContext,
} from "solid-js";
import { evalStats } from "src/workers/stats-worker.client";
import { CurrentTaskContext } from "~/context/current-task";
import { tasksCollection } from "~/lib/db";
import { type Timescale, timescaleTypeOf } from "~/lib/timescales";
import { asInstant, cn } from "~/lib/utils";
import { TaskChip } from "./task";
import { Button } from "./ui/button";

export function Timeframe(props: {
	class?: string;
	timescale: Timescale;
	time: Temporal.ZonedDateTime;
	collapsible?: boolean;
	accented?: boolean;
}) {
	const droppable = createDroppable(
		`${props.timescale.name} ${props.time.toString()}`,
		{
			time: () => props.time,
			timescale: () => props.timescale,
		},
	);
	const instance = createMemo(() => props.timescale.instance(props.time));

	const tasks = useLiveQuery((q) =>
		q.from({ task: tasksCollection }).fn.where(({ task }) => {
			// exclude root task
			if (task.timescale === "all_time") {
				return false;
			}
			if (task.timescale !== timescaleTypeOf(props.timescale)) {
				return false;
			}
			const startInstant = asInstant(task.timeframe_start);
			return (
				Temporal.Instant.compare(startInstant, instance().start.toInstant()) >=
				0 &&
				Temporal.Instant.compare(startInstant, instance().end.toInstant()) < 0
			);
		}),
	);
	const currentTaskCtx = useContext(CurrentTaskContext);

	const timeframeDuration = createMemo(() =>
		instance().end.since(instance().start),
	);
	const [p95dur, setP95Dur] = createSignal<number | null>(null);
	const [p95err, setP95Err] = createSignal<Error | null>(null);
	createEffect(() => {
		tasks().map((t) => ({
			o: t.optimistic,
			e: t.expected,
			p: t.pessimistic,
		}));
		const ids = tasks().map((t) => t.id);
		evalStats(ids, {
			type: "percentile",
			percentile: 95,
		})
			.then((dur) => {
				setP95Dur(dur);
			})
			.catch((err) => {
				console.error(err);
				setP95Err(err);
			});
	});

	return (
		<button
			type="button"
			class={cn(
				"flex flex-col min-h-[100px] group relative h-fit",
				"border border-muted rounded-lg",
				"transition-colors hover:border-primary/30 cursor-default",
				props.class,
			)}
			classList={{ "bg-muted": droppable.isActiveDroppable }}
			onDblClick={() => {
				if (!currentTaskCtx) {
					return;
				}
				currentTaskCtx.newChildAt(instance());
			}}
			use:droppable
		>
			<div
				classList={{
					"flex justify-between items-center sticky top-0": true,
					"rounded-t-lg bg-background border-b border-muted px-2 py-1": true,
					"transition-colors group-hover:border-primary/30": true,
				}}
			>
				<p
					classList={{
						"text-sm": true,
						"font-bold": props.accented,
					}}
				>
					{instance().name}
				</p>
				<Button
					class="px-1 py-0 h-min aspect-square text-primary/30"
					variant="ghost"
					onClick={() => {
						if (!currentTaskCtx) {
							return;
						}
						currentTaskCtx.newChildAt(instance());
					}}
				>
					＋
				</Button>
			</div>
			<div class="flex flex-col gap-1 px-1 py-1 pb-8">
				<For each={tasks()}>
					{(task) => (
						<TaskChip
							class="z-10"
							id={task.id}
							name={task.name}
							color="bg-gray-500"
							onClick={() => {
								currentTaskCtx?.selectTask(task.id);
							}}
						/>
					)}
				</For>
				<Show when={p95dur() !== null} fallback={<p>...</p>}>
					<p class="text-sm whitespace-nowrap">
						{p95dur()?.toFixed(1)}h /{" "}
						{timeframeDuration().total({ unit: "hours" })}h
					</p>
				</Show>
				<Show when={p95err() !== null}>
					<p class="text-sm text-red-500">Estimate failed</p>
				</Show>
			</div>
		</button>
	);
}
