"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { finishBookAction } from "@/app/actions/finishBook";

type Props = {
  recordId: number;
  bookTitle: string;
};

export function FinishReadingButton({ recordId, bookTitle }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleClose() {
    if (submitting) return;
    setOpen(false);
    // Reset state after animation
    setTimeout(() => {
      setRating(null);
      setHovered(null);
      setReview("");
      setError(null);
    }, 150);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await finishBookAction(recordId, rating, review);
      router.refresh();
      setOpen(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const displayRating = hovered ?? rating;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 transition-colors"
      >
        Finished Reading
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            aria-hidden="true"
            onClick={handleClose}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Finish reading"
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Finished Reading
              </h2>
              <button
                onClick={handleClose}
                disabled={submitting}
                className="rounded-md p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-50"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 2l12 12M14 2L2 14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5 line-clamp-2">
              {bookTitle}
            </p>

            {/* Star rating */}
            <div className="mb-5">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                Rating <span className="font-normal">(optional)</span>
              </p>
              <div className="flex gap-1" onMouseLeave={() => setHovered(null)}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(rating === star ? null : star)}
                    onMouseEnter={() => setHovered(star)}
                    disabled={submitting}
                    aria-label={`${star} star${star === 1 ? "" : "s"}`}
                    className="p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill={displayRating !== null && star <= displayRating ? "#f59e0b" : "none"}
                      stroke={displayRating !== null && star <= displayRating ? "#f59e0b" : "#d4d4d8"}
                      strokeWidth="1.5"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                ))}
                {rating !== null && (
                  <button
                    onClick={() => setRating(null)}
                    disabled={submitting}
                    className="ml-1 self-center text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Review textarea */}
            <div className="mb-6">
              <label
                htmlFor="finish-review"
                className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 block"
              >
                Review <span className="font-normal">(optional)</span>
              </label>
              <textarea
                id="finish-review"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                disabled={submitting}
                rows={4}
                placeholder="What did you think?"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:ring-zinc-400 disabled:opacity-50"
              />
            </div>

            {error && (
              <p className="mb-4 text-sm text-red-500 text-center">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleClose}
                disabled={submitting}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
              >
                {submitting ? "Saving…" : "Mark as Finished"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
