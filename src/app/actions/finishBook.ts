"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { readingRecords } from "@/db/schema";

export async function finishBookAction(
  recordId: number,
  rating: number | null,
  review: string | null
): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .update(readingRecords)
    .set({
      readEnded: new Date(),
      rating: rating ?? null,
      review: review?.trim() || null,
    })
    .where(and(eq(readingRecords.id, recordId), eq(readingRecords.clerkUserId, userId)));

  revalidatePath("/");
}
