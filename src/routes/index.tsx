import { createFileRoute } from "@tanstack/solid-router";
import { createEffect, createSignal } from "solid-js";
import { Timeframe } from "~/components/timeframe";
import {
	day,
	daypart,
	decade,
	fiveyear,
	month,
	quarter,
	semester,
	week,
	year,
} from "~/lib/timescales";

export const Route = createFileRoute("/")({
	component: Home,
});

function Home() {
	const [now, setNow] = createSignal(Temporal.Now.zonedDateTimeISO());
	createEffect(() => {
		const interval = setInterval(() => {
			setNow(Temporal.Now.zonedDateTimeISO());
		}, 10000);
		return () => {
			clearInterval(interval);
		};
	});

	return (
		<div class="flex flex-col gap-3 p-4">
			<Timeframe timescale={decade} time={now()} />
			<Timeframe timescale={fiveyear} time={now()} />
			<Timeframe timescale={year} time={now()} />
			<Timeframe timescale={semester} time={now()} />
			<Timeframe timescale={quarter} time={now()} />
			<Timeframe timescale={month} time={now()} />
			<Timeframe timescale={week} time={now()} />
			<Timeframe timescale={day} time={now()} />
			<Timeframe timescale={daypart} time={now()} />
		</div>
	);
}
