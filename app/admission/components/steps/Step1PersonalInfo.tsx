"use client";

import React, { useEffect } from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import LabeledInput from "./LabeledInput.tsx";

const countries = [
  "Ghana",
  "Nigeria",
  "Kenya",
  "South Africa",
  "United States",
  "United Kingdom",
  "Canada",
  "India",
  "Australia",
  "Other",
];

export default function StepPersonalInfo() {
  const { formData, setField } = useAdmissionStore();

  // Set default nationality to Ghana if empty
  useEffect(() => {
    if (!formData.nationality) {
      setField("nationality", "Ghana");
    }
  }, [formData.nationality, setField]);

  const handleDropdownChange = (value: string) => {
    if (value === "Other") {
      setField("nationality", ""); // clear for user input
    } else {
      setField("nationality", value);
    }
  };

  const isOther =
    !countries.includes(formData.nationality || "") &&
    formData.nationality !== "";

  return (
    <div className="space-y-4">
      <LabeledInput
        label="Date of Birth"
        type="date"
        value={
          formData.dateOfBirth
            ? new Date(formData.dateOfBirth).toISOString().substr(0, 10)
            : ""
        }
        onChangeValue={(v: string) =>
          setField("dateOfBirth", v ? new Date(v).toISOString() : "")
        }
      />

      <div className="flex flex-col space-y-2">
        <label htmlFor="nationality" className="mb-1 font-medium text-sm">
          Nationality
        </label>
        <select
          id="nationality"
          value={
            countries.includes(formData.nationality || "")
              ? formData.nationality
              : "Other"
          }
          onChange={(e) => handleDropdownChange(e.target.value)}
          className="border rounded p-2 focus:outline-none focus:ring focus:ring-blue-300"
        >
          <option value="" disabled>
            Select nationality
          </option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>

        {/* Show input if "Other" is selected */}
        {isOther && (
          <LabeledInput
            label="Enter Nationality"
            value={formData.nationality || ""}
            onChangeValue={(v: string) => setField("nationality", v)}
            placeholder="Type your nationality"
          />
        )}
      </div>
    </div>
  );
}
