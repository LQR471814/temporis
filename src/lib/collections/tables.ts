import { createCollection } from "@tanstack/solid-db";
import { trailBaseCollectionOptions } from "@tanstack/trailbase-db-collection";
import { z } from "zod";
import { executors } from "../query";
import { publicExecutorRowSchema } from "../supabase";
import { trailBaseClient } from "../trailbase";
import { tableQueryCollection } from "./utils";

const key = z.string();

export const tasksCollection = createCollection(
	trailBaseCollectionOptions({
		id: "task",
		recordApi: trailBaseClient.records("task"),
		getKey: (item) => key.parse(item.id),
		parse: {},
		serialize: {
			id: (val) => (!val ? crypto.randomUUID() : val),
		},
	}),
);
tasksCollection.createIndex((row) => row.parent_id);

export const executorsCollection = tableQueryCollection(
	executors,
	(i) => i.id,
	publicExecutorRowSchema,
);
