PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_client_ledgers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer NOT NULL,
	`reference_id` integer NOT NULL,
	`reference_type` text NOT NULL,
	`amount` real NOT NULL,
	`balance_before` real NOT NULL,
	`balance_after` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_client_ledgers`("id", "client_id", "reference_id", "reference_type", "amount", "balance_before", "balance_after", "created_at") SELECT "id", "client_id", "reference_id", "reference_type", "amount", "balance_before", "balance_after", "created_at" FROM `client_ledgers`;--> statement-breakpoint
DROP TABLE `client_ledgers`;--> statement-breakpoint
ALTER TABLE `__new_client_ledgers` RENAME TO `client_ledgers`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`notes` text,
	`debt` real DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_clients`("id", "name", "phone", "notes", "debt", "created_at", "updated_at") SELECT "id", "name", "phone", "notes", "debt", "created_at", "updated_at" FROM `clients`;--> statement-breakpoint
DROP TABLE `clients`;--> statement-breakpoint
ALTER TABLE `__new_clients` RENAME TO `clients`;--> statement-breakpoint
CREATE INDEX `clients_created_at_id_idx` ON `clients` (`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `__new_order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`product_name_snapshot` text NOT NULL,
	`quantity` real NOT NULL,
	`unit_price` real NOT NULL,
	`line_total` real NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_order_items`("id", "order_id", "product_id", "product_name_snapshot", "quantity", "unit_price", "line_total") SELECT "id", "order_id", "product_id", "product_name_snapshot", "quantity", "unit_price", "line_total" FROM `order_items`;--> statement-breakpoint
DROP TABLE `order_items`;--> statement-breakpoint
ALTER TABLE `__new_order_items` RENAME TO `order_items`;--> statement-breakpoint
CREATE INDEX `order_items_order_id_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`buying_price` real NOT NULL,
	`quantity` real DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "name", "buying_price", "quantity", "created_at", "updated_at") SELECT "id", "name", "buying_price", "quantity", "created_at", "updated_at" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
CREATE UNIQUE INDEX `products_name_unique` ON `products` (`name`);--> statement-breakpoint
CREATE INDEX `products_created_at_id_idx` ON `products` (`created_at`,`id`);