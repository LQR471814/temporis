import { eq, useLiveQuery } from "@tanstack/solid-db";
import { type Accessor, createMemo, createRoot } from "solid-js";
import type { z } from "zod";
import type { publicTaskRowSchema } from "~/lib/supabase/schemas.gen";
import { tasksCollection } from "./tables";

export type TaskNode = {
	node?: z.infer<typeof publicTaskRowSchema>;
	children: TaskNode[];
};

// currently unused
class TaskTreeMapping {
	mapping: Map<string, Accessor<TaskNode>>;

	constructor() {
		this.mapping = new Map();
	}

	private buildMapping(taskId: string): Accessor<TaskNode> {
		const accessor = createRoot((dispose) => {
			const identity = useLiveQuery((q) =>
				q
					.from({ task: tasksCollection })
					.where(({ task }) => eq(task.id, taskId)),
			);
			const children = useLiveQuery((q) =>
				q
					.from({ task: tasksCollection })
					.where(({ task }) => eq(task.parent_id, taskId))
					.select(({ task }) => ({ id: task.id })),
			);
			return createMemo(() => {
				if (!tasksCollection.get(taskId)) {
					dispose();
					return undefined as unknown as TaskNode;
				}
				const childNodes = children()
					// prevent cycles
					.filter((c) => c.id !== taskId)
					.map((c) => this.lookup(c.id)());
				return {
					node: identity()[0],
					children: childNodes,
				};
			});
		});
		this.mapping.set(taskId, accessor);
		return accessor;
	}

	lookup(taskId: string) {
		const accessor = this.mapping.get(taskId);
		if (!accessor) {
			return this.buildMapping(taskId);
		}
		return accessor;
	}
}

export const taskTree = new TaskTreeMapping();
