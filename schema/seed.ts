import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ROOT_ID } from "../src/lib/constants";
import { taskTable } from "./schema";

const sql = postgres(
	process.env.DB_URL ??
		"postgresql://postgres:postgres@127.0.0.1:54322/postgres",
);
const db = drizzle({ client: sql });

async function main() {
	await db
		.insert(taskTable)
		.values([
			{
				id: ROOT_ID,
				name: "Root",
				comments: "The root task which all tasks originate from.",
				parent_id: ROOT_ID,
				assigned_to: null,
				// the epoch
				timeframe_start: new Date(0),
				timescale: "all_time",
				optimistic: 100,
				expected: 100,
				pessimistic: 100,
				implementation: "children",
			},
		])
		.onConflictDoNothing();
}

main()
	.then(() => {
		console.log("Data seeded.");
		process.exit(0);
	})
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
