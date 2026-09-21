import { ValidationResult } from "@/src/validation/validator.zod";
import { toast } from "sonner";

export async function handleCrudAction<T, R>(
  action: (data: T) => Promise<ValidationResult<R>>,
  data: T,
  {
    successMessage = "Operation successful",
    onSuccess,
    onError,
    resetForm,
  }: {
    successMessage?: string;
    onSuccess?: (data: R) => Promise<void> | void;
    onError?: () => Promise<void> | void;
    resetForm?: () => Promise<void> | void;
  } = {},
) {
  const res = await action(data);

  if (!res.success) {
    toast.error(
      Object.values(res.details ?? {})[0]?.[0] ??
        res.error ??
        "An unexpected error occurred.",
    );

    await onError?.();
    return res;
  }

  toast.success(successMessage);

  await onSuccess?.(res.data);
  await resetForm?.();

  return res;
}
