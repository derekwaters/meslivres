"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addBookAction, type BookCandidate } from "@/app/actions/addBook";

type OLDoc = {
  title: string;
  author_name?: string[];
  isbn?: string[];
  number_of_pages_median?: number;
  cover_i?: number;
  key: string;
};

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "results"; docs: OLDoc[] }
  | { kind: "empty" }
  | { kind: "adding"; doc: OLDoc }
  | { kind: "success"; title: string }
  | { kind: "error"; message: string };

type Props = {
  open: boolean;
  onClose: () => void;
};

export function BookSearchModal({ open, onClose }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"title" | "author" | "isbn">("title");

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStatus({ kind: "idle" });
        setQuery("");
        setSearchType("title");
      }, 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setStatus({ kind: "loading" });
    const param = searchType === "isbn" ? "isbn" : searchType === "author" ? "author" : "title";
    const url = `https://openlibrary.org/search.json?${param}=${encodeURIComponent(query.trim())}&fields=title,author_name,isbn,number_of_pages_median,cover_i,key&limit=15`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Open Library request failed");
      const data: { docs: OLDoc[] } = await res.json();
      setStatus(data.docs.length > 0 ? { kind: "results", docs: data.docs } : { kind: "empty" });
    } catch {
      setStatus({ kind: "error", message: "Could not reach Open Library. Please try again." });
    }
  }

  async function handleSelect(doc: OLDoc) {
    setStatus({ kind: "adding", doc });
    const isbn13 = doc.isbn?.find((s) => s.length === 13) ?? null;
    const candidate: BookCandidate = {
      title: doc.title,
      authorNames: doc.author_name ?? [],
      isbn: isbn13,
      pageCount: doc.number_of_pages_median != null ? Math.round(doc.number_of_pages_median) : null,
    };
    try {
      await addBookAction(candidate);
      router.refresh();
      setStatus({ kind: "success", title: doc.title });
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search for a book"
        className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Add a Book</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Search type pills */}
        <div className="flex gap-2 mb-4">
          {(["title", "author", "isbn"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSearchType(type)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                searchType === type
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              {type === "isbn" ? "ISBN" : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              searchType === "title"
                ? "Search by title…"
                : searchType === "author"
                ? "Search by author…"
                : "Enter ISBN…"
            }
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:ring-zinc-400"
          />
          <button
            type="submit"
            disabled={status.kind === "loading" || status.kind === "adding"}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Search
          </button>
        </form>

        {/* Results area */}
        <div className="min-h-[4rem]">
          {status.kind === "idle" && null}

          {status.kind === "loading" && (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 dark:border-zinc-600 dark:border-t-zinc-200" />
            </div>
          )}

          {status.kind === "empty" && (
            <p className="py-6 text-center text-sm text-zinc-400">No results found.</p>
          )}

          {status.kind === "error" && (
            <p className="py-4 text-center text-sm text-red-500">{status.message}</p>
          )}

          {status.kind === "results" && (
            <ul className="max-h-80 overflow-y-auto -mx-1 space-y-1">
              {status.docs.map((doc) => (
                <li key={doc.key}>
                  <button
                    onClick={() => handleSelect(doc)}
                    className="flex w-full items-start gap-3 rounded-lg p-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {doc.cover_i ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`}
                        alt=""
                        className="h-16 w-11 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="h-16 w-11 shrink-0 rounded bg-zinc-100 dark:bg-zinc-800" />
                    )}
                    <div className="min-w-0 pt-0.5">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 line-clamp-2 leading-snug">
                        {doc.title}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500 truncate">
                        {doc.author_name?.join(", ") ?? "Unknown author"}
                      </p>
                      {doc.number_of_pages_median != null && (
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {Math.round(doc.number_of_pages_median)} pages
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {status.kind === "adding" && (
            <p className="py-4 text-center text-sm text-zinc-400">Adding "{status.doc.title}"…</p>
          )}

          {status.kind === "success" && (
            <div className="py-4 text-center space-y-3">
              <p className="text-sm text-green-600 dark:text-green-400">
                Started reading "{status.title}"!
              </p>
              <button
                onClick={onClose}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
