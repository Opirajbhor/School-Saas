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

import { Checkbox } from "@/components/ui/checkbox";

type FormCheckboxProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
};

export function FormCheckbox<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
}: FormCheckboxProps<TFieldValues>) {
  const { field } = useController({
    control,
    name,
  });

  return (
    <FormItem className={`flex flex-row items-start gap-3 ${className ?? ""}`}>
      <FormControl>
        <Checkbox
          checked={field.value ?? false}
          onCheckedChange={field.onChange}
          disabled={disabled}
        />
      </FormControl>

      <div className="space-y-1 leading-none">
        <FormLabel>{label}</FormLabel>

        {description && <FormDescription>{description}</FormDescription>}

        <FormMessage />
      </div>
    </FormItem>
  );
}
