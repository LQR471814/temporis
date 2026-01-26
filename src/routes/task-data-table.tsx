import {
	type Collection,
	createCollection,
	eq,
	liveQueryCollectionOptions,
	useLiveQuery,
} from "@tanstack/solid-db";
import { createFileRoute } from "@tanstack/solid-router";
import type { ColumnDef } from "@tanstack/solid-table";
import { Show } from "solid-js";
import { DataTable } from "~/components/ui/data-table";
import { executorsCollection, tasksCollection } from "~/lib/db/tables";

const joinedTasks = createCollection(
	liveQueryCollectionOptions({
		id: "tasks_data_table",
		query: (q) =>
			q
				.from({ task: tasksCollection })
				.leftJoin({ executor: executorsCollection }, ({ task, executor }) =>
					eq(task.assigned_to, executor.id),
				)
				.leftJoin({ blocker: tasksCollection }, ({ task, blocker }) =>
					eq(task.blocked_by, blocker.id),
				)
				.innerJoin({ parent: tasksCollection }, ({ task, parent }) =>
					eq(task.parent_id, parent.id),
				)
				.select(({ task, executor, blocker, parent }) => ({
					name: task.name,
					comments: task.comments,
					status: task.status,
					assigned: executor?.name ?? "-",
					blocker: blocker?.name ?? "-",
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
		accessorKey: "status",
		header: "Status",
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
		accessorKey: "blocker",
		header: "Blocked By",
	},
	{
		accessorKey: "parent",
		header: "Parent",
	},
];

export const Route = createFileRoute("/task-data-table")({
	component: RouteComponent,
});

function RouteComponent() {
	const query = useLiveQuery((q) =>
		q
			.from({ joinedTasks })
			.orderBy(({ joinedTasks }) => joinedTasks.name)
			.limit(50),
	)
	return (
		<Show when={!query.isLoading} fallback={<div>Loading...</div>}>
			<DataTable columns={columns} data={query()} />
		</Show>
	)
}
