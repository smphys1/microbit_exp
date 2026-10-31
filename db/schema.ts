import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const submissions = sqliteTable('submissions', {
 id:text('id').primaryKey(), ownerId:text('owner_id').notNull().unique(),
 student:text('student').notNull(), classroom:text('classroom').notNull(),
 payload:text('payload').notNull(), files:text('files').notNull(),
 revision:integer('revision').notNull().default(1), grade:text('grade'),
 submittedAt:text('submitted_at').notNull(), gradedAt:text('graded_at')
});
