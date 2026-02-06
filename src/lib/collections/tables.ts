import { createCollection } from "@tanstack/solid-db";
import { trailBaseCollectionOptions } from "@tanstack/trailbase-db-collection";
import { type executor, type task, trailBaseClient } from "../trailbase";

export const tasksCollection = createCollection(
	trailBaseCollectionOptions<typeof task.schema.infer>({
		id: "task",
		recordApi: trailBaseClient.records("task"),
		getKey: (item) => item.id.toString(),
		parse: {},
		serialize: {},
	}),
);
tasksCollection.createIndex((row) => row.parent_id);

export const executorCollection = createCollection(
	trailBaseCollectionOptions<typeof executor.schema.infer>({
		id: "executor",
		recordApi: trailBaseClient.records("executor"),
		getKey: (item) => item.id.toString(),
		parse: {},
		serialize: {},
	}),
);
