import { createFileRoute } from "@tanstack/solid-router";
import { HorizontalControlled } from "src/components/panes/horizontal-controlled";
import { Properties } from "src/components/panes/properties";
import { ViewController } from "src/components/panes/view-controller";
import { Separator } from "src/components/ui/separator";
import { CurrentTaskProvider } from "src/context/current-task";
import { ViewProvider } from "src/context/view";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<ViewProvider>
			<CurrentTaskProvider>
				<HorizontalControlled />
				<Properties class="fixed z-40 top-3 left-3" />
				<ViewController class="fixed z-40 top-3 right-3" />
				<div class="fixed top-0 left-0 z-40">
					<Separator />
					<div class="grid grid-cols-[300px,min-content,1fr]">
						<Separator orientation="vertical" />
					</div>
				</div>
			</CurrentTaskProvider>
		</ViewProvider>
	);
}
