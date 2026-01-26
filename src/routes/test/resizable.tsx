import { createFileRoute } from "@tanstack/solid-router";
import { HorizontalTimeframes } from "~/components/horizontal";
import {
	Resizable,
	ResizableHandle,
	ResizablePanel,
} from "~/components/ui/resizable";
import { VerticalTimeframes } from "~/components/vertical";

export const Route = createFileRoute("/test/resizable")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<Resizable class="rounded-lg border">
			<ResizablePanel initialSize={0.15} class="overflow-hidden">
				<VerticalTimeframes />
			</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel initialSize={0.85} class="overflow-hidden">
				<Resizable orientation="vertical">
					<ResizablePanel initialSize={0.5} class="overflow-hidden">
						<HorizontalTimeframes class="h-full" />
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel initialSize={0.5} class="overflow-hidden">
						<div class="flex h-full items-center justify-center p-6">
							<span class="font-semibold">Properties</span>
						</div>
					</ResizablePanel>
				</Resizable>
			</ResizablePanel>
		</Resizable>
	);
}
