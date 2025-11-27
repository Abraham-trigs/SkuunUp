// app/admission/form/schemas/step3Schema.ts
import { z } from "zod";

export const Step3Schema = z.object({
  familyMembers: z
    .array(
      z.object({
        relation: z.string().nonempty({ message: "Relation is required" }),
        name: z.string().nonempty({ message: "Name is required" }),
        postalAddress: z.string().nonempty({ message: "Postal Address is required" }),
        residentialAddress: z.string().nonempty({ message: "Residential Address is required" }),
      })
    )
    .nonempty({ message: "At least one family member is required" }),
});
