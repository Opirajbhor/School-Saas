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

type FormInputProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  defaultValue?: string;
} & Omit<
  React.ComponentProps<"input">,
  "name" | "type" | "value" | "onChange" | "onBlur"
>;

export function FormInputNumber<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  disabled,
  className,
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
                type="number"
                placeholder={placeholder}
                disabled={disabled}
                value={field.value ?? ""}
                defaultValue={defaultValue}
                onChange={(e) => {
                  field.onChange(
                    e.target.value === "" ? undefined : Number(e.target.value),
                  );
                  return;
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
