"use client";

import React, { useState, forwardRef } from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";

interface Step1CreateUserProps {
  onSuccess?: () => void;
}

const Step1CreateUser = forwardRef<HTMLInputElement, Step1CreateUserProps>(
  ({ onSuccess }, ref) => {
    const {
      formData,
      setField,
      createUser,
      createMinimalAdmission,
      markUserCreated,
      errors,
      setErrors,
      loading,
    } = useAdmissionStore();

    const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

    const requiredFields = [
      "firstName",
      "surname",
      "wardEmail",
      "dateOfBirth",
      "nationality",
      "sex",
    ];

    const handleCreateUserAndAdmission = async () => {
      setLocalErrors({});
      const errors: Record<string, string> = {};

      requiredFields.forEach((field) => {
        if (!formData[field] || formData[field].toString().trim() === "") {
          errors[field] =
            field[0].toUpperCase() + field.slice(1) + " is required";
        }
      });

      if (
        formData.wardEmail &&
        !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.wardEmail)
      ) {
        errors.wardEmail = "Invalid email format";
      }

      if (Object.keys(errors).length > 0) {
        setLocalErrors(errors);
        return;
      }

      try {
        const studentId = await createUser();
        if (!studentId) {
          setLocalErrors({ createUser: "Failed to create user." });
          return;
        }

        const admissionCreated = await createMinimalAdmission();
        if (!admissionCreated) {
          setLocalErrors({
            createMinimalAdmission: "Failed to create admission.",
          });
          return;
        }

        markUserCreated(studentId);
        onSuccess?.();
      } catch (err: any) {
        setLocalErrors({ general: err?.message || "Something went wrong" });
      }
    };

    return (
      <div className="w-full max-w-4xl mx-auto p-4 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-[var(--ford-primary)] mb-4">
          Step 1: Create User & Admission
        </h2>

        {[
          { key: "firstName", label: "First Name" },
          { key: "surname", label: "Surname" },
          { key: "wardEmail", label: "Ward Email" },
          { key: "dateOfBirth", label: "Date of Birth", type: "date" },
          { key: "nationality", label: "Nationality" },
          {
            key: "sex",
            label: "Sex",
            type: "select",
            options: ["Male", "Female"],
          },
        ].map((field) => (
          <div key={field.key} className="flex flex-col">
            <label
              htmlFor={`input-${field.key}`}
              className="text-[var(--ford-primary)] font-medium"
            >
              {field.label}
            </label>

            {field.type === "select" ? (
              <select
                id={`input-${field.key}`}
                value={formData[field.key] || ""}
                onChange={(e) => setField(field.key, e.target.value)}
                className={`w-full p-2 rounded border ${
                  localErrors[field.key] ? "border-red-600" : "border-gray-300"
                } bg-[var(--background)] text-[var(--typo)]`}
                disabled={loading}
                ref={field.key === "firstName" ? ref : null}
              >
                <option value="">Select {field.label}</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`input-${field.key}`}
                type={field.type || "text"}
                placeholder={`Enter ${field.label}`}
                value={formData[field.key] || ""}
                onChange={(e) => setField(field.key, e.target.value)}
                className={`w-full p-2 rounded border ${
                  localErrors[field.key] ? "border-red-600" : "border-gray-300"
                } bg-[var(--background)] text-[var(--typo)]`}
                disabled={loading}
                ref={field.key === "firstName" ? ref : null}
              />
            )}

            {localErrors[field.key] && (
              <p className="text-red-600 text-sm mt-1">
                {localErrors[field.key]}
              </p>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={handleCreateUserAndAdmission}
          disabled={loading}
          className="w-full py-2 px-4 bg-[var(--ford-secondary)] text-[var(--typo)] rounded hover:bg-[var(--ford-primary)] transition"
        >
          {loading ? "Creating User & Admission..." : "Continue"}
        </button>

        {localErrors.general && (
          <p className="text-red-600 mt-2">{localErrors.general}</p>
        )}
      </div>
    );
  }
);

Step1CreateUser.displayName = "Step1CreateUser";
export default Step1CreateUser;
