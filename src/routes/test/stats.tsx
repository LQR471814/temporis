import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/test/stats")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/test/stats"!</div>;
}
