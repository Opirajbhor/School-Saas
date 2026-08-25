"use client";

import {
  Control,
  FieldPath,
  FieldValues,
  useController,
} from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

type FormTextareaProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
} & Omit<
  React.ComponentProps<"textarea">,
  "name" | "value" | "defaultValue" | "onChange" | "onBlur"
>;

export function FormTextarea<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  disabled,
  className,
  ...textareaProps
}: FormTextareaProps<TFieldValues>) {
  const { field } = useController({
    control,
    name,
  });

  return (
    <FormItem className={className}>
      <FormLabel>{label}</FormLabel>

      <FormControl>
        <Textarea
          {...textareaProps}
          {...field}
          value={field.value ?? ""}
          placeholder={placeholder}
          disabled={disabled}
        />
      </FormControl>

      {description && (
        <FormDescription>{description}</FormDescription>
      )}

      <FormMessage />
    </FormItem>
  );
}