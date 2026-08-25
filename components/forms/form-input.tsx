"use client";

import { Control, FieldPath, FieldValues } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";

type FormInputProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  type?: React.ComponentProps<"input">["type"];
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
} & Omit<
  React.ComponentProps<"input">,
  "name" | "type" | "value" | "defaultValue" | "onChange" | "onBlur"
>;

export function FormInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  placeholder,
  description,
  disabled,
  className,
  ...inputProps
}: FormInputProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={`w-auto${className}`}>
          <FormLabel>{label}</FormLabel>

          <FormControl>
            <Input
              {...inputProps}
              {...field}
              type={type}
              placeholder={placeholder}
              disabled={disabled}
              value={field.value ?? ""}
            />
          </FormControl>

          {description && <FormDescription>{description}</FormDescription>}

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
