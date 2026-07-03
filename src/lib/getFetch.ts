import { getAcademicSession } from "../server-actions/academicSession.action";

export const fetchAcademicSession = async () => {
  try {
    const data = await getAcademicSession();
    return data;
  } catch (error) {
    console.error(error);
  }
};
