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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
}: FormSelectProps<TFieldValues>) {
  const { field } = useController({
    control,
    name,
  });

  return (
    <FormItem className={className}>
      <FormLabel>{label}</FormLabel>

      <Select
        value={field.value ?? ""}
        onValueChange={field.onChange}
        disabled={disabled}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
        </FormControl>

        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {description && <FormDescription>{description}</FormDescription>}

      <FormMessage />
    </FormItem>
  );
}
