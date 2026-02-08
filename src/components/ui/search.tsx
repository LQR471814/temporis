// biome-ignore-all lint/suspicious/noExplicitAny: lots of typescript shenanigans happening here

import { createFilter } from "@kobalte/core";
import type { Fn, Pipe, Tuples, Unions } from "hotscript";
import { createMemo, createSignal } from "solid-js";
import {
	Combobox,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxTrigger,
} from "~/components/ui/combobox";

interface IsValidLabel<T extends Record<string, unknown>> extends Fn {
	return: T[this["arg0"]] extends string | number | Element ? true : false;
}

export function Search<
	T extends Record<string, unknown>,
	IDField extends keyof T,
	LabelField extends Pipe<
		keyof T,
		[Unions.ToTuple, Tuples.Filter<IsValidLabel<T>>, Tuples.ToUnion]
	>,
>(props: {
	name: string;
	selectedId: T[IDField];
	options: T[];
	idField: IDField;
	labelField: LabelField;
	onChange(result: T | null): void;
}) {
	const filter = createFilter({ sensitivity: "base", ignorePunctuation: true });
	const selected = createMemo(() =>
		props.options.find((o) => o[props.idField] === props.selectedId),
	);
	const optionSignal = createMemo(() => {
		const [get, set] = createSignal(props.options);
		return { get, set };
	});
	const onInputChange = (value: string) => {
		optionSignal().set(
			props.options.filter((option) =>
				filter.contains(option[props.labelField as any] as any, value),
			),
		);
	};
	return (
		<Combobox
			name={props.name}
			value={selected()}
			options={optionSignal().get()}
			optionValue={props.idField}
			optionLabel={props.labelField as any}
			onInputChange={onInputChange}
			onChange={props.onChange}
			itemComponent={(p) => (
				<ComboboxItem item={p.item}>{p.item.textValue}</ComboboxItem>
			)}
		>
			<ComboboxTrigger>
				<ComboboxInput />
			</ComboboxTrigger>
			<ComboboxContent />
		</Combobox>
	);
}
