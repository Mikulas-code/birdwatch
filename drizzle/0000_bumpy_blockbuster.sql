CREATE TABLE `birds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`latinName` text,
	`order` text,
	`family` text,
	`date` text,
	`gender` integer,
	`notes` text,
	`count` integer,
	`seen` integer NOT NULL,
	`imageURL` text,
	`userId` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userName` text NOT NULL,
	`salt` text NOT NULL,
	`hash` text NOT NULL,
	`token` text NOT NULL
);
