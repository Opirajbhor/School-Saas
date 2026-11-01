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

import { Combobox } from "@/components/ui/combobox";

type FormSelectOption = {
  label: string;
  value: string;
};

type FormSelectProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  options: FormSelectOption[];
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (value: string) => void;
};

export function FormSelect<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = "Select an option",
  description,
  disabled,
  className,
  onChange,
}: FormSelectProps<TFieldValues>) {
  const { field } = useController({
    control,
    name,
  });

  return (
    <FormItem className={className}>
      <FormLabel>{label}</FormLabel>

      <FormControl>
        <Combobox
          options={options}
          // the form stores "" for "nothing chosen", the combobox wants null
          value={field.value ? String(field.value) : null}
          onValueChange={(value) => {
            const stringValue = value ?? "";
            field.onChange(stringValue);
            onChange?.(stringValue);
          }}
          placeholder={placeholder}
          searchPlaceholder={`Search ${label.toLowerCase()}…`}
          disabled={disabled}
        />
      </FormControl>

      {description && <FormDescription>{description}</FormDescription>}

      <FormMessage />
    </FormItem>
  );
}
