import {
	type AnyPgColumn,
	bigint,
	pgEnum,
	pgTable,
	real,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

export const timescale_type = pgEnum("timescale_type", [
	"all_time",
	"five_year",
	"year",
	"quarter",
	"month",
	"week",
	"day",
	"daypart",
]);

export const implementation_type = pgEnum("implementation_type", [
	"children",
	"hours",
]);

export const taskTable = pgTable("task", {
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
	name: varchar({ length: 256 }).notNull(),
	comments: varchar().notNull(),

	timescale: timescale_type().notNull(),
	timeframe_start: timestamp().notNull(),

	assigned_to: bigint({ mode: "number" }).references(() => executorTable.id),
	parent_id: bigint({ mode: "number" })
		.notNull()
		.references((): AnyPgColumn => taskTable.id, {
			onUpdate: "cascade",
			onDelete: "cascade",
		}),

	optimistic: real().notNull(),
	expected: real().notNull(),
	pessimistic: real().notNull(),
	implementation: implementation_type().notNull(),
});

export const executorTable = pgTable("executor", {
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	name: varchar().notNull(),
	comments: varchar().notNull(),
});

export const executorOccupied = pgTable("executor_occupied", {
	executor_id: bigint({ mode: "number" })
		.notNull()
		.references(() => executorTable.id),
	start: timestamp().notNull(),
	end: timestamp().notNull(),
});
