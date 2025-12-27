"use client";

import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import LabeledInput from "./LabeledInput.tsx";

const languagesList = [
  "English",
  "Akan (Twi/Fante)",
  "Ewe",
  "Ga",
  "Dagbani",
  "Dangme",
  "Dagaare",
  "Gonja",
  "Hausa",
  "Nzema",
  "Other",
];

const religionList = [
  "Christianity",
  "Islam",
  "Traditional African Religion",
  "None",
  "Other",
];

const denominationList = [
  "Pentecostal / Charismatic",
  "Protestant",
  "Catholic",
  "Methodist",
  "Seventh-day Adventist",
  "Muslim (Sunni)",
  "Traditional / Indigenous",
  "Other",
];

const regionList = [
  "Greater Accra",
  "Ashanti",
  "Eastern",
  "Western",
  "Central",
  "Northern",
  "Upper East",
  "Upper West",
  "Volta",
  "Oti",
  "Bono",
  "Bono East",
  "Ahafo",
  "Savannah",
  "North East",
  "Western North",
  "Other",
];

export default function StepLanguagesReligion() {
  const { formData, setField } = useAdmissionStore();

  const handleDropdownChange = (
    field: "languages" | "religion" | "denomination" | "region",
    value: string
  ) => {
    setField(field, value === "Other" ? "" : value);
  };

  // Ensure languages is always an array for type safety
  const selectedLanguages: string[] = Array.isArray(formData.languages)
    ? formData.languages
    : formData.languages
    ? [formData.languages]
    : [];

  const isOtherLanguage =
    selectedLanguages.length === 0 ||
    selectedLanguages.some((lang) => !languagesList.includes(lang));
  const isOtherReligion =
    !religionList.includes(formData.religion || "") && formData.religion !== "";
  const isOtherDenomination =
    !denominationList.includes(formData.denomination || "") &&
    formData.denomination !== "";
  const isOtherRegion =
    !regionList.includes(formData.region || "") && formData.region !== "";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Languages */}
      <div className="flex flex-col group mb-5">
        <label
          className="mb-1.5 text-xs font-black uppercase tracking-[0.15em] opacity-70"
          style={{ color: "#BFCDEF" }}
        >
          Languages
        </label>
        <div className="relative">
          <select
            id="languages"
            value={
              selectedLanguages.length === 1 &&
              languagesList.includes(selectedLanguages[0])
                ? selectedLanguages[0]
                : "Other"
            }
            onChange={(e) => handleDropdownChange("languages", e.target.value)}
            className="w-full appearance-none rounded-xl border px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-[#6BE8EF] outline-none cursor-pointer"
            style={{
              backgroundColor: "#1c376e",
              color: "#BFCDEF",
              borderColor: "#BFCDEF33",
            }}
          >
            <option value="" disabled className="bg-[#03102b]">
              Select language
            </option>
            {languagesList.map((lang) => (
              <option key={lang} value={lang} className="bg-[#03102b]">
                {lang}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#6BE8EF]">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {isOtherLanguage && (
          <div className="mt-3 animate-in zoom-in-95 duration-200">
            <LabeledInput
              label="Specify Language"
              value={selectedLanguages.join(", ")}
              onChangeValue={(v: string) =>
                setField(
                  "languages",
                  v.split(",").map((s) => s.trim())
                )
              }
              placeholder="Type language"
            />
          </div>
        )}
      </div>

      {/* Mother's Tongue */}
      <LabeledInput
        label="Mother's Tongue"
        value={formData.mothersTongue || ""}
        onChangeValue={(v) => setField("mothersTongue", v)}
        placeholder="e.g. Twi"
      />

      {/* Region */}
      <div className="flex flex-col group mb-5">
        <label
          className="mb-1.5 text-xs font-black uppercase tracking-[0.15em] opacity-70"
          style={{ color: "#BFCDEF" }}
        >
          Region
        </label>
        <div className="relative">
          <select
            id="region"
            value={
              regionList.includes(formData.region || "")
                ? formData.region
                : "Other"
            }
            onChange={(e) => handleDropdownChange("region", e.target.value)}
            className="w-full appearance-none rounded-xl border px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-[#6BE8EF] outline-none cursor-pointer"
            style={{
              backgroundColor: "#1c376e",
              color: "#BFCDEF",
              borderColor: "#BFCDEF33",
            }}
          >
            <option value="" disabled className="bg-[#03102b]">
              Select region
            </option>
            {regionList.map((r) => (
              <option key={r} value={r} className="bg-[#03102b]">
                {r}
              </option>
            ))}
          </select>
        </div>
        {isOtherRegion && (
          <div className="mt-3 animate-in zoom-in-95 duration-200">
            <LabeledInput
              label="Specify Region"
              value={formData.region || ""}
              onChangeValue={(v: string) => setField("region", v)}
              placeholder="Type region"
            />
          </div>
        )}
      </div>

      {/* Hometown */}
      <LabeledInput
        label="Hometown"
        value={formData.hometown || ""}
        onChangeValue={(v) => setField("hometown", v)}
        placeholder="e.g. Kumasi"
      />

      {/* Religion */}
      <div className="flex flex-col group mb-5">
        <label
          className="mb-1.5 text-xs font-black uppercase tracking-[0.15em] opacity-70"
          style={{ color: "#BFCDEF" }}
        >
          Religion
        </label>
        <div className="relative">
          <select
            id="religion"
            value={
              religionList.includes(formData.religion || "")
                ? formData.religion
                : "Other"
            }
            onChange={(e) => handleDropdownChange("religion", e.target.value)}
            className="w-full appearance-none rounded-xl border px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-[#6BE8EF] outline-none cursor-pointer"
            style={{
              backgroundColor: "#1c376e",
              color: "#BFCDEF",
              borderColor: "#BFCDEF33",
            }}
          >
            <option value="" disabled className="bg-[#03102b]">
              Select religion
            </option>
            {religionList.map((r) => (
              <option key={r} value={r} className="bg-[#03102b]">
                {r}
              </option>
            ))}
          </select>
        </div>
        {isOtherReligion && (
          <div className="mt-3 animate-in zoom-in-95 duration-200">
            <LabeledInput
              label="Specify Religion"
              value={formData.religion || ""}
              onChangeValue={(v: string) => setField("religion", v)}
              placeholder="Type religion"
            />
          </div>
        )}
      </div>

      {/* Denomination */}
      <div className="flex flex-col group mb-5">
        <label
          className="mb-1.5 text-xs font-black uppercase tracking-[0.15em] opacity-70"
          style={{ color: "#BFCDEF" }}
        >
          Denomination
        </label>
        <div className="relative">
          <select
            id="denomination"
            value={
              denominationList.includes(formData.denomination || "")
                ? formData.denomination
                : "Other"
            }
            onChange={(e) =>
              handleDropdownChange("denomination", e.target.value)
            }
            className="w-full appearance-none rounded-xl border px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-[#6BE8EF] outline-none cursor-pointer"
            style={{
              backgroundColor: "#1c376e",
              color: "#BFCDEF",
              borderColor: "#BFCDEF33",
            }}
          >
            <option value="" disabled className="bg-[#03102b]">
              Select denomination
            </option>
            {denominationList.map((d) => (
              <option key={d} value={d} className="bg-[#03102b]">
                {d}
              </option>
            ))}
          </select>
        </div>
        {isOtherDenomination && (
          <div className="mt-3 animate-in zoom-in-95 duration-200">
            <LabeledInput
              label="Specify Denomination"
              value={formData.denomination || ""}
              onChangeValue={(v: string) => setField("denomination", v)}
              placeholder="Type denomination"
            />
          </div>
        )}
      </div>
    </div>
  );
}
