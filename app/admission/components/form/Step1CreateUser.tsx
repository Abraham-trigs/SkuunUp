import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";

export default function Step1CreateUser() {
  const { formData, setField, errors } = useAdmissionStore();

  const getError = (field: string) => errors[field]?.[0];

  // Required fields for this step
  const requiredFields = ["firstName", "surname", "wardEmail", "password"];
  const allFilled = requiredFields.every((f) => formData[f]?.trim() !== "");

  return (
    <div className="space-y-4" aria-labelledby="step1-title">
      <h2
        id="step1-title"
        className="text-lg font-bold text-[var(--ford-primary)]"
      >
        Step 1: Create User
      </h2>

      {requiredFields.map((field) => (
        <div key={field} className="flex flex-col">
          <label
            htmlFor={field}
            className="font-medium text-[var(--ford-primary)]"
          >
            {field === "wardEmail"
              ? "Ward Email"
              : field[0].toUpperCase() + field.slice(1)}
          </label>
          <input
            type={field === "password" ? "password" : "text"}
            id={field}
            className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)] border"
            placeholder={`Enter your ${field}`}
            value={formData[field] || ""}
            onChange={(e) => setField(field, e.target.value)}
            aria-label={field}
          />
          {getError(field) && (
            <p className="text-red-600 text-sm">{getError(field)}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export { Step1CreateUser, requiredFields }; // export requiredFields to be used in MultiStep
