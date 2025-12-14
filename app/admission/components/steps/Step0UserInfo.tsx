"use client";

import React, { useEffect } from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { useAuthStore } from "@/app/store/useAuthStore.ts";
import LabeledInput from "./LabeledInput.tsx";

export default function StepUserInfo() {
  const { formData, setField } = useAdmissionStore();
  const { user } = useAuthStore();

  // Set default school domain with "@" prefix if not already set
  useEffect(() => {
    if (user?.school?.domain && !formData.schoolDomain) {
      setField("schoolDomain", `@${user.school.domain}`);
    }
  }, [user, formData.schoolDomain, setField]);

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
          // Strip any domain typed by user, keep only local part
          const localPart = v.split("@")[0];
          const fullEmail = formData.schoolDomain
            ? `${localPart}${formData.schoolDomain}`
            : localPart;
          setField("email", fullEmail);
        }}
        placeholder="Enter your account name"
        type="email"
        suffix={formData.schoolDomain} // visually display domain next to input
      />
      <LabeledInput
        label="Password"
        value={formData.password || ""}
        onChangeValue={(v) => setField("password", v)}
        placeholder="Enter password"
        type="password"
      />
    </div>
  );
}
