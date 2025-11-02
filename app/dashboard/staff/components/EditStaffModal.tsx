// app/staff/components/EditStaffModal.tsx
// Purpose: Edit existing staff with controlled password toggle, auto-department inference, proper name/email updates, and class dropdown.

"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStaffStore, Staff } from "@/app/store/useStaffStore";
import {
  positionRoleMap,
  roleToDepartment,
  inferRoleFromPosition,
  requiresClass,
} from "@/lib/api/constants/roleInference";
import { FaLock, FaUnlock } from "react-icons/fa";
import { toast } from "sonner";

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff;
}

const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().optional(),
  position: z.string().min(1, "Position is required"),
  department: z.string().optional(),
  salary: z.coerce.number().optional(),
  subject: z.string().optional(),
  classId: z.string().optional().nullable(),
});

type StaffFormValues = z.infer<typeof staffSchema>;

export default function EditStaffModal({
  isOpen,
  onClose,
  staff,
}: EditStaffModalProps) {
  const { updateStaff, classList } = useStaffStore();
  const [isPasswordEditable, setIsPasswordEditable] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
  });

  const position = watch("position");

  useEffect(() => {
    if (!staff) return;
    reset({
      name: staff.user?.name ?? "",
      email: staff.user?.email ?? "",
      password: undefined,
      position: staff.position ?? "",
      department: roleToDepartment[inferRoleFromPosition(staff.position)] ?? "",
      salary: staff.salary ?? undefined,
      subject: staff.subject ?? "",
      classId: staff.class?.id ?? null,
    });
    setIsPasswordEditable(false);
  }, [staff, reset]);

  // auto infer department
  useEffect(() => {
    if (!position) return;
    const inferred = roleToDepartment[inferRoleFromPosition(position)];
    reset((prev) => ({ ...prev, department: inferred }));
  }, [position, reset]);

  const onSubmit = async (data: StaffFormValues) => {
    try {
      const role = inferRoleFromPosition(data.position);

      const userData: Record<string, any> = {
        name: data.name,
        email: data.email,
        role,
      };
      if (isPasswordEditable && data.password) {
        userData.password = data.password;
      }

      const staffData = {
        position: data.position,
        department: data.department || roleToDepartment[role],
        classId: data.classId ?? null,
        salary: data.salary ?? null,
        subject: data.subject ?? null,
      };

      await updateStaff(staff.id, { user: userData, staff: staffData });

      toast.success("Staff updated successfully");
      onClose();
    } catch (err: any) {
      console.error("Update failed", err);
      toast.error("Failed to update staff");
    }
  };

  const requiresClassField = requiresClass(position);
  const positions = Object.keys(positionRoleMap);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-3">Edit Staff</h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Full name</label>
            <input
              {...register("name")}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
            />
            {errors.name && (
              <p className="text-red-600 text-sm">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              {...register("email")}
              type="email"
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
            />
            {errors.email && (
              <p className="text-red-600 text-sm">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="flex gap-2 items-center">
              <input
                {...register("password")}
                type="password"
                disabled={!isPasswordEditable}
                placeholder={
                  isPasswordEditable ? "Enter new password" : "Locked"
                }
                className="flex-1 border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
              />
              <button
                type="button"
                onClick={() => setIsPasswordEditable(!isPasswordEditable)}
                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                title={isPasswordEditable ? "Lock password" : "Unlock to edit"}
              >
                {isPasswordEditable ? <FaUnlock /> : <FaLock />}
              </button>
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium mb-1">Position</label>
            <select
              {...register("position")}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select role</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <input
              {...register("department")}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>

          {/* Salary */}
          <div>
            <label className="block text-sm font-medium mb-1">Salary</label>
            <input
              {...register("salary")}
              type="number"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              {...register("subject")}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Class Dropdown */}
          {requiresClassField && (
            <div>
              <label className="block text-sm font-medium mb-1">Class</label>
              <select
                {...register("classId")}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select class</option>
                {classList.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
