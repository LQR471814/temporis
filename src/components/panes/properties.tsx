// biome-ignore-all lint/suspicious/noExplicitAny: lots of typescript shenanigans happening here

import { useLiveQuery } from "@tanstack/solid-db";
import { Match, Show, Switch, useContext } from "solid-js";
import { tasksCollection } from "src/lib/collections";
import { ROOT_ID } from "src/lib/constants";
import {
	ImplementationType,
	type Timescale,
	timescaleFromType,
} from "src/lib/timescales";
import { asInstant, cn, currentTz } from "src/lib/utils";
import {
	CurrentTaskContext,
	type CurrentTaskValue,
} from "~/context/current-task";
import { TimeDisplay } from "../time-display";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Search } from "../ui/search";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { FormMultilineText, FormTextField } from "../ui/text-field";

function FormFields(props: {
	form: CurrentTaskValue["forms"][keyof CurrentTaskValue["forms"]];
}) {
	const parentOptions = useLiveQuery((q) => q.from({ tasks: tasksCollection }));
	const form = props.form;
	return (
		<>
			<form.Field
				name="name"
				validators={{
					onChange: ({ value }) => (!value ? "Name is required" : undefined),
				}}
				children={(field) => (
					<FormTextField
						class="max-w-[180px]"
						field={field()}
						transform={(v) => v}
						label="Name"
						type="text"
						placeholder="Task 1"
					/>
				)}
			/>
			<form.Field
				name="comments"
				children={(field) => (
					<FormMultilineText
						class="max-w-[400px]"
						field={field()}
						label="Comments"
						placeholder="Comments..."
					/>
				)}
			/>

			<form.Field
				name="implementation"
				children={(field) => (
					<div>
						<p class="text-sm font-medium">Estimate</p>
						<Tabs
							onChange={(value) => {
								const val = parseInt(value, 10);
								switch (val) {
									case ImplementationType.hours:
									case ImplementationType.children:
										field().handleChange(val);
								}
							}}
							value={field().state.value.toString()}
							class="w-[400px]"
						>
							<TabsList class="grid w-full grid-cols-2">
								<TabsTrigger value={ImplementationType.hours.toString()}>
									Hours
								</TabsTrigger>
								<TabsTrigger value={ImplementationType.children.toString()}>
									Children
								</TabsTrigger>
							</TabsList>

							<TabsContent
								class="flex gap-2"
								value={ImplementationType.hours.toString()}
							>
								<form.Field
									name="optimistic"
									validators={{
										onChange: ({ value }) =>
											Number.isNaN(value) ? "Not a number!" : undefined,
									}}
									children={(field) => (
										<FormTextField
											field={field()}
											transform={(v) => parseFloat(v)}
											label="Optimistic (h)"
											type="text"
											placeholder="Hours"
										/>
									)}
								/>
								<form.Field
									name="expected"
									validators={{
										onChange: ({ value }) =>
											Number.isNaN(value) ? "Not a number!" : undefined,
									}}
									children={(field) => (
										<FormTextField
											field={field()}
											transform={(v) => parseFloat(v)}
											label="Expected (h)"
											type="text"
											placeholder="Hours"
										/>
									)}
								/>
								<form.Field
									name="pessimistic"
									validators={{
										onChange: ({ value }) =>
											Number.isNaN(value) ? "Not a number!" : undefined,
									}}
									children={(field) => (
										<FormTextField
											field={field()}
											transform={(v) => parseFloat(v)}
											label="Pessimistic (h)"
											type="text"
											placeholder="Hours"
										/>
									)}
								/>
							</TabsContent>

							<TabsContent
								class="flex gap-2"
								value={ImplementationType.children.toString()}
							>
								<form.Field
									name="pessimistic"
									validators={{
										onChange: ({ value }) =>
											Number.isNaN(value) ? "Not a number!" : undefined,
									}}
									children={(field) => (
										<FormTextField
											field={field()}
											transform={(v) => parseFloat(v)}
											label="Pessimistic %"
											type="text"
											placeholder="Percentage"
										/>
									)}
								/>
								<form.Field
									name="expected"
									validators={{
										onChange: ({ value }) =>
											Number.isNaN(value) ? "Not a number!" : undefined,
									}}
									children={(field) => (
										<FormTextField
											field={field()}
											transform={(v) => parseFloat(v)}
											label="Expected %"
											type="text"
											placeholder="Percentage"
										/>
									)}
								/>
								<form.Field
									name="optimistic"
									validators={{
										onChange: ({ value }) =>
											Number.isNaN(value) ? "Not a number!" : undefined,
									}}
									children={(field) => (
										<FormTextField
											field={field()}
											transform={(v) => parseFloat(v)}
											label="Optimistic %"
											type="text"
											placeholder="Percentage"
										/>
									)}
								/>
							</TabsContent>
						</Tabs>
					</div>
				)}
			/>

			<form.Field
				name="parent_id"
				children={(field) => {
					return (
						<div class="max-w-[220px]">
							<label class="text-sm font-medium" for={field().name}>
								Parent
							</label>
							<Search
								name={field().name}
								options={parentOptions()}
								selectedId={field().state.value}
								idField="id"
								labelField="name"
								onChange={(newParent) => {
									if (!newParent) {
										// root id
										field().handleChange(ROOT_ID);
										return;
									}
									field().handleChange(newParent.id);
								}}
							/>
						</div>
					);
				}}
			/>
		</>
	);
}

