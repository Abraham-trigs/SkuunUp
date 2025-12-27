// app/staff/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EditStaffModal from "./components/EditStaffModal.tsx";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal.tsx";
import { useStaffStore, Staff } from "@/app/store/useStaffStore.ts";
import StaffProfileForm from "../staff/components/StaffProfileForm.tsx";

export default function StaffPage() {
  const router = useRouter();
  const {
    staffList,
    page,
    search,
    loading,
    error,
    setPage,
    setSearch,
    fetchStaffDebounced,
    totalPages,
  } = useStaffStore();

  const safeStaffList = staffList ?? [];

  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState<Staff | null>(null);

  // Add Staff modal state
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    fetchStaffDebounced(page, search);
  }, [page, search, fetchStaffDebounced]);

  const handleEditClick = (e: React.MouseEvent, staff: Staff) => {
    e.stopPropagation();
    setSelectedStaff(staff);
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setTimeout(() => setSelectedStaff(null), 120);
  };

  const handleDeleteClick = (e: React.MouseEvent, staff: Staff) => {
    e.stopPropagation();
    setSelectedToDelete(staff);
  };

  const closeDelete = () => setSelectedToDelete(null);

  const goToDetail = (id: string) => router.push(`/dashboard/staff/${id}`);

  const handleAddSuccess = (newStaff: any) => {
    console.log("Staff created:", newStaff);
    setIsAddOpen(false);
    fetchStaffDebounced(page, search);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen text-white mt-10 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1
            className="text-4xl font-black tracking-tight"
            style={{ color: "#BFCDEF" }}
          >
            STAFF
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div
              className="h-1 w-8 rounded-full"
              style={{ backgroundColor: "#6BE8EF" }}
            />
            <p className="opacity-60 text-xs uppercase tracking-widest font-bold">
              Personnel Directory
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72 group">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 group-focus-within:text-[#6BE8EF] transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search personnel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ backgroundColor: "#1c376e", borderColor: "#BFCDEF33" }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-[#6BE8EF] focus:outline-none transition-all placeholder:text-[#BFCDEF]/20 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            style={{ backgroundColor: "#6BE8EF", color: "#03102b" }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest hover:scale-[1.03] transition-all shadow-lg shadow-[#6BE8EF]/10"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Staff
          </button>
        </div>
      </div>

      {/* Staff List / Loading State */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#6BE8EF] border-t-transparent rounded-full animate-spin" />
          <p
            style={{ color: "#BFCDEF" }}
            className="text-xs font-bold uppercase tracking-widest opacity-60"
          >
            Accessing Records...
          </p>
        </div>
      ) : error ? (
        <div
          style={{ backgroundColor: "#E74C3C10", borderColor: "#E74C3C40" }}
          className="p-6 border rounded-2xl text-center text-[#E74C3C] font-bold uppercase tracking-wider text-xs"
        >
          {error}
        </div>
      ) : safeStaffList.length === 0 ? (
        <div
          style={{ backgroundColor: "#1c376e20" }}
          className="p-20 border border-dashed border-[#1c376e] rounded-2xl text-center opacity-40 italic text-sm"
        >
          No personnel records found.
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div
            style={{ backgroundColor: "#03102b", borderColor: "#1c376e" }}
            className="hidden md:block border rounded-2xl overflow-hidden shadow-2xl"
          >
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr
                  style={{ backgroundColor: "#1c376e" }}
                  className="text-[#BFCDEF] uppercase text-[10px] font-black tracking-[0.2em]"
                >
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Position</th>
                  <th className="px-6 py-4">Assigned Class</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {safeStaffList.map((staff) => (
                  <tr
                    key={staff.id}
                    onClick={() => goToDetail(staff.id)}
                    className="group hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <td className="px-6 py-4 font-bold text-[#BFCDEF] group-hover:text-[#6BE8EF] transition-colors">
                      {staff.user.name}
                    </td>
                    <td className="px-6 py-4 opacity-60 font-mono text-xs">
                      {staff.user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-[#BFCDEF]/10 text-[#BFCDEF] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border border-[#BFCDEF]/10">
                        {staff.position || "Teacher"}
                      </span>
                    </td>
                    <td className="px-6 py-4 opacity-80">
                      {staff.class?.name || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={(e) => handleEditClick(e, staff)}
                          className="p-2 rounded-lg hover:bg-white/10 text-[#BFCDEF] transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(e, staff)}
                          className="p-2 rounded-lg hover:bg-[#E74C3C]/20 text-[#E74C3C] transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-4">
            {safeStaffList.map((staff) => (
              <div
                key={staff.id}
                onClick={() => goToDetail(staff.id)}
                style={{ backgroundColor: "#03102b", borderColor: "#1c376e" }}
                className="border rounded-2xl p-5 shadow-lg active:scale-95 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-black text-[#BFCDEF] uppercase tracking-tight">
                      {staff.user.name}
                    </p>
                    <p className="text-[#BFCDEF] opacity-40 text-xs font-mono">
                      {staff.user.email}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => handleEditClick(e, staff)}
                      className="p-2 text-[#BFCDEF]"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, staff)}
                      className="p-2 text-[#E74C3C]"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[#BFCDEF]/5 text-[#BFCDEF] px-3 py-1 rounded-lg text-[10px] font-bold uppercase border border-[#BFCDEF]/10">
                    Pos: {staff.position || "Teacher"}
                  </span>
                  <span className="bg-[#6BE8EF]/10 text-[#6BE8EF] px-3 py-1 rounded-lg text-[10px] font-bold uppercase border border-[#6BE8EF]/10">
                    Class: {staff.class?.name || "N/A"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages() > 1 && (
        <div className="flex items-center justify-end gap-3 mt-8">
          <button
            onClick={() => setPage(Math.max(page - 1, 1))}
            disabled={page === 1}
            style={{ borderColor: "#1c376e" }}
            className="p-2 rounded-xl border hover:bg-white/5 disabled:opacity-20 transition-all text-[#BFCDEF]"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div
            style={{ backgroundColor: "#1c376e", color: "#6BE8EF" }}
            className="px-5 py-1.5 rounded-xl text-xs font-black border border-[#6BE8EF]/20"
          >
            {page} / {totalPages()}
          </div>
          <button
            onClick={() => setPage(Math.min(page + 1, totalPages()))}
            disabled={page === totalPages()}
            style={{ borderColor: "#1c376e" }}
            className="p-2 rounded-xl border hover:bg-white/5 disabled:opacity-20 transition-all text-[#BFCDEF]"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Add Staff Modal Overlay */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div
            style={{ backgroundColor: "#03102b", borderColor: "#1c376e" }}
            className="border rounded-2xl max-w-2xl w-full p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <button
              className="absolute top-6 right-6 text-[#BFCDEF] opacity-40 hover:opacity-100 transition-opacity"
              onClick={() => setIsAddOpen(false)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="mb-8">
              <h2
                style={{ color: "#BFCDEF" }}
                className="text-2xl font-black uppercase tracking-tighter"
              >
                Add Staff Member
              </h2>
              <div
                className="h-1 w-12 rounded-full mt-2"
                style={{ backgroundColor: "#6BE8EF" }}
              />
            </div>
            <StaffProfileForm onSuccess={handleAddSuccess} />
          </div>
        </div>
      )}

      {/* Modals for Edit/Delete follow same pattern... */}
    </div>
  );
}
