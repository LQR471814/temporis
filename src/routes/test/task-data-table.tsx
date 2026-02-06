import {
	type Collection,
	createCollection,
	eq,
	liveQueryCollectionOptions,
	useLiveQuery,
} from "@tanstack/solid-db";
import { createFileRoute } from "@tanstack/solid-router";
import type { ColumnDef } from "@tanstack/solid-table";
import { createEffect, Show } from "solid-js";
import { debug } from "src/components/debug";
import { DataTable } from "~/components/ui/data-table";
import { executorCollection, tasksCollection } from "~/lib/collections/tables";

const joinedTasks = createCollection(
	liveQueryCollectionOptions({
		id: "tasks_data_table",
		query: (q) =>
			q
				.from({ task: tasksCollection })
				.leftJoin({ executor: executorCollection }, ({ task, executor }) =>
					eq(task.assigned_to, executor.id),
				)
				.innerJoin({ parent: tasksCollection }, ({ task, parent }) =>
					eq(task.parent_id, parent.id),
				)
				.select(({ task, executor, parent }) => ({
					name: task.name,
					comments: task.comments,
					assigned: executor?.name ?? "-",
					parent: parent.name,
				})),
	}),
);

type JoinedTask = typeof joinedTasks extends Collection<infer U> ? U : never;

const columns: ColumnDef<JoinedTask>[] = [
	{
		accessorKey: "name",
		header: "Name",
	},
	{
		accessorKey: "comments",
		header: "Comments",
	},
	{
		accessorKey: "assigned",
		header: "Assigned",
	},
	{
		accessorKey: "parent",
		header: "Parent",
	},
];

export const Route = createFileRoute("/test/task-data-table")({
	component: debug(RouteComponent),
});

function RouteComponent() {
	const query = useLiveQuery((q) =>
		q
			.from({ joinedTasks })
			.orderBy(({ joinedTasks }) => joinedTasks.name)
			.limit(50),
	);
	createEffect(() => {
		console.log(query());
	});
	return (
		<Show when={!query.isLoading} fallback={<div>Loading...</div>}>
			<DataTable columns={columns} data={query()} />
		</Show>
	);
}
