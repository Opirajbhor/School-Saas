"use server";
import { eq } from "drizzle-orm";
import { verifyUser } from "./verifyUser.action";
import { db } from "../db";
import { student } from "../db/schema/student.drizzle";

// get student
export async function getStudents() {
  const verify = await verifyUser();
  if (!verify || verify.success === false || !verify.profile) {
    return {
      success: false,
      error:
        verify?.success === false
          ? verify.error
          : "Failed to verify user profile.",
    };
  }
  const info = verify.profile.id;
  try {
    const data = await db.query.student.findMany({
      where: eq(student.instituteId, info),
    });

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Database error in Student list:", error);

    return {
      success: false,
      error: "Failed to fetch student list.",
    };
  }
}


export async function addStudent(){
  
}