// stores/subjectStore.ts
// Manages Subject state, CRUD operations, and pagination/search

import { create } from "zustand";
import { Subject } from "@prisma/client";

interface SubjectState {
  subjects: Subject[];
  total: number;
  loading: boolean;
  error: string | null;
  fetchSubjects: (options?: { search?: string; page?: number; limit?: number }) => Promise<void>;
  createSubject: (data: Partial<Subject>) => Promise<Subject | null>;
  updateSubject: (id: string, data: Partial<Subject>) => Promise<Subject | null>;
  deleteSubject: (id: string) => Promise<boolean>;
  reset: () => void;
}

export const useSubjectStore = create<SubjectState>((set, get) => ({
  subjects: [],
  total: 0,
  loading: false,
  error: null,

  fetchSubjects: async ({ search = "", page = 1, limit = 20 } = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      params.append("page", String(page));
      params.append("limit", String(limit));

      const res = await fetch(`/api/subjects?${params.toString()}`);
      const json = await res.json();

      if (res.ok) set({ subjects: json.data, total: json.total });
      else set({ error: json.error });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  createSubject: async (data) => {
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        set({ subjects: [json.data, ...get().subjects] });
        return json.data;
      } else {
        set({ error: json.error });
        return null;
      }
    } catch (err: any) {
      set({ error: err.message });
      return null;
    }
  },

  updateSubject: async (id, data) => {
    try {
      const res = await fetch(`/api/subjects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        set({ subjects: get().subjects.map((s) => (s.id === id ? json.data : s)) });
        return json.data;
      } else {
        set({ error: json.error });
        return null;
      }
    } catch (err: any) {
      set({ error: err.message });
      return null;
    }
  },

  deleteSubject: async (id) => {
    try {
      const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        set({ subjects: get().subjects.filter((s) => s.id !== id) });
        return true;
      } else {
        set({ error: json.error });
        return false;
      }
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },

  reset: () => set({ subjects: [], total: 0, loading: false, error: null }),
}));
