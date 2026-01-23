import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/solid-db";
import { queryClient, tasksQuery } from "../query";

export const tasksCollection = createCollection(
	queryCollectionOptions({
		...tasksQuery,
		getKey: (i) => i.id,
		queryClient,
	}),
);
