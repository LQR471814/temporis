import {
	createContext,
	createMemo,
	type ParentComponent,
	useContext,
} from "solid-js";
import { createStore } from "solid-js/store";
import { durationOf, type Timescale, week } from "~/lib/timescales";
import { now } from "~/lib/utils";

export function useCurrentTime() {
	const ctx = useContext(ViewContext);
	return createMemo(() => now().add(ctx?.state.offset ?? { seconds: 0 }));
}

function viewValue() {
	const [state, setState] = createStore({
		offset: Temporal.Duration.from({ seconds: 0 }),
		timescale: week,
		percentile: 95,
	});
	const timescaleDuration = createMemo(() => durationOf(state.timescale));
	return {
		state,
		timescaleDuration,
		setPercentile(percentile: number) {
			setState((prev) => ({ ...prev, percentile }));
		},
		setTimescale(timescale: Timescale) {
			setState((prev) => ({ ...prev, timescale }));
		},
		forward() {
			setState((prev) => ({
				...prev,
				offset: prev.offset.add(durationOf(prev.timescale)),
			}));
		},
		backward() {
			setState((prev) => ({
				...prev,
				offset: prev.offset.subtract(durationOf(prev.timescale)),
			}));
		},
		reset() {
			setState((prev) => ({
				offset: Temporal.Duration.from({ seconds: 0 }),
				timescale: prev.timescale,
			}));
		},
	};
}

export type ViewContextValue = ReturnType<typeof viewValue>;

export const ViewContext = createContext<ViewContextValue>();

export const ViewProvider: ParentComponent = (props) => {
	const value = viewValue();
	return (
		<ViewContext.Provider value={value}>{props.children}</ViewContext.Provider>
	);
};
