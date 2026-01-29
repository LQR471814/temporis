/**
 * PowerSync SQLite Schema
 *
 * This defines the local SQLite schema that PowerSync uses for offline storage.
 * It mirrors the Postgres schema defined in schema/schema.ts
 */

import { Schema, Table, column } from "@powersync/web";

/**
 * PowerSync schema for the task table
 * Maps to the Postgres `task` table
 */
const taskTable = new Table({
	// Text fields
	name: column.text,
	comments: column.text,

	// Enum fields stored as text
	timescale: column.text, // timescale_type enum
	implementation: column.text, // implementation_type enum

	// Timestamp stored as ISO string
	timeframe_start: column.text,

	// Foreign keys (UUIDs stored as text)
	assigned_to: column.text, // nullable, references executor.id
	parent_id: column.text, // references task.id (self-referential)

	// Numeric estimation fields
	optimistic: column.real,
	expected: column.real,
	pessimistic: column.real,
});

/**
 * PowerSync schema for the executor table
 * Maps to the Postgres `executor` table
 */
const executorTable = new Table({
	name: column.text,
	comments: column.text,
});

/**
 * PowerSync schema for the executor_occupied table
 * Maps to the Postgres `executor_occupied` table
 */
const executorOccupiedTable = new Table({
	executor_id: column.text, // references executor.id
	start: column.text, // timestamp as ISO string
	end: column.text, // timestamp as ISO string
});

/**
 * Complete PowerSync schema for the application
 */
export const AppSchema = new Schema({
	task: taskTable,
	executor: executorTable,
	executor_occupied: executorOccupiedTable,
});

export type AppDatabase = (typeof AppSchema)["types"];
export type TaskRecord = AppDatabase["task"];
export type ExecutorRecord = AppDatabase["executor"];
export type ExecutorOccupiedRecord = AppDatabase["executor_occupied"];
