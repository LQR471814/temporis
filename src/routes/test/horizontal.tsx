import { createFileRoute } from "@tanstack/solid-router";
import * as HorizontalTimeframes  from "~/components/horizontal";

export const Route = createFileRoute("/test/horizontal")({
	component: RouteComponent,
});

function RouteComponent() {
	return <HorizontalTimeframes.Control />;
}
