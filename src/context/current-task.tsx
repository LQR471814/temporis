import {
	type Collection,
	createCollection,
	liveQueryCollectionOptions,
} from "@tanstack/solid-db";
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
import type { Enums } from "src/lib/supabase/types.gen";
import { ROOT_ID } from "~/lib/constants";
import {
	type Timescale,
	type TimescaleInstance,
	timescaleTypeOf,
} from "~/lib/timescales";

// TODO: improve this hack!
const __collection = createCollection(
	liveQueryCollectionOptions({
		query: (q) => q.from({ task: tasksCollection }),
	}),
);
type TaskFields = typeof __collection extends Collection<infer U> ? U : never;

function currentTaskValue() {
	const [shown, setShown] = createSignal<"selected" | "new_child" | "none">(
		"none",
	);
	const [selectedTaskId, setSelectedTaskId] = createSignal<
		string | undefined
	>();

	function form(onsubmit: () => void) {
		return createForm(() => ({
			defaultValues: {
				name: "",
				comments: "",
				implementation: "hours",
				optimistic: 0.5,
				expected: 1,
				pessimistic: 1.5,
				timeframe_start: 0,
				timescale: "week",
				parent_id: ROOT_ID,
				assigned_to: null,
			} as TaskFields,
			onSubmit: onsubmit,
		}));
	}
	const edit = form(() => {
		tasksCollection.update(edit.state.values.id, (val) => {
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

	let lastMove: Promise<void> | null = null;

	return {
		shown,
		selectedTaskId,
		forms: { edit, creation },
		selectTask(taskId: string) {
			const task = tasksCollection.get(taskId);
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
				implementation: "hours",
				parent_id: ROOT_ID,
				assigned_to: null,
			});
			showToast({
				title: "Fields reset.",
				variant: "success",
				duration: 1500,
			});
		},
		deleteTask() {
			tasksCollection.delete(edit.state.values.id);
			showToast({
				title: `Task deleted: ${edit.state.values.name}`,
				variant: "success",
				duration: 3000,
			});
			edit.reset();
			setShown("none");
		},
		async move(
			id: string,
			newTimeframeStart: Temporal.ZonedDateTime,
			newTimescale: Enums<"timescale_type">,
		) {
			const val = tasksCollection.get(id);
			if (!val) throw new Error(`unknown task: ${id}`);
			// not using update because that causes state issues!
			lastMove = (async () => {
				await lastMove;
				const result = tasksCollection.delete(val.id);
				await result.isPersisted.promise;
				const result2 = tasksCollection.insert({
					...val,
					timeframe_start: newTimeframeStart.epochMilliseconds,
					timescale: newTimescale,
				});
				await result2.isPersisted.promise;
			})();
		},
	};
}

export type CurrentTaskValue = ReturnType<typeof currentTaskValue>;

export const CurrentTaskContext = createContext<CurrentTaskValue>();

export type DragData = {
	taskId: string;
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
