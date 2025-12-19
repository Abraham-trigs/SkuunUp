// app/hooks/useDebounce.ts
// Purpose: Generic debounce hook for any value (used for debounced activeItem tracking)

import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay = 100): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
