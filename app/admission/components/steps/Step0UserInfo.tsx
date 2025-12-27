"use client";

import React, { useEffect } from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { useAuthStore } from "@/app/store/useAuthStore.ts";
import LabeledInput from "./LabeledInput.tsx";
import { ChevronDown } from "lucide-react";

type SexOption = "Male" | "Female" | "Other";

export default function StepUserInfo() {
  const { formData, setField } = useAdmissionStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.school?.domain && !formData.schoolDomain) {
      setField("schoolDomain", `@${user.school.domain}`);
    }
  }, [user, formData.schoolDomain, setField]);

  const sexOptions: SexOption[] = ["Male", "Female", "Other"];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Name Section - Grid for sleeker layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LabeledInput
          label="Surname"
          value={formData.surname || ""}
          onChangeValue={(v) => setField("surname", v)}
          placeholder="e.g. Doe"
        />
        <LabeledInput
          label="First Name"
          value={formData.firstName || ""}
          onChangeValue={(v) => setField("firstName", v)}
          placeholder="e.g. John"
        />
      </div>

      <LabeledInput
        label="Other Names"
        value={formData.otherNames || ""}
        onChangeValue={(v) => setField("otherNames", v)}
        placeholder="Enter middle names"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Email with Suffix */}
        <div className="md:col-span-2">
          <LabeledInput
            label="Institutional Email"
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
            placeholder="username"
            type="text"
            suffix={formData.schoolDomain}
          />
        </div>

        {/* Sex Selection - Styled to match LabeledInput */}
        <div className="flex flex-col mb-5 group">
          <label
            style={{ color: "#BFCDEF" }}
            className="mb-1.5 text-xs font-black uppercase tracking-[0.15em] opacity-70"
          >
            Sex
          </label>
          <div className="relative">
            <select
              id="sex"
              value={formData.sex || ""}
              onChange={(e) => setField("sex", e.target.value as SexOption)}
              style={{ backgroundColor: "#1c376e", color: "#BFCDEF" }}
              className="w-full appearance-none rounded-xl border border-[#BFCDEF]/10 px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-[#6BE8EF] outline-none cursor-pointer"
            >
              <option value="" disabled className="bg-[#03102b]">
                Select
              </option>
              {sexOptions.map((option) => (
                <option key={option} value={option} className="bg-[#03102b]">
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              style={{ color: "#6BE8EF" }}
              className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-60"
            />
          </div>
        </div>
      </div>

      <LabeledInput
        label="Security Password"
        value={formData.password || ""}
        onChangeValue={(v) => setField("password", v)}
        placeholder="••••••••"
        type="password"
      />
    </div>
  );
}
