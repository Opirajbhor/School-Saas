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

import { Switch } from "@/components/ui/switch";

type FormSwitchProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
};

export function FormSwitch<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
}: FormSwitchProps<TFieldValues>) {
  const { field } = useController({
    control,
    name,
  });

  return (
    <FormItem
      className={`flex flex-row items-center justify-between rounded-lg border p-4 ${className ?? ""}`}
    >
      <div className="space-y-0.5">
        <FormLabel>{label}</FormLabel>

        {description && <FormDescription>{description}</FormDescription>}
      </div>

      <FormControl>
        <Switch
          checked={field.value === "ACTIVE"}
          onCheckedChange={(checked) =>
            field.onChange(checked ? "ACTIVE" : "INACTIVE")
          }
          disabled={disabled}
          className="cursor-pointer"
        />
      </FormControl>

      <FormMessage />
    </FormItem>
  );
}
