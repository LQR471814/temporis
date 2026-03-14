import { createForm } from "@tanstack/solid-form";
import { DragDropProvider, DragDropSensors } from "@thisbeyond/solid-dnd";
import {
	untrack,
	batch,
	createContext,
	createSignal,
	type ParentComponent,
} from "solid-js";
import { showToast } from "src/components/ui/toast";
import { tasksCollection } from "src/lib/collections";
import {
	ImplementationType,
	ROOT_ID,
	StatusType,
	TimescaleType,
} from "src/lib/constants";
import {
	type Timescale,
	type TimescaleInstance,
	timescaleTypeOf,
} from "src/lib/timescales";
import type { task } from "src/lib/trailbase";
import { generateID } from "src/lib/utils";

function currentTaskValue() {
	const [shown, setShown] = createSignal<"editing" | "new_task" | "none">(
		"none",
	);

	function form(onsubmit: () => void) {
		return createForm(() => ({
			defaultValues: {
				id: generateID(),
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
				status: StatusType.pending,
			} as typeof task.schema.infer,
			onSubmit: onsubmit,
		}));
	}

	const editForm = form(() => {
		tasksCollection.update(editForm.state.values.id.toString(), (val) => {
			Object.assign(val, editForm.state.values);
		});
		showToast({
			title: `Task updated: ${editForm.state.values.name}`,
			variant: "success",
			duration: 3000,
		});
	});

	const createTaskForm = form(() => {
		// always generate a new ID before creating a task, ensure no conflicts
		createTaskForm.setFieldValue("id", generateID());
		tasksCollection.insert([createTaskForm.state.values]);
		showToast({
			title: `Task created: ${createTaskForm.state.values.name}`,
			variant: "success",
			duration: 3000,
		});
	});

	return {
		shown,
		forms: { edit: editForm, creation: createTaskForm },
		closeProperties() {
			setShown("none");
		},
		viewTask(taskId: string) {
			const task = tasksCollection.get(taskId.toString());
			if (!task) throw new Error("taskId is invalid");
			batch(() => {
				editForm.reset(task);
				setShown("editing");
			});
		},
		newTaskAt(timeframe: TimescaleInstance) {
			batch(() => {
				createTaskForm.setFieldValue(
					"timescale",
					timescaleTypeOf(timeframe.timescale),
				);
				createTaskForm.setFieldMeta("timescale", (prev) => ({
					...prev,
					isTouched: true,
					isDirty: true,
				}));
				createTaskForm.setFieldValue(
					"timeframe_start",
					timeframe.start.toInstant().epochMilliseconds,
				);
				createTaskForm.setFieldMeta("timeframe_start", (prev) => ({
					...prev,
					isTouched: true,
					isDirty: true,
				}));
				setShown("new_task");
			});
		},
		createChildTask() {
			const shownNow = untrack(() => shown());
			if (shownNow !== "editing") {
				return;
			}
			batch(() => {
				createTaskForm.setFieldValue("parent_id", editForm.getFieldValue("id"));
				setShown("new_task");
			});
		},
		resetNewTask() {
			createTaskForm.reset({
				...createTaskForm.state.values,
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
			tasksCollection.delete(editForm.state.values.id.toString());
			showToast({
				title: `Task deleted: ${editForm.state.values.name}`,
				variant: "success",
				duration: 3000,
			});
			editForm.reset();
			setShown("none");
		},
		moveTask(
			id: string,
			newTimeframeStart: Temporal.ZonedDateTime,
			newTimescale: TimescaleType,
		) {
			const val = tasksCollection.get(id.toString());
			if (!val) throw new Error(`unknown task: ${id}`);
			tasksCollection.update(id, (val) => {
				val.timeframe_start = newTimeframeStart.epochMilliseconds;
				val.timescale = newTimescale;
			});
		},
		toggleTaskStatus(id: string) {
			tasksCollection.update(id, (val) => {
				switch (val.status) {
					case StatusType.pending:
						val.status = StatusType.completed;
						break;
					case StatusType.completed:
						val.status = StatusType.pending;
						break;
					case StatusType.fixed:
						break;
				}
			});
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
				value.moveTask(
					dragData.taskId,
					dropData.timeframeStart(),
					timescaleTypeOf(dropData.timescale()),
				);
				if (value.forms.edit.state.values.id === dragData.taskId) {
					value.viewTask(dragData.taskId);
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
