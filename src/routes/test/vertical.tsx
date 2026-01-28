import { createFileRoute } from "@tanstack/solid-router";
import { VerticalTimeframes } from "~/components/panes/vertical";

export const Route = createFileRoute("/test/vertical")({
	component: RouteComponent,
});

function RouteComponent() {
	return <VerticalTimeframes />;
}
