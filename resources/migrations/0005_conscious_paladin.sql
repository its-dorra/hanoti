PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_number` integer NOT NULL,
	`client_id` integer NOT NULL,
	`order_date` integer DEFAULT (unixepoch()) NOT NULL,
	`subtotal` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_orders`("id", "invoice_number", "client_id", "order_date", "subtotal", "created_at", "updated_at") SELECT "id", "invoice_number", "client_id", "order_date", "subtotal", "created_at", "updated_at" FROM `orders`;--> statement-breakpoint
DROP TABLE `orders`;--> statement-breakpoint
ALTER TABLE `__new_orders` RENAME TO `orders`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `orders_client_id_order_date_idx` ON `orders` (`client_id`,`order_date`);--> statement-breakpoint
CREATE INDEX `orders_client_id_order_date_id_idx` ON `orders` (`client_id`,`order_date`,`id`);--> statement-breakpoint
CREATE TABLE `__new_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer NOT NULL,
	`amount` real NOT NULL,
	`payment_date` integer DEFAULT (unixepoch()) NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_payments`("id", "client_id", "amount", "payment_date", "note", "created_at") SELECT "id", "client_id", "amount", "payment_date", "note", "created_at" FROM `payments`;--> statement-breakpoint
DROP TABLE `payments`;--> statement-breakpoint
ALTER TABLE `__new_payments` RENAME TO `payments`;--> statement-breakpoint
CREATE INDEX `payments_client_id_payment_date_idx` ON `payments` (`client_id`,`payment_date`);--> statement-breakpoint
DROP INDEX `clients_name_id_idx`;--> statement-breakpoint
DROP INDEX `clients_id_created_at_idx`;--> statement-breakpoint
CREATE INDEX `clients_created_at_id_idx` ON `clients` (`created_at`,`id`);--> statement-breakpoint
DROP INDEX `products_name_idx`;--> statement-breakpoint
DROP INDEX `products_id_created_at_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `products_name_unique` ON `products` (`name`);--> statement-breakpoint
CREATE INDEX `products_created_at_id_idx` ON `products` (`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `order_items_order_id_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `product_prices_product_id_idx` ON `product_prices` (`product_id`);