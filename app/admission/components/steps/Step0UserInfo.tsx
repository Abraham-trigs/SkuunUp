// app/admission/components/Step0UserInfo.tsx
// Purpose: Step 0 of the multi-step admission form including basic user info and sex selection dropdown.

"use client";

import React, { useEffect } from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { useAuthStore } from "@/app/store/useAuthStore.ts";
import LabeledInput from "./LabeledInput.tsx";

// ------------------ Types ------------------
type SexOption = "Male" | "Female" | "Other";

export default function StepUserInfo() {
  const { formData, setField } = useAdmissionStore();
  const { user } = useAuthStore();

  // Set default school domain with "@" prefix if not already set
  useEffect(() => {
    if (user?.school?.domain && !formData.schoolDomain) {
      setField("schoolDomain", `@${user.school.domain}`);
    }
  }, [user, formData.schoolDomain, setField]);

  const sexOptions: SexOption[] = ["Male", "Female", "Other"];

  return (
    <div className="space-y-4">
      <LabeledInput
        label="Surname"
        value={formData.surname || ""}
        onChangeValue={(v) => setField("surname", v)}
        placeholder="Enter surname"
      />
      <LabeledInput
        label="First Name"
        value={formData.firstName || ""}
        onChangeValue={(v) => setField("firstName", v)}
        placeholder="Enter first name"
      />
      <LabeledInput
        label="Other Names"
        value={formData.otherNames || ""}
        onChangeValue={(v) => setField("otherNames", v)}
        placeholder="Enter other names"
      />
      <LabeledInput
        label="Email"
        value={
          formData.email
            ? formData.email.replace(formData.schoolDomain || "", "")
            : ""
        }
        onChangeValue={(v) => {
          const localPart = v.split("@")[0];
          const fullEmail = formData.schoolDomain
            ? `${localPart}${formData.schoolDomain}`
            : localPart;
          setField("email", fullEmail);
        }}
        placeholder="Enter your account name"
        type="email"
        suffix={formData.schoolDomain}
      />
      <LabeledInput
        label="Password"
        value={formData.password || ""}
        onChangeValue={(v) => setField("password", v)}
        placeholder="Enter password"
        type="password"
      />
      {/* Sex dropdown */}
      <div className="flex flex-col">
        <label htmlFor="sex" className="mb-1 font-medium text-sm">
          Sex
        </label>
        <select
          id="sex"
          value={formData.sex || ""}
          onChange={(e) => setField("sex", e.target.value as SexOption)}
          className="border rounded p-2 focus:outline-none focus:ring focus:ring-blue-300"
        >
          <option value="" disabled>
            Select sex
          </option>
          {sexOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* 
Design reasoning: Added a dropdown for sex selection to standardize input and reduce errors. Using a controlled select tied to Zustand store ensures reactivity and form consistency.
Structure: Exports StepUserInfo component; includes LabeledInput fields and a new sex <select>.
Implementation guidance: Can drop into Step 0 of multi-step form; store field "sex" must exist in admissionStore.
Scalability insight: Additional sex/gender options can be added to sexOptions array; validation can enforce allowed values in Zod schema.
*/
