import { createFileRoute } from "@tanstack/solid-router";
import { HorizontalControlled } from "src/components/panes/horizontal-controlled";
import { ViewProvider } from "~/context/view";

export const Route = createFileRoute("/test/horizontal")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<ViewProvider>
			<HorizontalControlled />
		</ViewProvider>
	);
}
