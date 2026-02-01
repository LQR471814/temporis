import { type ClassValue, clsx } from "clsx";
import { createEffect, createRoot, createSignal } from "solid-js";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const [now, setNow] = createSignal(Temporal.Now.zonedDateTimeISO());
createRoot(() => {
	createEffect(() => {
		const interval = setInterval(
			() => {
				setNow(Temporal.Now.zonedDateTimeISO());
			},
			60 * 1000 * 1000,
		);
		return () => {
			clearInterval(interval);
		};
	});
});
export { now };

export function currentTz() {
	return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function asInstant(dt: string | Date) {
	if (dt instanceof Date) {
		return Temporal.Instant.from(dt.toISOString());
	}
	if (dt.endsWith("Z")) {
		return Temporal.Instant.from(dt);
	}
	return Temporal.Instant.from(`${dt}Z`);
}

export function asUTCDate(dt: string | Date) {
	if (dt instanceof Date) {
		return dt;
	}
	if (dt.endsWith("Z")) {
		return new Date(dt);
	}
	return new Date(`${dt}Z`);
}
