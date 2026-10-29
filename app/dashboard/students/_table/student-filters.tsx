"use client";

import { useMemo, useState } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { StudentEnrollment } from "@/src/validation/student.zod";

type Option = { label: string; value: string };

// filter id -> the row value it matches on
type FilterId =
  | "classId"
  | "sectionId"
  | "groupId"
  | "gender"
  | "status"
  | "religion";

const GENDERS: Option[] = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Other", value: "OTHER" },
];

const STATUSES: Option[] = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

type Draft = Record<FilterId, string | null>;

const EMPTY_DRAFT: Draft = {
  classId: null,
  sectionId: null,
  groupId: null,
  gender: null,
  status: null,
  religion: null,
};

/** Turn a draft into the column filters the table reads. */
export function toFilters(draft: Draft): ColumnFiltersState {
  return (Object.entries(draft) as [FilterId, string | null][])
    .filter(([, value]) => value !== null && value !== "")
    .map(([id, value]) => ({ id, value }));
}

/** Rebuild a draft from applied filters, e.g. after an outside reset. */
export function toDraft(filters: ColumnFiltersState): Draft {
  const draft: Draft = { ...EMPTY_DRAFT };
  for (const filter of filters) {
    if (filter.id in draft) {
      draft[filter.id as FilterId] = String(filter.value);
    }
  }
  return draft;
}

const sameFilters = (a: ColumnFiltersState, b: ColumnFiltersState) => {
  const key = (f: ColumnFiltersState) =>
    [...f]
      .map(({ id, value }) => `${id}:${String(value)}`)
      .sort()
      .join("|");
  return key(a) === key(b);
};

/**
 * Class / section / group / gender / status / religion filters for the students
 * table.
 *
 * Edits only touch local `draft` state — nothing reaches the table until the
 * Search button is pressed, so the list doesn't re-filter on every click.
 */
export function StudentFilters({
  students,
  filters,
  onFiltersChange,
  search,
  onSearchChange,
}: {
  students: StudentEnrollment[];
  filters: ColumnFiltersState;
  onFiltersChange: (filters: ColumnFiltersState) => void;
  search: string;
  onSearchChange: (search: string) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(filters));
  // The text box is a draft too — it only reaches the table on Search.
  const [searchDraft, setSearchDraft] = useState(search);

  // An outside change (e.g. Reset) must be reflected in the dropdowns. Tracking
  // the previous value and resetting during render is the React-recommended
  // alternative to a setState-in-effect.
  const [applied, setApplied] = useState(filters);
  if (applied !== filters) {
    setApplied(filters);
    setDraft(toDraft(filters));
  }

  const [appliedSearch, setAppliedSearch] = useState(search);
  if (appliedSearch !== search) {
    setAppliedSearch(search);
    setSearchDraft(search);
  }

  // Helpers that build the distinct values actually present, so a choice can
  // never lead to an empty table.
  const optionsFrom = (
    rows: StudentEnrollment[],
    pick: (row: StudentEnrollment) => { id?: string; name?: string },
  ): Option[] => {
    const seen = new Map<string, string>();
    for (const row of rows) {
      const { id, name } = pick(row);
      if (id && name) seen.set(id, name);
    }
    return [...seen].map(([value, label]) => ({ value, label }));
  };

  const classOptions = useMemo(
    () =>
      optionsFrom(students, (row) => ({
        id: row.classId,
        name: row.class?.name,
      })),
    [students],
  );

  // A section or group only belongs to one class, so they stay locked until a
  // class is picked — otherwise you can choose a pair that matches nothing.
  const hasClass = draft.classId !== null;

  const scopedRows = useMemo(
    () =>
      hasClass
        ? students.filter((row) => row.classId === draft.classId)
        : students,
    [students, hasClass, draft.classId],
  );

  const sectionOptions = useMemo(
    () =>
      hasClass
        ? optionsFrom(scopedRows, (row) => ({
            id: row.sectionId,
            name: row.section?.name,
          }))
        : [],
    [scopedRows, hasClass],
  );

  const groupOptions = useMemo(
    () =>
      hasClass
        ? optionsFrom(scopedRows, (row) => ({
            id: row.group?.id,
            name: row.group?.name,
          }))
        : [],
    [scopedRows, hasClass],
  );

  const religionOptions = useMemo(
    () =>
      optionsFrom(students, (row) => ({
        id: row.student.religion ?? undefined,
        name: row.student.religion ?? undefined,
      })),
    [students],
  );

  const setDraftValue = (id: FilterId, next: string | null) => {
    setDraft((current) => {
      const updated: Draft = { ...current, [id]: next };

      // Changing the class invalidates a section/group from the old class.
      if (id === "classId") {
        updated.sectionId = null;
        updated.groupId = null;
      }
      return updated;
    });
  };

  const pending =
    !sameFilters(toFilters(draft), filters) || searchDraft !== search;
  const touched =
    !sameFilters(toFilters(draft), []) || filters.length > 0 || search !== "";

  const renderFilter = (
    id: FilterId,
    label: string,
    options: Option[],
    disabled = false,
    disabledHint?: string,
  ) => (
    <div className="space-y-1.5" key={id}>
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Select
        items={options}
        // `items` is what makes the trigger show the label instead of the raw
        // value, which is why "All …" and the id-based options render as names.
        value={draft[id]}
        onValueChange={(next) => setDraftValue(id, next as string | null)}
        disabled={disabled}
      >
        <SelectTrigger
          size="sm"
          className="w-full min-w-32 cursor-pointer disabled:cursor-not-allowed"
        >
          <SelectValue placeholder={disabledHint ?? `All ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {/* null clears the filter — otherwise the value itself is rendered */}
          <SelectItem className="cursor-pointer" value={null}>
            All {label}
          </SelectItem>
          {options.map((option) => (
            <SelectItem
              className="cursor-pointer"
              key={option.value}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="px-3 pt-3 space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search student..."
          className="pl-10"
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onFiltersChange(toFilters(draft));
              onSearchChange(searchDraft);
            }
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {renderFilter("classId", "Class", classOptions)}
        {renderFilter(
          "sectionId",
          "Section",
          sectionOptions,
          !hasClass,
          hasClass ? undefined : "Select a class first",
        )}
        {renderFilter(
          "groupId",
          "Group",
          groupOptions,
          !hasClass,
          hasClass ? undefined : "Select a class first",
        )}
        {renderFilter("gender", "Gender", GENDERS)}
        {renderFilter("status", "Status", STATUSES)}
        {renderFilter("religion", "Religion", religionOptions)}
      </div>

      <div className="flex items-center justify-end gap-2">
        {touched && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs cursor-pointer"
            onClick={() => {
              setDraft(EMPTY_DRAFT);
              setSearchDraft("");
              onFiltersChange([]);
              onSearchChange("");
            }}
          >
            <RotateCcw />
            Reset
          </Button>
        )}
        <Button
          size="sm"
          className="h-8 px-3 text-xs cursor-pointer"
          disabled={!pending}
          onClick={() => {
            onFiltersChange(toFilters(draft));
            onSearchChange(searchDraft);
          }}
        >
          <Search />
          Search
        </Button>
      </div>
    </div>
  );
}

/** Ids of the filter-only columns, hidden by default in the table. */
export const HIDDEN_FILTER_COLUMNS = {
  classId: false,
  sectionId: false,
  groupId: false,
  gender: false,
  religion: false,
} as const;
