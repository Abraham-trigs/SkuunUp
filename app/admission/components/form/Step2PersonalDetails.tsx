"use client";

import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { z } from "zod";
import { Step2Schema } from "./schemas/step2Schema.ts";

// Export required fields for Step 2
export const Step2Fields = [
  "surname",
  "firstName",
  "otherNames",
  "dateOfBirth",
  "nationality",
  "sex",
];

export default function Step2PersonalDetails() {
  const { formData, setField, errors, setErrors } = useAdmissionStore();

  const getError = (field: string) =>
    (errors.updateAdmission || []).find((e) =>
      e.toLowerCase().includes(field.toLowerCase())
    );

  const validateStep2 = () => {
    try {
      Step2Schema.parse(formData);
      setErrors({}); // clear previous errors
      return true;
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setErrors({ updateAdmission: err.errors.map((e) => e.message) });
      }
      return false;
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-[var(--ford-primary)]">
        Step 2: Personal Details
      </h2>

      <input
        className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)] border"
        placeholder="Surname"
        value={formData.surname || ""}
        onChange={(e) => setField("surname", e.target.value)}
      />
      {getError("surname") && (
        <p className="text-red-600 text-sm">{getError("surname")}</p>
      )}

      <input
        className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)] border"
        placeholder="First Name"
        value={formData.firstName || ""}
        onChange={(e) => setField("firstName", e.target.value)}
      />
      {getError("firstName") && (
        <p className="text-red-600 text-sm">{getError("firstName")}</p>
      )}

      <input
        className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)] border"
        placeholder="Other Names"
        value={formData.otherNames || ""}
        onChange={(e) => setField("otherNames", e.target.value)}
      />
      {getError("otherNames") && (
        <p className="text-red-600 text-sm">{getError("otherNames")}</p>
      )}

      <input
        type="date"
        className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)] border"
        placeholder="Date of Birth"
        value={formData.dateOfBirth || ""}
        onChange={(e) => setField("dateOfBirth", e.target.value)}
      />
      {getError("dateOfBirth") && (
        <p className="text-red-600 text-sm">{getError("dateOfBirth")}</p>
      )}

      <input
        className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)] border"
        placeholder="Nationality"
        value={formData.nationality || ""}
        onChange={(e) => setField("nationality", e.target.value)}
      />
      {getError("nationality") && (
        <p className="text-red-600 text-sm">{getError("nationality")}</p>
      )}

      <select
        className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)] border"
        value={formData.sex || ""}
        onChange={(e) => setField("sex", e.target.value)}
      >
        <option value="">Select Sex</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
      </select>
      {getError("sex") && (
        <p className="text-red-600 text-sm">{getError("sex")}</p>
      )}
    </div>
  );
}