function Header(props: {
	title: string;
	start: Temporal.ZonedDateTime;
	duration: Temporal.Duration;
	timescale: Timescale;
}) {
	return (
		<>
			<h1 class="text-lg">{props.title}</h1>
			<div class="flex items-center">
				<Badge variant="secondary">{props.timescale.name}</Badge>
				<TimeDisplay time={props.start} minDuration={props.duration} />
			</div>
			<Separator />
		</>
	);
}

function Form(props: {
	title: string;
	key: keyof CurrentTaskValue["forms"];
	actionTitle: string;
	secondaryAction?: {
		class?: string;
		title: string;
		onAction(): void;
	};
}) {
	const taskCtx = useContext(CurrentTaskContext);
	if (!taskCtx) {
		return (
			<p class="m-auto">
				CurrentTaskContext.Provider has not been initialized.
			</p>
		);
	}
	const form = taskCtx.forms[props.key];
	return (
		<>
			<form.Subscribe
				selector={(state) => {
					const timescale = timescaleFromType(state.values.timescale);
					const start = asInstant(state.values.timeframe_start);
					return {
						start: start,
						end: timescale.instance(start.toZonedDateTimeISO(currentTz())).end,
						timescale,
					};
				}}
				children={(selected) => (
					<Header
						title={props.title}
						start={selected().start.toZonedDateTimeISO(currentTz())}
						timescale={selected().timescale}
						duration={selected().end.since(
							selected().start.toZonedDateTimeISO(currentTz()),
						)}
					/>
				)}
			/>
			<FormFields form={form} />
			<div class="flex gap-1">
				<Button
					class="w-min"
					onClick={async () => {
						const results = await form.validateAllFields("submit");
						const valid = results.length === 0;
						if (!valid) {
							return;
						}
						form.handleSubmit();
					}}
				>
					{props.actionTitle}
				</Button>
				<Show when={!!props.secondaryAction}>
					<Button
						class={cn("w-min", props.secondaryAction?.class)}
						onClick={props.secondaryAction?.onAction}
					>
						{props.secondaryAction?.title}
					</Button>
				</Show>
			</div>
		</>
	);
}

export function Properties() {
	const taskCtx = useContext(CurrentTaskContext);
	if (!taskCtx) {
		return (
			<div class="flex w-full h-full">
				<p class="m-auto">
					CurrentTaskContext.Provider has not been initialized.
				</p>
			</div>
		);
	}
	return (
		<div class="flex flex-col gap-2 w-full h-full p-2">
			<Switch>
				<Match when={taskCtx.shown() === "new_child"}>
					<Form
						title="Creating task..."
						actionTitle="Create"
						key="creation"
						secondaryAction={{
							class: "bg-red-600 hover:bg-red-500",
							title: "Reset",
							onAction: taskCtx.resetNewChild,
						}}
					/>
				</Match>
				<Match when={taskCtx.shown() === "selected"}>
					<Form
						title="Editing task..."
						actionTitle="Save"
						key="edit"
						secondaryAction={{
							class: "bg-red-600 hover:bg-red-500",
							title: "Delete",
							onAction: taskCtx.deleteTask,
						}}
					/>
				</Match>
				<Match when={taskCtx.shown() === "none"}>
					<p class="m-auto">No task selected.</p>
				</Match>
			</Switch>
		</div>
	);
}
