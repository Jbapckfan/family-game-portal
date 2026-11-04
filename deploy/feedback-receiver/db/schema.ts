import { sql } from 'drizzle-orm';
import { sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';

export const feedback = sqliteTable('feedback', {
  userId: text('user_id').notNull(),
  id: text('id').notNull(),
  gameSlug: text('game_slug').notNull(),
  text: text('text').notNull(),
  receivedAt: text('received_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
}, table => [primaryKey({columns: [table.userId, table.id]})]);
