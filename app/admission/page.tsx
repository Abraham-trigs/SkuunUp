// app/admission/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  useAdmissionStore,
  FamilyMember,
  PreviousSchool,
  SchoolClass,
} from "@/app/store/admissionStore";

export default function AdmissionPage() {
  const store = useAdmissionStore();
  const {
    formData,
    setField,
    createUser,
    submitForm,
    fetchClasses,
    addFamilyMember,
    removeFamilyMember,
    addPreviousSchool,
    removePreviousSchool,
    availableClasses,
    loading,
    errors,
    submitted,
    userCreated,
  } = store;

  const [currentStep, setCurrentStep] = useState(1);
  const stepCount = 7;
  const progress = ((currentStep - 1) / (stepCount - 1)) * 100;

  const nextStep = async () => {
    if (currentStep === 1) {
      // Step 1 is user creation
      const created = await createUser();
      if (!created) return; // prevent moving if user not created
    }
    setCurrentStep((s) => Math.min(s + 1, stepCount));
  };

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  useEffect(() => {
    fetchClasses();
  }, []);

  const inputClass =
    "w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)]";

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--ford-primary)]">
              Step 1: Create User
            </h2>
            <input
              className={inputClass}
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setField("name", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setField("email", e.target.value)}
            />
            <input
              type="password"
              className={inputClass}
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setField("password", e.target.value)}
            />
            {errors.createUser && (
              <div className="text-red-600">{errors.createUser.join(", ")}</div>
            )}
          </div>
        );
      case 2:
        if (!userCreated)
          return (
            <div className="text-red-600">Please create the user first.</div>
          );
        return (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--ford-primary)]">
              Step 2: Personal Details
            </h2>
            <input
              className={inputClass}
              placeholder="Surname"
              value={formData.surname}
              onChange={(e) => setField("surname", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => setField("firstName", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Other Names"
              value={formData.otherNames}
              onChange={(e) => setField("otherNames", e.target.value)}
            />
            <input
              type="date"
              className={inputClass}
              placeholder="Date of Birth"
              value={formData.dateOfBirth}
              onChange={(e) => setField("dateOfBirth", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Nationality"
              value={formData.nationality}
              onChange={(e) => setField("nationality", e.target.value)}
            />
            <select
              className={inputClass}
              value={formData.sex}
              onChange={(e) => setField("sex", e.target.value)}
            >
              <option value="">Select Sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        );
      case 3:
        return (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--ford-primary)]">
              Family Members
            </h2>
            {formData.familyMembers?.map((f: FamilyMember, idx: number) => (
              <div
                key={idx}
                className="bg-[var(--background)] p-2 rounded space-y-2"
              >
                <input
                  className={inputClass}
                  placeholder="Relation"
                  value={f.relation}
                  onChange={(e) =>
                    setField(`familyMembers.${idx}.relation`, e.target.value)
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Name"
                  value={f.name}
                  onChange={(e) =>
                    setField(`familyMembers.${idx}.name`, e.target.value)
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Postal Address"
                  value={f.postalAddress}
                  onChange={(e) =>
                    setField(
                      `familyMembers.${idx}.postalAddress`,
                      e.target.value
                    )
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Residential Address"
                  value={f.residentialAddress}
                  onChange={(e) =>
                    setField(
                      `familyMembers.${idx}.residentialAddress`,
                      e.target.value
                    )
                  }
                />
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
      case 4:
        return (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--ford-primary)]">
              Previous Schools
            </h2>
            {formData.previousSchools?.map((s: PreviousSchool, idx: number) => (
              <div
                key={idx}
                className="bg-[var(--background)] p-2 rounded space-y-2"
              >
                <input
                  className={inputClass}
                  placeholder="School Name"
                  value={s.name}
                  onChange={(e) =>
                    setField(`previousSchools.${idx}.name`, e.target.value)
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Location"
                  value={s.location}
                  onChange={(e) =>
                    setField(`previousSchools.${idx}.location`, e.target.value)
                  }
                />
                <input
                  type="date"
                  className={inputClass}
                  placeholder="Start Date"
                  value={s.startDate}
                  onChange={(e) =>
                    setField(`previousSchools.${idx}.startDate`, e.target.value)
                  }
                />
                <input
                  type="date"
                  className={inputClass}
                  placeholder="End Date"
                  value={s.endDate}
                  onChange={(e) =>
                    setField(`previousSchools.${idx}.endDate`, e.target.value)
                  }
                />
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
      case 5:
        return (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--ford-primary)]">
              Medical & Special Needs
            </h2>
            <input
              className={inputClass}
              placeholder="Medical Summary"
              value={formData.medicalSummary}
              onChange={(e) => setField("medicalSummary", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Blood Type"
              value={formData.bloodType}
              onChange={(e) => setField("bloodType", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Special Disability"
              value={formData.specialDisability}
              onChange={(e) => setField("specialDisability", e.target.value)}
            />
          </div>
        );
      case 6:
        return (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--ford-primary)]">
              Class & Admission
            </h2>
            <select
              className={inputClass}
              value={formData.classId}
              onChange={(e) => setField("classId", e.target.value)}
            >
              <option value="">Select Class</option>
              {availableClasses.map((c: SchoolClass) => (
                <option key={c.id} value={c.id}>
                  {c.grade} - {c.name}
                </option>
              ))}
            </select>
          </div>
        );
      case 7:
        return (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--ford-primary)]">
              Declaration & Submission
            </h2>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.feesAcknowledged}
                onChange={(e) => setField("feesAcknowledged", e.target.checked)}
              />
              <span>Fees Acknowledged</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.declarationSigned}
                onChange={(e) =>
                  setField("declarationSigned", e.target.checked)
                }
              />
              <span>Declaration Signed</span>
            </label>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 text-[var(--typo)]">
      <h1 className="text-2xl font-bold text-[var(--ford-primary)] mb-4">
        Student Admission Form
      </h1>
      <div className="p-4 bg-white rounded shadow space-y-4">
        <div className="w-full h-2 rounded bg-[var(--background)] mb-4">
          <div
            className="h-2 rounded bg-[var(--ford-primary)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {renderStep()}

        <div className="flex justify-between mt-4">
          {currentStep > 1 && (
            <button
              className="px-3 py-1 bg-[var(--ford-secondary)] rounded"
              onClick={prevStep}
            >
              Previous
            </button>
          )}
          {currentStep < stepCount ? (
            <button
              className="px-3 py-1 bg-[var(--ford-primary)] rounded"
              onClick={nextStep}
              disabled={loading}
            >
              {loading && currentStep === 1 ? "Creating User..." : "Next"}
            </button>
          ) : (
            <button
              className="px-3 py-1 bg-[var(--success)] rounded"
              onClick={submitForm}
              disabled={loading || submitted}
            >
              {loading ? "Submitting..." : submitted ? "Submitted" : "Submit"}
            </button>
          )}
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-2 bg-[var(--warning)] text-black rounded">
            <h3 className="font-bold">Errors:</h3>
            <ul>
              {Object.entries(errors).map(([field, msgs]) => (
                <li key={field}>
                  {field}: {msgs.join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
