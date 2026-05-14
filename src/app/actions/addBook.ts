"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { authors, bookAuthors, books, readingRecords } from "@/db/schema";

export type BookCandidate = {
  title: string;
  authorNames: string[];
  isbn: string | null;
  pageCount: number | null;
};

export async function addBookAction(candidate: BookCandidate): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { title, authorNames, isbn, pageCount } = candidate;

  // Step 1: Resolve book
  let bookId: number;

  if (isbn) {
    const [book] = await db
      .insert(books)
      .values({ title, isbn, pageCount })
      .onConflictDoUpdate({
        target: books.isbn,
        set: { title, pageCount },
      })
      .returning({ id: books.id });
    bookId = book.id;
  } else {
    const existing = await db.query.books.findFirst({
      where: eq(books.title, title),
      columns: { id: true },
    });
    if (existing) {
      bookId = existing.id;
    } else {
      const [book] = await db
        .insert(books)
        .values({ title, pageCount })
        .returning({ id: books.id });
      bookId = book.id;
    }
  }

  // Step 2: Resolve authors and create bookAuthor records
  for (const [i, name] of authorNames.entries()) {
    let author = await db.query.authors.findFirst({
      where: eq(authors.name, name),
      columns: { id: true },
    });
    if (!author) {
      [author] = await db
        .insert(authors)
        .values({ name })
        .returning({ id: authors.id });
    }
    await db
      .insert(bookAuthors)
      .values({ bookId, authorId: author.id, authorOrder: i + 1 })
      .onConflictDoNothing();
  }

  // Step 3: Create the reading record
  await db.insert(readingRecords).values({
    clerkUserId: userId,
    bookId,
    readStarted: new Date(),
  });

  revalidatePath("/");
}
