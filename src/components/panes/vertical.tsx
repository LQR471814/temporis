import { useCurrentTime } from "src/context/view";
import { Timeframe } from "~/components/timeframe";
import { TaskChipContext } from "~/context/task-chip";
import {
	day,
	daypart,
	fiveyear,
	month,
	quarter,
	tenyear,
	week,
	year,
} from "~/lib/timescales";
import { cn } from "~/lib/utils";

export function VerticalTimeframes(props: { class?: string }) {
	const currentTime = useCurrentTime();
	return (
		<TaskChipContext.Provider value={{ namespace: "vertical" }}>
			<div class={cn("flex flex-col gap-1 p-1 overflow-y-auto", props.class)}>
				<Timeframe timescale={tenyear} time={currentTime()} />
				<Timeframe timescale={fiveyear} time={currentTime()} />
				<Timeframe timescale={year} time={currentTime()} />
				<Timeframe timescale={quarter} time={currentTime()} />
				<Timeframe timescale={month} time={currentTime()} />
				<Timeframe timescale={week} time={currentTime()} />
				<Timeframe timescale={day} time={currentTime()} />
				<Timeframe timescale={daypart} time={currentTime()} />
			</div>
		</TaskChipContext.Provider>
	);
}
