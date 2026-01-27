import type { Enums } from "./supabase/types.gen";
import { now } from "./utils";

export interface Timescale {
	name: string;
	instance(now: Temporal.ZonedDateTime): TimescaleInstance;
}

export interface TimescaleInstance {
	name: string;
	start: Temporal.ZonedDateTime;
	end: Temporal.ZonedDateTime;
	timescale: Timescale;
}

class SubCenturyMultiYear implements Timescale {
	name: string;
	private multiplier: number;

	constructor(multiplier: number) {
		this.multiplier = multiplier;
		this.name = `${multiplier} Year`;
	}

	private getMultiYearStart(now: Temporal.ZonedDateTime) {
		return Math.floor(now.year / this.multiplier) * this.multiplier;
	}

	instance(now: Temporal.ZonedDateTime): TimescaleInstance {
		const start = Temporal.ZonedDateTime.from({
			year: this.getMultiYearStart(now),
			month: 1,
			day: 1,
			timeZone: now.timeZoneId,
		});
		const end = start.add({ years: this.multiplier });
		return {
			name: `${start.year}—${end.year}`,
			start,
			end,
			timescale: this,
		};
	}
}

export class Decade extends SubCenturyMultiYear {
	constructor() {
		super(10);
	}
}

export class FiveYear extends SubCenturyMultiYear {
	constructor() {
		super(5);
	}
}

export class Year implements Timescale {
	name = "Year";

	instance(now: Temporal.ZonedDateTime): TimescaleInstance {
		const start = Temporal.ZonedDateTime.from({
			year: now.year,
			month: 1,
			day: 1,
			timeZone: now.timeZoneId,
		});
		const end = start.add({ years: 1 });
		return {
			name: `${now.year}`,
			start,
			end,
			timescale: this,
		};
	}
}

export class MultiMonth implements Timescale {
	private multiplier: number;
	name: string;
	symbol: string;

	constructor(multiplier: number, symbol: string) {
		this.multiplier = multiplier;
		this.name = `${this.multiplier} Months`;
		this.symbol = symbol;
	}

	private instanceNumber(now: Temporal.ZonedDateTime) {
		return Math.floor((now.month - 1) / this.multiplier);
	}

	instance(now: Temporal.ZonedDateTime): TimescaleInstance {
		const no = this.instanceNumber(now);
		const start = Temporal.ZonedDateTime.from({
			year: now.year,
			month: 1 + no * this.multiplier,
			day: 1,
			timeZone: now.timeZoneId,
		});
		const end = start.add({ months: this.multiplier });
		return {
			name: `${this.symbol}${no + 1}`,
			start,
			end,
			timescale: this,
		};
	}
}

export class Semester extends MultiMonth {
	name = "Semester";
	constructor() {
		super(6, "S");
	}
}

export class Quarter extends MultiMonth {
	name = "Quarter";
	constructor() {
		super(3, "Q");
	}
}

export class Month implements Timescale {
	name = "Month";

	instance(now: Temporal.ZonedDateTime): TimescaleInstance {
		const start = Temporal.ZonedDateTime.from({
			year: now.year,
			month: now.month,
			day: 1,
			timeZone: now.timeZoneId,
		});
		const end = start.add({ months: 1 });
		return {
			name: now.toLocaleString(undefined, { month: "long" }),
			start,
			end,
			timescale: this,
		};
	}
}

export class Week implements Timescale {
	name = "Week";

	instance(now: Temporal.ZonedDateTime): TimescaleInstance {
		if (now.weekOfYear === undefined)
			throw new Error("weeks unsupported in current calendar");
		const start = startOfDay(now.subtract({ days: now.dayOfWeek }));
		const end = start.add({ weeks: 1 });
		return {
			name: `W${start.weekOfYear}`,
			start,
			end,
			timescale: this,
		};
	}
}

export class Day implements Timescale {
	name = "Day";

	instance(now: Temporal.ZonedDateTime): TimescaleInstance {
		const start = startOfDay(now);
		const end = start.add({ days: 1 });
		return {
			name: `${start.day}`,
			start,
			end,
			timescale: this,
		};
	}
}

export class Daypart implements Timescale {
	name = "Daypart";

	private static partitions: {
		start: number;
		end: number;
		name: string;
	}[] = [
			{ start: 0, end: 5, name: "Night" },
			{ start: 5, end: 12, name: "Morning" },
			{ start: 12, end: 17, name: "Afternoon" },
			{ start: 17, end: 21, name: "Evening" },
			{ start: 21, end: 24, name: "Night" },
		];

	private getDaypart(now: Temporal.ZonedDateTime) {
		for (const p of Daypart.partitions) {
			if (now.hour >= p.start && now.hour < p.end) {
				return p;
			}
		}
		throw new Error("this should never happen!");
	}

	instance(now: Temporal.ZonedDateTime): TimescaleInstance {
		const dayPart = this.getDaypart(now);
		const start = Temporal.ZonedDateTime.from({
			year: now.year,
			month: now.month,
			day: now.day,
			hour: dayPart.start,
			timeZone: now.timeZoneId,
		});
		const end = start.with({ hour: dayPart.end });
		return {
			name: dayPart.name,
			start,
			end,
			timescale: this,
		};
	}
}

export enum DaypartValues {
	EARLY_MORNING = "Early Morning",
	MORNING = "Morning",
	LATE_MORNING = "Late Morning",
	AFTERNOON = "Afternoon",
	LATE_AFTERNOON = "Late Afternoon",
	EVENING = "Evening",
	LATE_EVENING = "Late Evening",
	NIGHT = "Night",
}

function startOfDay(now: Temporal.ZonedDateTime) {
	return now.with({
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 0,
		microsecond: 0,
		nanosecond: 0,
	});
}

export const decade = new Decade();
export const fiveyear = new FiveYear();
export const year = new Year();
export const quarter = new Quarter();
export const month = new Month();
export const week = new Week();
export const day = new Day();
export const daypart = new Daypart();

export function* childInstancesOf(
	parent: Timescale,
	child: Timescale,
	time: Temporal.ZonedDateTime,
) {
	const parentInstance = parent.instance(time);
	let cursor = parentInstance.start;

	while (Temporal.ZonedDateTime.compare(cursor, parentInstance.end) < 0) {
		yield cursor;
		const childInstance = child.instance(cursor);
		const childDuration = childInstance.end.since(childInstance.start);
		cursor = cursor.add(childDuration);
	}
}

export function durationOf(timescale: Timescale) {
	const instance = timescale.instance(now());
	return instance.end.since(instance.start);
}

export function timescaleTypeOf(timescale: Timescale): Enums<"timescale_type"> {
	switch (timescale) {
		case decade:
			break;
		case fiveyear:
			return "five_year";
		case year:
			return "year";
		case quarter:
			return "quarter";
		case month:
			return "month";
		case week:
			return "week";
		case day:
			return "day";
		case daypart:
			return "daypart";
	}
	throw new Error("unknown timescale!");
}

export const hierarchy = [
	decade,
	fiveyear,
	year,
	quarter,
	month,
	week,
	day,
	daypart,
];
