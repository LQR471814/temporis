import { createCollection } from "@tanstack/solid-db";
import { trailBaseCollectionOptions } from "@tanstack/trailbase-db-collection";
import { executors } from "../query";
import { publicExecutorRowSchema } from "../supabase";
import { trailBaseClient } from "../trailbase";
import { tableQueryCollection } from "./utils";

export const tasksCollection = createCollection(
	trailBaseCollectionOptions({
		id: "task",
		recordApi: trailBaseClient.records("task"),
		getKey: (item) => item.id,
	}),
);
tasksCollection.createIndex((row) => row.parent_id);

export const executorsCollection = tableQueryCollection(
	executors,
	(i) => i.id,
	publicExecutorRowSchema,
);
