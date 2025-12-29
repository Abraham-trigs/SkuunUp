// // app/store/useStaffStore.ts
// "use client";

// import { create } from "zustand";
// import { debounce } from "lodash";
// import { apiClient } from "@/lib/apiClient";

// export interface Staff {
//   id: string;
//   userId: string;
//   user: { id: string; name: string; email: string };
//   class?: { id: string; name: string } | null;
//   department?: { id: string; name } | null;
//   position?: string | null;
//   salary?: string | null; // string now
//   hireDate?: string | null; // string now
//   createdAt: string;
//   updatedAt: string;
// }

// interface StaffPayload {
//   userId: string;
//   position: string;
//   department?: string | null;
//   classId?: string | null;
//   salary?: string | null; // always string
//   hireDate?: string | null; // always string
// }

// interface StaffState {
//   staffList: Staff[];
//   selectedStaff: Staff | null;
//   total: number;
//   page: number;
//   perPage: number;
//   search: string;

//   fetchingStaff: boolean;
//   fetchStaffError: string | null;

//   creatingStaff: boolean;
//   createStaffError: string | null;

//   updatingStaff: boolean;
//   updateStaffError: string | null;

//   deletingStaff: boolean;
//   deleteStaffError: string | null;

//   cache: Record<number, Staff[]>;

//   setPage: (page: number) => void;
//   setPerPage: (perPage: number) => void;
//   setSearch: (search: string) => void;

//   setSelectedStaff: (staff: Staff | null) => void;
//   fetchStaff: (page?: number, search?: string) => Promise<void>;
//   fetchStaffDebounced: (page?: number, search?: string) => void;

//   createStaffRecord: (staffPayload: StaffPayload) => Promise<Staff | null>;
//   updateStaff: (id: string, data: Partial<Staff>) => Promise<void>;
//   deleteStaff: (id: string, onDeleted?: () => void) => Promise<void>;
//   totalPages: () => number;
// }

// export const useStaffStore = create<StaffState>((set, get) => {
//   const fetchStaffDebounced = debounce((page?: number, search?: string) => {
//     get().fetchStaff(page, search);
//   }, 300);

//   const normalizePayload = (payload: StaffPayload): StaffPayload => ({
//     ...payload,
//     salary: payload.salary != null ? String(payload.salary) : "",
//     hireDate: payload.hireDate != null ? String(payload.hireDate) : "",
//     department: payload.department ?? "",
//     classId: payload.classId ?? "",
//   });

//   return {
//     staffList: [],
//     selectedStaff: null,
//     total: 0,
//     page: 1,
//     perPage: 10,
//     search: "",

//     fetchingStaff: false,
//     fetchStaffError: null,
//     creatingStaff: false,
//     createStaffError: null,
//     updatingStaff: false,
//     updateStaffError: null,
//     deletingStaff: false,
//     deleteStaffError: null,

//     cache: {},

//     setPage: (page) => set({ page }),
//     setPerPage: (perPage) => set({ perPage }),
//     setSearch: (search) => {
//       set({ search, page: 1 });
//       fetchStaffDebounced(1, search);
//     },

//     setSelectedStaff: (staff) => set({ selectedStaff: staff }),

//     fetchStaff: async (page = get().page, search = get().search) => {
//       const cached = get().cache[page];
//       if (cached && !search) {
//         set({ staffList: cached, page });
//         return;
//       }
//       set({ fetchingStaff: true, fetchStaffError: null });
//       try {
//         const data = await apiClient<{ staffList: Staff[]; total: number; page: number }>(
//           `/api/staff?search=${encodeURIComponent(search)}&page=${page}&perPage=${get().perPage}`
//         );
//         set((state) => ({
//           staffList: data.staffList,
//           total: data.total,
//           page: data.page,
//           cache: search === "" ? { ...state.cache, [page]: data.staffList } : state.cache,
//         }));
//       } catch (err: any) {
//         set({ fetchStaffError: err?.message || "Failed to fetch staff" });
//       } finally {
//         set({ fetchingStaff: false });
//       }
//     },

//     fetchStaffDebounced,

//     fetchStaffById: async (id: string) => {
//       set({ fetchingStaff: true, fetchStaffError: null });
//       try {
//         const existing = get().staffList.find((s) => s.id === id);
//         if (existing) {
//           set({ selectedStaff: existing });
//           return existing;
//         }

//         const fetched = await apiClient<Staff>(`/api/staff/${id}`);
//         set({ selectedStaff: fetched });
//         set((state) => ({ staffList: [fetched, ...state.staffList.filter((s) => s.id !== id)] }));
//         return fetched;
//       } catch (err: any) {
//         set({ fetchStaffError: err?.message || "Failed to fetch staff by id" });
//         return null;
//       } finally {
//         set({ fetchingStaff: false });
//       }
//     },

//     createStaffRecord: async (staffPayload) => {
//       if (!staffPayload.userId) throw new Error("Missing userId for staff creation");
//       set({ creatingStaff: true, createStaffError: null });
//       try {
//         const payload = normalizePayload(staffPayload);
//         const newStaff = await apiClient<Staff>("/api/staff", {
//           method: "POST",
//           body: JSON.stringify(payload),
//         });
//         set((state) => ({
//           staffList: [newStaff, ...state.staffList],
//           total: state.total + 1,
//         }));
//         return newStaff;
//       } catch (err: any) {
//         set({ createStaffError: err?.message || "Failed to create staff" });
//         return null;
//       } finally {
//         set({ creatingStaff: false });
//       }
//     },

//     updateStaff: async (id, data) => {
//       set({ updatingStaff: true, updateStaffError: null });
//       const normalized = {
//         ...data,
//         salary: data.salary != null ? String(data.salary) : "",
//         hireDate: data.hireDate != null ? String(data.hireDate) : "",
//       };
//       set((state) => ({
//         staffList: state.staffList.map((s) => (s.id === id ? { ...s, ...normalized } : s)),
//         selectedStaff: state.selectedStaff?.id === id ? { ...state.selectedStaff, ...normalized } : state.selectedStaff,
//       }));
//       try {
//         await apiClient(`/api/staff/${id}`, { method: "PUT", body: JSON.stringify(normalized) });
//       } catch (err: any) {
//         set({ updateStaffError: err?.message || "Failed to update staff" });
//         get().fetchStaff();
//       } finally {
//         set({ updatingStaff: false });
//       }
//     },

//     deleteStaff: async (id, onDeleted) => {
//       set({ deletingStaff: true, deleteStaffError: null });
//       try {
//         const res = await apiClient<{ success: boolean; error?: any }>(`/api/staff/${id}`, { method: "DELETE" });
//         if (res.success) {
//           set((state) => ({
//             staffList: state.staffList.filter((s) => s.id !== id),
//             selectedStaff: state.selectedStaff?.id === id ? null : state.selectedStaff,
//             total: Math.max(0, state.total - 1),
//             cache: Object.fromEntries(
//               Object.entries(state.cache).map(([k, list]) => [k, list.filter((s) => s.id !== id)])
//             ),
//           }));
//           if (onDeleted) onDeleted();
//         } else {
//           set({ deleteStaffError: res.error?.message || "Failed to delete staff" });
//         }
//       } catch (err: any) {
//         set({ deleteStaffError: err?.message || "Failed to delete staff" });
//       } finally {
//         set({ deletingStaff: false });
//       }
//     },

//     totalPages: () => Math.ceil(get().total / get().perPage),
//   };
// });
