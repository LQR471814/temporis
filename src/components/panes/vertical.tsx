import { Timeframe } from "~/components/timeframe";
import {
	day,
	daypart,
	decade,
	fiveyear,
	month,
	quarter,
	week,
	year,
} from "~/lib/timescales";
import { cn, now } from "~/lib/utils";

export function VerticalTimeframes(props: { class?: string }) {
	return (
		<div class={cn("flex flex-col gap-1 p-1 overflow-y-auto", props.class)}>
			<Timeframe timescale={decade} time={now()} />
			<Timeframe timescale={fiveyear} time={now()} />
			<Timeframe timescale={year} time={now()} />
			<Timeframe timescale={quarter} time={now()} />
			<Timeframe timescale={month} time={now()} />
			<Timeframe timescale={week} time={now()} />
			<Timeframe timescale={day} time={now()} />
			<Timeframe timescale={daypart} time={now()} />
		</div>
	);
}
