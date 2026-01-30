import { createFileRoute } from "@tanstack/solid-router";
import { HorizontalControlled } from "src/components/panes/horizontal-controlled";
import { Properties } from "src/components/panes/properties";
import { VerticalTimeframes } from "~/components/panes/vertical";
import { ViewController } from "~/components/panes/view-controller";
import { Separator } from "~/components/ui/separator";
import { CurrentTaskProvider } from "~/context/current-task";
import { ViewProvider } from "~/context/view";

export const Route = createFileRoute("/test/resizable")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<ViewProvider>
			<CurrentTaskProvider>
				<div class="grid grid-rows-[min-content,min-content,minmax(0,1fr)] rounded-lg border h-full">
					<ViewController />
					<Separator />
					<div class="flex flex-1">
						<div class="min-w-[200px] overflow-y-auto">
							<VerticalTimeframes />
						</div>
						<Separator orientation="vertical" />
						<div class="flex flex-col flex-1">
							<HorizontalControlled />
							<Separator />
							<Properties />
						</div>
					</div>
				</div>
			</CurrentTaskProvider>
		</ViewProvider>
	);
}
