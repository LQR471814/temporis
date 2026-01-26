export interface Timescale {
	name: string;
	instance(now: Temporal.ZonedDateTime): TimescaleInstance;
}

export interface TimescaleInstance {
	name: string;
	start: Temporal.ZonedDateTime;
	end: Temporal.ZonedDateTime;
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
		};
	}
}

export class Semester implements Timescale {
	name = "Semester";

	private getSemester(now: Temporal.ZonedDateTime) {
		return Math.ceil(now.month / 6);
	}

	instance(now: Temporal.ZonedDateTime): TimescaleInstance {
		const semester = this.getSemester(now);
		const start = Temporal.ZonedDateTime.from({
			year: now.year,
			month: 1 + (semester - 1) * 6,
			day: 1,
			timeZone: now.timeZoneId,
		});
		const end = start.add({ months: 6 });
		return {
			name: `H${semester}`,
			start,
			end,
		};
	}
}

export class Quarter implements Timescale {
	name = "Quarter";

	private getQuarter(now: Temporal.ZonedDateTime) {
		return Math.ceil(now.month / 3);
	}

	instance(now: Temporal.ZonedDateTime): TimescaleInstance {
		const quarter = this.getQuarter(now);
		const start = Temporal.ZonedDateTime.from({
			year: now.year,
			month: 1 + (quarter - 1) * 3,
			day: 1,
			timeZone: now.timeZoneId,
		});
		const end = start.add({ months: 3 });
		return {
			name: `Q${quarter}`,
			start,
			end,
		};
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
export const semester = new Semester();
export const quarter = new Quarter();
export const month = new Month();
export const week = new Week();
export const day = new Day();
export const daypart = new Daypart();
