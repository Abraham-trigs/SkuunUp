"use client";
import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { Step4Schema } from "./schemas/step4Schema.ts";

export default function Step4PreviousSchools() {
  const {
    formData,
    setField,
    addPreviousSchool,
    removePreviousSchool,
    errors,
    setErrors,
  } = useAdmissionStore();

  const getError = (field: string, idx?: number) => {
    const stepErrors = errors.updateAdmission || [];
    if (typeof idx === "number") {
      return stepErrors.find((e) =>
        e.toLowerCase().includes(`${field}[${idx}]`)
      );
    }
    return stepErrors.find((e) =>
      e.toLowerCase().includes(field.toLowerCase())
    );
  };

  const validateStep4 = () => {
    try {
      Step4Schema.parse(formData);
      setErrors({});
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
        Previous Schools
      </h2>

      {formData.previousSchools?.map((s, idx) => (
        <div key={idx} className="bg-[var(--background)] p-2 rounded space-y-2">
          <input
            className="w-full p-2 rounded border"
            placeholder="School Name"
            value={s.name || ""}
            onChange={(e) =>
              setField(`previousSchools.${idx}.name`, e.target.value)
            }
          />
          {getError("name", idx) && (
            <p className="text-red-600 text-sm">{getError("name", idx)}</p>
          )}

          <input
            className="w-full p-2 rounded border"
            placeholder="Location"
            value={s.location || ""}
            onChange={(e) =>
              setField(`previousSchools.${idx}.location`, e.target.value)
            }
          />
          {getError("location", idx) && (
            <p className="text-red-600 text-sm">{getError("location", idx)}</p>
          )}

          <input
            type="date"
            className="w-full p-2 rounded border"
            placeholder="Start Date"
            value={s.startDate || ""}
            onChange={(e) =>
              setField(`previousSchools.${idx}.startDate`, e.target.value)
            }
          />
          {getError("startDate", idx) && (
            <p className="text-red-600 text-sm">{getError("startDate", idx)}</p>
          )}

          <input
            type="date"
            className="w-full p-2 rounded border"
            placeholder="End Date"
            value={s.endDate || ""}
            onChange={(e) =>
              setField(`previousSchools.${idx}.endDate`, e.target.value)
            }
          />
          {getError("endDate", idx) && (
            <p className="text-red-600 text-sm">{getError("endDate", idx)}</p>
          )}

          <button
            className="text-[var(--ford-secondary)]"
            onClick={() => removePreviousSchool(idx)}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        className="px-3 py-1 bg-[var(--ford-primary)] rounded"
        onClick={() =>
          addPreviousSchool({
            name: "",
            location: "",
            startDate: "",
            endDate: "",
          })
        }
      >
        Add Previous School
      </button>
    </div>
  );
}
