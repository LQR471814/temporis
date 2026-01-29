/**
 * PowerSync Collections for TanStack DB
 *
 * Creates TanStack DB collections backed by PowerSync's SQLite storage.
 * These collections provide:
 * - Reactive live queries that update automatically
 * - Optimistic updates with instant UI feedback
 * - Offline-first data access
 * - Automatic sync with the backend via PowerSync
 */

import { createCollection } from "@tanstack/solid-db";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { getPowerSyncDatabase } from "./database";
import { AppSchema } from "./schema";

/**
 * Get the PowerSync database instance
 * Note: Must be called after the database is initialized
 */
const getDb = () => getPowerSyncDatabase();

/**
 * Task collection - hierarchical task management
 *
 * Fields:
 * - id: UUID primary key
 * - name: Task name
 * - comments: Additional notes
 * - timescale: Time scale enum (all_time, five_year, year, quarter, month, week, day, daypart)
 * - timeframe_start: When the task timeframe begins
 * - assigned_to: UUID of assigned executor (nullable)
 * - parent_id: UUID of parent task (self-referential)
 * - optimistic/expected/pessimistic: Time estimates
 * - implementation: How task is implemented (children, hours)
 */
export const taskCollection = createCollection(
	powerSyncCollectionOptions({
		database: getDb(),
		table: AppSchema.tables.task,
	}),
);

/**
 * Executor collection - people/resources that execute tasks
 *
 * Fields:
 * - id: UUID primary key
 * - name: Executor name
 * - comments: Additional notes
 */
export const executorCollection = createCollection(
	powerSyncCollectionOptions({
		database: getDb(),
		table: AppSchema.tables.executor,
	}),
);

/**
 * Executor occupied collection - time slots when executors are busy
 *
 * Fields:
 * - executor_id: UUID of the executor
 * - start: Start timestamp
 * - end: End timestamp
 */
export const executorOccupiedCollection = createCollection(
	powerSyncCollectionOptions({
		database: getDb(),
		table: AppSchema.tables.executor_occupied,
	}),
);

// Re-export types for convenience
export type {
	TaskRecord,
	ExecutorRecord,
	ExecutorOccupiedRecord,
} from "./schema";
