"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

export type FinishedBook = {
  id: number;
  title: string;
  isbn: string | null;
  authorNames: string;
  rating: number | null;
  readEnded: string; // ISO string — dates serialize to strings across the server/client boundary
};

type SortKey = "title" | "author" | "rating" | "date";
type SortDir = "asc" | "desc";

export function ReadingHistoryTable({ books }: { books: FinishedBook[] }) {
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const displayed = useMemo(() => {
    const q = filter.toLowerCase().trim();
    const filtered = q
      ? books.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.authorNames.toLowerCase().includes(q)
        )
      : books;

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "author":
          cmp = a.authorNames.localeCompare(b.authorNames);
          break;
        case "rating":
          cmp = (a.rating ?? 0) - (b.rating ?? 0);
          break;
        case "date":
          cmp = new Date(a.readEnded).getTime() - new Date(b.readEnded).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [books, filter, sortKey, sortDir]);

  if (books.length === 0) {
    return <p className="text-sm text-zinc-400">No books finished yet.</p>;
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by title or author…"
        className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:ring-zinc-400"
      />

      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="w-14 px-4 py-3" />
                <th className="px-4 py-3 text-left">
                  <SortHeader
                    label="Title"
                    active={sortKey === "title"}
                    dir={sortDir}
                    onClick={() => handleSort("title")}
                  />
                </th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">
                  <SortHeader
                    label="Author"
                    active={sortKey === "author"}
                    dir={sortDir}
                    onClick={() => handleSort("author")}
                  />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader
                    label="Rating"
                    active={sortKey === "rating"}
                    dir={sortDir}
                    onClick={() => handleSort("rating")}
                  />
                </th>
                <th className="px-4 py-3 text-left hidden md:table-cell">
                  <SortHeader
                    label="Finished"
                    active={sortKey === "date"}
                    dir={sortDir}
                    onClick={() => handleSort("date")}
                  />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {displayed.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-zinc-400"
                  >
                    No results.
                  </td>
                </tr>
              ) : (
                displayed.map((book) => (
                  <tr
                    key={book.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      {book.isbn ? (
                        <Image
                          src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-S.jpg`}
                          alt=""
                          width={36}
                          height={54}
                          className="rounded object-cover"
                        />
                      ) : (
                        <div className="w-9 h-[54px] rounded bg-zinc-100 dark:bg-zinc-800" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {book.isbn ? (
                        <a
                          href={`https://openlibrary.org/isbn/${book.isbn}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-zinc-900 dark:text-zinc-50 hover:underline"
                        >
                          {book.title}
                        </a>
                      ) : (
                        <span className="font-medium text-zinc-900 dark:text-zinc-50">
                          {book.title}
                        </span>
                      )}
                      {/* Author shown inline on small screens where the Author column is hidden */}
                      <p className="text-xs text-zinc-400 mt-0.5 sm:hidden">
                        {book.authorNames || "Unknown author"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">
                      {book.authorNames || "Unknown author"}
                    </td>
                    <td className="px-4 py-3">
                      <StarRating rating={book.rating} />
                    </td>
                    <td className="px-4 py-3 text-zinc-400 hidden md:table-cell whitespace-nowrap">
                      {new Date(book.readEnded).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs font-semibold text-zinc-400 uppercase tracking-widest hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
    >
      {label}
      <span
        className={
          active
            ? "text-zinc-600 dark:text-zinc-300"
            : "opacity-0 pointer-events-none"
        }
        aria-hidden={!active}
      >
        {dir === "asc" ? "↑" : "↓"}
      </span>
    </button>
  );
}

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) {
    return <span className="text-zinc-300 dark:text-zinc-600 text-xs">—</span>;
  }
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={s <= rating ? "#f59e0b" : "none"}
          stroke={s <= rating ? "#f59e0b" : "#d4d4d8"}
          strokeWidth="1.5"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}
