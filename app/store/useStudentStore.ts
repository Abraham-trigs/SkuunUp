// app/stores/studentStore.ts
"use client";

import { create } from "zustand";
import { useAuthStore } from "./useAuthStore.ts";
import { API_ENDPOINTS } from "@/lib/api/endpoints.ts";

// ------------------ Types ------------------
export type StudentListItem = {
  id: string;
  userId: string;
  name: string;
  email: string;
  classId?: string;
  className?: string;
  gradeId?: string;
  gradeName?: string;
  admissionId?: string;
};

export type StudentDetail = StudentListItem & {
  attendance: any[];
  exams: any[];
  parents: any[];
  borrows: any[];
  transactions: any[];
  purchases: any[];
};

// ------------------ Store Interface ------------------
interface StudentStore {
  students: StudentListItem[];
  studentDetail: StudentDetail | null;
  loading: boolean;
  errors: Record<string, string[]>;
  pagination: { page: number; perPage: number; total: number; totalPages: number };
  filters: { search?: string; sortBy?: string; sortOrder?: "asc" | "desc"; classId?: string; gradeId?: string };

  fetchStudents: (options?: Partial<StudentStore["filters"]> & { page?: number; perPage?: number }) => Promise<void>;
  fetchStudentDetail: (id: string) => Promise<void>;
  createStudent: (userId: string, classId?: string, gradeId?: string) => Promise<void>;
  updateStudent: (id: string, data: { classId?: string; gradeId?: string }) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  setFilters: (filters: Partial<StudentStore["filters"]>) => void;
  resetStore: () => void;
}

// ------------------ Store Implementation ------------------
export const useStudentStore = create<StudentStore>((set, get) => ({
  students: [],
  studentDetail: null,
  loading: false,
  errors: {},
  pagination: { page: 1, perPage: 20, total: 0, totalPages: 1 },
  filters: { search: "", sortBy: "surname", sortOrder: "asc" },

  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),

  resetStore: () =>
    set({
      students: [],
      studentDetail: null,
      loading: false,
      errors: {},
      pagination: { page: 1, perPage: 20, total: 0, totalPages: 1 },
      filters: { search: "", sortBy: "surname", sortOrder: "asc" },
    }),

  fetchStudents: async ({ page, perPage, ...filters } = {}) => {
    set({ loading: true, errors: {} });
    try {
      const schoolId = useAuthStore.getState().user?.school?.id;
      if (!schoolId) throw new Error("Unauthorized: missing school ID");

      const query = new URLSearchParams({
        page: (page || get().pagination.page).toString(),
        perPage: (perPage || get().pagination.perPage).toString(),
        sortBy: filters.sortBy || get().filters.sortBy || "surname",
        sortOrder: filters.sortOrder || get().filters.sortOrder || "asc",
      });

      if (filters.search) query.append("search", filters.search);
      if (filters.classId) query.append("classId", filters.classId);
      if (filters.gradeId) query.append("gradeId", filters.gradeId);

      const res = await fetch(`${API_ENDPOINTS.students}?${query.toString()}`, {
        headers: { "X-School-ID": schoolId },
      });

      if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);
      const data = await res.json();

      set({ students: data.students, pagination: data.pagination, filters: { ...get().filters, ...filters } });
    } catch (err: any) {
      set({ errors: { fetchStudents: [err.message || "Fetch failed"] } });
    } finally {
      set({ loading: false });
    }
  },

  fetchStudentDetail: async (id) => {
    set({ loading: true, errors: {} });
    try {
      const schoolId = useAuthStore.getState().user?.school?.id;
      if (!schoolId) throw new Error("Unauthorized: missing school ID");

      const res = await fetch(`${API_ENDPOINTS.students}/${id}`, { headers: { "X-School-ID": schoolId } });
      if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);
      const data = await res.json();

      set({ studentDetail: data.student });
      // admissions are NOT auto-loaded here
    } catch (err: any) {
      set({ errors: { fetchStudentDetail: [err.message || "Fetch failed"] } });
    } finally {
      set({ loading: false });
    }
  },

  createStudent: async (userId, classId, gradeId) => {
    set({ loading: true, errors: {} });
    try {
      const schoolId = useAuthStore.getState().user?.school?.id;
      if (!schoolId) throw new Error("Unauthorized: missing school ID");

      const res = await fetch(API_ENDPOINTS.students, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-School-ID": schoolId },
        body: JSON.stringify({ userId, classId, gradeId }),
      });

      if (!res.ok) throw new Error(`Create failed: ${res.statusText}`);
      const data = await res.json();

      set({ students: [data.student, ...get().students] });
    } catch (err: any) {
      set({ errors: { createStudent: [err.message || "Create failed"] } });
    } finally {
      set({ loading: false });
    }
  },

  updateStudent: async (id, data) => {
    set({ loading: true, errors: {} });
    try {
      const schoolId = useAuthStore.getState().user?.school?.id;
      if (!schoolId) throw new Error("Unauthorized: missing school ID");

      const res = await fetch(`${API_ENDPOINTS.students}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-School-ID": schoolId },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error(`Update failed: ${res.statusText}`);
      const updated = (await res.json()).student;

      set({
        students: get().students.map((s) => (s.id === updated.id ? updated : s)),
        studentDetail: get().studentDetail?.id === updated.id ? updated : get().studentDetail,
      });
    } catch (err: any) {
      set({ errors: { updateStudent: [err.message || "Update failed"] } });
    } finally {
      set({ loading: false });
    }
  },

  deleteStudent: async (id) => {
    set({ loading: true, errors: {} });
    try {
      const schoolId = useAuthStore.getState().user?.school?.id;
      if (!schoolId) throw new Error("Unauthorized: missing school ID");

      const res = await fetch(`${API_ENDPOINTS.students}/${id}`, {
        method: "DELETE",
        headers: { "X-School-ID": schoolId },
      });

      if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`);
      set({
        students: get().students.filter((s) => s.id !== id),
        studentDetail: get().studentDetail?.id === id ? null : get().studentDetail,
      });
    } catch (err: any) {
      set({ errors: { deleteStudent: [err.message || "Delete failed"] } });
    } finally {
      set({ loading: false });
    }
  },
}));
