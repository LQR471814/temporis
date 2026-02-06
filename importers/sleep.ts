import "temporal-polyfill/global";

import sqlite3 from "better-sqlite3";
import { and, eq, gte, type InferInsertModel, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { ROOT_ID } from "src/lib/constants";
import { childInstancesOf, day, year } from "../src/lib/timescales";
import { taskTable } from "./schema";

const sql = sqlite3(process.env.DB_URL ?? "./traildepot/data/main.db");
const db = drizzle({ client: sql });

async function main() {
	// add sleep tasks for this year
	const now = Temporal.Now.zonedDateTimeISO();

	const thisYear = year.instance(now);

	await db
		.delete(taskTable)
		.where(
			and(
				eq(taskTable.name, "Sleep (year)"),
				eq(taskTable.timeframe_start, thisYear.start.epochMilliseconds),
			),
		);
	const yearTaskId = crypto.randomUUID();
	await db.insert(taskTable).values([
		{
			id: yearTaskId,
			name: "Sleep (year)",
			comments: "",
			optimistic: 1,
			expected: 1,
			pessimistic: 1,
			implementation: "children",
			parent_id: ROOT_ID,
			assigned_to: null,
			timeframe_start: thisYear.start.epochMilliseconds,
			timescale: "year",
		},
	]);

	// days
	await db
		.delete(taskTable)
		.where(
			and(
				eq(taskTable.name, "Sleep"),
				gte(taskTable.timeframe_start, thisYear.start.epochMilliseconds),
				lt(taskTable.timeframe_start, thisYear.start.epochMilliseconds),
			),
		);
	const values: InferInsertModel<typeof taskTable>[] = [];
	for (const child of childInstancesOf(year, day, now)) {
		values.push({
			id: crypto.randomUUID(),
			name: "Sleep",
			parent_id: yearTaskId,
			assigned_to: null,
			timeframe_start: child.epochMilliseconds,
			timescale: "day",
			optimistic: 9,
			expected: 9,
			pessimistic: 9,
			implementation: "hours",
			comments: "",
		});
	}
	await db.insert(taskTable).values(values);
}

main()
	.then(() => {
		console.log("Added sleep data.");
		process.exit(0);
	})
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
