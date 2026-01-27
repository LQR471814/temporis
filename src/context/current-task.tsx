import { createContext, type ParentComponent } from "solid-js";
import { createStore } from "solid-js/store";
import type { TimescaleInstance } from "~/lib/timescales";

function currentTaskValue() {
	const [state, setState] = createStore<{
		selectedTaskId?: number;
		newChildTimeframe?: TimescaleInstance;
	}>({});
	return {
		state,
		selectTask(taskId: number) {
			setState({ selectedTaskId: taskId });
		},
		newChild(timeframe: TimescaleInstance) {
			setState({ newChildTimeframe: timeframe });
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
