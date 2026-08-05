import { z } from "zod";

export type ValidationFailure = {
  success: false;
  error: string;
  details: Record<string, string[] | undefined>;
};

export type ValidationSuccess<T> = {
  success: true;
  data: T;
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Replaces the repeated `safeParse` + `details` block in every action.
 * Returns the exact same shape your UI expects for toast handling.
 */
export function parseWithZod<T extends z.ZodType>(
  schema: T,
  data: unknown,
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      details: result.error.flatten().fieldErrors,
    };
  }
  if (data === null || data === undefined) {
    return {
      success: false,
      error: "Data is null or undefined",
      details: {},
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
