import { auth } from "@clerk/nextjs/server";
import { and, avg, count, eq, isNotNull, isNull, sql } from "drizzle-orm";
import Image from "next/image";
import { db } from "@/db";
import { authors, bookAuthors, books, readingRecords } from "@/db/schema";
import { AddBookButton } from "@/components/AddBookButton";
import { FinishReadingButton } from "@/components/FinishReadingButton";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500">Sign in to see your reading dashboard.</p>
      </div>
    );
  }

  const [
    currentlyReading,
    [{ finishedCount }],
    [{ readingCount }],
    [{ avgPagesPerDay }],
    authorStatsRaw,
  ] = await Promise.all([
    db.query.readingRecords.findMany({
      where: and(
        eq(readingRecords.clerkUserId, userId),
        isNotNull(readingRecords.readStarted),
        isNull(readingRecords.readEnded)
      ),
      with: {
        book: {
          with: {
            bookAuthors: {
              with: { author: true },
              orderBy: (ba, { asc }) => [asc(ba.authorOrder)],
            },
          },
        },
      },
    }),
    db
      .select({ finishedCount: count() })
      .from(readingRecords)
      .where(and(eq(readingRecords.clerkUserId, userId), isNotNull(readingRecords.readEnded))),
    db
      .select({ readingCount: count() })
      .from(readingRecords)
      .where(
        and(
          eq(readingRecords.clerkUserId, userId),
          isNotNull(readingRecords.readStarted),
          isNull(readingRecords.readEnded)
        )
      ),
    db
      .select({
        avgPagesPerDay: sql<number | null>`AVG(
          ${books.pageCount}::float /
          GREATEST(1, EXTRACT(EPOCH FROM (${readingRecords.readEnded} - ${readingRecords.readStarted})) / 86400)
        )`,
      })
      .from(readingRecords)
      .innerJoin(books, eq(readingRecords.bookId, books.id))
      .where(
        and(
          eq(readingRecords.clerkUserId, userId),
          isNotNull(readingRecords.readEnded),
          isNotNull(readingRecords.readStarted),
          isNotNull(books.pageCount)
        )
      ),
    db
      .select({
        authorId: authors.id,
        name: authors.name,
        readCount: count(readingRecords.id),
        avgRating: avg(readingRecords.rating),
      })
      .from(readingRecords)
      .innerJoin(bookAuthors, eq(readingRecords.bookId, bookAuthors.bookId))
      .innerJoin(authors, eq(bookAuthors.authorId, authors.id))
      .where(and(eq(readingRecords.clerkUserId, userId), isNotNull(readingRecords.readEnded)))
      .groupBy(authors.id, authors.name),
  ]);

  const topRatedAuthors = [...authorStatsRaw]
    .filter((a) => a.avgRating !== null)
    .sort((a, b) => Number(b.avgRating) - Number(a.avgRating))
    .slice(0, 5);

  const mostReadAuthors = [...authorStatsRaw]
    .sort((a, b) => b.readCount - a.readCount)
    .slice(0, 5);

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-zinc-950">
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-10">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Reading Dashboard
        </h1>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              Currently Reading
            </h2>
            <AddBookButton />
          </div>
          {currentlyReading.length === 0 ? (
            <p className="text-sm text-zinc-400">No books in progress.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {currentlyReading.map((record) => {
                const authorNames = record.book.bookAuthors
                  .map((ba) => ba.author.name)
                  .join(", ");
                const daysAgo =
                  record.readStarted !== null
                    ? Math.floor(
                        (Date.now() - record.readStarted.getTime()) / (1000 * 60 * 60 * 24)
                      )
                    : null;
                const coverUrl = record.book.isbn
                  ? `https://covers.openlibrary.org/b/isbn/${record.book.isbn}-M.jpg`
                  : null;
                return (
                  <div
                    key={record.id}
                    className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 flex flex-col"
                  >
                    <div className="flex gap-4">
                      {coverUrl && (
                        <div className="shrink-0">
                          <Image
                            src={coverUrl}
                            alt={`Cover of ${record.book.title}`}
                            width={56}
                            height={84}
                            className="rounded object-cover"
                          />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <p className="text-xs text-zinc-400 mb-1 truncate">
                          {authorNames || "Unknown author"}
                        </p>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-50 leading-snug">
                          {record.book.title}
                        </p>
                        {daysAgo !== null && (
                          <p className="mt-auto pt-3 text-xs text-zinc-400">
                            Started{" "}
                            {daysAgo === 0
                              ? "today"
                              : `${daysAgo} day${daysAgo === 1 ? "" : "s"} ago`}
                          </p>
                        )}
                      </div>
                    </div>
                    <FinishReadingButton recordId={record.id} bookTitle={record.book.title} />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Books Finished", value: finishedCount },
              { label: "Currently Reading", value: readingCount },
              {
                label: "Avg Pages / Day",
                value:
                  avgPagesPerDay != null ? Math.round(Number(avgPagesPerDay)) : "—",
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-xs text-zinc-400 mb-2">{label}</p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            Authors
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-semibold text-zinc-400 mb-4">Highest Rated</p>
              {topRatedAuthors.length === 0 ? (
                <p className="text-sm text-zinc-400">No rated books yet.</p>
              ) : (
                <ol className="space-y-3">
                  {topRatedAuthors.map((a, i) => (
                    <li key={a.authorId} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-zinc-400 w-4 shrink-0">{i + 1}</span>
                        <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {a.name}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-zinc-500 shrink-0">
                        {Number(a.avgRating).toFixed(1)} ★
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-semibold text-zinc-400 mb-4">Most Read</p>
              {mostReadAuthors.length === 0 ? (
                <p className="text-sm text-zinc-400">No books finished yet.</p>
              ) : (
                <ol className="space-y-3">
                  {mostReadAuthors.map((a, i) => (
                    <li key={a.authorId} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-zinc-400 w-4 shrink-0">{i + 1}</span>
                        <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {a.name}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-zinc-500 shrink-0">
                        {a.readCount} book{a.readCount === 1 ? "" : "s"}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
