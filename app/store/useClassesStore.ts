"use client";

import { create } from "zustand";
import { Class, Student } from "@prisma/client";
import { apiClient } from "@/lib/apiClient.ts";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { notify } from "@/lib/helpers/notifications";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  timeIn?: string;
  timeOut?: string;
  remarks?: string;
}

interface ClassesStore {
  classes: Class[];
  total: number;
  page: number;
  perPage: number;
  loading: boolean;
  error: string | null;

  selectedClass: Class | null;
  students: Student[];
  attendance: AttendanceRecord[];

  search: string;
  sortBy: "name" | "studentCount" | "createdAt";
  sortOrder: "asc" | "desc";
  dateFilter?: string;
  cache: Record<string, Class[]>;

  fetchClasses: (page?: number, perPage?: number, search?: string) => Promise<void>;
  fetchClassById: (id: string) => Promise<void>;
  fetchStudents: (classId: string) => Promise<void>;
  fetchAttendance: (classId: string, date?: string) => Promise<void>;

  createClass: (name: string, grade: string) => Promise<{ success: boolean; data?: Class; error?: string }>;
  updateClass: (id: string, name?: string, grade?: string) => Promise<boolean>;
  deleteClass: (id: string) => Promise<void>;
  markAttendance: (classId: string, records: AttendanceRecord[], date?: string) => Promise<void>;

  selectClass: (cls: Class) => void;
  clearSelectedClass: () => void;

  setSearch: (search: string) => void;
  setSort: (sortBy: "name" | "studentCount" | "createdAt", sortOrder: "asc" | "desc") => void;
  setDateFilter: (date?: string) => void;
}

export const useClassesStore = create<ClassesStore>((set, get) => ({
  classes: [],
  total: 0,
  page: 1,
  perPage: 10,
  loading: false,
  error: null,

  selectedClass: null,
  students: [],
  attendance: [],
  search: "",
  sortBy: "name",
  sortOrder: "asc",
  dateFilter: undefined,
  cache: {},

  fetchClasses: async (page = get().page, perPage = get().perPage, search = get().search) => {
    set({ loading: true, error: null });
    const { sortBy, sortOrder, dateFilter, cache } = get();
    const cacheKey = `${page}-${perPage}-${search}-${sortBy}-${sortOrder}-${dateFilter}`;

    try {
      if (cache[cacheKey]) {
        set({ classes: cache[cacheKey], loading: false });
        return;
      }

      const data = await apiClient<{
        classes: Class[];
        total: number;
        page: number;
        perPage: number;
      }>(
        API_ENDPOINTS.classes +
          `?search=${encodeURIComponent(search)}&page=${page}&perPage=${perPage}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
        { method: "GET", showError: true }
      );

      // Compute fullName for staff and students
      const classesWithFullName = data.classes.map((cls: any) => ({
        ...cls,
        staff: cls.staff.map((st: any) => ({
          ...st,
          user: {
            ...st.user,
            fullName: [st.user.firstName, st.user.surname, st.user.otherNames].filter(Boolean).join(" "),
          },
        })),
        students: cls.students.map((s: any) => ({
          ...s,
          user: {
            ...s.user,
            fullName: [s.user.firstName, s.user.surname, s.user.otherNames].filter(Boolean).join(" "),
          },
        })),
      }));

      set((state) => ({
        classes: classesWithFullName,
        total: data.total,
        page: data.page,
        perPage: data.perPage,
        cache: { ...state.cache, [cacheKey]: classesWithFullName },
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchClassById: async (id) => {
    set({ loading: true });
    try {
      const data = await apiClient<Class>(`${API_ENDPOINTS.classes}/${id}`);
      set({ selectedClass: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchStudents: async (classId) => {
    set({ loading: true });
    try {
      const res = await apiClient<any[]>(`${API_ENDPOINTS.classes}/${classId}/students`);
      const normalized = res.map((s) => ({
        id: s.user?.id ?? s.id,
        studentId: s.id,
        user: {
          id: s.user?.id ?? s.id,
          fullName: [s.user?.firstName, s.user?.surname, s.user?.otherNames].filter(Boolean).join(" "),
          email: s.user?.email ?? "",
        },
        classId: s.classId ?? classId,
        enrolledAt: s.enrolledAt ?? null,
        parents: s.parents ?? [],
        exams: s.exams ?? [],
        transactions: s.transactions ?? [],
        attendances: s.attendances ?? [],
      }));
      set({ students: normalized, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchAttendance: async (classId, date) => {
    set({ loading: true });
    try {
      const data = await apiClient<AttendanceRecord[]>(`${API_ENDPOINTS.classes}/${classId}/attendance?date=${date ?? ""}`);
      set({ attendance: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  createClass: async (name, grade) => {
    set({ loading: true });
    try {
      const data = await apiClient<Class>(API_ENDPOINTS.classes, {
        method: "POST",
        body: JSON.stringify({ name, grade }),
        showSuccess: true,
        successMessage: `Class "${name}" created successfully`,
      });

      set((state) => ({
        classes: [data, ...state.classes],
        cache: {},
        loading: false,
      }));

      return { success: true, data };
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  },

  updateClass: async (id, name, grade) => {
    set({ loading: true });
    try {
      const data = await apiClient<Class>(`${API_ENDPOINTS.classes}/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name, grade }),
        showSuccess: true,
        successMessage: "Class updated successfully",
      });

      set((state) => {
        const updatedClasses = state.classes.map((c) => (c.id === id ? { ...c, ...data } : c));
        const updatedSelected = state.selectedClass?.id === id ? { ...state.selectedClass, ...data } : state.selectedClass;
        return { classes: updatedClasses, selectedClass: updatedSelected, loading: false };
      });

      return true;
    } catch (err: any) {
      notify("Failed to update class", "error");
      set({ error: err.message, loading: false });
      return false;
    }
  },

  deleteClass: async (id) => {
    set({ loading: true });
    try {
      await apiClient(`${API_ENDPOINTS.classes}/${id}`, {
        method: "DELETE",
        showSuccess: true,
        successMessage: "Class deleted successfully",
      });
      set((state) => ({
        classes: state.classes.filter((c) => c.id !== id),
        selectedClass: state.selectedClass?.id === id ? null : state.selectedClass,
        cache: {},
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  markAttendance: async (classId, records, date) => {
    set({ loading: true });
    try {
      await apiClient(`${API_ENDPOINTS.classes}/${classId}/attendance`, {
        method: "POST",
        body: JSON.stringify({ date, records }),
        showSuccess: true,
        successMessage: "Attendance recorded successfully",
      });
      await get().fetchAttendance(classId, date);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  selectClass: (cls) => set({ selectedClass: { ...cls } }),
  clearSelectedClass: () => set({ selectedClass: null }),

  setSearch: (search) => {
    set({ search, page: 1 });
    get().fetchClasses(1);
  },

  setSort: (sortBy, sortOrder) => {
    set({ sortBy, sortOrder });
    get().fetchClasses(get().page);
  },

  setDateFilter: (date) => {
    set({ dateFilter: date });
    get().fetchClasses(1);
  },
}));
