import type { AnyFieldApi } from "@tanstack/solid-form";

export interface FieldInfoProps {
	field: AnyFieldApi;
}

export function FieldInfo(props: FieldInfoProps) {
	return (
		<>
			{props.field.state.meta.isTouched && !props.field.state.meta.isValid ? (
				<em>{props.field.state.meta.errors.join(",")}</em>
			) : null}
			{props.field.state.meta.isValidating ? "Validating..." : null}
		</>
	);
}
