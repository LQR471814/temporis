import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { taskTable } from "./schema";

const sql = postgres(
	process.env.DB_URL ??
	"postgresql://postgres:postgres@127.0.0.1:54322/postgres",
);
const db = drizzle({ client: sql });

async function main() {
	await db.insert(taskTable).values([
		{
			name: "Root",
			comments: "The root task which all tasks originate from.",
			parent_id: 1,
			assigned_to: null,
			// the epoch
			timeframe_start: new Date(0),
			timescale: "all_time",
			optimistic: 1,
			expected: 1,
			pessimistic: 1,
			implementation: "children",
		},
	]);
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
