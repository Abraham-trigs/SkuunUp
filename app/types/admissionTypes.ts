// app/types/admissionTypes.ts

// =====================
// Family Member
// =====================
export interface FamilyMember {
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
}

// =====================
// Previous School
// =====================
export interface PreviousSchool {
  name: string;
  location: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

// =====================
// School Class
// =====================
export interface SchoolClass {
  id: string;
  name: string;
  grade: string;
}

// =====================
// Admission Form Data
// =====================
export interface AdmissionFormData {
  studentId: string;
  classId: string;
  surname: string;
  firstName: string;
  otherNames?: string;
  dateOfBirth: string;
  nationality: string;
  sex: string;
  languages: string[];
  mothersTongue: string;
  religion: string;
  denomination?: string;
  hometown: string;
  region: string;
  profilePicture?: string;
  wardLivesWith: string;
  numberOfSiblings?: number;
  siblingsOlder?: number;
  siblingsYounger?: number;
  postalAddress: string;
  residentialAddress: string;
  wardMobile?: string;
  wardEmail?: string;
  emergencyContact: string;
  emergencyMedicalContact?: string;
  medicalSummary?: string;
  bloodType?: string;
  specialDisability?: string;
  feesAcknowledged: boolean;
  declarationSigned: boolean;
  signature?: string;
  classification?: string;
  submittedBy?: string;
  receivedBy?: string;
  receivedDate?: string;
  remarks?: string;
  previousSchools?: PreviousSchool[];
  familyMembers?: FamilyMember[];
  admissionPin: string;
  grade?: string; // synced from selected class
}
