import { create } from "zustand";
import { Exam } from "@/generated/prisma";

interface ExamState {
  exams: Exam[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  search: string; // Added
  fetchExams: (options?: { search?: string; page?: number; perPage?: number; studentId?: string }) => void;
  createExam: (data: Partial<Exam>) => Promise<Exam | null>;
  updateExam: (id: string, data: Partial<Exam>) => Promise<Exam | null>;
  deleteExam: (id: string) => Promise<boolean>;
  setPage: (page: number) => void; // Added
  setSearch: (search: string) => void; // Added
  reset: () => void;
}

export const useExamStore = create<ExamState>((set, get) => {
  let searchTimeout: NodeJS.Timeout | null = null;

  const debounce = (fn: () => void, delay = 300) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(fn, delay);
  };

  return {
    exams: [],
    total: 0,
    page: 1,
    perPage: 20,
    totalPages: 0,
    loading: false,
    error: null,
    search: "", // Initialize

    // Actions for state management
    setPage: (page: number) => set({ page }),
    setSearch: (search: string) => set({ search }),

    fetchExams: ({ search, page, perPage, studentId } = {}) => {
      // Use provided options or fall back to current store state
      const currentSearch = search !== undefined ? search : get().search;
      const currentPage = page !== undefined ? page : get().page;
      const currentPerPage = perPage !== undefined ? perPage : get().perPage;

      debounce(async () => {
        set({ loading: true, error: null });
        try {
          const params = new URLSearchParams();
          if (currentSearch) params.append("search", currentSearch);
          params.append("page", String(currentPage));
          params.append("perPage", String(currentPerPage));
          if (studentId) params.append("studentId", studentId);

          const res = await fetch(`/api/exams?${params.toString()}`);
          const json = await res.json();

          if (res.ok) {
            const totalPages = Math.ceil(json.total / currentPerPage);
            set({
              exams: json.exams,
              total: json.total,
              page: currentPage,
              perPage: currentPerPage,
              totalPages,
            });
          } else {
            set({ error: json.error });
          }
        } catch (err: any) {
          set({ error: err.message });
        } finally {
          set({ loading: false });
        }
      }, 300);
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
          await get().fetchExams({ page: 1, perPage: get().perPage });
          return json;
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
            exams: get().exams.map((e) => (e.id === id ? json : e)),
          });
          return json;
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
        if (res.ok) {
          await get().fetchExams({ page: get().page, perPage: get().perPage });
          return true;
        } else {
          const json = await res.json();
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
        perPage: 20,
        totalPages: 0,
        loading: false,
        error: null,
        search: "",
      }),
  };
});
