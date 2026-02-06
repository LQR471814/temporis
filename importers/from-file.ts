import "temporal-polyfill/global";

import { readFile } from "node:fs/promises";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { Tables } from "src/lib/supabase/types.gen";
import { taskTable } from "./schema";

const client = postgres(
	process.env.DB_URL ??
		"postgresql://postgres:postgres@127.0.0.1:54322/postgres",
);
const db = drizzle({ client: client });

async function main() {
	const rows = JSON.parse(await readFile("tasks.json", "utf8"));
	await db
		.delete(taskTable)
		.where(eq(taskTable.comments, "=== replace-with-imported ==="));
	await db
		.insert(taskTable)
		.values(
			rows.map((r: Tables<"task">) => {
				if (!r.id) {
					r.id = crypto.randomUUID();
				}
				return r;
			}),
		)
		.onConflictDoUpdate({
			target: taskTable.id,
			set: {
				assigned_to: sql`excluded.assigned_to`,
				comments: sql`excluded.comments`,
				implementation: sql`excluded.implementation`,
				name: sql`excluded.name`,
				optimistic: sql`excluded.optimistic`,
				expected: sql`excluded.expected`,
				pessimistic: sql`excluded.pessimistic`,
				parent_id: sql`excluded.parent_id`,
				timeframe_start: sql`excluded.timeframe_start`,
				timescale: sql`excluded.timescale`,
			},
		});
}

main()
	.then(() => {
		console.log("Successfully inserted rows.");
		process.exit(0);
	})
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
