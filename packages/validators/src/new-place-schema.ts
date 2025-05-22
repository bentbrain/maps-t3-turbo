import { z } from "zod";

// Base schema with required fields
export const baseFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  address: z.string().min(1, "Address is required"),
  longitude: z.string().min(1, "Longitude is required"),
  latitude: z.string().min(1, "Latitude is required"),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  emoji: z.string().emoji(),
});

// Helper function to create dynamic form schema based on database properties
export function createDynamicFormSchema(
  properties: Record<string, { type: string }>,
) {
  // Use more specific Zod types for dynamic fields
  const dynamicFields: Record<string, z.ZodTypeAny> = {};

  for (const [key, prop] of Object.entries(properties)) {
    if (prop.type === "multi_select") {
      dynamicFields[key.toLowerCase()] = z.array(z.string()).default([]);
    } else if (prop.type === "select") {
      dynamicFields[key.toLowerCase()] = z.string().default("");
    } else if (prop.type === "number") {
      dynamicFields[key.toLowerCase()] = z.coerce.number().default(0);
    }
  }

  // The return type will be a Zod schema with the correct field types
  return baseFormSchema.extend(dynamicFields);
}

// Export type for base form data
export type BaseFormData = z.infer<typeof baseFormSchema>;

// Export type for dynamic form data that includes all possible field types
export type DynamicFormData = BaseFormData &
  Record<string, string | string[] | undefined>;
