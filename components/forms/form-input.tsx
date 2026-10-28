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
  min?: number;
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
  min,
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
                min={min}
                disabled={disabled}
                value={field.value ?? ""}
                defaultValue={defaultValue}
                onChange={(e) => {
                  if (type === "number") {
                    if (e.target.value === "") {
                      field.onChange(undefined);
                      return;
                    }

                    // html max/min are advisory only, so clamp the value
                    // before it reaches the form state
                    let value = e.target.valueAsNumber;
                    if (Number.isNaN(value)) return;
                    if (max !== undefined && value > max) value = max;
                    if (min !== undefined && value < min) value = min;

                    // keep the visible input in sync with the clamped value
                    if (value !== e.target.valueAsNumber) {
                      e.target.value = String(value);
                    }
                    field.onChange(value);
                  } else {
                    field.onChange(e.target.value);
                  }
                }}
                // reflect the clamped value when the browser kept a rejected
                // keystroke in the dom instead of the field state
                onBlur={(e) => {
                  const input = e.currentTarget;
                  if (type === "number") {
                    const value = input.valueAsNumber;
                    if (max !== undefined && value > max) {
                      input.value = String(max);
                    } else if (min !== undefined && value < min) {
                      input.value = String(min);
                    }
                  }
                  field.onBlur();
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
