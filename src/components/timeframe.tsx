import { and, eq, gte, lt, not } from "@tanstack/solid-db";
import { createDroppable } from "@thisbeyond/solid-dnd";
import { createMemo, For, Match, Show, Switch, useContext } from "solid-js";
import {
	CurrentTaskContext,
	type DroppableData,
} from "src/context/current-task";
import { ViewContext } from "src/context/view";
import { tasksCollection } from "src/lib/collections";
import { type StatusType, TimescaleType } from "src/lib/constants";
import { type Timescale, timescaleTypeOf } from "src/lib/timescales";
import type { task } from "src/lib/trailbase";
import { usePercentileDuration } from "src/lib/use-percentile";
import { cn, useLiveQueryNoReconcile } from "src/lib/utils";
import { TaskChip } from "./task-chip";
import { Button } from "./ui/button";

function getTaskAnalysis(
	currentTimescale: TimescaleType,
	allTasks: (typeof task.schema.infer)[],
) {
	// find all tasks with a parent_id not in the list
	const ids = new Set<string>();
	for (const t of allTasks) {
		if (t.id === undefined) throw new Error("id is missing!");
		ids.add(t.id);
	}
	let hidden = 0;
	const independent: (typeof task.schema.infer)[] = [];
	const dependent: (typeof task.schema.infer)[] = [];
	for (const t of allTasks) {
		if (!ids.has(t.parent_id)) {
			if (t.timescale !== currentTimescale) {
				hidden++;
			}
			independent.push(t);
			continue;
		}
		dependent.push(t);
	}
	return { independent, dependent, hidden };
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
		`${props.timescale.name}:${props.time.toString()}`,
		{
			timeframeStart: () => instance().start,
			timescale: () => props.timescale,
		} satisfies DroppableData,
	);

	// task

	// not performant, but fixes the correctness issues of useLiveQuery as a
	// result of calling reconcile()
	const tasksInTimeframe = useLiveQueryNoReconcile((q) => {
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
		tasksInTimeframe()
			.filter((t) => t.timescale === timescaleType())
			.sort((a, b) => a.status - b.status),
	);

	// percentile computation

	const viewCtx = useContext(ViewContext);
	const percentile = createMemo(() => viewCtx?.state.percentile ?? 95);
	const totalTaskDuration = usePercentileDuration(
		percentile,
		() => taskAnalysis().independent,
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
				status: t.status,
				onClick: () => {
					currentTaskCtx?.selectTask(t.id);
				},
				onClickStatus: () => {
					currentTaskCtx?.toggleTaskStatus(t.id);
				},
			}))}
			duration={duration()}
			hiddenTasks={taskAnalysis().hidden}
			// hiddenTasksDuration={otherTaskDuration.duration()}
		/>
	);
}

type TaskElementParams = {
	id: string;
	name: string;
	status: StatusType;
	onClick(): void;
	onClickStatus(): void;
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
			<div class="flex flex-col gap-1 p-1">
				<For each={props.tasks}>
					{(task) => (
						<TaskChip
							class="z-10"
							id={task.id}
							status={task.status}
							name={task.name}
							onClick={task.onClick}
							onClickStatus={task.onClickStatus}
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
