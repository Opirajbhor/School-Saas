"use client";
import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";

export type AllowedIdType = string | number;

export interface DynamicCheckboxGroupProps<
  T extends Record<string, unknown>,
  VKey extends keyof T = "id" extends keyof T ? "id" : keyof T,
  LKey extends keyof T = "name" extends keyof T ? "name" : keyof T,
  DKey extends keyof T = keyof T,
> {
  legend: string;
  description?: string;
  options: readonly T[];
  /** Key on your object to use as the ID. Defaults to "id" */
  valueKey?: VKey;
  /** Key on your object to display as the label. Defaults to "name" */
  labelKey?: LKey;
  /** Optional key on your object for secondary description */
  descriptionKey?: DKey;
  value?: readonly AllowedIdType[];
  defaultValue?: readonly AllowedIdType[];
  onChange?: (selectedIds: AllowedIdType[], selectedItems: T[]) => void;
  name?: string;
  className?: string;
}

export function DynamicCheckboxGroup<
  T extends Record<string, unknown>,
  VKey extends keyof T = "id" extends keyof T ? "id" : keyof T,
  LKey extends keyof T = "name" extends keyof T ? "name" : keyof T,
  DKey extends keyof T = keyof T,
>({
  legend,
  description,
  options,
  valueKey = ("id" in (options[0] ?? {})
    ? "id"
    : Object.keys(options[0] ?? {})[0]) as VKey,
  labelKey = ("name" in (options[0] ?? {})
    ? "name"
    : Object.keys(options[0] ?? {})[0]) as LKey,
  descriptionKey,
  value,
  defaultValue = [],
  onChange,
  name = "checkbox-group",
  className,
}: DynamicCheckboxGroupProps<T, VKey, LKey, DKey>) {
  const [internalSelectedIds, setInternalSelectedIds] =
    useState<readonly AllowedIdType[]>(defaultValue);

  const selectedIds = value ?? internalSelectedIds;

  const handleCheckedChange = (option: T, isChecked: boolean) => {
    const rawId = option[valueKey];

    if (typeof rawId !== "string" && typeof rawId !== "number") {
      throw new Error(
        `Invalid valueKey '${String(valueKey)}'. Expected string or number.`,
      );
    }

    const optionId: AllowedIdType = rawId;

    const nextSelectedIds = isChecked
      ? [...selectedIds, optionId]
      : selectedIds.filter((selectedId) => selectedId !== optionId);

    if (value === undefined) {
      setInternalSelectedIds(nextSelectedIds);
    }

    if (onChange) {
      const selectedItems = options.filter((opt) => {
        const id = opt[valueKey];
        return typeof id === "string" || typeof id === "number"
          ? nextSelectedIds.includes(id)
          : false;
      });
      onChange([...nextSelectedIds], selectedItems);
    }
  };

  return (
    <FieldSet className={className}>
      <FieldLegend variant="label">{legend}</FieldLegend>
      {description && <FieldDescription>{description}</FieldDescription>}

      <FieldGroup className="gap-3">
        {options.map((option, index) => {
          const rawId = option[valueKey];
          const rawLabel = option[labelKey];
          const rawDescription = descriptionKey ? option[descriptionKey] : null;

          const optionId: AllowedIdType =
            typeof rawId === "string" || typeof rawId === "number"
              ? rawId
              : index;
          const optionLabel =
            typeof rawLabel === "string" || typeof rawLabel === "number"
              ? String(rawLabel)
              : "";
          const optionDescription =
            typeof rawDescription === "string" ? rawDescription : null;

          const checkboxId = `${name}-${optionId}`;
          const isChecked = selectedIds.includes(optionId);

          return (
            <Field key={optionId} orientation="horizontal">
              <Checkbox
                id={checkboxId}
                name={name}
                value={String(optionId)}
                checked={isChecked}
                onCheckedChange={(checked) =>
                  handleCheckedChange(option, checked === true)
                }
              />
              <div className="flex flex-col gap-0.5">
                <FieldLabel
                  htmlFor={checkboxId}
                  className="font-normal cursor-pointer select-none"
                >
                  {optionLabel}
                </FieldLabel>
                {optionDescription && (
                  <FieldDescription>{optionDescription}</FieldDescription>
                )}
              </div>
            </Field>
          );
        })}
      </FieldGroup>
    </FieldSet>
  );
}
