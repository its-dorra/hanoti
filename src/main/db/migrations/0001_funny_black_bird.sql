CREATE INDEX `clients_name_id_idx` ON `clients` (`name`,`id`);--> statement-breakpoint
CREATE INDEX `orders_order_date_id_idx` ON `orders` (`order_date`,`id`);--> statement-breakpoint
ALTER TABLE `payments` DROP COLUMN `method`;