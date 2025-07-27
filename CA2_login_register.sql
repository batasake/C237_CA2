CREATE DATABASE IF NOT EXISTS `C237_usersdb` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `C237_usersdb`;


CREATE TABLE users (
    `id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `username` VARCHAR(20) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `contact` VARCHAR(10) NOT NULL
);
