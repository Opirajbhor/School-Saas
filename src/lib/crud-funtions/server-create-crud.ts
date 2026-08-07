import { db } from "@/src/db";
import { requireInstitute } from "@/src/server-actions/get-institute-profile";
import type { PgTable } from "drizzle-orm/pg-core";
import { z } from "zod";

type CreateConfig<T extends PgTable> = {
  // Runs before insert. Can check/change data.
  beforeCrud?: (params: {
    data: T["$inferInsert"];
    tx: typeof db;
    profile: Awaited<ReturnType<typeof requireInstitute>>;
  }) =>
    | void
    | Partial<T["$inferInsert"]>
    | Promise<void | Partial<T["$inferInsert"]>>;

  // Zod validation
  zodSchema: z.ZodType<Partial<T["$inferInsert"]>>;

  // Extra fields to add before insert
  additionFields?: Partial<T["$inferInsert"]>;

  // Runs after successful insert
  afterCrud?: (params: {
    record: T["$inferSelect"];
    tx: typeof db;
    profile: Awaited<ReturnType<typeof requireInstitute>>;
  }) => void | Promise<void>;

  // Drizzle table
  drizzleSchema: T;
};

// server create function
export async function createRecord<T extends PgTable>(
  config: CreateConfig<T>,
  data: unknown,
) {
  try {
    const profile = await requireInstitute();

    // Validate input first
    const parsed = config.zodSchema.safeParse(data);

    if (!parsed.success) {
      return {
        success: false as const,
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      };
    }

    return await db.transaction(async (tx) => {
      // Allow custom checks/modifications before insert
      const beforeData = config.beforeCrud
        ? await config.beforeCrud({
            data: parsed.data,
            tx: db,
            profile,
          })
        : undefined;

      const insertData = {
        ...parsed.data,
        ...beforeData,
        ...config.additionFields,

        // Always enforce the current institute
        instituteId: profile.id,
        userId: profile.userId,
      };

      const [record] = await tx
        .insert(config.drizzleSchema)
        .values(insertData)
        .returning();

      // Run custom logic after successful insert
      if (config.afterCrud) {
        await config.afterCrud({
          record,
          tx: db,
          profile,
        });
      }

      return {
        success: true as const,
        data: record,
      };
    });
  } catch (error) {
    console.error("Create failed:", error);

    return {
      success: false as const,
      error: "Failed to create record",
      details: {},
    };
  }
}

// // // use case
// // const result = await createRecord(
// //   {
// //     zodSchema: zod Schema Name,
// //     drizzleSchema: drizzle schema name,
// //     beforeCrud: async ({ data }) => {
// //       // Example: check duplicate teacher
// //       // return modified fields if needed
// //       return {
// //         data: data
// //       };
// //     },

// //     additionFields: {
// //       status: "ACTIVE",
// //     },

// //     afterCrud: async ({ record }) => {
// //       // Optional additional operation

// //     },
// //   },
// //   data: data,
// // );

// // post
// export async function create(
//   data: T extends PgTable["$inferInsert"],
//   zodSchema: z.ZodType<T["$inferInsert"]>,
//   drizzleSchema: T extends PgTable,
//   name,
// ) {
//   const profile = await requireInstitute();

//   // parse with zod-----------------
//   const validatedFields = parseWithZod(zodSchema, data);
//   if (!validatedFields.success) return validatedFields;
//   // parse with zod-----------------

//   try {
//     return await db.transaction(async (tx) => {
//       const [newData] = await tx
//         .insert(dbSchema)
//         .values({
//           ...validatedFields.data,
//           instituteId: profile?.id,
//           userId: profile?.userId,
//         })
//         .returning();

//       return {
//         success: true as const,
//         data: newData,
//       };
//     });
//   } catch {
//     return {
//       success: false as const,
//       error: `Failed to create ${name} due to a database failure.`,
//       details: {},
//     };
//   }
// }
