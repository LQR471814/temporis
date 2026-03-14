import { createFileRoute } from "@tanstack/solid-router";
import { Properties } from "src/components/panes/properties";
import { ViewController } from "src/components/panes/view-controller";
import { CurrentTaskProvider } from "src/context/current-task";
import { ViewProvider } from "src/context/view";
import { HorizontalControlled } from "src/components/panes/horizontal-controlled";
import { ScrollerContainer, ScrollerProvider } from "src/context/scroller";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<ScrollerProvider>
			<ViewProvider>
				<CurrentTaskProvider>
					<ScrollerContainer class="h-[100vh]">
						<HorizontalControlled />
					</ScrollerContainer>
					<Properties class="fixed z-40 top-3 left-3" />
					<ViewController class="fixed z-40 top-3 right-3" />
				</CurrentTaskProvider>
			</ViewProvider>
		</ScrollerProvider>
	);
}
