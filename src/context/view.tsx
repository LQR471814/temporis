import {
	createContext,
	createEffect,
	createMemo,
	type ParentComponent,
	useContext,
} from "solid-js";
import { createStore } from "solid-js/store";
import {
	day,
	daypart,
	fiveyear,
	month,
	quarter,
	tenyear,
	week,
	year,
	type TimescaleInstance,
} from "src/lib/timescales";
import { ScrollerContext } from "./scroller";

export function useViewTimeInstant() {
	const ctx = useContext(ViewContext);
	return createMemo(
		() => ctx?.state.viewTime ?? Temporal.Now.zonedDateTimeISO(),
	);
}

function viewValue() {
	const scrollerCtx = useContext(ScrollerContext);
	if (!scrollerCtx) throw new Error("ViewContext is not under ScrollerContext");

	const [state, setState] = createStore({
		viewTime: Temporal.Now.zonedDateTimeISO(),
		percentile: 90,
	});

	let lastUpdateTime = Temporal.Now.zonedDateTimeISO();
	createEffect(() => {
		const id = setInterval(() => {
			const duration = Temporal.Now.zonedDateTimeISO().since(lastUpdateTime);
			scrollerCtx.persistScroll(() => {
				setState((prev) => ({
					...prev,
					viewTime: prev.viewTime.add(duration),
				}));
			});
			lastUpdateTime = Temporal.Now.zonedDateTimeISO();
		}, 60 * 1000);
		return () => clearInterval(id);
	});

	return {
		state,
		setViewPortion(instance: TimescaleInstance) {
			setState((prev) => {
				const prevTime = prev.viewTime;
				let nextTime: Temporal.ZonedDateTime;
				switch (instance.timescale) {
					case tenyear: {
						const block = Math.floor(instance.start.year / 10);
						const offset = prevTime.year % 10;
						nextTime = prevTime.with({ year: block + offset });
						break;
					}
					case fiveyear: {
						const block = Math.floor(instance.start.year / 5);
						const offset = prevTime.year % 5;
						nextTime = prevTime.with({ year: block + offset });
						break;
					}
					case year:
						nextTime = prevTime.with({ year: instance.start.year });
						break;
					case quarter: {
						const quarter = Math.floor(instance.start.month / 3);
						const offset = prevTime.month % 3;
						nextTime = prevTime.with({ month: 1 }).add({
							months: quarter * 3 + offset,
						});
						break;
					}
					case month:
						nextTime = prevTime.with({ month: 1 }).add({
							months: instance.start.month - 1,
						});
						break;
					case week:
						nextTime = prevTime.with({ month: 1, day: 1 }).add({
							weeks: instance.start.weekOfYear! - 1,
						});
						break;
					case day:
						nextTime = prevTime.with({ month: 1, day: 1 }).add({
							days: instance.start.dayOfYear - 1,
						});
						break;
					case daypart:
						nextTime = prevTime.with({ hour: 0, minute: 0 }).add({
							hours: instance.start.hour,
						});
						break;
					default:
						throw new Error("unknown timescale");
				}
				if (nextTime.equals(prevTime)) {
					return prev;
				}
				lastUpdateTime = nextTime;
				return { ...prev, viewTime: nextTime };
			});
		},
		setPercentile(percentile: number) {
			setState((prev) => ({ ...prev, percentile }));
		},
		reset() {
			setState((prev) => ({
				...prev,
				viewTime: Temporal.Now.zonedDateTimeISO(),
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
