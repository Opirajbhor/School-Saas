// useSearch.ts
import { useState, useMemo } from "react";

export const useSearch = <T>(
  items: T[] | null | undefined,
  searchFields: (keyof T)[],
) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (!searchTerm.trim()) return items;

    const query = searchTerm.toLowerCase().trim();
    return items.filter((item) =>
      searchFields.some((field) =>
        String(item[field]).toLowerCase().includes(query),
      ),
    );
  }, [items, searchTerm, searchFields]);

  return { searchTerm, setSearchTerm, filteredItems };
};
