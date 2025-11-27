// app/admission/form/schemas/step2Schema.ts
import { z } from "zod";

export const Step2Schema = z.object({
  surname: z.string().nonempty({ message: "Surname is required" }),
  firstName: z.string().nonempty({ message: "First Name is required" }),
  otherNames: z.string().optional(),
  dateOfBirth: z.string().nonempty({ message: "Date of Birth is required" }),
  nationality: z.string().nonempty({ message: "Nationality is required" }),
  sex: z.enum(["Male", "Female"], { errorMap: () => ({ message: "Sex is required" }) }),
});
