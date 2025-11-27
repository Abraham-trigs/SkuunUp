"use client";
import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { Step3Schema } from "./schemas/step3Schema.ts";

export default function Step3Family() {
  const {
    formData,
    setField,
    addFamilyMember,
    removeFamilyMember,
    errors,
    setErrors,
  } = useAdmissionStore();

  const getError = (field: string, idx?: number) => {
    const stepErrors = errors.updateAdmission || [];
    if (typeof idx === "number") {
      // For array field errors
      return stepErrors.find((e) =>
        e.toLowerCase().includes(`${field}[${idx}]`)
      );
    }
    return stepErrors.find((e) =>
      e.toLowerCase().includes(field.toLowerCase())
    );
  };

  const validateStep3 = () => {
    try {
      Step3Schema.parse(formData);
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
        Family Members
      </h2>

      {formData.familyMembers?.map((f, idx) => (
        <div key={idx} className="bg-[var(--background)] p-2 rounded space-y-2">
          <input
            className="w-full p-2 rounded border"
            placeholder="Relation"
            value={f.relation || ""}
            onChange={(e) =>
              setField(`familyMembers.${idx}.relation`, e.target.value)
            }
          />
          {getError("relation", idx) && (
            <p className="text-red-600 text-sm">{getError("relation", idx)}</p>
          )}

          <input
            className="w-full p-2 rounded border"
            placeholder="Name"
            value={f.name || ""}
            onChange={(e) =>
              setField(`familyMembers.${idx}.name`, e.target.value)
            }
          />
          {getError("name", idx) && (
            <p className="text-red-600 text-sm">{getError("name", idx)}</p>
          )}

          <input
            className="w-full p-2 rounded border"
            placeholder="Postal Address"
            value={f.postalAddress || ""}
            onChange={(e) =>
              setField(`familyMembers.${idx}.postalAddress`, e.target.value)
            }
          />
          {getError("postalAddress", idx) && (
            <p className="text-red-600 text-sm">
              {getError("postalAddress", idx)}
            </p>
          )}

          <input
            className="w-full p-2 rounded border"
            placeholder="Residential Address"
            value={f.residentialAddress || ""}
            onChange={(e) =>
              setField(
                `familyMembers.${idx}.residentialAddress`,
                e.target.value
              )
            }
          />
          {getError("residentialAddress", idx) && (
            <p className="text-red-600 text-sm">
              {getError("residentialAddress", idx)}
            </p>
          )}

          <button
            className="text-[var(--ford-secondary)]"
            onClick={() => removeFamilyMember(idx)}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        className="px-3 py-1 bg-[var(--ford-primary)] rounded"
        onClick={() =>
          addFamilyMember({
            relation: "",
            name: "",
            postalAddress: "",
            residentialAddress: "",
          })
        }
      >
        Add Family Member
      </button>
    </div>
  );
}
