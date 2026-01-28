// biome-ignore-all lint/suspicious/noExplicitAny: lots of typescript shenanigans happening here

import type { AnyFieldApi, FieldApi } from "@tanstack/solid-form";
import { Match, Switch, useContext } from "solid-js";
import { CurrentTaskContext } from "~/context/current-task";
import { FieldInfo } from "../field-info";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
	TextField,
	TextFieldInput,
	type TextFieldInputProps,
	TextFieldLabel,
	TextFieldTextArea,
} from "../ui/text-field";

function FormMultilineText(props: {
	field: FieldApi<
		any,
		any,
		string,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any
	>;
	label: string;
	placeholder?: string;
}) {
	return (
		<TextField>
			<TextFieldLabel for={props.field.name}>{props.label}</TextFieldLabel>
			<TextFieldTextArea
				id={props.field.name}
				name={props.field.name}
				placeholder={props.placeholder}
				onBlur={props.field.handleBlur}
				onInput={(e) => props.field.handleChange(e.currentTarget.value)}
			/>
			<FieldInfo field={props.field} />
		</TextField>
	);
}

function FormTextField<
	T extends AnyFieldApi,
	// typescript madness
	__Return extends T extends FieldApi<
		any,
		any,
		infer U,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any
	>
		? U
		: never,
>(props: {
	field: T;
	transform: (text: string) => __Return;
	type: TextFieldInputProps<"input">["type"];
	label: string;
	placeholder?: string;
}) {
	return (
		<TextField>
			<TextFieldLabel for={props.field.name}>{props.label}</TextFieldLabel>
			<TextFieldInput
				id={props.field.name}
				type={props.type}
				name={props.field.name}
				placeholder={props.placeholder}
				onBlur={props.field.handleBlur}
				onInput={(e) =>
					props.field.handleChange(props.transform(e.currentTarget.value))
				}
			/>
			<FieldInfo field={props.field} />
		</TextField>
	);
}

function Fields() {
	const ctx = useContext(CurrentTaskContext);
	if (!ctx) {
		return (
			<p class="m-auto">
				CurrentTaskContext.Provider has not been initialized.
			</p>
		);
	}
	const form = ctx.form;
	return (
		<Switch fallback={<p class="m-auto">No task selected.</p>}>
			<Match when={ctx.shown() === "selected" || ctx.shown() === "new_child"}>
				<div class="flex flex-col flex-wrap gap-2">
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
						name="comments"
						children={(field) => (
							<FormMultilineText
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
										switch (value) {
											case "hours":
											case "children":
												field().handleChange(value);
										}
									}}
									defaultValue={field().state.value}
									class="w-[400px]"
								>
									<TabsList class="grid w-full grid-cols-2">
										<TabsTrigger value="hours">Hours</TabsTrigger>
										<TabsTrigger value="children">Children</TabsTrigger>
									</TabsList>
									<TabsContent class="flex gap-2" value="hours">
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
													label="Optimistic"
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
													label="Expected"
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
													label="Pessimistic"
													type="text"
													placeholder="Hours"
												/>
											)}
										/>
									</TabsContent>

									<TabsContent class="flex gap-2" value="children">
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
													label="Least %"
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
													label="Average %"
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
													label="Most %"
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
				</div>
			</Match>
		</Switch>
	);
}

export function TaskProperties() {
	return (
		<div class="flex w-full h-full p-2">
			<Fields />
		</div>
	);
}
