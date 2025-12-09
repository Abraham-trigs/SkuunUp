// app/stores/useAdmissionStore.ts
// Store for managing student admission step-wise with backend sync

"use client";

import { create } from "zustand";
import { z } from "zod";
import axios from "axios";
import { useClassesStore } from "./useClassesStore";
import { useAuthStore } from "./useAuthStore";

// ------------------ Types ------------------
export type FamilyMember = {
  relation: string;
  name: string;
  postalAddress: string;
  residentialAddress: string;
  phone?: string;
  email?: string;
  occupation?: string;
  workplace?: string;
  religion?: string;
  isAlive?: boolean;
};

export type PreviousSchool = {
  name: string;
  location: string;
  startDate: string | Date;
  endDate: string | Date;
};

export type SchoolClass = {
  id: string;
  name: string;
  grade: string;
};

// ------------------ Zod Schemas ------------------
const FamilyMemberSchema = z.object({
  relation: z.string(),
  name: z.string(),
  postalAddress: z.string(),
  residentialAddress: z.string(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  occupation: z.string().optional(),
  workplace: z.string().optional(),
  religion: z.string().optional(),
  isAlive: z.boolean().optional(),
});

const PreviousSchoolSchema = z.object({
  name: z.string(),
  location: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

// Complete admission schema (used for validation)
export const admissionFormSchema = z.object({
  applicationId: z.string().optional(),
  studentId: z.string().optional(),
  admissionPin: z.string().optional(),
  classId: z.string().optional(),
  // Step 1: User fields
  surname: z.string().optional(),
  firstName: z.string().optional(),
  otherNames: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().optional(),
  // Step 2
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  sex: z.string().optional(),
  // Step 3
  languages: z.array(z.string()).optional(),
  mothersTongue: z.string().optional(),
  religion: z.string().optional(),
  denomination: z.string().optional(),
  hometown: z.string().optional(),
  region: z.string().optional(),
  // Step 4
  profilePicture: z.string().optional(),
  wardLivesWith: z.string().optional(),
  numberOfSiblings: z.number().optional(),
  siblingsOlder: z.number().optional(),
  siblingsYounger: z.number().optional(),
  // Step 5
  postalAddress: z.string().optional(),
  residentialAddress: z.string().optional(),
  wardMobile: z.string().optional(),
  wardEmail: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyMedicalContact: z.string().optional(),
  // Step 6
  medicalSummary: z.string().optional(),
  bloodType: z.string().optional(),
  specialDisability: z.string().optional(),
  // Step 7
  previousSchools: z.array(PreviousSchoolSchema).optional(),
  familyMembers: z.array(FamilyMemberSchema).optional(),
  // Step 8
  feesAcknowledged: z.boolean().optional(),
  declarationSigned: z.boolean().optional(),
  signature: z.string().optional(),
  classification: z.string().optional(),
  submittedBy: z.string().optional(),
  receivedBy: z.string().optional(),
  receivedDate: z.string().optional(),
  remarks: z.string().optional(),
  progress: z.number().default(0),
});

// ------------------ Step Definitions ------------------
const STEP_FIELDS = [
  ["surname", "firstName", "otherNames", "email", "password", "classId"], // Step 1: create user+student+app
  ["dateOfBirth", "nationality", "sex"], // Step 2
  ["languages", "mothersTongue", "religion", "denomination", "hometown", "region"], // Step 3
  ["profilePicture", "wardLivesWith", "numberOfSiblings", "siblingsOlder", "siblingsYounger"], // Step 4
  ["postalAddress", "residentialAddress", "wardMobile", "wardEmail", "emergencyContact", "emergencyMedicalContact"], // Step 5
  ["medicalSummary", "bloodType", "specialDisability"], // Step 6
  ["previousSchools", "familyMembers"], // Step 7
  ["feesAcknowledged", "declarationSigned", "signature"], // Step 8
];

// ------------------ Helper ------------------
function calculateProgress(formData: any) {
  let completedSteps = 0;
  STEP_FIELDS.forEach((fields) => {
    const stepComplete = fields.every((f) => {
      const val = formData[f];
      if (Array.isArray(val)) return val.length > 0;
      if (typeof val === "boolean") return val === true;
      return val !== undefined && val !== null && val !== "";
    });
    if (stepComplete) completedSteps += 1;
  });
  return Math.round((completedSteps / STEP_FIELDS.length) * 100);
}

// ------------------ Store Interface ------------------
interface AdmissionStore {
  formData: z.infer<typeof admissionFormSchema>;
  availableClasses: SchoolClass[];
  loading: boolean;
  errors: Record<string, string[]>;
  userCreated: boolean;

  setField: (field: string, value: any) => void;
  completeStep: (step: number) => Promise<boolean>;
  fetchClasses: () => Promise<void>;
  loadStudentData: (admission: any) => void;
  addFamilyMember: (member: FamilyMember) => void;
  removeFamilyMember: (idx: number) => void;
  addPreviousSchool: (school: PreviousSchool) => void;
  removePreviousSchool: (idx: number) => void;
}

// ------------------ Store Implementation ------------------
export const useAdmissionStore = create<AdmissionStore>((set, get) => ({
  formData: admissionFormSchema.partial().parse({ admissionPin: "" }),
  availableClasses: [],
  loading: false,
  errors: {},
  userCreated: false,

  setField: (field, value) => {
    set((state) => {
      const keys = field.split(".");
      let obj: any = state.formData;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      state.formData.progress = calculateProgress(state.formData);
      return { formData: state.formData };
    });
  },

  completeStep: async (step) => {
    set({ loading: true, errors: {} });
    try {
      const stepFields = STEP_FIELDS[step - 1];
      const payload: any = {};
      stepFields.forEach((f) => (payload[f] = get().formData[f]));

      const schoolId = useAuthStore.getState().user?.school.id;
      if (!schoolId) throw new Error("Unauthorized: School ID missing");

      if (step === 1) {
        // Step 1 = create user+student+application
        const res = await axios.post("/api/admissions", payload, { headers: { "X-School-ID": schoolId } });
        const app = res.data.admission;
        set((state) => ({
          formData: { ...state.formData, studentId: app.studentId, applicationId: app.id },
          userCreated: true,
        }));
      } else {
        // Steps 2+ = update existing application
        const appId = get().formData.applicationId;
        if (!appId) throw new Error("Application ID missing");
        await axios.patch(`/api/admissions/${appId}`, payload, { headers: { "X-School-ID": schoolId } });
      }

      // Recalculate progress locally
      set((state) => {
        const formWithProgress = { ...state.formData, progress: calculateProgress(state.formData) };
        return { formData: formWithProgress };
      });

      return true;
    } catch (err: any) {
      set({ errors: { completeStep: [err?.response?.data?.error || err.message || "Step failed"] } });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  fetchClasses: async () => {
    try {
      await useClassesStore.getState().fetchClasses(1, 100);
      set({ availableClasses: useClassesStore.getState().classes });
    } catch {
      set({ availableClasses: [] });
    }
  },

  loadStudentData: (admission) => {
    if (!admission) return;
    const formData: any = { ...admission, studentId: admission.student?.id, applicationId: admission.id };
    formData.progress = calculateProgress(formData);
    set({ formData, userCreated: true });
  },

  addFamilyMember: (member) =>
    set((state) => {
      const updated = [...(state.formData.familyMembers || []), member];
      const formWithProgress = { ...state.formData, familyMembers: updated };
      formWithProgress.progress = calculateProgress(formWithProgress);
      return { formData: formWithProgress };
    }),

  removeFamilyMember: (idx) =>
    set((state) => {
      const updated = state.formData.familyMembers?.filter((_, i) => i !== idx) || [];
      const formWithProgress = { ...state.formData, familyMembers: updated };
      formWithProgress.progress = calculateProgress(formWithProgress);
      return { formData: formWithProgress };
    }),

  addPreviousSchool: (school) =>
    set((state) => {
      const updated = [...(state.formData.previousSchools || []), school];
      const formWithProgress = { ...state.formData, previousSchools: updated };
      formWithProgress.progress = calculateProgress(formWithProgress);
      return { formData: formWithProgress };
    }),

  removePreviousSchool: (idx) =>
    set((state) => {
      const updated = state.formData.previousSchools?.filter((_, i) => i !== idx) || [];
      const formWithProgress = { ...state.formData, previousSchools: updated };
      formWithProgress.progress = calculateProgress(formWithProgress);
      return { formData: formWithProgress };
    }),
}));
