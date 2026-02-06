import { createForm } from "@tanstack/solid-form";
import { DragDropProvider, DragDropSensors } from "@thisbeyond/solid-dnd";
import {
	batch,
	createContext,
	createSignal,
	type ParentComponent,
} from "solid-js";
import { showToast } from "src/components/ui/toast";
import { tasksCollection } from "src/lib/collections";
import type { task } from "src/lib/trailbase";
import { randomSnowflakeID } from "src/lib/utils";
import { ROOT_ID } from "~/lib/constants";
import {
	ImplementationType,
	type Timescale,
	type TimescaleInstance,
	TimescaleType,
	timescaleTypeOf,
} from "~/lib/timescales";

function currentTaskValue() {
	const [shown, setShown] = createSignal<"selected" | "new_child" | "none">(
		"none",
	);
	const [selectedTaskId, setSelectedTaskId] = createSignal<
		bigint | undefined
	>();

	function form(onsubmit: () => void) {
		return createForm(() => ({
			defaultValues: {
				id: randomSnowflakeID(),
				name: "",
				comments: "",
				implementation: ImplementationType.hours,
				optimistic: 0.5,
				expected: 1,
				pessimistic: 1.5,
				timeframe_start: 0,
				timescale: TimescaleType.week,
				parent_id: ROOT_ID,
				assigned_to: undefined,
			} as typeof task.schema.infer,
			onSubmit: onsubmit,
		}));
	}
	const edit = form(() => {
		tasksCollection.update(edit.state.values.id.toString(), (val) => {
			Object.assign(val, edit.state.values);
		});
		showToast({
			title: `Task updated: ${edit.state.values.name}`,
			variant: "success",
			duration: 3000,
		});
	});
	const creation = form(() => {
		tasksCollection.insert([creation.state.values]);
		showToast({
			title: `Task created: ${creation.state.values.name}`,
			variant: "success",
			duration: 3000,
		});
	});

	return {
		shown,
		selectedTaskId,
		forms: { edit, creation },
		selectTask(taskId: bigint) {
			const task = tasksCollection.get(taskId.toString());
			if (!task) throw new Error("taskId is invalid");
			batch(() => {
				edit.reset(task);
				setSelectedTaskId(taskId);
				setShown("selected");
			});
		},
		newChildAt(timeframe: TimescaleInstance) {
			batch(() => {
				creation.setFieldValue(
					"timescale",
					timescaleTypeOf(timeframe.timescale),
				);
				creation.setFieldMeta("timescale", (prev) => ({
					...prev,
					isTouched: true,
					isDirty: true,
				}));
				creation.setFieldValue(
					"timeframe_start",
					timeframe.start.toInstant().epochMilliseconds,
				);
				creation.setFieldMeta("timeframe_start", (prev) => ({
					...prev,
					isTouched: true,
					isDirty: true,
				}));
				setShown("new_child");
			});
		},
		resetNewChild() {
			creation.reset({
				...creation.state.values,
				name: "",
				comments: "",
				optimistic: 0.5,
				expected: 1,
				pessimistic: 1.5,
				implementation: ImplementationType.hours,
				parent_id: ROOT_ID,
				assigned_to: undefined,
			});
			showToast({
				title: "Fields reset.",
				variant: "success",
				duration: 1500,
			});
		},
		deleteTask() {
			tasksCollection.delete(edit.state.values.id.toString());
			showToast({
				title: `Task deleted: ${edit.state.values.name}`,
				variant: "success",
				duration: 3000,
			});
			edit.reset();
			setShown("none");
		},
		move(
			id: bigint,
			newTimeframeStart: Temporal.ZonedDateTime,
			newTimescale: TimescaleType,
		) {
			const val = tasksCollection.get(id.toString());
			if (!val) throw new Error(`unknown task: ${id}`);
			tasksCollection.update(val.id.toString(), (val) => {
				val.timeframe_start = newTimeframeStart.epochMilliseconds;
				val.timescale = newTimescale;
			});
		},
	};
}

export type CurrentTaskValue = ReturnType<typeof currentTaskValue>;

export const CurrentTaskContext = createContext<CurrentTaskValue>();

export type DragData = {
	taskId: bigint;
};

export type DroppableData = {
	timeframeStart(): Temporal.ZonedDateTime;
	timescale(): Timescale;
};

export const CurrentTaskProvider: ParentComponent = (props) => {
	const value = currentTaskValue();
	return (
		<DragDropProvider
			onDragEnd={(e) => {
				if (!e.droppable) {
					return;
				}
				const dragData = e.draggable.data as DragData;
				const dropData = e.droppable.data as DroppableData;
				value.move(
					dragData.taskId,
					dropData.timeframeStart(),
					timescaleTypeOf(dropData.timescale()),
				);
				if (value.selectedTaskId() === dragData.taskId) {
					value.selectTask(dragData.taskId);
				}
			}}
		>
			<DragDropSensors />
			<CurrentTaskContext.Provider value={value}>
				{props.children}
			</CurrentTaskContext.Provider>
		</DragDropProvider>
	);
};
