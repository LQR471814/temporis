import { createFileRoute } from "@tanstack/solid-router";
import { HorizontalControlled } from "src/components/panes/horizontal-controlled";
import { TaskProperties } from "~/components/panes/task-properties";
import { VerticalTimeframes } from "~/components/panes/vertical";
import { ViewController } from "~/components/panes/view-controller";
import {
	Resizable,
	ResizableHandle,
	ResizablePanel,
} from "~/components/ui/resizable";
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
				<Resizable orientation="vertical" class="rounded-lg border h-full">
					<ResizablePanel initialSize={0}>
						<ViewController />
					</ResizablePanel>
					<Separator class="h-0" />
					<ResizablePanel initialSize={1}>
						<Resizable orientation="horizontal">
							<ResizablePanel initialSize={0.15} class="overflow-auto">
								<VerticalTimeframes />
							</ResizablePanel>
							<ResizableHandle withHandle />
							<ResizablePanel initialSize={0.85} class="overflow-auto">
								<Resizable orientation="vertical">
									<ResizablePanel initialSize={0.5} class="overflow-auto">
										<HorizontalControlled />
									</ResizablePanel>
									<ResizableHandle withHandle />
									<ResizablePanel initialSize={0.5} class="overflow-auto">
										<TaskProperties />
									</ResizablePanel>
								</Resizable>
							</ResizablePanel>
						</Resizable>
					</ResizablePanel>
				</Resizable>
			</CurrentTaskProvider>
		</ViewProvider>
	);
}
