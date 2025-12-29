"use client";

import { create } from "zustand";
import axios from "axios";
import { Class, Grade, Application } from "@/generated/prisma";
import { useStudentStore, StudentListItem } from "./useStudentStore";

// ------------------ Types ------------------
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export type AttendanceRecord = {
  studentId: string;
  status: AttendanceStatus;
  timeIn?: string;
  timeOut?: string;
  remarks?: string;
};

// Extend Prisma Class with optional students
export type ClassWithStudents = Class & { students?: StudentListItem[] };

// Include Applications in Grade for type safety
export type GradeWithApplications = Grade & { Application?: Application[] };

interface ClassesStore {
  classes: ClassWithStudents[];
  total: number;
  page: number;
  perPage: number;
  loading: boolean;
  error: string | null;

  selectedClass: ClassWithStudents | null;
  students: StudentListItem[];
  attendance: AttendanceRecord[];
  grades: GradeWithApplications[];

  search: string;
  sortBy: "name" | "createdAt" | "studentCount";
  sortOrder: "asc" | "desc";
  dateFilter?: string;
  cache: Record<string, ClassWithStudents[]>;

  // ------------------ Fetching ------------------
  fetchClasses: (page?: number, perPage?: number, search?: string) => Promise<void>;
  fetchClassById: (id: string) => Promise<void>;
  fetchStudents: (classId: string) => Promise<void>;
  fetchAttendance: (classId: string, date?: string) => Promise<void>;

  // ------------------ Mutations ------------------
  createClass: (
    name: string
  ) => Promise<{ success: boolean; data?: Class; error?: string }>;

  updateClass: (
    id: string,
    name?: string
  ) => Promise<{ success: boolean; data?: Class; error?: string }>;

  deleteClass: (id: string) => Promise<void>;

  createGrade: (classId: string, name: string) => Promise<GradeWithApplications | null>;
  updateGrade: (classId: string, gradeId: string, name: string) => Promise<GradeWithApplications | null>;
  deleteGrade: (classId: string, gradeId: string) => Promise<boolean>;

  markAttendance: (
    classId: string,
    records: AttendanceRecord[],
    date?: string
  ) => Promise<void>;

  // ------------------ Helpers ------------------
  selectClass: (cls: ClassWithStudents) => void;
  clearSelectedClass: () => void;

  setClassData: (updatedClass: ClassWithStudents) => void;

  setSearch: (search: string) => void;
  setSort: (sortBy: "name" | "createdAt" | "studentCount", sortOrder: "asc" | "desc") => void;
  setDateFilter: (date?: string) => void;

  sortClassesByClientKey: (key: "name" | "studentCount", order: "asc" | "desc") => void;
}

