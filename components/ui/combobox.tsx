"use client";

import { useId, useMemo, useState } from "react";
import { Check, CaretDown as ChevronDown, MagnifyingGlass as Search } from "@phosphor-icons/react/ssr";


import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils/utils";

export type ComboboxOption = {
  label: string;
  value: string;
  /** right-aligned secondary text, e.g. a roll number or count */
  hint?: string;
};

/**
 * Searchable select built from Popover + Input.
 *
 * `cmdk` is not a dependency, so the list is a plain filtered list with its own
 * keyboard handling: type to narrow, ↑/↓ to move, Enter to pick. `value = null`
 * means "nothing chosen" and renders the placeholder — pass `clearLabel` to get
 * an explicit "All …" row that resets it.
 */
export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyMessage = "No results.",
  clearLabel,
  disabled = false,
  size = "default",
  className,
  id,
  invalid = false,
  describedBy,
}: {
  options: ComboboxOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  clearLabel?: string;
  disabled?: boolean;
  size?: "sm" | "default";
  className?: string;
  /** id for the trigger, so a <label for> points at it */
  id?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();

  const selected = options.find((option) => option.value === value) ?? null;

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(term),
    );
  }, [options, query]);

  const choose = (next: string | null) => {
    onValueChange(next);
    setOpen(false);
    setQuery("");
    setActive(0);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const pick = filtered[active];
      if (pick) choose(pick.value);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery("");
          setActive(0);
        }
      }}
    >
      <PopoverTrigger asChild disabled={disabled}>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-label={placeholder}
          disabled={disabled}
          className={cn(
            "flex w-full cursor-pointer items-center justify-between gap-1.5 rounded-md border border-input bg-transparent px-2.5 text-left text-sm whitespace-nowrap transition-colors outline-none select-none",
            "hover:bg-input/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:bg-input/30 dark:hover:bg-input/50",
            size === "sm" ? "h-7 rounded-[min(var(--radius-md),10px)] text-[13px]" : "h-8",
            className,
          )}
        >
          <span
            className={cn(
              "line-clamp-1 min-w-0 flex-1",
              selected ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-(--radix-popover-trigger-width) min-w-56 gap-0 p-0"
      >
        <div className="relative border-b p-1.5">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={searchPlaceholder}
            className="h-8 border-0 pl-8 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
        </div>

        <div
          id={listId}
          role="listbox"
          className="max-h-60 overflow-y-auto p-1"
        >
          {clearLabel && (
            <Row
              label={clearLabel}
              muted
              selected={value === null}
              onClick={() => choose(null)}
            />
          )}

          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            filtered.map((option, index) => (
              <Row
                key={option.value}
                label={option.label}
                hint={option.hint}
                selected={option.value === value}
                active={index === active}
                onClick={() => choose(option.value)}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Row({
  label,
  hint,
  selected,
  active,
  muted,
  onClick,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  active?: boolean;
  muted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
        active ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
        selected && "font-medium",
        muted && "text-muted-foreground",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {hint && (
        <span className="shrink-0 text-[11px] text-muted-foreground">{hint}</span>
      )}
      {selected && <Check className="size-3.5 shrink-0 text-foreground" />}
    </button>
  );
}
