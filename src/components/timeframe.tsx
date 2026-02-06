import { debounce } from "@tanstack/pacer";
import { and, eq, gte, lt, not, useLiveQuery } from "@tanstack/solid-db";
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
import type { task } from "src/lib/trailbase";
import { evalStats } from "src/workers/stats-worker.client";
import { CurrentTaskContext, type DroppableData } from "~/context/current-task";
import { tasksCollection } from "~/lib/collections";
import {
	type Timescale,
	TimescaleType,
	timescaleTypeOf,
} from "~/lib/timescales";
import { cn } from "~/lib/utils";
import { TaskChip } from "./task";
import { Button } from "./ui/button";

const cachedPercentiles = new Map<string, number | Promise<number>>();

function usePercentileDuration(
	percentile: Accessor<number>,
	tasks: Accessor<
		{
			id: bigint;
			optimistic: number;
			expected: number;
			pessimistic: number;
		}[]
	>,
	dependencies: Accessor<
		{
			id: bigint;
			optimistic: number;
			expected: number;
			pessimistic: number;
		}[]
	>,
) {
	const [state, setState] = createSignal<
		{ duration: number; error: null } | { duration: null; error: Error } | null
	>(null);

	const calculate = debounce(
		(p: number) => {
			let hash = "";
			for (const t of tasks()) {
				hash += `${p}|${t.optimistic}:${t.expected}:${t.pessimistic},`;
			}
			for (const t of dependencies()) {
				hash += `|${t.optimistic}:${t.expected}:${t.pessimistic},`;
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
							percentile: p,
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
		},
		{ wait: 100 },
	);

	createEffect(() => {
		const p = percentile();
		calculate(p);
	});

	return state;
}

function getTaskAnalysis(
	currentTimescale: TimescaleType,
	allTasks: (typeof task.schema.infer)[],
) {
	// find all tasks with a parent_id not in the list
	const ids = new Set<bigint>();
	for (const t of allTasks) {
		if (t.id === undefined) throw new Error("id is missing!");
		ids.add(t.id);
	}
	let hidden = 0;
	const indep: (typeof task.schema.infer)[] = [];
	const dependent: (typeof task.schema.infer)[] = [];
	for (const t of allTasks) {
		if (!ids.has(t.parent_id)) {
			if (t.timescale !== currentTimescale) {
				hidden++;
			}
			indep.push(t);
			continue;
		}
		dependent.push(t);
	}
	return { indep, dependent, hidden };
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

	const tasksInTimeframe = useLiveQuery((q) => {
		// for some reason, this isn't rerun unless the dependencies are
		// explicitly stated here (do not compute these values from within
		// the query's where callback)
		const tfstart = instance().start.epochMilliseconds;
		const tfend = instance().end.epochMilliseconds;
		const currentTimescaleHierarchyIdx = timescaleType();
		return q
			.from({ task: tasksCollection })
			.where(({ task }) =>
				and(
					not(eq(task.timescale, TimescaleType.all_time)),
					gte(task.timeframe_start, tfstart),
					lt(task.timeframe_start, tfend),
				),
			)
			.fn.where(({ task }) => task.timescale <= currentTimescaleHierarchyIdx);
	});
	const taskAnalysis = createMemo(() =>
		getTaskAnalysis(timescaleType(), tasksInTimeframe()),
	);
	const shownTasks = createMemo(() =>
		tasksInTimeframe().filter((t) => t.timescale === timescaleType()),
	);

	// percentile computation

	const viewCtx = useContext(ViewContext);
	const percentile = createMemo(() => viewCtx?.state.percentile ?? 95);
	const totalTaskDuration = usePercentileDuration(
		percentile,
		() => taskAnalysis().indep,
		() => taskAnalysis().dependent,
	);
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

	const currentTaskCtx = useContext(CurrentTaskContext);

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
			tasks={shownTasks().map((t) => ({
				id: t.id,
				name: t.name,
				onClick: () => {
					currentTaskCtx?.selectTask(t.id);
				},
			}))}
			duration={duration()}
			hiddenTasks={taskAnalysis().hidden}
		// hiddenTasksDuration={otherTaskDuration.duration()}
		/>
	);
}

type TaskElementParams = {
	id: bigint;
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
					"flex justify-between items-center sticky top-0 z-20": true,
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