// ------------------ Store ------------------
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
  grades: [],

  search: "",
  sortBy: "name",
  sortOrder: "asc",
  dateFilter: undefined,
  cache: {},

  // ------------------ Fetching ------------------
  fetchClasses: async (page = get().page, perPage = get().perPage, search = get().search) => {
    set({ loading: true, error: null });
    const { sortBy, sortOrder, dateFilter, cache } = get();
    const cacheKey = `${page}-${perPage}-${search}-${sortBy}-${sortOrder}-${dateFilter}`;

    try {
      if (cache[cacheKey]) {
        set({ classes: cache[cacheKey], loading: false });
        return;
      }

      const res = await axios.get(
        `/api/classes?page=${page}&perPage=${perPage}&search=${encodeURIComponent(search)}`
      );

      const normalized: ClassWithStudents[] = res.data.classes.map((cls: any) => ({
        ...cls,
        students: cls.students || [],
      }));

      set((state) => ({
        classes: normalized,
        total: res.data.total,
        page: res.data.page,
        perPage: res.data.perPage,
        cache: { ...state.cache, [cacheKey]: normalized },
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, loading: false });
    }
  },

  fetchClassById: async (id) => {
    set({ loading: true });
    try {
      const res = await axios.get(`/api/classes/${id}`);
      const cls: ClassWithStudents = { ...res.data, students: res.data.students || [] };

      // Ensure grades include Applications
      const grades: GradeWithApplications[] = (res.data.grades || []).map((g: any) => ({
        ...g,
        Application: g.Application || [],
      }));

      set({
        selectedClass: cls,
        grades,
        students: cls.students || [],
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, loading: false });
    }
  },

  fetchStudents: async (classId) => {
    set({ loading: true });
    try {
      const studentStore = useStudentStore.getState();
      await studentStore.fetchStudents(1, 50, "");
      set({
        students: studentStore.students.filter((s) => s.classId === classId),
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, loading: false });
    }
  },

  fetchAttendance: async (classId, date) => {
    set({ loading: true });
    try {
      const res = await axios.get(`/api/classes/${classId}/attendance?date=${date ?? ""}`);
      set({ attendance: res.data || [], loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, loading: false });
    }
  },

  // ------------------ Mutations ------------------
  createClass: async (name) => {
    set({ loading: true });
    try {
      const res = await axios.post("/api/classes", { name });
      set((state) => ({
        classes: [res.data, ...state.classes],
        cache: {},
        loading: false,
      }));
      return { success: true, data: res.data };
    } catch (err: any) {
      const error = err.response?.data?.error || err.message;
      set({ error, loading: false });
      return { success: false, error };
    }
  },

  updateClass: async (id, name) => {
    set({ loading: true });
    try {
      const res = await axios.put(`/api/classes/${id}`, { name });
      const updatedClass: ClassWithStudents = res.data;

      set((state) => ({
        classes: state.classes.map((c) => (c.id === id ? { ...c, ...updatedClass } : c)),
        selectedClass:
          state.selectedClass?.id === id ? { ...state.selectedClass, ...updatedClass } : state.selectedClass,
        cache: {},
        loading: false,
      }));

      return { success: true, data: updatedClass };
    } catch (err: any) {
      const error = err.response?.data?.error || err.message;
      set({ error, loading: false });
      return { success: false, error };
    }
  },

  setClassData: (updatedClass) => {
    set((state) => ({
      classes: state.classes.map((c) => (c.id === updatedClass.id ? { ...c, ...updatedClass } : c)),
      selectedClass:
        state.selectedClass?.id === updatedClass.id
          ? { ...state.selectedClass, ...updatedClass }
          : state.selectedClass,
      cache: {},
    }));
  },

  deleteClass: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`/api/classes/${id}`);
      set((state) => ({
        classes: state.classes.filter((c) => c.id !== id),
        selectedClass: state.selectedClass?.id === id ? null : state.selectedClass,
        cache: {},
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, loading: false });
    }
  },

  // ------------------ Grades & Attendance ------------------
  createGrade: async (classId, name) => {
    try {
      const res = await axios.post(`/api/classes/${classId}/grades`, { name });
      set({ grades: res.data.grades || [] });
      return res.data.grades?.at(-1) ?? null;
    } catch {
      return null;
    }
  },

  updateGrade: async (classId, gradeId, name) => {
    try {
      const res = await axios.put(`/api/classes/${classId}/grades/${gradeId}`, { name });
      set({ grades: res.data.grades || [] });
      return res.data.grades?.find((g: GradeWithApplications) => g.id === gradeId) ?? null;
    } catch {
      return null;
    }
  },

  deleteGrade: async (classId, gradeId) => {
    try {
      await axios.delete(`/api/classes/${classId}/grades/${gradeId}`);
      set((state) => ({ grades: state.grades.filter((g) => g.id !== gradeId) }));
      return true;
    } catch {
      return false;
    }
  },

  markAttendance: async (classId, records, date) => {
    set({ loading: true });
    try {
      await axios.post(`/api/classes/${classId}/attendance`, { date, records });
      await get().fetchAttendance(classId, date);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, loading: false });
    }
  },

  // ------------------ Helpers ------------------
  selectClass: (cls) => {
    set({ selectedClass: cls, grades: [], students: [], attendance: [] });
  },

  clearSelectedClass: () => set({ selectedClass: null, grades: [], students: [], attendance: [] }),

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

  sortClassesByClientKey: (key, order) => {
    const sorted = [...get().classes].sort((a, b) => {
      if (key === "studentCount") {
        return order === "asc"
          ? (a.students?.length || 0) - (b.students?.length || 0)
          : (b.students?.length || 0) - (a.students?.length || 0);
      }
      return 0;
    });
    set({ classes: sorted, sortBy: key as any, sortOrder: order });
  },
}));
