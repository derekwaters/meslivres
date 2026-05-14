import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const authors = pgTable("authors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const books = pgTable(
  "books",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    isbn: varchar("isbn", { length: 13 }),
    pageCount: integer("page_count"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("books_isbn_unique_idx").on(t.isbn),
  ]
);

export const bookAuthors = pgTable(
  "book_authors",
  {
    bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
    authorId: integer("author_id").notNull().references(() => authors.id, { onDelete: "cascade" }),
    authorOrder: integer("author_order").notNull().default(1),
  },
  (t) => [
    uniqueIndex("book_authors_pkey").on(t.bookId, t.authorId),
    index("book_authors_book_id_idx").on(t.bookId),
    index("book_authors_author_id_idx").on(t.authorId),
  ]
);

export const readingRecords = pgTable(
  "reading_records",
  {
    id: serial("id").primaryKey(),
    clerkUserId: varchar("clerk_user_id", { length: 255 }).notNull(),
    bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
    rating: integer("rating"),
    review: text("review"),
    readStarted: timestamp("read_started", { withTimezone: true }),
    readEnded: timestamp("read_ended", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("rating_range", sql`${t.rating} IS NULL OR (${t.rating} >= 1 AND ${t.rating} <= 5)`),
    index("reading_records_user_idx").on(t.clerkUserId),
    index("reading_records_book_idx").on(t.bookId),
    index("reading_records_user_book_idx").on(t.clerkUserId, t.bookId),
  ]
);

export const authorsRelations = relations(authors, ({ many }) => ({
  bookAuthors: many(bookAuthors),
}));

export const booksRelations = relations(books, ({ many }) => ({
  bookAuthors: many(bookAuthors),
  readingRecords: many(readingRecords),
}));

export const bookAuthorsRelations = relations(bookAuthors, ({ one }) => ({
  book: one(books, { fields: [bookAuthors.bookId], references: [books.id] }),
  author: one(authors, { fields: [bookAuthors.authorId], references: [authors.id] }),
}));

export const readingRecordsRelations = relations(readingRecords, ({ one }) => ({
  book: one(books, { fields: [readingRecords.bookId], references: [books.id] }),
}));

export type Author = typeof authors.$inferSelect;
export type NewAuthor = typeof authors.$inferInsert;
export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
export type BookAuthor = typeof bookAuthors.$inferSelect;
export type NewBookAuthor = typeof bookAuthors.$inferInsert;
export type ReadingRecord = typeof readingRecords.$inferSelect;
export type NewReadingRecord = typeof readingRecords.$inferInsert;
