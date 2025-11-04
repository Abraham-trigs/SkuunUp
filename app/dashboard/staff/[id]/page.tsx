// app/staff/[id]/page.tsx
// Purpose: Staff detail page with edit/delete functionality, ensuring redirect after deletion with manual back navigation option.

"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Staff, useStaffStore } from "@/app/store/useStaffStore";
import EditStaffModal from "../components/EditStaffModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

export default function StaffDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const {
    selectedStaff,
    fetchStaffById,
    updateStaff,
    deleteStaff,
    loading,
    error,
  } = useStaffStore();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // track deletion in progress

  // --- Fetch staff if not in store ---
  useEffect(() => {
    if (id) fetchStaffById(id as string);
  }, [id, fetchStaffById]);

  // --- Modal Handlers ---
  const handleEdit = () => setIsEditOpen(true);
  const handleDelete = () => setIsDeleteOpen(true);
  const closeEdit = () => setIsEditOpen(false);
  const closeDelete = () => setIsDeleteOpen(false);

  // --- Delete with redirect ---
  const handleDeleteConfirmed = async () => {
    if (!selectedStaff) return;
    setIsDeleting(true);
    await deleteStaff(selectedStaff.id, () => {
      router.replace("/dashboard/staff"); // redirect after deletion
    });
    setIsDeleting(false);
    closeDelete();
  };

  // --- Update in-place from edit modal ---
  const handleUpdate = (data: Partial<Staff>) => {
    if (!selectedStaff) return;
    updateStaff(selectedStaff.id, data);
  };

  // --- UI States ---
  if (loading && !selectedStaff)
    return (
      <div className="p-6 text-center text-gray-500">Loading staff...</div>
    );

  if (error)
    return (
      <div className="p-6 text-center text-red-500">
        Failed to load staff: {error}
      </div>
    );

  // Show message if staff removed or not found, but allow manual back
  if (!selectedStaff && !loading && !isDeleting)
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-gray-500">
          Staff not found or may have been removed.
        </p>
        <button
          onClick={() => router.push("/dashboard/staff")}
          className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 focus:outline-none"
        >
          Back to Staff List
        </button>
      </div>
    );

  const staff = selectedStaff;

  return (
    <div className="p-4 md:p-6 space-y-6 mt-6">
      {/* --- Header --- */}
      <header className="flex justify-between items-center flex-wrap gap-3">
        <button
          onClick={() => router.push("/dashboard/staff")}
          className="flex items-center gap-2 text-blue-600 hover:underline focus:outline-none"
        >
          <ArrowLeft size={18} /> Back to all staff
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleEdit}
            className="flex items-center gap-1 px-3 py-1 border border-blue-500 text-blue-600 rounded hover:bg-blue-50 focus:ring-2 focus:ring-blue-400 transition"
          >
            <Edit size={16} /> Edit
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 px-3 py-1 border border-red-500 text-red-600 rounded hover:bg-red-50 focus:ring-2 focus:ring-red-400 transition"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </header>

      {/* --- Profile Summary --- */}
      {staff && (
        <>
          <section
            className="bg-white shadow-sm rounded-2xl p-5 space-y-3 border border-gray-200"
            aria-labelledby="staff-profile"
          >
            <h2
              id="staff-profile"
              className="text-lg font-semibold border-b pb-2"
            >
              Staff Profile
            </h2>
            <div className="grid sm:grid-cols-2 gap-y-2 text-gray-700">
              <p>
                <span className="font-medium">Name:</span> {staff.user.name}
              </p>
              <p>
                <span className="font-medium">Email:</span> {staff.user.email}
              </p>
              <p>
                <span className="font-medium">Position:</span>{" "}
                {staff.position || "Teacher"}
              </p>
              <p>
                <span className="font-medium">Phone:</span>{" "}
                {staff.user.phone || "—"}
              </p>
            </div>
          </section>

          {/* --- Assigned Class --- */}
          <section
            className="bg-white shadow-sm rounded-2xl p-5 space-y-3 border border-gray-200"
            aria-labelledby="assigned-class"
          >
            <h2
              id="assigned-class"
              className="text-lg font-semibold border-b pb-2"
            >
              Assigned Class
            </h2>
            {staff.class ? (
              <div className="text-gray-700">
                <p>
                  <span className="font-medium">Class Name:</span>{" "}
                  {staff.class.name}
                </p>
                <p>
                  <span className="font-medium">Students:</span>{" "}
                  {staff.class.students?.length ?? 0}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">No class assigned yet.</p>
            )}
          </section>
        </>
      )}

      {/* --- Modals --- */}
      {isEditOpen && staff && (
        <EditStaffModal
          isOpen={isEditOpen}
          onClose={closeEdit}
          staff={staff}
          onUpdate={handleUpdate} // optimistic UI update
        />
      )}
      {isDeleteOpen && staff && (
        <ConfirmDeleteModal
          isOpen={isDeleteOpen}
          staff={staff}
          onClose={closeDelete}
          onConfirm={handleDeleteConfirmed} // redirect after delete
        />
      )}
    </div>
  );
}
