import { type Task, taskTimeDigest } from "~/lib/stats";

export type Action = {
	type: "percentile";
	// a number from 0-100
	percentile: number;
};

export type Request = {
	id: string;
	tasks: Task[];
	action: Action;
};

self.onmessage = ({ data }) => {
	const req = data as Request;
	try {
		// const t1 = performance.now();
		const digest = taskTimeDigest(req.tasks);
		switch (req.action.type) {
			case "percentile": {
				if (req.tasks.length === 0) {
					self.postMessage({ id: req.id, value: 0 });
					break;
				}
				const value = digest.percentile(req.action.percentile / 100);
				self.postMessage({ id: req.id, value });
				break;
			}
		}
		// const t2 = performance.now();
		// console.log(`handled request in ${t2 - t1}ms`);
	} catch (err) {
		self.postMessage({ id: data.id, error: err });
	}
};
