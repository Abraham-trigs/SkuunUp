"use client";

import React, { useState, useEffect } from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { Step3Schema } from "./schemas/step3Schema.ts";
import { z } from "zod";

export default function Step2FamilyMembers() {
  const { formData, setField, errors, setErrors, updateAdmission, loading } =
    useAdmissionStore();

  const initialMembers = formData.familyMembers || [];
  const [localMembers, setLocalMembers] = useState(initialMembers);

  useEffect(() => {
    setLocalMembers(formData.familyMembers || []);
  }, [formData.familyMembers]);

  const getError = (index: number, field: string) => {
    const memberErrors = errors.updateAdmission || [];
    return memberErrors
      .filter((err) => err.includes(`familyMembers[${index}].${field}`))
      .map((err) => err.replace(`familyMembers[${index}].${field}: `, ""));
  };

  const handleChange = async (index: number, field: string, value: string) => {
    const updated = [...localMembers];
    updated[index] = { ...updated[index], [field]: value };
    setLocalMembers(updated);
    setField("familyMembers", updated);

    try {
      Step3Schema.parse({ familyMembers: updated });
      setErrors({});
      await updateAdmission({ familyMembers: updated }, 3);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        err.errors.forEach((e) => {
          formattedErrors.updateAdmission =
            formattedErrors.updateAdmission || [];
          formattedErrors.updateAdmission.push(e.message);
        });
        setErrors(formattedErrors);
      }
    }
  };

  const addMember = async () => {
    const newMember = {
      relation: "",
      name: "",
      postalAddress: "",
      residentialAddress: "",
    };
    const updated = [...localMembers, newMember];
    setLocalMembers(updated);
    setField("familyMembers", updated);

    try {
      await updateAdmission({ familyMembers: updated }, 3);
    } catch (err) {
      console.error("Failed to add member", err);
    }
  };

  const removeMember = async (index: number) => {
    const updated = localMembers.filter((_, i) => i !== index);
    setLocalMembers(updated);
    setField("familyMembers", updated);

    try {
      await updateAdmission({ familyMembers: updated }, 3);
    } catch (err) {
      console.error("Failed to remove member", err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-[var(--ford-primary)] mb-4">
        Step 2: Family Members
      </h2>

      {localMembers.map((member, idx) => (
        <div
          key={idx}
          className="border rounded-xl p-4 bg-[var(--background)] shadow-md flex flex-col gap-3"
        >
          <div className="flex justify-between items-center">
            <span className="font-semibold text-[var(--ford-primary)]">
              Family Member #{idx + 1}
            </span>
            <button
              type="button"
              className="text-red-600 hover:text-red-800 font-bold"
              onClick={() => removeMember(idx)}
              aria-label={`Remove member ${idx + 1}`}
              disabled={loading}
            >
              Remove
            </button>
          </div>

          {["relation", "name", "postalAddress", "residentialAddress"].map(
            (field) => (
              <div key={field} className="flex flex-col">
                <label
                  htmlFor={`${field}-${idx}`}
                  className="text-[var(--ford-primary)] font-medium"
                >
                  {field
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())}
                </label>
                <input
                  type="text"
                  id={`${field}-${idx}`}
                  value={member[field as keyof typeof member] || ""}
                  onChange={(e) => handleChange(idx, field, e.target.value)}
                  className={`w-full p-2 rounded border ${
                    getError(idx, field).length > 0
                      ? "border-red-600"
                      : "border-gray-300"
                  } bg-[var(--background)] text-[var(--typo)]`}
                  placeholder={`Enter ${field}`}
                  disabled={loading}
                />
                {getError(idx, field).length > 0 && (
                  <p className="text-red-600 text-sm mt-1">
                    {getError(idx, field).join(", ")}
                  </p>
                )}
              </div>
            )
          )}
        </div>
      ))}

      <button
        type="button"
        className="w-full py-2 px-4 bg-[var(--ford-secondary)] text-[var(--typo)] rounded hover:bg-[var(--ford-primary)] transition"
        onClick={addMember}
        disabled={loading}
      >
        + Add Family Member
      </button>
    </div>
  );
}
