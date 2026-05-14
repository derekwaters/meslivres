"use client";

import { useState } from "react";
import { BookSearchModal } from "./BookSearchModal";

export function AddBookButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        + Add Book
      </button>
      <BookSearchModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
