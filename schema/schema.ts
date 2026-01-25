import {
	type AnyPgColumn,
	integer,
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
	id: integer().primaryKey().generatedByDefaultAsIdentity(),
	name: varchar({ length: 256 }).notNull(),
	comments: varchar().notNull(),

	timescale: timescale_type().notNull(),
	timeframe_start: timestamp().notNull(),

	assigned_to: integer().references(() => executorTable.id),
	parent_id: integer()
		.notNull()
		.references((): AnyPgColumn => taskTable.id, {
			onUpdate: "cascade",
			onDelete: "cascade",
		}),
	blocked_by: integer().references((): AnyPgColumn => taskTable.id, {
		onUpdate: "cascade",
		onDelete: "set null",
	}),

	optimistic: real().notNull(),
	expected: real().notNull(),
	pessimistic: real().notNull(),
	implementation: implementation_type().notNull(),
});

export const executorTable = pgTable("executor", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	name: varchar().notNull(),
	comments: varchar().notNull(),
});

export const executorOccupied = pgTable("executor_occupied", {
	executor_id: integer()
		.notNull()
		.references(() => executorTable.id),
	start: timestamp().notNull(),
	end: timestamp().notNull(),
});
