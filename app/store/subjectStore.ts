// app/stores/subjectStore.ts
// Purpose: Zustand store to manage Subjects with pagination, search, filters, and CRUD operations

import { create } from "zustand";
import { Subject } from "@prisma/client";

interface SubjectFilters {
  classId?: string;
  staffId?: string;
  fromDate?: string; // ISO string
  toDate?: string;   // ISO string
}

interface SubjectStoreState {
  subjects: Subject[];
  total: number;
  page: number;
  limit: number;
  search: string;
  filters: SubjectFilters;
  loading: boolean;
  error: string | null;

  fetchSubjects: (page?: number, search?: string, filters?: SubjectFilters) => Promise<void>;
  createSubject: (data: { name: string; code?: string | null }) => Promise<Subject | void>;
  updateSubject: (id: string, data: { name?: string; code?: string | null }) => Promise<Subject | void>;
  deleteSubject: (id: string) => Promise<void>;
  setSearch: (search: string) => void;
  setFilters: (filters: SubjectFilters) => void;
}

export const useSubjectStore = create<SubjectStoreState>((set, get) => ({
  subjects: [],
  total: 0,
  page: 1,
  limit: 20,
  search: "",
  filters: {},
  loading: false,
  error: null,

  fetchSubjects: async (page = get().page, search = get().search, filters = get().filters) => {
    set({ loading: true, error: null });

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(get().limit),
      });
      if (search) params.append("search", search);
      if (filters.classId) params.append("classId", filters.classId);
      if (filters.staffId) params.append("staffId", filters.staffId);
      if (filters.fromDate) params.append("fromDate", filters.fromDate);
      if (filters.toDate) params.append("toDate", filters.toDate);

      const res = await fetch(`/api/subjects?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch subjects");

      set({ subjects: json.data, total: json.meta.total, page, search, filters });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  createSubject: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json.error) || "Failed to create subject");

      set((state) => ({ subjects: [json, ...state.subjects], total: state.total + 1 }));
      return json;
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  updateSubject: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/subjects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json.error) || "Failed to update subject");

      set((state) => ({
        subjects: state.subjects.map((s) => (s.id === id ? json : s)),
      }));
      return json;
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  deleteSubject: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete subject");

      set((state) => ({
        subjects: state.subjects.filter((s) => s.id !== id),
        total: state.total - 1,
      }));
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  setSearch: (search) => set({ search }),

  setFilters: (filters: SubjectFilters) => set({ filters }),
}));

/*
Design reasoning:
- Introduced flexible filter options (classId, staffId, date range) to enable refined search.
- Pagination and search remain supported for large datasets.
- Optimistic updates after create/update/delete ensure smooth UI.

Structure:
- subjects, total, page, limit, search, filters: state
- loading, error: UI feedback
- fetchSubjects: supports pagination, search, and filters
- createSubject/updateSubject/deleteSubject: CRUD
- setSearch/setFilters: update search/filter state

Implementation guidance:
- Call fetchSubjects() whenever filters or search term change.
- Can implement debounce on search to minimize API calls.
- Infinite scroll is possible by incrementing page and appending subjects.

Scalability insight:
- Can easily extend filters with additional parameters (e.g., department, term, semester).
- Supports infinite scroll or server-side filtering for very large datasets without refactoring store.
*/
