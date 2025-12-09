"use client";

import { create } from "zustand";
import { z } from "zod";
import axios from "axios";
import { useClassesStore } from "./useClassesStore.ts";
import { useAuthStore } from "./useAuthStore.ts";

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

export const admissionFormSchema = z.object({
  applicationId: z.string().optional(),
  studentId: z.string().optional(),
  admissionPin: z.string().optional(),
  classId: z.string(),
  surname: z.string(),
  firstName: z.string(),
  otherNames: z.string().optional(),
  dateOfBirth: z.string(),
  nationality: z.string(),
  sex: z.string(),
  languages: z.array(z.string()),
  mothersTongue: z.string(),
  religion: z.string(),
  denomination: z.string().optional(),
  hometown: z.string(),
  region: z.string(),
  profilePicture: z.string().optional(),
  wardLivesWith: z.string(),
  numberOfSiblings: z.number().optional(),
  siblingsOlder: z.number().optional(),
  siblingsYounger: z.number().optional(),
  postalAddress: z.string(),
  residentialAddress: z.string(),
  wardMobile: z.string().optional(),
  wardEmail: z.string().optional(),
  emergencyContact: z.string(),
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
  previousSchools: z.array(PreviousSchoolSchema).optional(),
  familyMembers: z.array(FamilyMemberSchema).optional(),
});

// ------------------ Store Interface ------------------
interface AdmissionStore {
  formData: z.infer<typeof admissionFormSchema>;
  availableClasses: SchoolClass[];
  loading: boolean;
  errors: Record<string, string[]>;
  userCreated: boolean;
  minimalCreated: boolean;

  setField: (field: string, value: any) => void;
  setErrors: (errors: Record<string, string[]>) => void;
  markUserCreated: (studentId: string, applicationId?: string) => void;

  createUser: () => Promise<string | false>;
  createMinimalAdmission: () => Promise<boolean>;
  updateAdmission: (updatedFields?: Partial<z.infer<typeof admissionFormSchema>>) => Promise<void>;
  fetchStudentAdmission: (applicationId: string) => Promise<void>;
  fetchClasses: () => Promise<void>;

  addFamilyMember: (member: FamilyMember) => void;
  removeFamilyMember: (idx: number) => void;
  addPreviousSchool: (school: PreviousSchool) => void;
  removePreviousSchool: (idx: number) => void;

  loadStudentData: (admission: any) => void;
}

