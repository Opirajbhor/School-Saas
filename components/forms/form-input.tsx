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
import { cn } from "@/utils/utils";
import { maxLength } from "zod";

type FormInputProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  type?: React.ComponentProps<"input">["type"];
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  defaultValue?: string;
  max?: number;
} & Omit<
  React.ComponentProps<"input">,
  "name" | "type" | "value" | "onChange" | "onBlur"
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
  max,
  defaultValue,
  ...inputProps
}: FormInputProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        return (
          <FormItem className={cn("w-auto", className)}>
            <FormLabel>{label}</FormLabel>

            <FormControl>
              <Input
                {...inputProps}
                {...field}
                type={type}
                placeholder={placeholder}
                max={max}
                disabled={disabled}
                value={field.value ?? ""}
                defaultValue={defaultValue}
                onChange={(e) => {
                  if (type === "number") {
                    field.onChange(
                      e.target.value === ""
                        ? undefined
                        : e.target.valueAsNumber,
                    );
                  } else {
                    field.onChange(e.target.value);
                  }
                }}
              />
            </FormControl>

            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
