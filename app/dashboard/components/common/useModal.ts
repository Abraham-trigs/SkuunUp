"use client";

import { useState, useCallback } from "react";

/**
 * A reusable hook for managing modal state with associated data.
 * @template T The type of data the modal will handle (e.g., Exam, Student)
 */
export function useModal<T = any>() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((item?: T) => {
    if (item) setData(item);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Slight delay to prevent content "flicker" during exit animations
    setTimeout(() => setData(null), 200);
  }, []);

  return { isOpen, data, open, close, setData };
}
