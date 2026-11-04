CREATE TABLE `feedback` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`game_slug` text NOT NULL,
	`text` text NOT NULL,
	`received_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	PRIMARY KEY(`user_id`, `id`)
);
