ALTER TABLE `venues` ADD `updated_at` integer;--> statement-breakpoint
ALTER TABLE `venues` ADD `updated_by_id` text REFERENCES users(id);