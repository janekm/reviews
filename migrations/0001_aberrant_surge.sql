ALTER TABLE `users` ADD `role` text DEFAULT 'viewer' NOT NULL;--> statement-breakpoint
ALTER TABLE `venues` ADD `creator_id` text REFERENCES users(id);