// biome-ignore-all lint/suspicious/noExplicitAny: lots of typescript shenanigans happening here

import { useLiveQuery } from "@tanstack/solid-db";
import { Match, Show, Switch, useContext, type JSX } from "solid-js";
import { tasksCollection } from "src/lib/collections";
import { ROOT_ID, StatusType } from "src/lib/constants";
import { type Timescale, timescaleFromType } from "src/lib/timescales";
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
import { ImplementationType } from "src/lib/constants";
import * as Select from "../ui/select";
import { Label } from "../ui/label";

function IconText(props: {
	class?: string;
	icon: (props: { class?: string }) => JSX.Element;
	text: string;
}) {
	return (
		<div class={cn("flex items-center gap-1", props.class)}>
			<props.icon class="size-4" />
			<p>{props.text}</p>
		</div>
	);
}

function StatusTypeText(props: { type: StatusType }) {
	return (
		<Switch>
			<Match when={props.type === StatusType.pending}>
				<IconText
					text="Pending"
					icon={(props) => (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							class={props.class}
						>
							<title>Loader</title>
							<path d="M11.9995 2C12.5518 2 12.9995 2.44772 12.9995 3V6C12.9995 6.55228 12.5518 7 11.9995 7C11.4472 7 10.9995 6.55228 10.9995 6V3C10.9995 2.44772 11.4472 2 11.9995 2ZM11.9995 17C12.5518 17 12.9995 17.4477 12.9995 18V21C12.9995 21.5523 12.5518 22 11.9995 22C11.4472 22 10.9995 21.5523 10.9995 21V18C10.9995 17.4477 11.4472 17 11.9995 17ZM20.6597 7C20.9359 7.47829 20.772 8.08988 20.2937 8.36602L17.6956 9.86602C17.2173 10.1422 16.6057 9.97829 16.3296 9.5C16.0535 9.02171 16.2173 8.41012 16.6956 8.13398L19.2937 6.63397C19.772 6.35783 20.3836 6.52171 20.6597 7ZM7.66935 14.5C7.94549 14.9783 7.78161 15.5899 7.30332 15.866L4.70525 17.366C4.22695 17.6422 3.61536 17.4783 3.33922 17C3.06308 16.5217 3.22695 15.9101 3.70525 15.634L6.30332 14.134C6.78161 13.8578 7.3932 14.0217 7.66935 14.5ZM20.6597 17C20.3836 17.4783 19.772 17.6422 19.2937 17.366L16.6956 15.866C16.2173 15.5899 16.0535 14.9783 16.3296 14.5C16.6057 14.0217 17.2173 13.8578 17.6956 14.134L20.2937 15.634C20.772 15.9101 20.9359 16.5217 20.6597 17ZM7.66935 9.5C7.3932 9.97829 6.78161 10.1422 6.30332 9.86602L3.70525 8.36602C3.22695 8.08988 3.06308 7.47829 3.33922 7C3.61536 6.52171 4.22695 6.35783 4.70525 6.63397L7.30332 8.13398C7.78161 8.41012 7.94549 9.02171 7.66935 9.5Z"></path>
						</svg>
					)}
				/>
			</Match>
			<Match when={props.type === StatusType.completed}>
				<IconText
					text="Completed"
					class="text-green-600"
					icon={(props) => (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							class={props.class}
						>
							<title>Checkmark</title>
							<path d="M9.9997 15.1709L19.1921 5.97852L20.6063 7.39273L9.9997 17.9993L3.63574 11.6354L5.04996 10.2212L9.9997 15.1709Z"></path>
						</svg>
					)}
				></IconText>
			</Match>
			<Match when={props.type === StatusType.fixed}>
				<IconText
					text="Fixed"
					class="text-gray-400"
					icon={(props) => (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							class={props.class}
						>
							<title>Locked</title>
							<path d="M19 10H20C20.5523 10 21 10.4477 21 11V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V11C3 10.4477 3.44772 10 4 10H5V9C5 5.13401 8.13401 2 12 2C15.866 2 19 5.13401 19 9V10ZM5 12V20H19V12H5ZM11 14H13V18H11V14ZM17 10V9C17 6.23858 14.7614 4 12 4C9.23858 4 7 6.23858 7 9V10H17Z"></path>
						</svg>
					)}
				></IconText>
			</Match>
		</Switch>
	);
}

function FormFields(props: {
	form: CurrentTaskValue["forms"][keyof CurrentTaskValue["forms"]];
}) {
	const parentOptions = useLiveQuery((q) => q.from({ tasks: tasksCollection }));
	const form = props.form;
	return (
		<div
			classList={{
				"grid grid-cols-[minmax(min-content,1fr)] gap-2": true,
				"xl:grid-cols-[minmax(min-content,1fr),minmax(min-content,1fr),minmax(min-content,1fr)]": true,
				"lg:grid-cols-[minmax(min-content,1fr),minmax(min-content,1fr)]": true,
			}}
		>
			<div class="flex flex-col gap-1">
				<div class="flex gap-1">
					<form.Field
						name="name"
						validators={{
							onChange: ({ value }) =>
								!value ? "Name is required" : undefined,
						}}
						children={(field) => (
							<FormTextField
								field={field()}
								transform={(v) => v}
								label="Name"
								type="text"
								placeholder="Task 1"
							/>
						)}
					/>
					<form.Field
						name="status"
						children={(field) => (
							<div class="flex flex-col gap-1">
								<Label for={field().name}>Label</Label>
								<Select.Select
									id={field().name}
									class="min-w-[180px]"
									value={field().state.value}
									options={[
										StatusType.pending,
										StatusType.completed,
										StatusType.fixed,
									]}
									onChange={(value) => {
										field().handleChange(value ?? StatusType.pending);
									}}
									itemComponent={(props) => (
										<Select.SelectItem item={props.item}>
											<StatusTypeText type={props.item.rawValue} />
										</Select.SelectItem>
									)}
								>
									<Select.SelectTrigger>
										<Select.SelectValue<number>>
											{(state) => (
												<StatusTypeText type={state.selectedOption()} />
											)}
										</Select.SelectValue>
									</Select.SelectTrigger>
									<Select.SelectContent />
								</Select.Select>
							</div>
						)}
					/>
				</div>
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
			</div>

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
		</div>
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
		<div class="flex flex-col gap-2 w-full p-2">
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
		</div>
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
				<div class="flex min-h-[300px]">
					<p class="m-auto">No task selected.</p>
				</div>
			</Match>
		</Switch>
	);
}
