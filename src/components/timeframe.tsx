import { useLiveQuery } from "@tanstack/solid-db";
import { createDroppable } from "@thisbeyond/solid-dnd";
import {
	createEffect,
	createMemo,
	createSignal,
	For,
	Match,
	Switch,
	useContext,
} from "solid-js";
import { TaskChipContext } from "src/context/task-chip";
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
	const namespace = useContext(TaskChipContext);
	const droppable = createDroppable(
		`${namespace?.namespace ?? "null_namespace"} ${props.timescale.name} ${props.time.toString()}`,
		{
			time: () => props.time,
			timescale: () => props.timescale,
		},
	);
	const instance = createMemo(() => props.timescale.instance(props.time));

	const tasks = useLiveQuery((q) => {
		// for some reason, this isn't rerun unless this dependency is
		// explicitly stated here
		instance();
		return q.from({ task: tasksCollection }).fn.where(({ task }) => {
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
		});
	});
	const currentTaskCtx = useContext(CurrentTaskContext);

	const timeframeDuration = createMemo(() =>
		instance().end.since(instance().start),
	);
	const [p95dur, setP95Dur] = createSignal<number | null>(null);
	const [p95err, setP95Err] = createSignal<Error | null>(null);
	createEffect(() => {
		// effect has implicit dependency on task parameters, so we explicitly
		// specify them here
		tasks().map((t) => ({
			o: t.optimistic,
			e: t.expected,
			p: t.pessimistic,
		}));
		const ids = tasks().map((t) => t.id);
		setP95Dur(null);
		setP95Err(null);
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
		<Display
			class={props.class}
			label={instance().name}
			accented={props.accented}
			ref={droppable}
			isDroppingOver={droppable.isActiveDroppable}
			onCreateAction={() => {
				if (!currentTaskCtx) {
					return;
				}
				currentTaskCtx.newChildAt(instance());
			}}
			tasks={tasks().map((t) => ({
				id: t.id,
				name: t.name,
				onClick: () => {
					currentTaskCtx?.selectTask(t.id);
				},
			}))}
			duration={
				p95dur() !== null
					? {
							// biome-ignore lint/style/noNonNullAssertion: this has already been checked
							filledHours: p95dur()!,
							totalHours: timeframeDuration().total({ unit: "hours" }),
						}
					: p95err()
			}
		/>
	);
}

type TaskElementParams = {
	id: string;
	name: string;
	onClick(): void;
};

type DurationStats = {
	filledHours: number;
	totalHours: number;
};

function Display(props: {
	class?: string;
	label: string;
	accented?: boolean;
	isDroppingOver: boolean;
	onCreateAction(): void;
	ref(el: HTMLButtonElement): void;
	tasks: TaskElementParams[];
	duration: null | DurationStats | Error;
}) {
	return (
		<button
			type="button"
			class={cn(
				"flex flex-col min-h-[100px] group relative h-fit",
				"border border-muted rounded-lg",
				"transition-colors hover:border-primary/30 cursor-default",
				props.class,
			)}
			classList={{ "bg-muted": props.isDroppingOver }}
			onDblClick={() => {}}
			ref={props.ref}
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
					{props.label}
				</p>
				<Button
					class="px-1 py-0 h-min aspect-square text-primary/30"
					variant="ghost"
					onClick={props.onCreateAction}
				>
					＋
				</Button>
			</div>
			<div class="flex flex-col gap-1 px-1 py-1 pb-8">
				<For each={props.tasks}>
					{(task) => (
						<TaskChip
							class="z-10"
							id={task.id}
							name={task.name}
							color="bg-gray-500"
							onClick={task.onClick}
						/>
					)}
				</For>
				<Switch>
					<Match when={props.duration instanceof Error}>
						<p class="text-sm text-red-500">
							Estimate failed: {(props.duration as Error).message}
						</p>
					</Match>
					<Match when={props.duration !== null}>
						<p class="text-sm whitespace-nowrap">
							{(props.duration as DurationStats).filledHours?.toFixed(1)}h /{" "}
							{(props.duration as DurationStats).totalHours}h
						</p>
					</Match>
					<Match when={props.duration === null}>
						<p>...</p>
					</Match>
				</Switch>
			</div>
		</button>
	);
}
