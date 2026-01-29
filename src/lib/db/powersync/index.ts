/**
 * PowerSync + TanStack DB Integration
 *
 * This module provides offline-first data sync using PowerSync with TanStack DB.
 *
 * Setup:
 * 1. Install dependencies:
 *    npm install @powersync/web @tanstack/powersync-db-collection @journeyapps/wa-sqlite
 *
 * 2. Add VITE_POWERSYNC_URL to your environment (defaults to http://localhost:8081)
 *
 * 3. Initialize PowerSync after user authentication:
 *    ```ts
 *    import { initializePowerSync } from './lib/db/powersync';
 *
 *    // After Supabase auth
 *    await initializePowerSync();
 *    ```
 *
 * 4. Use collections in components:
 *    ```tsx
 *    import { taskCollection } from './lib/db/powersync';
 *    import { useLiveQuery, eq } from '@tanstack/solid-db';
 *
 *    function TaskList() {
 *      const tasks = useLiveQuery((q) =>
 *        q.from({ t: taskCollection })
 *         .where(({ t }) => eq(t.timescale, 'week'))
 *         .select()
 *      );
 *
 *      return <For each={tasks()}>{(task) => <div>{task.name}</div>}</For>;
 *    }
 *    ```
 *
 * 5. Mutations are automatically synced:
 *    ```ts
 *    // Insert
 *    taskCollection.insert({
 *      id: crypto.randomUUID(),
 *      name: 'New Task',
 *      // ... other fields
 *    });
 *
 *    // Update
 *    taskCollection.update({
 *      id: existingTaskId,
 *      name: 'Updated Name',
 *    });
 *
 *    // Delete
 *    taskCollection.delete({ id: taskId });
 *    ```
 */

// Database setup
export {
	getPowerSyncDatabase,
	initializePowerSync,
	disconnectPowerSync,
} from "./database";

// Schema
export { AppSchema } from "./schema";
export type {
	AppDatabase,
	TaskRecord,
	ExecutorRecord,
	ExecutorOccupiedRecord,
} from "./schema";

// Collections
export {
	taskCollection,
	executorCollection,
	executorOccupiedCollection,
} from "./collections";
