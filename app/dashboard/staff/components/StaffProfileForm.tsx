// src/components/StaffStepForm.tsx
"use client";

import React, { useState, useMemo } from "react";
import {
  positionRoleMap,
  inferDepartmentFromPosition,
  requiresClass,
  inferRoleFromPosition,
} from "@/lib/api/constants/roleInference";

interface UserStepData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface StaffStepData {
  position: string;
  department?: string;
  classId?: string;
  salary?: number;
  hireDate?: string;
}

interface StaffStepFormProps {
  onSuccess: (data: { user: UserStepData; staff: StaffStepData }) => void;
}

export default function StaffStepForm({ onSuccess }: StaffStepFormProps) {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<UserStepData>({
    name: "",
    email: "",
    password: "",
  });
  const [staffData, setStaffData] = useState<StaffStepData>({
    position: "",
    department: "",
    classId: "",
    salary: undefined,
    hireDate: "",
  });

  const positionOptions = useMemo(() => Object.keys(positionRoleMap), []);

  const isStep1Valid = userData.name && userData.email && userData.password;
  const isStep2Valid =
    staffData.position &&
    (!requiresClass(staffData.position) || staffData.classId);

  const handleNext = () => {
    if (!isStep1Valid) return alert("Please fill all user fields");
    setStep(2);
  };

  const handlePrev = () => setStep(1);

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleStaffChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let newStaff = { ...staffData, [name]: value };

    if (name === "position") {
      newStaff.department = inferDepartmentFromPosition(value);
      if (!requiresClass(value)) newStaff.classId = "";
    }

    setStaffData(newStaff);
  };

  const handleSubmit = () => {
    if (!isStep2Valid)
      return alert("Please select a position and class (if required)");
    const role = inferRoleFromPosition(staffData.position);
    onSuccess({ user: { ...userData, role }, staff: staffData });
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Step Indicator */}
      <div className="flex mb-6">
        <div
          className={`flex-1 py-2 text-center rounded-t-lg font-semibold transition ${
            step === 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
          }`}
        >
          User
        </div>
        <div
          className={`flex-1 py-2 text-center rounded-t-lg font-semibold transition ${
            step === 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
          }`}
        >
          Staff
        </div>
      </div>

      {/* Step 1: User */}
      {step === 1 && (
        <div className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={userData.name}
            onChange={handleUserChange}
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={userData.email}
            onChange={handleUserChange}
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={userData.password}
            onChange={handleUserChange}
            className="w-full border rounded px-3 py-2"
          />
          <button
            className={`w-full py-2 rounded text-white ${
              isStep1Valid
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            onClick={handleNext}
            disabled={!isStep1Valid}
          >
            Next
          </button>
        </div>
      )}

      {/* Step 2: Staff */}
      {step === 2 && (
        <div className="space-y-4">
          <select
            name="position"
            value={staffData.position}
            onChange={handleStaffChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Position</option>
            {positionOptions.map((pos) => (
              <option key={pos} value={pos}>
                {pos.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="department"
            value={staffData.department}
            readOnly
            placeholder="Department (auto)"
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />

          {staffData.position && requiresClass(staffData.position) && (
            <input
              type="text"
              name="classId"
              value={staffData.classId}
              onChange={handleStaffChange}
              placeholder="Class ID"
              className="w-full border rounded px-3 py-2"
            />
          )}

          <input
            type="number"
            name="salary"
            value={staffData.salary ?? ""}
            onChange={handleStaffChange}
            placeholder="Salary"
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="date"
            name="hireDate"
            value={staffData.hireDate}
            onChange={handleStaffChange}
            className="w-full border rounded px-3 py-2"
          />

          <div className="flex justify-between mt-4">
            <button className="px-4 py-2 border rounded" onClick={handlePrev}>
              Prev
            </button>
            <button
              className={`px-4 py-2 rounded text-white ${
                isStep2Valid
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              onClick={handleSubmit}
              disabled={!isStep2Valid}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