// ------------------ Store Implementation ------------------
export const useAdmissionStore = create<AdmissionStore>((set, get) => ({
  formData: admissionFormSchema.partial().parse({ admissionPin: "" }),
  availableClasses: [],
  loading: false,
  errors: {},
  userCreated: false,
  minimalCreated: false,

  setField: (field, value) => {
    set((state) => {
      const keys = field.split(".");
      let obj: any = state.formData;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return { formData: state.formData };
    });
  },

  setErrors: (errors) => set({ errors }),

  markUserCreated: (studentId, applicationId) => {
    set((state) => ({
      formData: { ...state.formData, studentId, applicationId },
      userCreated: true,
    }));
  },

  // ---------------- CREATE USER ----------------
  createUser: async () => {
    set({ loading: true, errors: {} });
    try {
      const schoolId = useAuthStore.getState().user?.school.id;
      if (!schoolId) throw new Error("Unauthorized: School ID missing");

      const { surname, firstName, otherNames, wardEmail } = get().formData;
      const password = "Default123";

      const resUser = await axios.post(
        "/api/users",
        { surname, firstName, otherNames, email: wardEmail, password, role: "STUDENT" },
        { headers: { "X-School-ID": schoolId } }
      );

      const studentId = resUser.data.student?.id;
      set({ formData: { ...get().formData, studentId }, userCreated: true });
      return studentId;
    } catch (err: any) {
      set({ errors: { createUser: [err.response?.data?.error || err.message || "Failed to create user"] } });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ---------------- CREATE MINIMAL ADMISSION ----------------
  createMinimalAdmission: async () => {
    set({ loading: true, errors: {} });
    try {
      const schoolId = useAuthStore.getState().user?.school.id;
      if (!schoolId) throw new Error("Unauthorized: School ID missing");

      const { studentId, admissionPin, classId, surname, firstName, dateOfBirth, nationality, sex } = get().formData;
      if (!studentId) throw new Error("Student ID missing");

      const payload: any = {
        studentId,
        classId,
        surname,
        firstName,
        dateOfBirth: typeof dateOfBirth === "string" ? dateOfBirth : dateOfBirth.toISOString().slice(0, 10),
        nationality,
        sex,
      };
      if (admissionPin) payload.admissionPin = admissionPin;

      const resAdmission = await axios.post(
        "/api/admissions",
        payload,
        { headers: { "X-School-ID": schoolId } }
      );

      const applicationId = resAdmission.data.admission?.id || resAdmission.data.id;
      set({
        formData: { ...get().formData, applicationId },
        minimalCreated: true,
      });

      return true;
    } catch (err: any) {
      set({ errors: { createMinimalAdmission: [err.response?.data?.error || err.message || "Failed to create minimal admission"] } });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ---------------- UPDATE ADMISSION (Partial) ----------------
  updateAdmission: async (updatedFields) => {
    const applicationId = get().formData.applicationId;
    if (!applicationId) {
      set({ errors: { updateAdmission: ["Application ID missing"] } });
      return;
    }

    set({ loading: true, errors: {} });
    try {
      const schoolId = useAuthStore.getState().user?.school.id;
      if (!schoolId) throw new Error("Unauthorized: School ID missing");

      const body = { ...get().formData, ...updatedFields };
      const partialSchema = admissionFormSchema.partial();
      partialSchema.parse(body);

      await axios.patch(
        `/api/admissions?admissionId=${applicationId}`,
        body,
        { headers: { "X-School-ID": schoolId } }
      );

      set({ formData: body });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        set({
          errors: {
            updateAdmission:
              (err.errors || err.issues)?.map(e => e.message) || ["Validation failed"],
          },
        });
      } else {
        set({
          errors: {
            updateAdmission: [
              err?.response?.data?.error || err?.message || "Failed to update admission",
            ],
          },
        });
      }
    } finally {
      set({ loading: false });
    }
  },

  // ---------------- FETCH STUDENT ADMISSION ----------------
  fetchStudentAdmission: async (applicationId) => {
    set({ loading: true, errors: {} });
    try {
      const schoolId = useAuthStore.getState().user?.school.id;
      if (!schoolId) throw new Error("Unauthorized: School ID missing");

      const res = await axios.get(
        `/api/admissions?admissionId=${applicationId}`,
        { headers: { "X-School-ID": schoolId } }
      );

      get().loadStudentData(res.data.admission || res.data.data);
    } catch (err: any) {
      set({
        errors: {
          fetchStudentAdmission: [
            err.response?.data?.error || err.message || "Failed to fetch admission",
          ],
        },
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchClasses: async () => {
    try {
      await useClassesStore.getState().fetchClasses(1, 100);
      set({ availableClasses: useClassesStore.getState().classes });
    } catch (err) {
      console.error(err);
      set({ availableClasses: [] });
    }
  },

  addFamilyMember: (member) =>
    set((state) => ({
      formData: { ...state.formData, familyMembers: [...(state.formData.familyMembers || []), member] },
    })),
  removeFamilyMember: (idx) =>
    set((state) => ({
      formData: { ...state.formData, familyMembers: state.formData.familyMembers?.filter((_, i) => i !== idx) },
    })),

  addPreviousSchool: (school) =>
    set((state) => ({
      formData: { ...state.formData, previousSchools: [...(state.formData.previousSchools || []), school] },
    })),
  removePreviousSchool: (idx) =>
    set((state) => ({
      formData: { ...state.formData, previousSchools: state.formData.previousSchools?.filter((_, i) => i !== idx) },
    })),

  loadStudentData: (admission) => {
    if (!admission) return;
    set({
      formData: {
        ...get().formData,
        applicationId: admission.id,
        studentId: admission.student?.id,
        classId: admission.student?.classId || "",
        surname: admission.surname,
        firstName: admission.firstName,
        otherNames: admission.otherNames,
        dateOfBirth: new Date(admission.dateOfBirth),
        nationality: admission.nationality,
        sex: admission.sex,
        languages: admission.languages,
        mothersTongue: admission.mothersTongue,
        religion: admission.religion,
        denomination: admission.denomination,
        hometown: admission.hometown,
        region: admission.region,
        profilePicture: admission.profilePicture,
        wardLivesWith: admission.wardLivesWith,
        numberOfSiblings: admission.numberOfSiblings,
        siblingsOlder: admission.siblingsOlder,
        siblingsYounger: admission.siblingsYounger,
        postalAddress: admission.postalAddress,
        residentialAddress: admission.residentialAddress,
        wardMobile: admission.wardMobile,
        wardEmail: admission.student?.user?.email,
        emergencyContact: admission.emergencyContact,
        emergencyMedicalContact: admission.emergencyMedicalContact,
        medicalSummary: admission.medicalSummary,
        bloodType: admission.bloodType,
        specialDisability: admission.specialDisability,
        feesAcknowledged: admission.feesAcknowledged,
        declarationSigned: admission.declarationSigned,
        signature: admission.signature,
        classification: admission.classification,
        submittedBy: admission.submittedBy,
        receivedBy: admission.receivedBy,
        receivedDate: admission.receivedDate ? new Date(admission.receivedDate) : null,
        remarks: admission.remarks,
        previousSchools: admission.previousSchools || [],
        familyMembers: admission.familyMembers || [],
      },
      userCreated: true,
      minimalCreated: true,
    });
  },
}));
