export async function fetchData<T>(
  action: () => Promise<
    | { success: true; data: T; error?: undefined }
    | { success: false; error: string; data?: undefined }
  >,
): Promise<T> {
  const result = await action();

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data as T;
}
