-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost
-- Généré le : lun. 28 avr. 2025 à 14:30
-- Version du serveur : 10.3.39-MariaDB-0+deb10u2
-- Version de PHP : 7.3.33-24+0~20250311.131+debian11~1.gbp8dc7d2

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `805729_sql`
--

-- --------------------------------------------------------

--
-- Structure de la table `top_serveur`
--

CREATE TABLE `top_serveur` (
  `discord_name` varchar(255) NOT NULL,
  `discord_rp_name` varchar(255) NOT NULL,
  `steam_id` bigint NOT NULL,
  `vote_value` int NOT NULL,
  `bank_value` int NOT NULL,
  `vote_at_withdraw` int NOT NULL,
  `date_at_withdraw` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `top_serveur`
--
ALTER TABLE `top_serveur`
  ADD PRIMARY KEY (`discord_name`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
