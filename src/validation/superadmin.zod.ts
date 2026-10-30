import { z } from "zod";

// A superadmin governs platform-wide defaults. Creating one hands over full
// access to every institute, so the password rules match signUpZod rather than
// being relaxed here.
const passwordRules = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password is too long")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
    "Password must contain uppercase, lowercase and number",
  );

// ============== create a brand new superadmin account ==============
export const createSuperAdminZod = z
  .object({
    name: z
      .string()
      .min(5, "Name must be at least 5 characters")
      .max(100, "Name is too long"),
    email: z.string().email("Please enter a valid email address"),
    password: passwordRules,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type CreateSuperAdminInput = z.infer<typeof createSuperAdminZod>;

// ============== promote an existing account ==============
export const promoteSuperAdminZod = z.object({
  email: z.string().email("Please enter a valid email address"),
});
export type PromoteSuperAdminInput = z.infer<typeof promoteSuperAdminZod>;

// ============== row shape for the table ==============
export type SuperAdminType = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};
