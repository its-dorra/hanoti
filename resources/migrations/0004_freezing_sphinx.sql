DROP INDEX `orders_order_date_id_idx`;--> statement-breakpoint
CREATE INDEX `orders_client_id_order_date_idx` ON `orders` (`client_id`,`order_date`);--> statement-breakpoint
CREATE INDEX `orders_id_created_at_idx` ON `orders` (`id`,`created_at`);--> statement-breakpoint
CREATE INDEX `clients_id_created_at_idx` ON `clients` (`id`,`created_at`);--> statement-breakpoint
CREATE INDEX `debt_entries_id_created_at_idx` ON `debt_entries` (`id`,`created_at`);--> statement-breakpoint
CREATE INDEX `debt_transactions_id_created_at` ON `debt_transactions` (`id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_name_idx` ON `products` (`name`);--> statement-breakpoint
CREATE INDEX `products_id_created_at_idx` ON `products` (`id`,`created_at`);