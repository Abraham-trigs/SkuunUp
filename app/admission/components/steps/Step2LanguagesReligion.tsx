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

  const isOtherLanguage =
    !languagesList.includes(formData.languages || "") &&
    formData.languages !== "";
  const isOtherReligion =
    !religionList.includes(formData.religion || "") && formData.religion !== "";
  const isOtherDenomination =
    !denominationList.includes(formData.denomination || "") &&
    formData.denomination !== "";
  const isOtherRegion =
    !regionList.includes(formData.region || "") && formData.region !== "";

  return (
    <div className="space-y-4">
      {/* Languages */}
      <div className="flex flex-col space-y-2">
        <label htmlFor="languages" className="mb-1 font-medium text-sm">
          Languages
        </label>
        <select
          id="languages"
          value={
            languagesList.includes(formData.languages || "")
              ? formData.languages
              : "Other"
          }
          onChange={(e) => handleDropdownChange("languages", e.target.value)}
          className="border rounded p-2 focus:outline-none focus:ring focus:ring-blue-300"
        >
          <option value="" disabled>
            Select language
          </option>
          {languagesList.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>

        {isOtherLanguage && (
          <LabeledInput
            label="Enter Language"
            value={formData.languages || ""}
            onChangeValue={(v: string) => setField("languages", v)}
            placeholder="Type your language"
          />
        )}
      </div>

      {/* Mother's Tongue */}
      <LabeledInput
        label="Mother's Tongue"
        value={formData.mothersTongue || ""}
        onChangeValue={(v) => setField("mothersTongue", v)}
        placeholder="Enter mother's tongue"
      />

      {/* Region */}
      <div className="flex flex-col space-y-2">
        <label htmlFor="region" className="mb-1 font-medium text-sm">
          Region
        </label>
        <select
          id="region"
          value={
            regionList.includes(formData.region || "")
              ? formData.region
              : "Other"
          }
          onChange={(e) => handleDropdownChange("region", e.target.value)}
          className="border rounded p-2 focus:outline-none focus:ring focus:ring-blue-300"
        >
          <option value="" disabled>
            Select region
          </option>
          {regionList.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {isOtherRegion && (
          <LabeledInput
            label="Enter Region"
            value={formData.region || ""}
            onChangeValue={(v: string) => setField("region", v)}
            placeholder="Type your region"
          />
        )}
      </div>

      {/* Hometown */}
      <LabeledInput
        label="Hometown"
        value={formData.hometown || ""}
        onChangeValue={(v) => setField("hometown", v)}
        placeholder="Enter hometown"
      />

      {/* Religion */}
      <div className="flex flex-col space-y-2">
        <label htmlFor="religion" className="mb-1 font-medium text-sm">
          Religion
        </label>
        <select
          id="religion"
          value={
            religionList.includes(formData.religion || "")
              ? formData.religion
              : "Other"
          }
          onChange={(e) => handleDropdownChange("religion", e.target.value)}
          className="border rounded p-2 focus:outline-none focus:ring focus:ring-blue-300"
        >
          <option value="" disabled>
            Select religion
          </option>
          {religionList.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {isOtherReligion && (
          <LabeledInput
            label="Enter Religion"
            value={formData.religion || ""}
            onChangeValue={(v: string) => setField("religion", v)}
            placeholder="Type your religion"
          />
        )}
      </div>

      {/* Denomination */}
      <div className="flex flex-col space-y-2">
        <label htmlFor="denomination" className="mb-1 font-medium text-sm">
          Denomination
        </label>
        <select
          id="denomination"
          value={
            denominationList.includes(formData.denomination || "")
              ? formData.denomination
              : "Other"
          }
          onChange={(e) => handleDropdownChange("denomination", e.target.value)}
          className="border rounded p-2 focus:outline-none focus:ring focus:ring-blue-300"
        >
          <option value="" disabled>
            Select denomination
          </option>
          {denominationList.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {isOtherDenomination && (
          <LabeledInput
            label="Enter Denomination"
            value={formData.denomination || ""}
            onChangeValue={(v: string) => setField("denomination", v)}
            placeholder="Type your denomination"
          />
        )}
      </div>
    </div>
  );
}
