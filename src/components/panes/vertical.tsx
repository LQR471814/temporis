import { Timeframe } from "src/components/timeframe";
import { TaskChipContext } from "src/context/task-chip";
import { useViewTimeInstant } from "src/context/view";
import {
	day,
	daypart,
	fiveyear,
	month,
	quarter,
	tenyear,
	week,
	year,
} from "src/lib/timescales";
import { cn, useBottomScrollRef } from "src/lib/utils";

export function VerticalTimeframes(props: { class?: string }) {
	const viewInstant = useViewTimeInstant();
	const scrollRef = useBottomScrollRef();
	return (
		<TaskChipContext.Provider value={{ namespace: "vertical" }}>
			<div
				class={cn("flex flex-col gap-1 p-1 overflow-y-auto", props.class)}
				ref={scrollRef}
			>
				<Timeframe timescale={tenyear} time={viewInstant()} />
				<Timeframe timescale={fiveyear} time={viewInstant()} />
				<Timeframe timescale={year} time={viewInstant()} />
				<Timeframe timescale={quarter} time={viewInstant()} />
				<Timeframe timescale={month} time={viewInstant()} />
				<Timeframe timescale={week} time={viewInstant()} />
				<Timeframe timescale={day} time={viewInstant()} />
				<Timeframe timescale={daypart} time={viewInstant()} />
			</div>
		</TaskChipContext.Provider>
	);
}
