import {
	and,
	createLiveQueryCollection,
	eq,
	gte,
	lt,
	not,
} from "@tanstack/solid-db";
import { createDroppable } from "@thisbeyond/solid-dnd";
import {
	type Accessor,
	createEffect,
	createMemo,
	createSignal,
	For,
	Match,
	Show,
	Switch,
	useContext,
} from "solid-js";
import { ViewContext } from "src/context/view";
import { evalStats } from "src/workers/stats-worker.client";
import { CurrentTaskContext, type DroppableData } from "~/context/current-task";
import { tasksCollection } from "~/lib/db";
import {
	hierarchyTypes,
	type Timescale,
	timescaleTypeOf,
} from "~/lib/timescales";
import { cn } from "~/lib/utils";
import { TaskChip } from "./task";
import { Button } from "./ui/button";

// TODO: make it so that task estimates rerender when their children change!

const cachedPercentiles = new Map<string, number | Promise<number>>();

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
	const [state, setState] = createSignal<
		{ duration: number; error: null } | { duration: null; error: Error } | null
	>(null);

	createEffect(() => {
		let hash = "";
		for (const t of tasks()) {
			hash += `${t.optimistic}:${t.expected}:${t.pessimistic},`;
		}
		const cached = cachedPercentiles.get(hash);
		if (typeof cached === "number") {
			setState({ duration: cached, error: null });
			return;
		}

		setState(null);

		const promise =
			cached instanceof Promise
				? cached
				: evalStats(
						tasks().map((t) => t.id),
						{
							type: "percentile",
							percentile: percentile(),
						},
					);

		cachedPercentiles.set(hash, promise);

		promise
			.then((dur) => {
				setState({ duration: dur, error: null });
				cachedPercentiles.set(hash, dur);
			})
			.catch((err) => {
				console.error(err);
				setState({ duration: null, error: err });
			});
	});
	return state;
}

export function Timeframe(props: {
	class?: string;
	timescale: Timescale;
	time: Temporal.ZonedDateTime;
	collapsible?: boolean;
	accented?: boolean;
}) {
	// timeframe calculations

	const instance = createMemo(() => props.timescale.instance(props.time));
	const timescaleType = createMemo(() => timescaleTypeOf(props.timescale));
	const hierarchyLevel = createMemo(
		() => hierarchyTypes.length - hierarchyTypes.indexOf(timescaleType()),
	);
	const timeframeDuration = createMemo(() =>
		instance().end.since(instance().start),
	);

	// dnd

	const droppable = createDroppable(
		`${props.timescale.name} ${props.time.toString()}`,
		{
			timeframeStart: () => instance().start,
			timescale: () => props.timescale,
		} satisfies DroppableData,
	);

	// task

	const tasksInTimeframe = createLiveQueryCollection((q) => {
		// for some reason, this isn't rerun unless the dependencies are
		// explicitly stated here (do not compute these values from within the
		// query's where callback)
		const tfstart = instance().start.epochMilliseconds;
		const tfend = instance().end.epochMilliseconds;
		return q
			.from({ task: tasksCollection })
			.where(({ task }) =>
				and(
					not(eq(task.timescale, "all_time")),
					gte(task.timeframe_start, tfstart),
					lt(task.timeframe_start, tfend),
				),
			);
	});
	const shownTasksCollection = createLiveQueryCollection((q) =>
		q
			.from({ task: tasksInTimeframe })
			.where(({ task }) => eq(task.timescale, timescaleType())),
	);
	// not extremely efficient, but beats the correctness issues with
	// useLiveQuery for now
	const [tasks, setTasks] = createSignal(
		Array.from(shownTasksCollection.values()),
	);
	createEffect(() => {
		const { unsubscribe } = shownTasksCollection.subscribeChanges(() => {
			setTasks(Array.from(shownTasksCollection.values()));
		});
		return unsubscribe;
	});
	// other tasks include:
	// - tasks which also occur within the timeframe but not the same timescale
	// - tasks which are not children of the tasks in `tasks()`
	const otherTasksCollection = createLiveQueryCollection((q) => {
		// explicitly list dependency here, otherwise the live query doesn't update
		tasks();
		return q
			.from({ task: tasksInTimeframe })
			.where(({ task }) => not(eq(task.timescale, timescaleType())))
			.fn.where(({ task }) => {
				const level =
					hierarchyTypes.length - hierarchyTypes.indexOf(task.timescale);
				if (level > hierarchyLevel()) {
					return false;
				}
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
	const [otherTasks, setOtherTasks] = createSignal(
		Array.from(otherTasksCollection.values()),
	);
	createEffect(() => {
		const { unsubscribe } = otherTasksCollection.subscribeChanges(() => {
			setOtherTasks(Array.from(otherTasksCollection.values()));
		});
		return unsubscribe;
	});
	const currentTaskCtx = useContext(CurrentTaskContext);

	// percentile computation

	const viewCtx = useContext(ViewContext);
	const percentile = viewCtx?.state.percentile ?? 95;

	const allTasks = createMemo(() => [...tasks(), ...otherTasks()]);
	// const otherTaskDuration = usePercentileDuration(() => percentile, otherTasks);
	const totalTaskDuration = usePercentileDuration(() => percentile, allTasks);
	const duration = createMemo(() => {
		const dur = totalTaskDuration();
		if (!dur) {
			return null;
		}
		if (dur.duration === null) {
			return dur.error;
		}
		return {
			filledHours: dur.duration,
			totalHours: timeframeDuration().total({ unit: "hours" }),
		} satisfies DurationStats;
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
			duration={duration()}
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
