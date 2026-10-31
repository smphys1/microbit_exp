CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`student` text NOT NULL,
	`classroom` text NOT NULL,
	`payload` text NOT NULL,
	`files` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`grade` text,
	`submitted_at` text NOT NULL,
	`graded_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `submissions_owner_id_unique` ON `submissions` (`owner_id`);