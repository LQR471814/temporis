import {
	and,
	createLiveQueryCollection,
	eq,
	gte,
	lt,
	not,
	useLiveQuery,
} from "@tanstack/solid-db";
import { createDroppable } from "@thisbeyond/solid-dnd";
import {
	createEffect,
	createMemo,
	createSignal,
	For,
	Match,
	Show,
	Switch,
	useContext,
	type Accessor,
} from "solid-js";
import { TaskChipContext } from "src/context/task-chip";
import { evalStats } from "src/workers/stats-worker.client";
import { CurrentTaskContext } from "~/context/current-task";
import { tasksCollection } from "~/lib/db";
import { type Timescale, timescaleTypeOf } from "~/lib/timescales";
import { cn } from "~/lib/utils";
import { TaskChip } from "./task";
import { Button } from "./ui/button";
import { ViewContext } from "src/context/view";

function usePercentileDuration(
	percentile: Accessor<number>,
	tasks: Accessor<
		{
			id: string;
			optimistic: number;
			expected: number;
			pessimistic: number;
		}[]
	>,
) {
	const [duration, setDuration] = createSignal<number | null>(null);
	const [error, setError] = createSignal<Error | null>(null);
	createEffect(() => {
		tasks().map((t) => ({
			o: t.optimistic,
			e: t.expected,
			p: t.pessimistic,
		}));
		const ids = tasks().map((t) => t.id);
		setDuration(null);
		setError(null);
		evalStats(ids, {
			type: "percentile",
			percentile: percentile(),
		})
			.then((dur) => {
				setDuration(dur);
			})
			.catch((err) => {
				console.error(err);
				setError(err);
			});
	});
	return { duration, error };
}

export function Timeframe(props: {
	class?: string;
	timescale: Timescale;
	time: Temporal.ZonedDateTime;
	collapsible?: boolean;
	accented?: boolean;
}) {
	// dnd

	const namespace = useContext(TaskChipContext);
	const droppable = createDroppable(
		`${namespace?.namespace ?? "null_namespace"} ${props.timescale.name} ${props.time.toString()}`,
		{
			time: () => props.time,
			timescale: () => props.timescale,
		},
	);

	// timeframe calculations

	const instance = createMemo(() => props.timescale.instance(props.time));
	const timescaleType = createMemo(() => timescaleTypeOf(props.timescale));
	const timeframeDuration = createMemo(() =>
		instance().end.since(instance().start),
	);

	// task

	const tasksInTimeframe = createLiveQueryCollection((q) => {
		// for some reason, this isn't rerun unless the dependencies are
		// explicitly stated here (do not compute these values from within the
		// query's where callback)
		const tfstart = new Date(instance().start.epochMilliseconds);
		const tfend = new Date(instance().end.epochMilliseconds);
		return q
			.from({ task: tasksCollection })
			.where(({ task }) => not(eq(task.timescale, "all_time")))
			.where(({ task }) =>
				and(
					gte(task.timeframe_start, tfstart),
					lt(task.timeframe_start, tfend),
				),
			);
	});
	const tasks = useLiveQuery((q) =>
		q
			.from({ task: tasksInTimeframe })
			.where(({ task }) => eq(task.timescale, timescaleType())),
	);
	// other tasks include:
	// - tasks which also occur within the timeframe but not the same timescale
	// - tasks which are not children of the tasks in `tasks()`
	const otherTasks = useLiveQuery((q) => {
		// explicitly list dependency here, otherwise the live query doesn't update
		tasks();
		return q
			.from({ task: tasksInTimeframe })
			.where(({ task }) => not(eq(task.timescale, timescaleType())))
			.fn.where(({ task }) => {
				let id = task.id;
				let parent = task.parent_id;
				while (id !== parent) {
					if (tasks().findIndex((e) => e.id === parent) >= 0) {
						return false;
					}
					const parentTask = tasksCollection.get(parent);
					if (!parentTask) {
						throw new Error(`could not find parent task: ${parent}`);
					}
					id = parentTask.id;
					parent = parentTask.parent_id;
				}
				return true;
			});
	});
	const currentTaskCtx = useContext(CurrentTaskContext);

	// percentile computation

	const viewCtx = useContext(ViewContext);
	const percentile = viewCtx?.state.percentile ?? 95;

	const allTasks = createMemo(() => [...tasks(), ...otherTasks()]);
	// const otherTaskDuration = usePercentileDuration(() => percentile, otherTasks);
	const totalTaskDuration = usePercentileDuration(() => percentile, allTasks);

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
				totalTaskDuration.duration() !== null
					? {
							// biome-ignore lint/style/noNonNullAssertion: this has already been checked
							filledHours: totalTaskDuration.duration()!,
							totalHours: timeframeDuration().total({ unit: "hours" }),
						}
					: totalTaskDuration.error()
			}
			hiddenTasks={otherTasks().length}
			// hiddenTasksDuration={otherTaskDuration.duration()}
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
	hiddenTasks: number;
	// hiddenTasksDuration: number | null;
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
			onDblClick={props.onCreateAction}
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
				<Show when={props.hiddenTasks > 0}>
					<div class="border border-dashed text-primary/30 rounded-md">
						<p class="text-center text-sm">
							{props.hiddenTasks} lower-level tasks
							{/* ({props.hiddenTasksDuration?.toFixed(1) ?? "..."}h) */}
						</p>
					</div>
				</Show>
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
