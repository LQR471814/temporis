import {
	type Collection,
	createCollection,
	liveQueryCollectionOptions,
} from "@tanstack/solid-db";
import { createForm } from "@tanstack/solid-form";
import {
	batch,
	createContext,
	createSignal,
	type ParentComponent,
} from "solid-js";
import { showToast } from "src/components/ui/toast";
import { tasksCollection } from "src/lib/db";
import { ROOT_ID } from "~/lib/constants";
import { type TimescaleInstance, timescaleTypeOf } from "~/lib/timescales";

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

	function form() {
		return createForm(() => ({
			defaultValues: {
				name: "",
				comments: "",
				implementation: "hours",
				optimistic: 0.5,
				expected: 1,
				pessimistic: 1.5,
				timeframe_start: Temporal.Now.instant().toString(),
				timescale: "week",
				parent_id: ROOT_ID,
				assigned_to: null,
			} as TaskFields,
			onSubmit: ({ value }) => {
				if (selectedTaskId() !== undefined) {
					console.log("update", value);
				} else {
					console.log("create", value);
				}
			},
		}));
	}
	const edit = form();
	const creation = form();

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
					timeframe.start.toInstant().toString(),
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
			creation.reset();
		},
		createTask() {
			tasksCollection.insert([
				{
					...creation.state.values,
					timeframe_start: creation.state.values.timeframe_start.toString(),
				},
			]);
			showToast({
				title: `Task created: ${creation.state.values.name}`,
				variant: "success",
				duration: 3000,
			});
		},
		saveTask() {},
	};
}

export type CurrentTaskValue = ReturnType<typeof currentTaskValue>;

export const CurrentTaskContext = createContext<CurrentTaskValue>();

export const CurrentTaskProvider: ParentComponent = (props) => {
	const value = currentTaskValue();
	return (
		<CurrentTaskContext.Provider value={value}>
			{props.children}
		</CurrentTaskContext.Provider>
	);
};
