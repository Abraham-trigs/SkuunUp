// app/store/admissionStore.ts
"use client";

import { create } from "zustand";
import { z } from "zod";
import axios from "axios";

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
  startDate: string;
  endDate: string;
};

export type SchoolClass = {
  id: string;
  name: string;
  grade: string;
};

// ------------------ Form Schema ------------------
export const admissionFormSchema = z.object({
  admissionPin: z.string(),
  studentId: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().default("STUDENT"),
  classId: z.string().optional(),
  surname: z.string().optional(),
  firstName: z.string().optional(),
  otherNames: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  sex: z.string().optional(),
  languages: z.array(z.string()).optional(),
  mothersTongue: z.string().optional(),
  religion: z.string().optional(),
  denomination: z.string().optional(),
  hometown: z.string().optional(),
  region: z.string().optional(),
  profilePicture: z.string().optional(),
  wardLivesWith: z.string().optional(),
  numberOfSiblings: z.number().optional(),
  siblingsOlder: z.number().optional(),
  siblingsYounger: z.number().optional(),
  postalAddress: z.string().optional(),
  residentialAddress: z.string().optional(),
  wardMobile: z.string().optional(),
  wardEmail: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyMedicalContact: z.string().optional(),
  medicalSummary: z.string().optional(),
  bloodType: z.string().optional(),
  specialDisability: z.string().optional(),
  feesAcknowledged: z.boolean().default(false),
  declarationSigned: z.boolean().default(false),
  signature: z.string().optional(),
  classification: z.string().optional(),
  submittedBy: z.string().optional(),
  receivedBy: z.string().optional(),
  receivedDate: z.string().optional(),
  remarks: z.string().optional(),
  previousSchools: z.array(z.any()).optional(),
  familyMembers: z.array(z.any()).optional(),
});

// ------------------ Store ------------------
interface AdmissionStore {
  formData: z.infer<typeof admissionFormSchema>;
  availableClasses: SchoolClass[];
  loading: boolean;
  errors: Record<string, string[]>;
  submitted: boolean;
  userCreated: boolean;

  setField: (field: string, value: any) => void;
  createUser: () => Promise<boolean>;
  submitForm: () => Promise<void>;
  fetchClasses: () => Promise<void>;
  addFamilyMember: (member: FamilyMember) => void;
  removeFamilyMember: (idx: number) => void;
  addPreviousSchool: (school: PreviousSchool) => void;
  removePreviousSchool: (idx: number) => void;
}

export const useAdmissionStore = create<AdmissionStore>((set, get) => ({
  formData: {
    admissionPin: "",
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
    studentId: undefined,
    classId: "",
    surname: "",
    firstName: "",
    otherNames: "",
    dateOfBirth: "",
    nationality: "",
    sex: "",
    languages: [],
    mothersTongue: "",
    religion: "",
    denomination: "",
    hometown: "",
    region: "",
    profilePicture: "",
    wardLivesWith: "",
    numberOfSiblings: undefined,
    siblingsOlder: undefined,
    siblingsYounger: undefined,
    postalAddress: "",
    residentialAddress: "",
    wardMobile: "",
    wardEmail: "",
    emergencyContact: "",
    emergencyMedicalContact: "",
    medicalSummary: "",
    bloodType: "",
    specialDisability: "",
    feesAcknowledged: false,
    declarationSigned: false,
    signature: "",
    classification: "",
    submittedBy: "",
    receivedBy: "",
    receivedDate: "",
    remarks: "",
    previousSchools: [],
    familyMembers: [],
  },
  availableClasses: [],
  loading: false,
  errors: {},
  submitted: false,
  userCreated: false,

  setField: (field, value) => {
    set((state) => {
      const keys = field.split(".");
      let obj: any = state.formData;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return { formData: state.formData };
    });
  },

  createUser: async () => {
    set({ loading: true, errors: {} });
    try {
      const { name, email, password, role } = get().formData;
      const res = await axios.post("/api/users", { name, email, password, role });
      if (res.status === 201) {
        // Store studentId from created user
        set({ formData: { ...get().formData, studentId: res.data.id }, userCreated: true });
        return true;
      }
    } catch (err: any) {
      if (err.response?.data?.error) set({ errors: { createUser: [err.response.data.error] } });
    } finally {
      set({ loading: false });
    }
    return false;
  },

  submitForm: async () => {
    if (!get().userCreated) {
      set({ errors: { submitForm: ["User must be created first."] } });
      return;
    }
    set({ loading: true, errors: {} });
    try {
      const body = get().formData;
      await axios.post("/api/admissions", body);
      set({ submitted: true });
    } catch (err: any) {
      if (err.response?.data?.error) set({ errors: { submitForm: [err.response.data.error] } });
    } finally {
      set({ loading: false });
    }
  },

  fetchClasses: async () => {
    try {
      const res = await axios.get("/api/classes");
      set({ availableClasses: res.data || [] });
    } catch (err) {
      console.error("Error fetching classes", err);
    }
  },

  addFamilyMember: (member) => {
    set((state) => ({ formData: { ...state.formData, familyMembers: [...(state.formData.familyMembers || []), member] } }));
  },
  removeFamilyMember: (idx) => {
    set((state) => ({
      formData: {
        ...state.formData,
        familyMembers: state.formData.familyMembers?.filter((_, i) => i !== idx),
      },
    }));
  },
  addPreviousSchool: (school) => {
    set((state) => ({ formData: { ...state.formData, previousSchools: [...(state.formData.previousSchools || []), school] } }));
  },
  removePreviousSchool: (idx) => {
    set((state) => ({
      formData: { ...state.formData, previousSchools: state.formData.previousSchools?.filter((_, i) => i !== idx) },
    }));
  },
}));
