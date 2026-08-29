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
} from "../ui/form";
import { Checkbox } from "../ui/checkbox";
import { cn } from "@/src/lib/utils";

type FormCheckboxGroupProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  description?: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
};

export function FormCheckboxGroup<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  options,
  disabled,
  className,
}: FormCheckboxGroupProps<TFieldValues>) {
  const { field } = useController({
    control,
    name,
  });

  const selectedValues: string[] = Array.isArray(field.value)
    ? field.value
    : [];

  const handleCheckboxChange = (value: string, checked: boolean) => {
    const newValues = checked
      ? [...selectedValues, value]
      : selectedValues.filter((v) => v !== value);

    field.onChange(newValues);
  };

  return (
    <FormItem className={className}>
      {label && <FormLabel>{label}</FormLabel>}
      {description && <FormDescription>{description}</FormDescription>}

      <div className="space-y-2">
        {options.map((option, index) => {
          const isChecked = selectedValues.includes(option.value);

          const checkboxId = `${name}-option-${index}-${String(option.value).replace(/\s+/g, "-")}`;

          return (
            <div
              key={option.value || index}
              className="flex items-center gap-3 cursor-pointer"
            >
              <FormControl>
                <Checkbox
                  id={checkboxId}
                  checked={isChecked}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(option.value, checked === true)
                  }
                  onBlur={field.onBlur}
                  disabled={disabled}
                  ref={index === 0 ? field.ref : undefined}
                />
              </FormControl>

              <label
                htmlFor={checkboxId}
                className={cn(
                  "font-normal p-2 border rounded-md cursor-pointer flex-1 select-none transition-colors",
                  isChecked
                    ? " bg-primary/50 text-accent-foreground font-medium"
                    : "bg-transparent border-input hover:bg-accent/20",
                )}
              >
                {option.label}
              </label>
            </div>
          );
        })}
      </div>

      <FormMessage />
    </FormItem>
  );
}
