CREATE TABLE `client_ledgers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer NOT NULL,
	`reference_id` integer NOT NULL,
	`reference_type` text NOT NULL,
	`amount` integer NOT NULL,
	`balance_before` integer NOT NULL,
	`balance_after` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`notes` text,
	`debt` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_clients`("id", "name", "phone", "notes", "debt", "created_at", "updated_at") SELECT "id", "name", "phone", "notes", "debt", "created_at", "updated_at" FROM `clients`;--> statement-breakpoint
DROP TABLE `clients`;--> statement-breakpoint
ALTER TABLE `__new_clients` RENAME TO `clients`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `clients_created_at_id_idx` ON `clients` (`created_at`,`id`);--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `invoice_number`;