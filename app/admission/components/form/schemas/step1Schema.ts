// app/admission/form/schemas/step1Schema.ts
import { z } from "zod";

export const Step1Schema = z.object({
  firstName: z.string().nonempty({ message: "First Name is required" }),
  surname: z.string().nonempty({ message: "Surname is required" }),
  wardEmail: z.string().email({ message: "Valid email is required" }),
  password: z.string().nonempty({ message: "Password is required" }),
});
