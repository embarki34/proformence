-- CreateTable
CREATE TABLE `like_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `worker_id` INTEGER NOT NULL,
    `is_liked` BOOLEAN NOT NULL,
    `comment` TEXT NULL,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `created_by`(`created_by`),
    INDEX `idx_like_worker`(`worker_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organization` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `password` VARCHAR(100) NOT NULL,
    `wilaya` VARCHAR(50) NOT NULL,
    `commune` VARCHAR(50) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `username`(`username`),
    INDEX `idx_org_location`(`wilaya`, `commune`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `worker` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fullname` VARCHAR(50) NOT NULL,
    `organization_id` INTEGER NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `total_likes` INTEGER NULL DEFAULT 0,
    `total_dislikes` INTEGER NULL DEFAULT 0,
    `active` BOOLEAN NULL DEFAULT true,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_worker_org`(`organization_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `like_history` ADD CONSTRAINT `like_history_ibfk_1` FOREIGN KEY (`worker_id`) REFERENCES `worker`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `like_history` ADD CONSTRAINT `like_history_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `worker`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `worker` ADD CONSTRAINT `worker_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
