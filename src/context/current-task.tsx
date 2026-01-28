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
import { tasksCollection } from "src/lib/db";
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
		number | undefined
	>();

	function form() {
		return createForm(() => ({
			defaultValues: {
				id: -1,
				name: "",
				comments: "",
				implementation: "hours",
				status: "pending",
				optimistic: 0,
				expected: 0,
				pessimistic: 0,
				timeframe_start: Temporal.Now.zonedDateTimeISO(),
				timescale: "week",
				parent_id: -1,
				assigned_to: null,
				blocked_by: null,
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
		selectTask(taskId: number) {
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
				creation.setFieldValue("timeframe_start", timeframe.start);
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
