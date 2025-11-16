CREATE TABLE `horses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`horseName` varchar(255) NOT NULL,
	`raceId` int NOT NULL,
	`jockey` varchar(255),
	`trainer` varchar(255),
	`odds` varchar(50),
	`form` text,
	CONSTRAINT `horses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`raceId` int NOT NULL,
	`predictions` text NOT NULL,
	`modelVersion` varchar(50) NOT NULL DEFAULT '1.0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `predictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `races` (
	`id` int AUTO_INCREMENT NOT NULL,
	`raceId` varchar(255) NOT NULL,
	`date` timestamp NOT NULL,
	`track` varchar(255) NOT NULL,
	`raceNumber` int NOT NULL,
	`raceType` varchar(100),
	`distance` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `races_id` PRIMARY KEY(`id`),
	CONSTRAINT `races_raceId_unique` UNIQUE(`raceId`)
);
