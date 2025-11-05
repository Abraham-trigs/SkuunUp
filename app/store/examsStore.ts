// stores/examStore.ts
// Zustand store for managing exams with full pagination, search, CRUD, and built-in debounce for search

import { create } from "zustand";
import { Exam } from "@prisma/client";

interface ExamState {
  exams: Exam[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  fetchExams: (options?: {
    search?: string;
    page?: number;
    limit?: number;
    studentId?: string;
  }) => void;
  createExam: (data: Partial<Exam>) => Promise<Exam | null>;
  updateExam: (id: string, data: Partial<Exam>) => Promise<Exam | null>;
  deleteExam: (id: string) => Promise<boolean>;
  reset: () => void;
}

export const useExamStore = create<ExamState>((set, get) => {
  // Debounce helper
  let searchTimeout: NodeJS.Timeout | null = null;
  const debounce = (fn: () => void, delay = 300) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(fn, delay);
  };

  return {
    exams: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    loading: false,
    error: null,

    fetchExams: ({ search = "", page = 1, limit = 20, studentId } = {}) => {
      debounce(async () => {
        set({ loading: true, error: null });
        try {
          const params = new URLSearchParams();
          if (search) params.append("search", search);
          params.append("page", String(page));
          params.append("limit", String(limit));
          if (studentId) params.append("studentId", studentId);

          const res = await fetch(`/api/exams?${params.toString()}`);
          const json = await res.json();

          if (res.ok) {
            set({
              exams: json.data,
              total: json.total,
              page,
              limit,
              totalPages: json.totalPages,
            });
          } else {
            set({ error: json.error });
          }
        } catch (err: any) {
          set({ error: err.message });
        } finally {
          set({ loading: false });
        }
      }, 300); // debounce delay 300ms
    },

    createExam: async (data) => {
      try {
        const res = await fetch("/api/exams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (res.ok) {
          // Refetch first page for consistency
          await get().fetchExams({ page: 1, limit: get().limit });
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

    updateExam: async (id, data) => {
      try {
        const res = await fetch(`/api/exams/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (res.ok) {
          set({
            exams: get().exams.map((e) => (e.id === id ? json.data : e)),
          });
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

    deleteExam: async (id) => {
      try {
        const res = await fetch(`/api/exams/${id}`, { method: "DELETE" });
        const json = await res.json();
        if (res.ok) {
          await get().fetchExams({ page: get().page, limit: get().limit });
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

    reset: () =>
      set({
        exams: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        loading: false,
        error: null,
      }),
  };
});
