import { toast } from "sonner";

export interface ReadResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
}

export async function clientReadAction<R>(
  action: () => Promise<ReadResult<R>>,
  options?: {
    onSuccess?: (data: R) => Promise<void> | void;
    onError?: () => Promise<void> | void;
    onLoading?: (loading: boolean) => Promise<void> | void;
  },
) {
  await options?.onLoading?.(true);

  try {
    const res = await action();

    if (!res.success) {
      toast.error(
        Object.values(res.details ?? {})[0]?.[0] ??
          res.error ??
          "An unexpected error occurred.",
      );
      await options?.onError?.();
      return res;
    }

    if (res.data) {
      await options?.onSuccess?.(res.data);
    }

    return res;
  } finally {
    await options?.onLoading?.(false);
  }
}
