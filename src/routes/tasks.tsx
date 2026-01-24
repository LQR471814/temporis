import { createFileRoute, Link } from "@tanstack/solid-router";
import type { ColumnDef } from "@tanstack/solid-table"
import type { PublicTaskRow } from "~/lib/supabase";

export const columns: ColumnDef<PublicTaskRow>[] = [
	{
		accessorKey: "status",
		header: "Status"
	},
	{
		accessorKey: "name",
		header: "Name"
	},
	{
		accessorKey: "comments",
		header: "Comments",
	},
	{
		accessorKey: "assigned_to",
		header: "Assigned"
	},
]

export const Route = createFileRoute("/tasks")({
	component: Tasks,
});

function Tasks() {
	return (
	);
}
