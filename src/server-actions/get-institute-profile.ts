import { verifyUser } from "./verifyUser.action";

export async function requireInstitute() {
  const result = await verifyUser();

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.profile;
}
