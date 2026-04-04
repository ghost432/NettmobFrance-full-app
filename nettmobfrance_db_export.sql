-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: localhost    Database: nettmobfrance
-- ------------------------------------------------------
-- Server version	8.0.43-0ubuntu0.24.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_invoice_summary`
--

DROP TABLE IF EXISTS `admin_invoice_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_invoice_summary` (
  `id` int NOT NULL,
  `invoice_id` int NOT NULL,
  `automob_id` int NOT NULL,
  `total_hours` decimal(10,2) NOT NULL,
  `amount_to_pay` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_invoice` (`invoice_id`),
  KEY `idx_automob` (`automob_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_invoice_summary`
--

LOCK TABLES `admin_invoice_summary` WRITE;
/*!40000 ALTER TABLE `admin_invoice_summary` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_invoice_summary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_logs`
--

DROP TABLE IF EXISTS `admin_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_user_id` int NOT NULL,
  `action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_user_id` int DEFAULT NULL,
  `details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `target_user_id` (`target_user_id`),
  KEY `idx_admin` (`admin_user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_logs`
--

LOCK TABLES `admin_logs` WRITE;
/*!40000 ALTER TABLE `admin_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `automob_availabilities`
--

DROP TABLE IF EXISTS `automob_availabilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `automob_availabilities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `automob_profile_id` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=789 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `automob_availabilities`
--

LOCK TABLES `automob_availabilities` WRITE;
/*!40000 ALTER TABLE `automob_availabilities` DISABLE KEYS */;
INSERT INTO `automob_availabilities` VALUES (694,8,'2025-11-15','2025-12-03','2025-11-20 10:13:48','2025-11-20 10:13:48'),(781,7,'2025-08-27','2025-10-02','2026-03-07 22:58:27','2026-03-07 22:58:27'),(788,9,'2026-03-05','2026-03-29','2026-03-08 17:57:08','2026-03-08 17:57:08');
/*!40000 ALTER TABLE `automob_availabilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `automob_competences`
--

DROP TABLE IF EXISTS `automob_competences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `automob_competences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `automob_profile_id` int NOT NULL,
  `competence_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1459 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `automob_competences`
--

LOCK TABLES `automob_competences` WRITE;
/*!40000 ALTER TABLE `automob_competences` DISABLE KEYS */;
INSERT INTO `automob_competences` VALUES (885,8,6,'2025-11-20 10:13:48'),(886,8,5,'2025-11-20 10:13:48'),(887,8,8,'2025-11-20 10:13:48'),(888,8,7,'2025-11-20 10:13:48'),(1295,7,6,'2026-03-07 22:58:27'),(1296,7,5,'2026-03-07 22:58:27'),(1297,7,8,'2026-03-07 22:58:27'),(1298,7,7,'2026-03-07 22:58:27'),(1455,9,6,'2026-03-08 17:57:08'),(1456,9,5,'2026-03-08 17:57:08'),(1457,9,8,'2026-03-08 17:57:08'),(1458,9,7,'2026-03-08 17:57:08');
/*!40000 ALTER TABLE `automob_competences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `automob_documents`
--

DROP TABLE IF EXISTS `automob_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `automob_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'document',
  `has_expiry` tinyint(1) DEFAULT '0',
  `expiry_date` date DEFAULT NULL,
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `automob_documents`
--

LOCK TABLES `automob_documents` WRITE;
/*!40000 ALTER TABLE `automob_documents` DISABLE KEYS */;
INSERT INTO `automob_documents` VALUES (1,24,'jhjhhjjhjhj','document',0,NULL,'/uploads/documents/doc-1763081211172-172505419.jpg','2025-11-14 00:46:51','2025-11-14 00:46:51'),(2,27,'mjjkj','habilitation',1,NULL,'/uploads/documents/doc-1772992661247-111930880.png','2026-03-08 17:57:41','2026-03-08 17:57:41');
/*!40000 ALTER TABLE `automob_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `automob_experiences`
--

DROP TABLE IF EXISTS `automob_experiences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `automob_experiences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `job_title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `is_current` tinyint(1) DEFAULT '0',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_dates` (`start_date`,`end_date`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `automob_experiences`
--

LOCK TABLES `automob_experiences` WRITE;
/*!40000 ALTER TABLE `automob_experiences` DISABLE KEYS */;
INSERT INTO `automob_experiences` VALUES (14,27,'bla bla bla','Btp Afrique','2026-03-01','2026-03-25',0,'Sur les tableaux de bord (Auto-entrepreneur et Client), j\'ai ajouté un lien cliquable bleu \"Compléter mon profil →\" juste en dessous de \"Complétez votre profil pour maximiser vos opportunités\".','2026-03-08 17:57:08','2026-03-08 17:57:08');
/*!40000 ALTER TABLE `automob_experiences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `automob_profiles`
--

DROP TABLE IF EXISTS `automob_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `automob_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `siret` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('homme','femme','') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone_country_code` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '+33',
  `iban` varchar(34) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bic_swift` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `experience` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `years_of_experience` enum('junior','intermediaire','senior','expert','') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `current_position` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `secteur_id` int DEFAULT NULL,
  `about_me` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `work_areas` json DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `availability_start_date` date DEFAULT NULL,
  `availability_end_date` date DEFAULT NULL,
  `wallet_balance` decimal(10,2) DEFAULT '0.00',
  `vehicle_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `id_document_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_verified` tinyint(1) DEFAULT '0',
  `web_push_enabled` tinyint(1) DEFAULT '0',
  `web_push_subscription` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `email_notifications` tinyint(1) DEFAULT '1',
  `privacy_policy_accepted` tinyint(1) DEFAULT '0',
  `billing_mandate_accepted` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `profile_picture` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cover_picture` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `total_session_duration` int DEFAULT '0',
  `sms_notifications` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `automob_profiles`
--

LOCK TABLES `automob_profiles` WRITE;
/*!40000 ALTER TABLE `automob_profiles` DISABLE KEYS */;
INSERT INTO `automob_profiles` VALUES (7,24,'89632147456287','Pierre','Kalla','homme','+237655974875','+33','FR76 8555 5555 8888 9999 6666 66','BNPAFRPP234','J\'ai déjà plusieurs clients réguliers','intermediaire','Auto-entrepreneur en batiment',2,'1 place des marsellais 94220 Charenton le pont1 place des marsellais 94220 Charenton le pont1 place des marsellais 94220 Charenton le pont1 place des marsellais 94220 Charenton le pont','1 place des marsellais 94220 Charenton le pont','Marseille','[\"Paris\", \"Lille\", \"Marseille\"]',48.82623100,2.40597300,NULL,NULL,0.00,'Voiture',18.50,NULL,1,1,'{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/test-endpoint\",\"keys\":{\"p256dh\":\"test-p256dh-key\",\"auth\":\"test-auth-key\"}}',1,1,1,'2025-11-12 07:57:40','2026-03-07 22:58:27','/uploads/profile/24_1763148291613.png','/uploads/profile/24_1763148310391.jpg',NULL,0,1),(8,25,'58787887554899','Raymond','Salazar','homme','+237655974875','+237','FR75 5555 5555 9999 8888 7777 25','BNPAFRPP234','J\'ai déjà réalisé quelques missions','intermediaire','Auto-entrepreneur en batiment',2,'bdsdhsdbhsdhj','34 Avenue des Champs-Élysées, Paris, France','Paris','[\"Paris\", \"Lille\", \"Lyon\", \"Marseille\"]',NULL,NULL,NULL,NULL,0.00,NULL,NULL,NULL,1,1,'{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/test-endpoint-valid\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BMZn8OKQ_qCJYPQjZ5xq9mBwbK0vPk9jJY6Oz0fV8dH8qXK7Vq9Pw5Y8qY6Vz8wX5Y7Kz9Qq8dV5Kp9Y\",\"auth\":\"yZh8K5q9Vz7Y8wX5pQ\"}}',0,1,1,'2025-11-12 08:53:46','2025-11-21 02:18:26',NULL,NULL,NULL,0,1),(9,27,'68745213987451','Thierry','Ninja','homme','+237655974875','+23','FR76 8555 5555 8888 9999 6666 66','BNPAFRPP234','J\'ai déjà réalisé quelques missions','intermediaire','Auto-entrepreneur en batiment',2,'Sur les tableaux de bord (Auto-entrepreneur et Client), j\'ai ajouté un lien cliquable bleu \"Compléter mon profil →\" juste en dessous de \"Complétez votre profil pour maximiser vos opportunités\".Sur les tableaux de bord (Auto-entrepreneur et Client), j\'ai ajouté un lien cliquable bleu \"Compléter mon profil →\" juste en dessous de \"Complétez votre profil pour maximiser vos opportunités\".','34 Avenue Des Champs-Élysées, 75008 Paris, France','Paris','[\"Paris\", \"Lille\", \"Marseille\", \"Nice\"]',48.86996500,2.30816400,NULL,NULL,0.00,NULL,NULL,NULL,1,0,NULL,0,1,1,'2026-03-08 17:37:42','2026-03-08 19:53:33','/uploads/profile/27_1772992670478.png','/uploads/profile/27_1772992687684.png',NULL,0,1);
/*!40000 ALTER TABLE `automob_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `automob_reviews`
--

DROP TABLE IF EXISTS `automob_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `automob_reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `automob_id` int NOT NULL,
  `client_id` int NOT NULL,
  `mission_id` int NOT NULL,
  `rating` int NOT NULL,
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `automob_reviews`
--

LOCK TABLES `automob_reviews` WRITE;
/*!40000 ALTER TABLE `automob_reviews` DISABLE KEYS */;
INSERT INTO `automob_reviews` VALUES (2,24,26,10,4,'fdsggsgsggssgggsgs','2025-11-15 20:00:26'),(3,24,26,46,5,'bon gars','2026-03-08 00:07:25'),(4,27,28,48,4,'lkjjk kj jk jk j','2026-03-08 23:30:04');
/*!40000 ALTER TABLE `automob_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `billing_frequencies`
--

DROP TABLE IF EXISTS `billing_frequencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing_frequencies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `value` varchar(50) NOT NULL,
  `label` varchar(100) NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `billing_frequencies`
--

LOCK TABLES `billing_frequencies` WRITE;
/*!40000 ALTER TABLE `billing_frequencies` DISABLE KEYS */;
INSERT INTO `billing_frequencies` VALUES (1,'jour','Par jour',1,'2025-11-13 11:49:06','2025-11-13 11:49:06'),(2,'semaine','Par semaine',1,'2025-11-13 11:49:06','2025-11-13 11:49:06'),(3,'mois','Par mois',1,'2025-11-13 11:49:06','2025-11-13 11:49:06'),(4,'mission','À la mission',1,'2025-11-13 11:49:06','2025-11-13 11:49:06');
/*!40000 ALTER TABLE `billing_frequencies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blog_posts`
--

DROP TABLE IF EXISTS `blog_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blog_posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('auto-entrepreneur','enterprise') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `excerpt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `slug` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `helpful_yes` int DEFAULT '0',
  `helpful_no` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blog_posts`
--

LOCK TABLES `blog_posts` WRITE;
/*!40000 ALTER TABLE `blog_posts` DISABLE KEYS */;
INSERT INTO `blog_posts` VALUES (1,'Saturation du marché et difficultés pour décrocher des missions en 2026','auto-entrepreneur','En 2026, l’un des défis les plus persistants pour les auto-entrepreneurs en France n’est pas seulement économique ou administratif : il est humain, stratégique et numérique.','En 2026, le statut d’auto-entrepreneur en France reste extrêmement populaire. Selon les données récentes, les immatriculations sous ce statut continuent d’augmenter, avec une progression notable des inscriptions de micro-entrepreneurs sur les douze derniers mois, malgré une stabilisation globale du nombre de créations d’entreprises.<div><br></div><div>Une croissance forte mais fragmentée</div><div>Le régime de l’auto-entrepreneur attire encore beaucoup de candidats grâce à sa simplicité administrative, des cotisations sociales allégées et la possibilité de se lancer sans apport de départ. Cependant, cette popularité a un revers : le marché est devenu extrêmement saturé dans de nombreux secteurs.</div><div><br></div><div>La France compte aujourd’hui plusieurs millions d’auto-entrepreneurs actifs. Cette masse de travailleurs indépendants se retrouve face à une concurrence féroce, notamment dans les domaines les plus accessibles : services aux particuliers, logistique, nettoyage, hôtellerie, services informatiques et métiers du digital.</div><div><br></div><div>Concurrence accrue</div><div>La conséquence directe de cette saturation est une pression importante sur les prix. Beaucoup d’auto-entrepreneurs sont contraints de baisser leurs tarifs simplement pour obtenir des missions. Cette “guerre des prix” réduit leurs marges et rend difficile toute stratégie de croissance rentable.</div><div><br></div><div>Dans les secteurs où les missions sont les plus nombreuses, les profils sont souvent très similaires. Les entreprises clientes peuvent ainsi choisir en priorité les profils les moins chers ou ceux qui apparaissent comme les plus disponibles — ce qui renforce la compétition pour les mêmes opportunités.</div><div><br></div><div>Une visibilité réduite malgré la demande</div><div>Malgré un environnement économique qui fait parfois rechercher des indépendants plutôt que des salariés, beaucoup d’auto-entrepreneurs ont du mal à se faire connaître. Sans un réseau établi, sans profil professionnel développé ou sans outils de mise en relation efficaces, il peut être extrêmement difficile d’attirer l’attention des clients potentiels.</div><div><br></div><div>La solitude professionnelle — le fait d’évoluer seul sans support collectif ou réseau — est citée comme l’un des principaux freins à la croissance d’une micro-entreprise. Les auto-entrepreneurs peuvent se sentir isolés, sans accompagnement ni visibilité suffisante pour attirer des contrats réguliers ou mieux rémunérés.</div><div><br></div><div>Résultats concrets : une majorité sans missions stables</div><div>Derrière les chiffres impressionnants du nombre de créations se cache une réalité plus dure : de nombreux auto-entrepreneurs ne parviennent pas à générer un chiffre d’affaires suffisant pour faire vivre leur activité. Dans certains secteurs, le taux de pérennité à trois ans est faible, et les revenus restent souvent modestes.</div><div><br></div><div>Cela signifie que même lorsqu’ils décrochent quelques missions, ces travailleurs indépendants peinent à trouver des missions régulières ou à constituer une base de clients fidèles. Pour beaucoup, la recherche de nouveaux contrats devient une tâche permanente, presque à temps plein.</div><div><br></div><div>Facteurs aggravants</div><div>Outre la saturation, d’autres éléments accentuent la difficulté :</div><div><br></div><div>➤ Manque de réseau et d’accompagnement professionnel : sans relations établies ni soutien stratégique, gagner la confiance d’un client peut prendre beaucoup plus de temps que prévu.</div><div>➤ Compétition dans les secteurs “généralistes” : ceux qui ne se spécialisent pas peinent à se positionner comme experts face à une offre très large.</div><div>➤ Baisse possible des missions qualifiées : certains auto-entrepreneurs expérimentent des périodes avec peu voire pas de missions, ce qui affecte directement leurs revenus.</div><div>La saturation du marché fait aujourd’hui partie des premiers défis pour un auto-entrepreneur en France.</div><div>La concurrence intense et les profils nombreux réduisent les chances de décrocher des missions bien rémunérées.</div><div>Un manque de visibilité et d’accompagnement professionnel empêche beaucoup de se démarquer et de construire un portefeuille clients solide.</div><div><br></div><div>Pour réussir durablement, de nombreux auto-entrepreneurs doivent désormais se spécialiser, développer leur visibilité digitale, et s’appuyer sur des réseaux ou des plateformes efficaces qui leur permettent d’accéder plus rapidement à des missions adaptées à leurs compétences.</div>','/uploads/blog/blog-1773013680449-360263702.jpeg','2026-03-04 17:14:47','2026-03-08 23:48:00','saturation-du-marche-et-difficultes-pour-decrocher-des-missions-en-202',2,0),(2,'Missions rares, concurrence rude : pourquoi tant d’auto-entrepreneurs peinent à vivre de leur activité en 2026','auto-entrepreneur','De plus en plus d’auto-entrepreneurs, mais de moins en moins de missions stables et correctement rémunérées.','En 2026, l’auto-entrepreneuriat en France est marqué par un paradoxe inquiétant : de plus en plus d’auto-entrepreneurs, mais de moins en moins de missions stables et correctement rémunérées.<div>Pour beaucoup, vivre pleinement de leur activité est devenu un objectif difficilement atteignable.</div><div><br></div><div>La concurrence intense et la raréfaction des opportunités fragilisent un modèle déjà précaire.</div><div><br></div><div>1. Une explosion du nombre d’auto-entrepreneurs</div><div>Ces dernières années, le statut a séduit :</div><div><br></div><div>des salariés en reconversion</div><div>des jeunes actifs</div><div>des personnes cherchant un complément de revenu</div><div>Cette croissance rapide a entraîné une saturation du marché, notamment dans les secteurs de services.</div><div><br></div><div>2. Des missions de plus en plus difficiles à obtenir</div><div>En 2026, beaucoup d’auto-entrepreneurs constatent :</div><div><br></div><div>moins d’offres réellement sérieuses</div><div>des délais d’attente prolongés entre deux missions</div><div>des réponses rares ou inexistantes</div><div>La recherche de travail devient chronophage et décourageante.</div><div><br></div><div>3. Une concurrence basée sur le prix plutôt que la qualité</div><div>Face à la pénurie de missions :</div><div><br></div><div>certains cassent les tarifs pour se démarquer</div><div>les entreprises privilégient le coût immédiat</div><div>les compétences et l’expérience passent au second plan</div><div>Cette course vers le bas pénalise les profils sérieux.</div><div><br></div><div>4. Une visibilité insuffisante sur les plateformes classiques</div><div>Sur de nombreuses plateformes :</div><div><br></div><div>les profils sont noyés dans la masse</div><div>les critères de sélection sont flous</div><div>la mise en avant est aléatoire</div><div>Être compétent ne garantit plus d’être vu.</div><div><br></div><div>5. Une précarité qui s’installe durablement</div><div>L’irrégularité des missions entraîne :</div><div><br></div><div>une instabilité financière</div><div>une difficulté à planifier l’avenir</div><div>un stress constant lié aux revenus</div><div>Pour certains, l’activité devient insoutenable à long terme.</div><div><br></div><div>6. Une perte de confiance progressive</div><div>À force d’échecs :</div><div><br></div><div>la motivation s’érode</div><div>la confiance en soi diminue</div><div>l’envie d’entreprendre disparaît</div><div>Certains abandonnent, malgré leur savoir-faire.</div><div><br></div><div>NettmobFrance : rééquilibrer le marché au profit des indépendants sérieux</div><div>NettmobFrance apporte une réponse concrète :</div><div><br></div><div>mise en relation avec des entreprises fiables</div><div>valorisation des compétences réelles</div><div>opportunités ciblées selon le profil</div><div>réduction de la concurrence inutile</div><div>La qualité reprend le dessus sur la quantité.</div><div><br></div><div>En 2026, la difficulté des auto-entrepreneurs à vivre de leur activité n’est pas liée à un manque d’efforts, mais à un marché déséquilibré et mal structuré.</div><div>La concurrence rude et la rareté des missions ne doivent pas condamner les professionnels sérieux.</div><div><br></div><div>NettmobFrance redonne des perspectives durables au travail indépendant, en créant des opportunités plus justes et plus fiables.</div>','/uploads/blog/blog-1773013517655-391746280.jpeg','2026-03-04 17:14:54','2026-03-08 23:45:17','missions-rares-concurrence-rude-pourquoi-tant-dauto-entrepreneurs-pein',1,0),(3,'Auto-entrepreneurs en France en 2026 : entre surcharge de travail et absence de reconnaissance','auto-entrepreneur','En 2026, le nombre d’auto-entrepreneurs en France continue d’augmenter. Mais derrière cette dynamique se cache une surcharge de travail constante et un manque de reconnaissance.','En 2026, le nombre d’auto-entrepreneurs en France continue d’augmenter. Présenté comme un statut flexible et accessible, l’auto-entrepreneuriat attire des profils variés.<div>Pourtant, derrière cette dynamique apparente se cache une réalité moins visible : une surcharge de travail constante et un profond manque de reconnaissance professionnelle.</div><div><br></div><div>Beaucoup d’auto-entrepreneurs donnent énormément sans recevoir en retour la considération ou la stabilité qu’ils méritent.</div><div><br></div><div>1. Une charge de travail bien plus large que les missions facturées</div><div>Le travail d’un auto-entrepreneur ne se limite pas à l’exécution des missions. Il comprend aussi :</div><div><br></div><div>la prospection quotidienne</div><div>la gestion administrative (factures, déclarations, relances)</div><div>la négociation avec les clients</div><div>la recherche permanente de nouvelles opportunités</div><div>Ces tâches invisibles occupent une part importante du temps, sans être rémunérées.</div><div><br></div><div>2. Des journées longues, sans réelle frontière</div><div>En 2026, beaucoup d’auto-entrepreneurs :</div><div><br></div><div>travaillent tôt le matin et tard le soir</div><div>répondent aux sollicitations en continu</div><div>peinent à séparer vie professionnelle et personnelle</div><div>Cette surcharge finit par provoquer fatigue chronique et découragement.</div><div><br></div><div>3. Une reconnaissance professionnelle insuffisante</div><div>Malgré leur investissement, les auto-entrepreneurs sont souvent :</div><div><br></div><div>perçus comme des solutions temporaires</div><div>considérés comme interchangeables</div><div>moins écoutés que les salariés</div><div>Leur expertise est rarement valorisée à sa juste valeur.</div><div><br></div><div>4. Des exigences élevées pour une rémunération limitée</div><div>Les entreprises attendent souvent :</div><div><br></div><div>une grande disponibilité</div><div>une adaptabilité immédiate</div><div>une exécution rapide</div><div>Mais en parallèle :</div><div><br></div><div>les tarifs sont négociés à la baisse</div><div>les conditions sont parfois floues</div><div>la stabilité n’est pas garantie</div><div>Ce déséquilibre renforce le sentiment d’injustice.</div><div><br></div><div>5. Une pression psychologique constante</div><div>Cette combinaison de surcharge et de manque de reconnaissance entraîne :</div><div><br></div><div>une perte de motivation</div><div>un stress permanent</div><div>une remise en question de son activité</div><div>Certains auto-entrepreneurs finissent par douter de leur valeur professionnelle.</div><div><br></div><div>6. Une lassitude qui pousse à l’abandon</div><div>Face à cette situation :</div><div><br></div><div>certains réduisent leur activité</div><div>d’autres envisagent un retour au salariat</div><div>beaucoup se sentent piégés par un système peu protecteur</div><div>La passion initiale laisse place à l’épuisement.</div><div><br></div><div>NettmobFrance : remettre l’auto-entrepreneur au centre</div><div>NettmobFrance propose une approche différente :</div><div><br></div><div>valorisation des compétences réelles</div><div>mise en relation avec des entreprises sérieuses</div><div>cadre professionnel clair et respectueux</div><div>réduction du temps perdu en prospection</div><div>Le travail fourni est reconnu, structuré et mieux valorisé.</div><div><br></div><div>En 2026, la surcharge de travail et l’absence de reconnaissance ne devraient plus être la norme pour les auto-entrepreneurs.</div><div>Ces professionnels sont essentiels à l’économie française et méritent un environnement plus juste.</div><div><br></div><div>NettmobFrance contribue à redonner équilibre, reconnaissance et dignité au travail indépendant.</div>','/uploads/blog/blog-1773013464048-752348438.jpg','2026-03-04 17:14:55','2026-03-08 23:44:24','auto-entrepreneurs-en-france-en-2026-entre-surcharge-de-travail-et-abs',0,0),(4,'Auto-entrepreneurs en France : trouver des missions devient un véritable défi','auto-entrepreneur','En France, le nombre d’auto-entrepreneurs continue d’augmenter. Mais trouver des missions régulières devient de plus en plus compliqué.','En France, le nombre d’auto-entrepreneurs continue d’augmenter. On compte aujourd’hui plus de 3,1 millions de micro-entrepreneurs administrativement actifs, preuve que ce statut attire de plus en plus de professionnels souhaitant travailler à leur compte.<div><br></div><div>Cependant, derrière cette croissance se cache une réalité bien plus difficile : trouver des missions régulières devient de plus en plus compliqué.</div><div><br></div><div>Un marché du travail qui se tend</div><div>Depuis 2024, le marché du travail français connaît un ralentissement. Les entreprises recrutent moins et les offres d’emploi diminuent. Les procédures de recrutement sont également plus longues et plus exigeantes.</div><div><br></div><div>Pour les auto-entrepreneurs, cela signifie :</div><div><br></div><div>moins de missions disponibles</div><div>plus de concurrence entre auto-entrepreneurs</div><div>des négociations plus difficiles avec les entreprises</div><div>Beaucoup d’auto-entrepreneurs passent désormais plus de temps à chercher des clients qu’à travailler réellement sur leurs missions.</div><div><br></div><div>L’isolement des auto-entrepreneurs</div><div>Contrairement aux salariés, les auto-entrepreneurs doivent gérer seuls :</div><div><br></div><div>la prospection commerciale</div><div>la négociation des contrats</div><div>la gestion administrative</div><div>la recherche de nouvelles missions</div><div>Cette solitude professionnelle peut freiner leur croissance et rendre leur activité instable.</div><div><br></div><div>NettmobFrance : une solution pour simplifier la mise en relation</div><div>Face à ces difficultés, des plateformes spécialisées comme NettmobFrance offrent une solution concrète.</div><div><br></div><div>La plateforme permet de :</div><div>✔ connecter rapidement les entreprises avec des auto-entrepreneurs qualifiés</div><div>✔ simplifier la recherche de missions</div><div>✔ sécuriser les collaborations</div><div>✔ valoriser les profils professionnels</div><div><br></div><div>Grâce à NettmobFrance, les indépendants peuvent se concentrer sur leur métier plutôt que sur la prospection commerciale.</div><div><br></div><div>2. La concurrence explose chez les auto-entrepreneurs : comment se démarquer ?</div><div>Le statut d’auto-entrepreneur séduit chaque année de plus en plus de Français grâce à sa simplicité administrative et à ses démarches de création rapides.</div><div><br></div><div>Mais cette popularité a une conséquence directe : la concurrence devient de plus en plus forte entre auto-entrepreneurs.</div><div><br></div><div>Une explosion du nombre d’auto-entrepreneurs</div><div>Avec la digitalisation de l’économie et la recherche d’indépendance professionnelle, des milliers de Français se lancent chaque année dans l’auto-entrepreneuriat.</div><div><br></div><div>Dans certains secteurs comme :</div><div><br></div><div>la logistique grande surface</div><div>l’hôtellerie</div><div>le nettoyage</div><div>les services aux entreprises</div><div>les entreprises reçoivent désormais des dizaines de candidatures pour une seule mission.</div><div><br></div><div>Résultat :</div><div><br></div><div>les prix sont tirés vers le bas</div><div>les missions sont plus difficiles à obtenir</div><div>certains auto-entrepreneurs peinent à stabiliser leur activité</div><div>Les entreprises ont aussi un problème</div><div>Du côté des entreprises, la situation n’est pas simple non plus.</div><div><br></div><div>Elles doivent :</div><div><br></div><div>trouver rapidement des prestataires fiables</div><div>vérifier les compétences</div><div>éviter les profils peu qualifiés</div><div>Sans plateforme spécialisée, le processus peut être long et risqué.</div><div><br></div><div>NettmobFrance : un écosystème gagnant-gagnant</div><div>La plateforme NettmobFrance apporte une réponse efficace à ce problème.</div><div><br></div><div>Elle permet :</div><div><br></div><div>🔹 aux entreprises de trouver rapidement des auto-entrepreneurs compétents</div><div>🔹 aux auto-entrepreneur de gagner en visibilité</div><div>🔹 de sécuriser les missions grâce à des profils vérifiés</div><div><br></div><div>NettmobFrance crée ainsi un véritable pont entre les entreprises et les auto-entrepreneurs, facilitant les collaborations et accélérant les opportunités.</div><div><br></div><div>3. Auto-entrepreneurs : pourquoi les plateformes de mise en relation deviennent indispensables</div><div>Aujourd’hui, travailler en tant qu’auto-entrepreneur ne consiste plus seulement à avoir des compétences.</div><div><br></div><div>Il faut aussi savoir :</div><div><br></div><div>se rendre visible</div><div>trouver des clients</div><div>gérer sa réputation en ligne</div><div>construire un réseau professionnel solide.</div><div>Le défi de la visibilité</div><div>De nombreux auto-entrepreneurs possèdent un excellent savoir-faire, mais manquent de visibilité auprès des entreprises.</div><div><br></div><div>Sans réseau professionnel solide, ils doivent :</div><div><br></div><div>envoyer des dizaines de candidatures</div><div>prospecter constamment</div><div>utiliser plusieurs plateformes différentes</div><div>Ce processus est souvent long, incertain et décourageant.</div><div><br></div><div>L’importance des plateformes spécialisées</div><div>Avec l’évolution du marché du travail, les plateformes de mise en relation deviennent un outil essentiel pour les indépendants.</div><div><br></div><div>Elles permettent :</div><div><br></div><div>d’accéder directement aux entreprises qui recherchent des prestataires</div><div>d’augmenter ses chances de trouver des missions</div><div>de construire une réputation professionnelle.</div><div>NettmobFrance : un accélérateur d’opportunités</div><div>C’est précisément la mission de NettmobFrance : simplifier la rencontre entre les entreprises et les auto-entrepreneurs.</div><div><br></div><div>La plateforme propose :</div><div>✔ des profils professionnels vérifiés</div><div>✔ des missions adaptées aux compétences</div><div>✔ un accès rapide aux entreprises qui recrutent</div><div><br></div><div>Pour les auto-entrepreneurs, cela signifie plus d’opportunités et moins de temps perdu à chercher des clients.</div><div><br></div><div>Pour les entreprises, c’est la garantie de trouver rapidement des professionnels qualifiés et disponibles.</div>','/uploads/blog/blog-1773013420274-368653123.jpg','2026-03-04 17:14:56','2026-03-08 23:43:40','auto-entrepreneurs-en-france-trouver-des-missions-devient-un-veritable',0,0),(5,'Pénurie de profils fiables : pourquoi les entreprises françaises peinent à recruter des auto-entrepreneurs en 2026','enterprise','En 2026, les entreprises françaises font face à une contradiction : jamais le nombre d’auto-entrepreneurs n’a été aussi élevé, et pourtant jamais il n’a été aussi difficile de recruter des profils réellement fiables.','En 2026, les entreprises françaises font face à une contradiction de plus en plus frappante : jamais le nombre d’auto-entrepreneurs n’a été aussi élevé, et pourtant jamais il n’a été aussi difficile de recruter des profils réellement fiables.<div>Dans de nombreux secteurs — logistique entrepôt, grande distribution, hôtellerie, nettoyage, événementiel ou services — cette pénurie de fiabilité devient un frein majeur à la croissance et à la stabilité des entreprises.</div><div><br></div><div>1. Une explosion du nombre d’auto-entrepreneurs… mais pas de la qualité</div><div>Le statut d’auto-entrepreneur attire chaque année des milliers de personnes en quête d’indépendance. Cependant :</div><div><br></div><div>beaucoup se lancent sans réelle expérience terrain</div><div>certains sous-estiment les exigences professionnelles</div><div>d’autres s’inscrivent sans projet clair ou durable</div><div>Résultat : une offre abondante mais très inégale, difficile à exploiter pour les entreprises.</div><div><br></div><div>2. Des compétences difficiles à vérifier</div><div>Pour les recruteurs et dirigeants :</div><div><br></div><div>les CV sont parfois approximatifs</div><div>les compétences déclarées ne sont pas toujours réelles</div><div>les références sont absentes ou invérifiables</div><div>Les entreprises prennent alors des décisions à l’aveugle, avec un risque élevé d’erreur de casting.</div><div><br></div><div>3. Une fiabilité mise à mal par des comportements instables</div><div>De plus en plus d’entreprises témoignent de :</div><div><br></div><div>désistements de dernière minute</div><div>absences injustifiées</div><div>non-respect des délais</div><div>abandon de mission sans préavis</div><div>Ces comportements fragilisent la planification et la crédibilité des indépendants sérieux.</div><div><br></div><div>4. Un impact direct sur la performance des entreprises</div><div>Dans des secteurs à flux tendu :</div><div><br></div><div>une mission non honorée peut bloquer toute une chaîne</div><div>un poste non couvert entraîne des surcoûts</div><div>un client mécontent nuit durablement à l’image de marque</div><div>La pénurie de profils fiables devient ainsi un risque opérationnel majeur.</div><div><br></div><div>5. Des plateformes classiques devenues inefficaces</div><div>Les entreprises reprochent souvent aux plateformes généralistes :</div><div><br></div><div>un volume excessif de profils non qualifiés</div><div>l’absence de contrôle sérieux</div><div>une mise en relation basée uniquement sur le prix</div><div>Le gain de temps promis se transforme en perte de temps.</div><div><br></div><div>6. Une méfiance croissante envers les collaborations ponctuelles</div><div>À force de mauvaises expériences, certaines entreprises :</div><div><br></div><div>limitent leur recours aux auto-entrepreneurs</div><div>internalisent à contrecœur</div><div>ou renoncent à des opportunités faute de ressources fiables</div><div>Un cercle vicieux s’installe.</div><div><br></div><div>NettmobFrance : structurer la fiabilité</div><div>Face à cette situation, NettmobFrance apporte une réponse concrète et moderne :</div><div><br></div><div>profils d’auto-entrepreneurs vérifiés</div><div>compétences ciblées par secteur</div><div>transparence sur l’expérience et la disponibilité</div><div>mise en relation rapide et sécurisée</div><div>Les entreprises recrutent moins, mais mieux.</div><div><br></div><div>En 2026, le véritable problème n’est pas la pénurie d’auto-entrepreneurs, mais la pénurie de profils fiables et opérationnels.</div><div>En rétablissant la confiance et en structurant la mise en relation, NettmobFrance devient un levier stratégique pour les entreprises françaises.</div>','/uploads/blog/blog-1773013948592-148741002.jpeg','2026-03-04 17:14:58','2026-03-08 23:52:28','penurie-de-profils-fiables-pourquoi-les-entreprises-francaises-peinent',1,0),(6,'Entre méfiance et perte de temps : pourquoi les entreprises françaises doutent de plus en plus des plateformes classiques','enterprise','Au cours des dernières années, les plateformes de mise en relation se sont multipliées. En 2026, de nombreuses entreprises ne font plus confiance aux plateformes classiques.','Au cours des dernières années, les plateformes de mise en relation entre entreprises et auto-entrepreneurs se sont multipliées en France.<div>Présentées comme des solutions rapides et modernes, elles devaient simplifier le recrutement et sécuriser les collaborations.</div><div><br></div><div>En 2026, le constat est clair : de nombreuses entreprises ne font plus confiance aux plateformes classiques, qu’elles jugent chronophages, peu fiables et insuffisamment sécurisées.</div><div><br></div><div>1. Une multiplication des plateformes sans réelle valeur ajoutée</div><div>Le marché est aujourd’hui saturé de plateformes qui proposent :</div><div><br></div><div>des milliers de profils accessibles instantanément</div><div>une inscription rapide et peu contraignante</div><div>peu ou pas de contrôle à l’entrée</div><div>Cette logique de volume donne l’illusion du choix, mais dilue la qualité.</div><div><br></div><div>2. Des profils difficilement exploitables</div><div>Les entreprises se retrouvent face à :</div><div><br></div><div>des profils incomplets ou imprécis</div><div>des compétences déclaratives non vérifiées</div><div>des expériences professionnelles invérifiables</div><div>Résultat :</div><div>les recruteurs passent des heures à analyser, contacter et tester, sans garantie de succès.</div><div><br></div><div>3. Un temps de recrutement devenu excessif</div><div>Ce qui devait être un gain de temps devient souvent :</div><div><br></div><div>une perte d’énergie</div><div>une mobilisation inutile des équipes RH ou opérationnelles</div><div>des délais incompatibles avec les besoins terrain</div><div>Le coût caché du temps perdu est rarement mesuré, mais bien réel.</div><div><br></div><div>4. Une responsabilité entièrement transférée aux entreprises</div><div>Sur la majorité des plateformes :</div><div><br></div><div>l’entreprise doit vérifier les documents</div><div>contrôler la conformité administrative</div><div>gérer les imprévus et les litiges</div><div>La plateforme se limite à un rôle d’intermédiaire passif, laissant l’entreprise seule face aux risques.</div><div><br></div><div>5. Une confiance difficile à construire</div><div>Sans cadre clair :</div><div><br></div><div>les engagements sont flous</div><div>les désistements se multiplient</div><div>les conflits sont mal encadrés</div><div>Peu à peu, les entreprises développent une méfiance structurelle, même envers les auto-entrepreneurs sérieux.</div><div><br></div><div>6. Des relations professionnelles fragilisées</div><div>La méfiance entraîne :</div><div><br></div><div>des contrôles excessifs</div><div>des conditions plus strictes</div><div>une communication moins fluide</div><div>Ce climat nuit à la qualité des collaborations et à la performance globale.</div><div><br></div><div>NettmobFrance : une nouvelle génération de plateforme</div><div>NettmobFrance se distingue clairement des plateformes classiques en proposant :</div><div><br></div><div>une sélection rigoureuse des auto-entrepreneurs</div><div>la vérification des profils et des documents</div><div>une mise en relation ciblée selon les besoins réels</div><div>un cadre professionnel rassurant pour les entreprises</div><div>La plateforme devient un véritable partenaire, pas un simple annuaire.</div><div><br></div><div>Les entreprises françaises ne doutent pas de l’auto-entrepreneuriat, mais des outils mal adaptés à leurs exigences actuelles.</div><div>En 2026, elles recherchent de la fiabilité, du temps gagné et de la confiance.</div><div><br></div><div>NettmobFrance répond à ces attentes et redéfinit la mise en relation professionnelle en France.</div>','/uploads/blog/blog-1773013831996-435460739.jpg','2026-03-04 17:14:59','2026-03-08 23:50:32','entre-mefiance-et-perte-de-temps-pourquoi-les-entreprises-francaises-d',0,0),(7,'Urgences opérationnelles et désistements de dernière minute : un risque permanent pour les entreprises françaises','enterprise','En 2026, les entreprises françaises évoluent dans un contexte de plus en plus tendu : délais serrés, exigences clients élevées, flux de travail en continu.','En 2026, les entreprises françaises évoluent dans un contexte de plus en plus tendu : délais serrés, exigences clients élevées, flux de travail en continu.<div>Dans ce cadre, les urgences opérationnelles font partie du quotidien.</div><div><br></div><div>Pourtant, un phénomène fragilise gravement leur organisation : les désistements de dernière minute des auto-entrepreneurs, devenus fréquents et difficilement anticipables.</div><div><br></div><div>1. Une économie sous pression permanente</div><div>De nombreux secteurs fonctionnent désormais en flux tendu :</div><div><br></div><div>logistique et entrepôts</div><div>grande distribution</div><div>nettoyage industriel et tertiaire</div><div>hôtellerie et services</div><div>La moindre absence imprévue peut :</div><div><br></div><div>bloquer une chaîne logistique</div><div>retarder une ouverture de site</div><div>désorganiser une équipe entière</div><div>L’entreprise n’a plus de marge d’erreur.</div><div><br></div><div>2. Des engagements fragiles dès le départ</div><div>Les entreprises constatent régulièrement que :</div><div><br></div><div>des missions sont acceptées sans réelle disponibilité</div><div>certains auto-entrepreneurs cumulent plusieurs engagements</div><div>la priorité n’est pas toujours donnée à la mission confirmée</div><div>Résultat : annulations tardives, retards ou absences totales, souvent sans solution immédiate.</div><div><br></div><div>3. Des désistements aux conséquences lourdes</div><div>Un désistement de dernière minute entraîne :</div><div><br></div><div>une réorganisation dans l’urgence</div><div>un stress important pour les managers</div><div>des coûts supplémentaires (intérim, heures supplémentaires)</div><div>une dégradation de la relation client</div><div>À répétition, ces situations fragilisent la crédibilité de l’entreprise.</div><div><br></div><div>4. Une dépendance excessive aux solutions improvisées</div><div>Face à l’urgence, les entreprises sont souvent contraintes de :</div><div><br></div><div>rappeler d’anciens prestataires non disponibles</div><div>accepter des profils peu qualifiés</div><div>surcharger les équipes internes</div><div>Ces solutions temporaires deviennent chroniques et nuisent à la performance globale.</div><div><br></div><div>5. Un manque de cadre dans la mise en relation</div><div>Le problème n’est pas l’auto-entrepreneuriat en soi, mais :</div><div><br></div><div>l’absence de sélection sérieuse</div><div>le manque d’engagement contractuel clair</div><div>l’absence de suivi des missions</div><div>Les plateformes généralistes facilitent la mise en relation, mais ne sécurisent pas l’exécution.</div><div><br></div><div>6. Une perte de confiance progressive</div><div>À force de désistements :</div><div><br></div><div>les entreprises deviennent méfiantes</div><div>les managers hésitent à externaliser</div><div>les collaborations deviennent plus rigides</div><div>Cette défiance nuit autant aux entreprises qu’aux auto-entrepreneurs sérieux.</div><div><br></div><div>NettmobFrance : fiabilité et engagement au cœur du modèle</div><div>NettmobFrance répond directement à ces problématiques en proposant :</div><div><br></div><div>des auto-entrepreneurs vérifiés et réellement disponibles</div><div>une mise en relation ciblée selon les urgences opérationnelles</div><div>un cadre clair qui responsabilise les deux parties</div><div>une réduction significative des désistements de dernière minute</div><div>L’entreprise gagne en visibilité, en stabilité et en sérénité.</div><div><br></div><div>Les urgences sont inévitables.</div><div>L’improvisation, en revanche, ne devrait plus l’être.</div><div><br></div><div>En 2026, les entreprises ont besoin de partenaires fiables, capables de répondre présents quand cela compte.</div><div>NettmobFrance transforme l’urgence en solution maîtrisée.</div>','/uploads/blog/blog-1773013878218-741988248.jpg','2026-03-04 17:14:59','2026-03-08 23:51:18','urgences-operationnelles-et-desistements-de-derniere-minute-un-risque-',1,0),(8,'Recrutement difficile : les TPE et PME peinent à trouver des profils qualifiés — auto-entrepreneurs inclus','enterprise','En France en 2025-2026, les très petites entreprises (TPE) et les petites et moyennes entreprises (PME) continuent de se heurter à une difficulté récurrente : trouver des profils qualifiés.','En France en 2025-2026, les très petites entreprises (TPE) et les petites et moyennes entreprises (PME) continuent de se heurter à une difficulté récurrente : trouver des profils qualifiés pour répondre à leurs besoins, et cela inclut désormais aussi les auto-entrepreneurs et freelances qu’elles souhaiteraient engager pour des missions ponctuelles ou temporaires.<div><br></div><div>Un constat très large : 9 TPE/PME sur 10 ont des difficultés</div><div>Une enquête de conjoncture menée auprès de dirigeants de TPE/PME indique que près de 9 entreprises sur 10 déclarent rencontrer des difficultés pour recruter le bon profil. Cette difficulté ne touche pas seulement les salariés classiques ; elle s’étend aussi aux profils externes comme les auto-entrepreneurs, surtout quand ces derniers doivent être hautement spécialisés ou immédiatement opérationnels.</div><div><br></div><div>Ces difficultés s’expliquent par plusieurs phénomènes interdépendants :</div><div><br></div><div>1. Manque général de profils qualifiés disponible</div><div>Les dirigeants de petites structures indiquent que les candidatures souvent ne correspondent pas aux besoins précis, tant sur les compétences techniques que sur l’expérience requise. Même lorsque des auto-entrepreneurs postulent ou se proposent, il arrive qu’ils ne possèdent ni l’expertise ni les compétences spécifiques requises pour une mission donnée, ce qui rallonge le processus de recherche ou mène parfois à l’absence de candidature pertinente.</div><div><br></div><div>2. Attractivité limitée des TPE/PME</div><div>Les petites entreprises ont généralement moins de visibilité sur le marché et peinent à attirer des talents — qu’ils soient salariés ou indépendants. Cela peut être lié à la localisation géographique (en zones rurales ou moins dynamiques), à une notoriété limitée, ou encore à des offres qui ne sont pas facilement repérées par les candidats potentiels.</div><div><br></div><div>De ce fait, même des auto-entrepreneurs intéressés peuvent ne pas voir l’offre ou ne pas considérer la mission comme suffisamment attractive. Certaines entreprises doivent investir dans la diffusion de leurs offres sur plusieurs canaux, ce qui alourdit leurs démarches de recrutement.</div><div><br></div><div>3. Processus de recrutement long et coûteux</div><div>Un autre facteur aggravant est la durée moyenne des recrutements : les postes mettent souvent plusieurs semaines — parfois jusqu’à plusieurs mois — à être pourvus, surtout lorsque la recherche implique un tri minutieux des profils qualifiés. Les entreprises doivent alors mobiliser du temps et de l’énergie pour filtrer, contacter, interviewer et vérifier les compétences des candidats, ce qui constitue un frein organisationnel significatif pour des TPE/PME déjà très occupées par leurs opérations quotidiennes.</div><div><br></div><div>4. Déficit de compétences internes en recrutement</div><div>Dans beaucoup de petites entreprises, le recrutement est géré par le propre dirigeant ou un manager sans expérience RH. L’absence d’experts dédiés au recrutement signifie que les descriptions de mission ou de poste sont parfois mal formulées, les canaux de diffusion sont sous-utilisés, et les candidatures reçues ne sont pas efficacement analysées. Cette situation est aussi problématique quand il s’agit de missions confiées à des auto-entrepreneurs — car ces engagements nécessitent souvent de bien cadrer les objectifs, les livrables et les compétences recherchées, ce qui demande une expertise que plusieurs petites structures n’ont pas encore développée.</div><div><br></div><div>Conséquences pour les entreprises</div><div>Délais prolongés pour concrétiser un recrutement ou une mission, ce qui retarde des projets ou freine la croissance.</div><div>Coûts supplémentaires, que ce soit en temps ou en investissement dans des plateformes de recrutement et de mise en relation spécialisées.</div><div>Concurrence accrue, notamment pour attirer les mêmes profils qualifiés, ce qui peut mener les TPE/PME à revoir leurs offres, ajuster les rémunérations ou assouplir certains critères pour ne pas perdre des candidats précieux.</div><div><br></div><div>Élargissement vers les auto-entrepreneurs : un défi spécifique</div><div>Pour de nombreuses petites entreprises, solliciter des auto-entrepreneurs ou freelances est vue comme une solution flexible, particulièrement pour des tâches spécifiques, des pics de charge ou des projets ponctuels. Cependant :</div><div><br></div><div>Les plateformes grand public ne permettent pas toujours de filtrer précisément les compétences recherchées.</div><div>Il existe parfois un décalage entre les missions proposées par l’entreprise et les profils des auto-entrepreneurs inscrits sur ces plateformes.</div><div>Les PME n’ont pas toujours de stratégie claire pour attirer et évaluer rapidement des indépendants qualifiés, ce qui complique la mise en relation efficace.</div><div>Ces obstacles font que, même si les auto-entrepreneurs pourraient être une réponse adaptée, le manque de visibilité, de structuration et de compétences ciblées reste un frein à leur recrutement réussi.</div><div><br></div><div>Les difficultés de recrutement des TPE et PME françaises en 2025-2026 ne se limitent pas aux postes salariés : elles incluent aussi les missions confiées à des auto-entrepreneurs ou indépendants.</div><div>Ces difficultés sont dues à un manque de profils qualifiés disponibles, à une attractivité limitée, à des délais longs et à un déficit de compétences internes en RH.</div><div>En conséquence, de nombreuses entreprises doivent repenser leurs stratégies de recrutement, renforcer leurs capacités d’analyse des profils et utiliser des outils plus efficaces pour trouver les bons talents, qu’ils soient salariés ou indépendants.</div>','/uploads/blog/blog-1773013780038-361678767.jpeg','2026-03-04 17:15:00','2026-03-08 23:49:40','recrutement-difficile-les-tpe-et-pme-peinent-a-trouver-des-profils-qua',0,0);
/*!40000 ALTER TABLE `blog_posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blog_posts_clean`
--

DROP TABLE IF EXISTS `blog_posts_clean`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blog_posts_clean` (
  `id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('auto-entrepreneur','enterprise') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `excerpt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `slug` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `helpful_yes` int DEFAULT '0',
  `helpful_no` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blog_posts_clean`
--

LOCK TABLES `blog_posts_clean` WRITE;
/*!40000 ALTER TABLE `blog_posts_clean` DISABLE KEYS */;
/*!40000 ALTER TABLE `blog_posts_clean` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blog_posts_tmp_fix`
--

DROP TABLE IF EXISTS `blog_posts_tmp_fix`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blog_posts_tmp_fix` (
  `id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('auto-entrepreneur','enterprise') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `excerpt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `slug` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `helpful_yes` int DEFAULT '0',
  `helpful_no` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blog_posts_tmp_fix`
--

LOCK TABLES `blog_posts_tmp_fix` WRITE;
/*!40000 ALTER TABLE `blog_posts_tmp_fix` DISABLE KEYS */;
/*!40000 ALTER TABLE `blog_posts_tmp_fix` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_conversations`
--

DROP TABLE IF EXISTS `chat_conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_conversations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mission_id` int NOT NULL,
  `client_id` int NOT NULL,
  `automob_id` int NOT NULL,
  `last_message_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_conversation` (`mission_id`,`client_id`,`automob_id`),
  KEY `automob_id` (`automob_id`),
  KEY `idx_participants` (`client_id`,`automob_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_conversations`
--

LOCK TABLES `chat_conversations` WRITE;
/*!40000 ALTER TABLE `chat_conversations` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` int NOT NULL,
  `sender_id` int NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_status` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sender_id` (`sender_id`),
  KEY `idx_conversation` (`conversation_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_competences`
--

DROP TABLE IF EXISTS `client_competences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_competences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_profile_id` int NOT NULL,
  `competence_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `client_profile_id` (`client_profile_id`),
  KEY `competence_id` (`competence_id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_competences`
--

LOCK TABLES `client_competences` WRITE;
/*!40000 ALTER TABLE `client_competences` DISABLE KEYS */;
INSERT INTO `client_competences` VALUES (39,6,6,'2026-03-07 21:11:18'),(40,6,5,'2026-03-07 21:11:18'),(41,6,8,'2026-03-07 21:11:18'),(42,6,7,'2026-03-07 21:11:18'),(52,7,6,'2026-03-08 19:36:32'),(53,7,5,'2026-03-08 19:36:32'),(54,7,8,'2026-03-08 19:36:32');
/*!40000 ALTER TABLE `client_competences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_profiles`
--

DROP TABLE IF EXISTS `client_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `company_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone_country_code` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '+33',
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `siret` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `secteur_id` int DEFAULT NULL,
  `representative_id_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `representative_id_verified` tinyint(1) DEFAULT '0',
  `web_push_enabled` tinyint(1) DEFAULT '0',
  `web_push_subscription` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `email_notifications` tinyint(1) DEFAULT '1',
  `privacy_policy_accepted` tinyint(1) DEFAULT '0',
  `billing_mandate_accepted` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `profile_picture` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cover_picture` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `total_session_duration` int DEFAULT '0',
  `company_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `work_areas` json DEFAULT NULL,
  `manager_position` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sms_notifications` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_profiles`
--

LOCK TABLES `client_profiles` WRITE;
/*!40000 ALTER TABLE `client_profiles` DISABLE KEYS */;
INSERT INTO `client_profiles` VALUES (6,26,'Btp Afrique','Mounchili','thierry','+237655974875','+23','34 Avenue Des Champs-Élysées, 75008 Paris, France',NULL,NULL,NULL,'87654123285985',2,NULL,1,1,NULL,0,1,1,'2025-11-14 01:09:45','2026-03-07 21:11:18','/uploads/profile/26_1772838971887.png','/uploads/profile/26_1772838979655.png',NULL,0,'kbbbbkjbjkbjkbkbb  jhk jhk bjjgjgkjgjfkjfgjggkfg gkj gkjgggjgk gfkg','[\"Paris\", \"Marseille\", \"Lille\"]','PDG',1),(7,28,'Btp Afrique','Henry','Durant','+237620701318','+23','10 Rue Du Colisée, 75008 Paris, France','Paris',48.87055600,2.30798600,'89654712365478',2,NULL,1,0,NULL,0,1,1,'2026-03-08 19:32:37','2026-03-08 19:42:27','/uploads/profile/28_1772998604800.png','/uploads/profile/28_1772998613711.png',NULL,0,'Tu as tout à fait raison ! J\'avais modifié le mauvais fichier (UsersManagement.jsx au lieu de UsersList.jsx). C\'est pour ça que rien ne changeait sur ton écran.\n\nJ\'ai maintenant appliqué les modifications au bon fichier (UsersList.jsx) :','[\"Paris\", \"Lille\", \"Maeseille\", \"Nice\"]','PDG',1);
/*!40000 ALTER TABLE `client_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_profils_recherches`
--

DROP TABLE IF EXISTS `client_profils_recherches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_profils_recherches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_profile_id` int NOT NULL,
  `competence_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_profils_recherches`
--

LOCK TABLES `client_profils_recherches` WRITE;
/*!40000 ALTER TABLE `client_profils_recherches` DISABLE KEYS */;
INSERT INTO `client_profils_recherches` VALUES (13,6,6,'2025-11-14 01:09:47'),(14,6,5,'2025-11-14 01:09:47'),(15,6,8,'2025-11-14 01:09:47'),(16,6,7,'2025-11-14 01:09:47'),(17,7,6,'2026-03-08 19:32:37'),(18,7,5,'2026-03-08 19:32:37'),(19,7,8,'2026-03-08 19:32:37'),(20,7,7,'2026-03-08 19:32:37');
/*!40000 ALTER TABLE `client_profils_recherches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `competences`
--

DROP TABLE IF EXISTS `competences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `competences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `secteur_id` int NOT NULL,
  `nom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `competences`
--

LOCK TABLES `competences` WRITE;
/*!40000 ALTER TABLE `competences` DISABLE KEYS */;
INSERT INTO `competences` VALUES (1,1,'Préparation de commandes en magasin ou rayons',NULL,1,'2025-11-02 18:14:13','2025-11-02 18:14:13'),(2,1,'Réassortiment, gestion des stocks, mise en rayon',NULL,1,'2025-11-02 18:14:13','2025-11-02 18:14:13'),(3,1,'Utilisation de transpalette, chariot élévateur (souhaitable)',NULL,1,'2025-11-02 18:14:13','2025-11-02 18:14:13'),(4,1,'Respect des consignes de sécurité, bonnes conditions physiques',NULL,1,'2025-11-02 18:14:13','2025-11-02 18:14:13'),(5,2,'Manutention de marchandises, chargement/déchargement',NULL,1,'2025-11-02 18:14:13','2025-11-02 18:14:13'),(6,2,'Conditionnement, rangement, gestion d\'inventaire',NULL,1,'2025-11-02 18:14:13','2025-11-02 18:14:13'),(7,2,'Utilisation de matériel (chariot, transpalette)',NULL,1,'2025-11-02 18:14:13','2025-11-02 18:14:13'),(8,2,'Respect des normes et procédures d\'entrepôt',NULL,1,'2025-11-02 18:14:13','2025-11-02 18:14:13'),(9,3,'Accueil clientèle ou services hôteliers (ménage, petit-déjeuner, réception)',NULL,1,'2025-11-02 18:14:14','2025-11-02 18:14:14'),(10,3,'Qualité de service, relation client, polyvalence',NULL,1,'2025-11-02 18:14:14','2025-11-02 18:14:14'),(11,3,'Gestion des urgences, disponibilité (week-ends/soirées)',NULL,1,'2025-11-02 18:14:14','2025-11-02 18:14:14'),(12,4,'Nettoyage de locaux, bâtiments, entretien industriel ou tertiaire',NULL,1,'2025-11-02 18:14:14','2025-11-02 18:14:14'),(13,4,'Respect des protocoles d\'hygiène et de sécurité',NULL,1,'2025-11-02 18:14:14','2025-11-02 18:14:14'),(14,4,'Autonomie, ponctualité, rigueur',NULL,1,'2025-11-02 18:14:14','2025-11-02 18:14:14');
/*!40000 ALTER TABLE `competences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_messages`
--

LOCK TABLES `contact_messages` WRITE;
/*!40000 ALTER TABLE `contact_messages` DISABLE KEYS */;
INSERT INTO `contact_messages` VALUES (1,'Test Entreprise','test@entreprise.com','0600000000','[Entreprise - Ma Société] Test','Message de test depuis entreprise',1,'2026-03-06 18:00:01'),(2,'Mounchili thierry','ulrichthierry47@gmail.com','655974875','[Entreprise - Btp Afrique] jhh jez ez hjez ezh ezjez ezhj ee','ezhje hej ezh ezjh ezhjez hez jhez hjez hjez jhezhez hjezhejz ezhj ezhj ezh ezhj ezjh ezjh ezjh ezhj ezh ez',1,'2026-03-06 18:00:37'),(3,'Test','test@test.com','0600000000','Test sujet','Message de test',1,'2026-03-06 18:34:18'),(4,'Mounchili thierry','ulrichthierry47@gmail.com','655974875','[Entreprise - Btp Afrique] devis de test','Je vérifie les logs ou le code backend pour comprendre pourquoi le token généré à la connexion est parfois refusé immédiatement après, provoquant un 401 et la déconnexion inopinée.',1,'2026-03-06 20:41:04');
/*!40000 ALTER TABLE `contact_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devis_entreprise`
--

DROP TABLE IF EXISTS `devis_entreprise`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devis_entreprise` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `secteur` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `volume` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('nouveau','lu','repondu') COLLATE utf8mb4_unicode_ci DEFAULT 'nouveau',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devis_entreprise`
--

LOCK TABLES `devis_entreprise` WRITE;
/*!40000 ALTER TABLE `devis_entreprise` DISABLE KEYS */;
INSERT INTO `devis_entreprise` VALUES (1,'Test','test@test.com','0600000000','Test Inc','Autre','Autre','Test message','nouveau','2026-03-06 20:51:54','2026-03-06 20:51:54'),(2,'Test','test@test.com','0600000000','Test Inc','Autre','Autre','Test message','nouveau','2026-03-06 20:52:47','2026-03-06 20:52:47'),(3,'Test','test@test.com','0600000000','Test Inc','Autre','Autre','Test message','nouveau','2026-03-06 21:01:32','2026-03-06 21:01:32'),(4,'Test','test@test.com','0600000000','Test Inc','Autre','Autre','Test message','nouveau','2026-03-06 21:02:59','2026-03-06 21:02:59'),(5,'Mounchili thierry','ulrichthierry47@gmail.com','655974875','Btp Afrique','Logistique Entrepôt','Moins de 10 missions','J\'ai corrigé l\'erreur 404 et les plantages 500 sur le formulaire de devis. Les administrateurs reçoivent désormais une notification (in-app et push) à chaque nouvelle demande.\n\nConcernant les déconnexions intempestives (erreur 401) :\n\nAs-tu vu une alerte s\'afficher avec une URL spécifique lors de la dernière déconnexion ? Si oui, quelle était cette URL ?\nSinon, peux-tu essayer de te reconnecter et me dire si l\'alerte s\'affiche quand le dashboard s\'actualise ?\nUne fois que nous aurons identifié l\'URL fautive, je pourrai corriger le problème de session.','nouveau','2026-03-06 21:04:23','2026-03-06 21:04:23'),(6,'Ulrich Thierry','test@test.com','0600000000','Nettmob Test','Nettoyage Industriel','500m2 / mois','Ceci est un test du nouveau design d email premium.','nouveau','2026-03-06 21:14:15','2026-03-06 21:14:15'),(7,'Ulrich Thierry','test@test.com','0600000000','Nettmob Test Premium','Nettoyage Industriel','500m2 / mois','Ceci est un test du nouveau design d email premium forcé à l adresse de destination.','nouveau','2026-03-06 21:14:51','2026-03-06 21:14:51'),(8,'Mounchili thierry','ulrichthierry47@gmail.com','655974875','Mounchili thierry','Logistique Entrepôt','Moins de 10 missions','/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise/entreprise','nouveau','2026-03-06 21:50:43','2026-03-06 21:50:43');
/*!40000 ALTER TABLE `devis_entreprise` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dispute_history`
--

DROP TABLE IF EXISTS `dispute_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dispute_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dispute_id` int NOT NULL,
  `admin_user_id` int NOT NULL,
  `action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dispute_history`
--

LOCK TABLES `dispute_history` WRITE;
/*!40000 ALTER TABLE `dispute_history` DISABLE KEYS */;
INSERT INTO `dispute_history` VALUES (1,3,1,'resolved','{\"admin_decision\":\"automob_wins\",\"compensation_amount\":\"\"}','2025-11-16 07:49:33');
/*!40000 ALTER TABLE `dispute_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dispute_messages`
--

DROP TABLE IF EXISTS `dispute_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dispute_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dispute_id` int NOT NULL,
  `user_id` int NOT NULL,
  `user_role` enum('automob','client','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attachments` json DEFAULT NULL COMMENT 'Array of file URLs',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_dispute` (`dispute_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dispute_messages`
--

LOCK TABLES `dispute_messages` WRITE;
/*!40000 ALTER TABLE `dispute_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `dispute_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `disputes`
--

DROP TABLE IF EXISTS `disputes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `disputes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mission_id` int NOT NULL,
  `created_by_user_id` int NOT NULL,
  `created_by_role` enum('automob','client') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `against_user_id` int NOT NULL,
  `against_role` enum('automob','client') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dispute_type` enum('payment_issue','service_quality','mission_cancellation','communication_issue','contract_breach','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `disputed_amount` decimal(10,2) DEFAULT '0.00',
  `evidence` json DEFAULT NULL COMMENT 'Array of file URLs',
  `status` enum('pending','under_review','resolved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `admin_decision` enum('automob_wins','client_wins','partial','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admin_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `admin_user_id` int DEFAULT NULL,
  `decided_at` datetime DEFAULT NULL,
  `compensation_amount` decimal(10,2) DEFAULT '0.00',
  `compensation_to_user_id` int DEFAULT NULL,
  `compensation_paid` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `disputes`
--

LOCK TABLES `disputes` WRITE;
/*!40000 ALTER TABLE `disputes` DISABLE KEYS */;
INSERT INTO `disputes` VALUES (3,9,24,'automob',26,'client','other','cvvvv','vfvdfdfdfdfdfffdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfdfffd',100.00,'[]','resolved','automob_wins','dtgfgfnffgfbgfg',1,'2025-11-16 08:49:32',0.00,NULL,0,'2025-11-16 01:09:26','2025-11-16 07:49:32');
/*!40000 ALTER TABLE `disputes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fcm_tokens`
--

DROP TABLE IF EXISTS `fcm_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fcm_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'web',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fcm_tokens`
--

LOCK TABLES `fcm_tokens` WRITE;
/*!40000 ALTER TABLE `fcm_tokens` DISABLE KEYS */;
INSERT INTO `fcm_tokens` VALUES (3,26,'fk258EFXSKA-rlty4EEvfh:APA91bHXVUztSQtZYseuj8OO2HuqGMpymWggyrBYDVMe7gomL1r3zpiapHRZwQj6LaOLiaG4saC-FC3QdmMCDWH-EdgeHEKn5VBXyzVCNhw5V9uLI3LPg48','web','2025-11-15 15:25:55','2026-03-08 03:53:04'),(4,24,'fk258EFXSKA-rlty4EEvfh:APA91bHXVUztSQtZYseuj8OO2HuqGMpymWggyrBYDVMe7gomL1r3zpiapHRZwQj6LaOLiaG4saC-FC3QdmMCDWH-EdgeHEKn5VBXyzVCNhw5V9uLI3LPg48','web','2025-11-15 15:51:37','2026-03-08 17:11:10'),(5,1,'fk258EFXSKA-rlty4EEvfh:APA91bHXVUztSQtZYseuj8OO2HuqGMpymWggyrBYDVMe7gomL1r3zpiapHRZwQj6LaOLiaG4saC-FC3QdmMCDWH-EdgeHEKn5VBXyzVCNhw5V9uLI3LPg48','web','2025-11-16 08:25:03','2026-03-09 01:57:07'),(6,25,'diXUGC0qUX-j83Az9yM9_8:APA91bGsAFTJ9QegWzgDuBYshg5OuTA1OekGOkHpRmO5v7hi0IyqhBlfBQdRM13fxPt0foGcDoT3mMAGLFR1C9rfKw7SI0x2QndUK_oY-OtXY4Cugu41Lfo','web','2025-11-18 23:32:42','2025-11-21 02:41:39'),(7,27,'fk258EFXSKA-rlty4EEvfh:APA91bHXVUztSQtZYseuj8OO2HuqGMpymWggyrBYDVMe7gomL1r3zpiapHRZwQj6LaOLiaG4saC-FC3QdmMCDWH-EdgeHEKn5VBXyzVCNhw5V9uLI3LPg48','web','2026-03-08 17:39:27','2026-03-08 23:54:58'),(8,27,'fk258EFXSKA-rlty4EEvfh:APA91bHXVUztSQtZYseuj8OO2HuqGMpymWggyrBYDVMe7gomL1r3zpiapHRZwQj6LaOLiaG4saC-FC3QdmMCDWH-EdgeHEKn5VBXyzVCNhw5V9uLI3LPg48','web','2026-03-08 17:39:27','2026-03-08 23:54:58'),(9,27,'fk258EFXSKA-rlty4EEvfh:APA91bHXVUztSQtZYseuj8OO2HuqGMpymWggyrBYDVMe7gomL1r3zpiapHRZwQj6LaOLiaG4saC-FC3QdmMCDWH-EdgeHEKn5VBXyzVCNhw5V9uLI3LPg48','web','2026-03-08 17:39:27','2026-03-08 23:54:58'),(10,27,'fk258EFXSKA-rlty4EEvfh:APA91bHXVUztSQtZYseuj8OO2HuqGMpymWggyrBYDVMe7gomL1r3zpiapHRZwQj6LaOLiaG4saC-FC3QdmMCDWH-EdgeHEKn5VBXyzVCNhw5V9uLI3LPg48','web','2026-03-08 17:39:27','2026-03-08 23:54:58'),(11,28,'fk258EFXSKA-rlty4EEvfh:APA91bHXVUztSQtZYseuj8OO2HuqGMpymWggyrBYDVMe7gomL1r3zpiapHRZwQj6LaOLiaG4saC-FC3QdmMCDWH-EdgeHEKn5VBXyzVCNhw5V9uLI3LPg48','web','2026-03-08 19:33:21','2026-03-09 00:07:11'),(12,28,'fk258EFXSKA-rlty4EEvfh:APA91bHXVUztSQtZYseuj8OO2HuqGMpymWggyrBYDVMe7gomL1r3zpiapHRZwQj6LaOLiaG4saC-FC3QdmMCDWH-EdgeHEKn5VBXyzVCNhw5V9uLI3LPg48','web','2026-03-08 19:33:21','2026-03-09 00:07:11'),(13,28,'fk258EFXSKA-rlty4EEvfh:APA91bHXVUztSQtZYseuj8OO2HuqGMpymWggyrBYDVMe7gomL1r3zpiapHRZwQj6LaOLiaG4saC-FC3QdmMCDWH-EdgeHEKn5VBXyzVCNhw5V9uLI3LPg48','web','2026-03-08 19:33:21','2026-03-09 00:07:11'),(14,28,'fk258EFXSKA-rlty4EEvfh:APA91bHXVUztSQtZYseuj8OO2HuqGMpymWggyrBYDVMe7gomL1r3zpiapHRZwQj6LaOLiaG4saC-FC3QdmMCDWH-EdgeHEKn5VBXyzVCNhw5V9uLI3LPg48','web','2026-03-08 19:33:21','2026-03-09 00:07:11');
/*!40000 ALTER TABLE `fcm_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hourly_rates`
--

DROP TABLE IF EXISTS `hourly_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hourly_rates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rate` decimal(10,2) NOT NULL,
  `work_time` enum('jour','nuit','both') DEFAULT 'both',
  `label` varchar(100) NOT NULL,
  `description` text,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hourly_rates`
--

LOCK TABLES `hourly_rates` WRITE;
/*!40000 ALTER TABLE `hourly_rates` DISABLE KEYS */;
INSERT INTO `hourly_rates` VALUES (1,15.00,'jour','Débutant (Jour)','Pour les missions simples en journée',1,'2025-11-13 11:49:08','2025-11-13 14:48:16'),(2,20.00,'jour','Standard (Jour)','Tarif moyen du marché pour le jour',1,'2025-11-13 11:49:08','2025-11-13 14:48:16'),(3,25.00,'jour','Intermédiaire (Jour)','Pour les profils avec expérience (jour)',1,'2025-11-13 11:49:08','2025-11-13 14:48:16'),(4,30.00,'nuit','Standard (Nuit)','Tarif de nuit standard',1,'2025-11-13 11:49:08','2025-11-13 14:48:16'),(5,35.00,'nuit','Expert (Nuit)','Pour les missions de nuit qualifiées',1,'2025-11-13 11:49:08','2025-11-13 14:48:16'),(6,18.00,'jour','Intermédiaire Plus (Jour)','Tarif intermédiaire amélioré pour le jour',1,'2025-11-13 14:48:17','2025-11-13 14:48:17'),(7,22.00,'nuit','Débutant (Nuit)','Pour les missions simples de nuit',1,'2025-11-13 14:48:17','2025-11-13 14:48:17'),(8,28.00,'nuit','Intermédiaire (Nuit)','Pour les profils avec expérience (nuit)',1,'2025-11-13 14:48:17','2025-11-13 14:48:17'),(9,40.00,'nuit','Premium (Nuit)','Pour les missions spécialisées de nuit',1,'2025-11-13 14:48:17','2025-11-13 14:48:17');
/*!40000 ALTER TABLE `hourly_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `identity_verifications`
--

DROP TABLE IF EXISTS `identity_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `identity_verifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `document_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `document_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `submitted_at` timestamp NULL DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `reviewed_by` int DEFAULT NULL,
  `rejection_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reviewed_by` (`reviewed_by`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `identity_verifications`
--

LOCK TABLES `identity_verifications` WRITE;
/*!40000 ALTER TABLE `identity_verifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `identity_verifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `identity_verifications_new`
--

DROP TABLE IF EXISTS `identity_verifications_new`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `identity_verifications_new` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `user_type` enum('automob','client') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `manager_first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager_last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `manager_position` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `document_type` enum('carte_identite','passeport','permis_conduire','titre_sejour') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_recto` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `document_verso` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `selfie_with_document` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `assurance_rc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `justificatif_domicile` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `avis_insee` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `attestation_urssaf` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `has_habilitations` tinyint(1) DEFAULT '0',
  `nombre_habilitations` int DEFAULT '0',
  `habilitations_files` json DEFAULT NULL,
  `has_caces` tinyint(1) DEFAULT '0',
  `nombre_caces` int DEFAULT '0',
  `caces_files` json DEFAULT NULL,
  `kbis` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `presentation` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `submitted_at` datetime DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `reviewed_by` int DEFAULT NULL,
  `rejection_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `identity_verifications_new`
--

LOCK TABLES `identity_verifications_new` WRITE;
/*!40000 ALTER TABLE `identity_verifications_new` DISABLE KEYS */;
INSERT INTO `identity_verifications_new` VALUES (2,24,'automob','Patrice Raoul','Geoffroy','mounchilithierry432@gmail.com','+33761040251','1 Place Des Marseillais, 94220 Charenton-le-Pont, France',NULL,NULL,NULL,NULL,NULL,NULL,'carte_identite','/uploads/verification/24_1762946330847_document_recto.jpg','/uploads/verification/24_1762946330850_document_verso.jpg','/uploads/verification/24_1762946330859_selfie_with_document.png','/uploads/verification/24_1762946330863_assurance_rc.jpg','/uploads/verification/24_1762946330947_justificatif_domicile.jpg','/uploads/verification/24_1762946331142_avis_insee.jpg','/uploads/verification/24_1762946331171_attestation_urssaf.jpg',1,3,'[\"/uploads/verification/24_1762946331285_habilitation_0.png\", \"/uploads/verification/24_1762946331389_habilitation_1.jpg\", \"/uploads/verification/24_1762946331463_habilitation_2.png\"]',0,0,'[]',NULL,'unfuibefuifuidfuidff f f  fdfui dfu fd hfdudf  df','approved','2025-11-12 12:18:53','2025-11-12 17:42:52',1,NULL,'2025-11-12 11:17:58','2025-11-12 16:42:52'),(3,26,'client',NULL,NULL,NULL,NULL,NULL,'Mounchili','thierry','antoinepaulcm@gmail.com','+237655974875','34 Avenue Des Champs-Élysées, 75008 Paris, France','PDG','carte_identite','/uploads/verification/26_1763082710576_document_recto.png','/uploads/verification/26_1763082710845_document_verso.png','/uploads/verification/26_1763082710919_selfie_with_document.png',NULL,'/uploads/verification/26_1763082711010_justificatif_domicile.jpg',NULL,NULL,0,0,NULL,0,0,NULL,'/uploads/verification/26_1763082710923_kbis.jpg','bkbhjbjkb    jk kj jkjk j bj  bjkbjk  kj','approved','2025-11-14 02:11:51','2025-11-14 04:07:39',1,NULL,'2025-11-14 01:11:51','2025-11-14 03:07:39'),(4,25,'automob','Patrice','Geoffroy','ulrichthierry47@gmail.com','+237655974875','1 Place Des Marseillais, 94220 Charenton-le-Pont, France',NULL,NULL,NULL,NULL,NULL,NULL,'carte_identite',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'[]',0,0,'[]',NULL,'jjhhjjhjhjhjhjhjhjhjh','approved','2025-11-19 00:36:39','2025-11-19 00:37:38',1,NULL,'2025-11-18 23:36:39','2025-11-18 23:37:38'),(5,27,'automob','Thierry','Ninja','mounchilithierry432@gmail.com','+237655974875','34 Avenue Des Champs-Élysées, 75008 Paris, France',NULL,NULL,NULL,NULL,NULL,NULL,'passeport','/uploads/verification/27_1772992004478_document_recto.png','/uploads/verification/27_1772992004479_document_verso.png','/uploads/verification/27_1772992004504_selfie_with_document.jpg','/uploads/verification/27_1772992004506_assurance_rc.png','/uploads/verification/27_1772992004509_justificatif_domicile.png','/uploads/verification/27_1772992004513_avis_insee.png','/uploads/verification/27_1772992004517_attestation_urssaf.pdf',0,0,'[]',0,0,'[]',NULL,'Bonjour ! 👋 Je suis l\'Assistant IA de NettmobFrance. Comment puis-je vous aider aujourd\'hui ? Que ce soit pour comprendre le fonctionnement, écrire une belle description de mission ou créer un profil parfait, je suis là !\r\n\r\n','approved','2026-03-08 18:46:44','2026-03-08 20:53:33',1,NULL,'2026-03-08 17:46:44','2026-03-08 19:53:33'),(6,28,'client',NULL,NULL,NULL,NULL,NULL,'Henry','Durant','ulrichthierry47@gmail.com','+237620701318','10 Rue Du Colisée, 75008 Paris, France','PDG','passeport','/uploads/verification/28_1772998481558_document_recto.png','/uploads/verification/28_1772998481559_document_verso.png','/uploads/verification/28_1772998481569_selfie_with_document.png',NULL,'/uploads/verification/28_1772998481576_justificatif_domicile.png',NULL,NULL,0,0,NULL,0,0,NULL,'/uploads/verification/28_1772998481572_kbis.png','Tu as tout à fait raison ! J\'avais modifié le mauvais fichier (UsersManagement.jsx au lieu de UsersList.jsx). C\'est pour ça que rien ne changeait sur ton écran.\r\n\r\nJ\'ai maintenant appliqué les modifications au bon fichier (UsersList.jsx) :','approved','2026-03-08 20:34:41','2026-03-08 20:42:27',1,NULL,'2026-03-08 19:34:41','2026-03-08 19:42:27');
/*!40000 ALTER TABLE `identity_verifications_new` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_items`
--

DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `description` text NOT NULL,
  `timesheet_id` int DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `is_overtime` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_items`
--

LOCK TABLES `invoice_items` WRITE;
/*!40000 ALTER TABLE `invoice_items` DISABLE KEYS */;
INSERT INTO `invoice_items` VALUES (16,7,'Heures travaillées - 10/11/2025 au 16/11/2025',5,42.00,18.00,756.00,0,'2025-11-15 20:49:18'),(17,7,'Heures supplémentaires - 10/11/2025 au 16/11/2025',5,3.00,18.00,54.00,1,'2025-11-15 20:49:19'),(18,7,'Heures travaillées - 15/11/2025 au 15/11/2025',7,8.00,18.00,144.00,0,'2025-11-15 20:49:19'),(19,8,'Heures travaillées - 10/11/2025 au 16/11/2025',5,42.00,18.00,756.00,0,'2025-11-15 20:49:28'),(20,8,'Heures supplémentaires - 10/11/2025 au 16/11/2025',5,3.00,18.00,54.00,1,'2025-11-15 20:49:29'),(21,8,'Heures travaillées - 15/11/2025 au 15/11/2025',7,8.00,18.00,144.00,0,'2025-11-15 20:49:29'),(22,8,'Commission NettmobFrance (20%)',NULL,1.00,190.80,190.80,0,'2025-11-15 20:49:29'),(23,9,'Heures travaillées - 08/03/2026 au 08/03/2026',9,20.00,15.00,300.00,0,'2026-03-08 03:56:16'),(24,9,'Heures supplémentaires - 08/03/2026 au 08/03/2026',9,7.00,15.00,105.00,1,'2026-03-08 03:56:18'),(25,10,'Heures travaillées - 08/03/2026 au 08/03/2026',9,20.00,15.00,300.00,0,'2026-03-08 03:56:22'),(26,10,'Heures supplémentaires - 08/03/2026 au 08/03/2026',9,7.00,15.00,105.00,1,'2026-03-08 03:56:22'),(27,10,'Commission NettmobFrance (20%)',NULL,1.00,81.00,81.00,0,'2026-03-08 03:56:23'),(28,11,'Heures travaillées - 08/03/2026 au 08/03/2026',9,20.00,15.00,300.00,0,'2026-03-08 03:56:31'),(29,11,'Heures supplémentaires - 08/03/2026 au 08/03/2026',9,7.00,15.00,105.00,1,'2026-03-08 03:56:31'),(30,12,'Heures travaillées - 08/03/2026 au 08/03/2026',9,20.00,15.00,300.00,0,'2026-03-08 03:56:36'),(31,12,'Heures supplémentaires - 08/03/2026 au 08/03/2026',9,7.00,15.00,105.00,1,'2026-03-08 03:56:37'),(32,12,'Commission NettmobFrance (20%)',NULL,1.00,81.00,81.00,0,'2026-03-08 03:56:37'),(33,13,'Heures travaillées - 08/03/2026 au 14/03/2026',11,40.00,15.00,600.00,0,'2026-03-08 23:30:04'),(34,14,'Heures travaillées - 08/03/2026 au 14/03/2026',10,46.00,20.00,920.00,0,'2026-03-08 23:31:03'),(35,14,'Heures supplémentaires - 08/03/2026 au 14/03/2026',10,3.00,20.00,60.00,1,'2026-03-08 23:31:03'),(36,15,'Heures travaillées - 08/03/2026 au 14/03/2026',10,46.00,20.00,920.00,0,'2026-03-08 23:31:33'),(37,15,'Heures supplémentaires - 08/03/2026 au 14/03/2026',10,3.00,20.00,60.00,1,'2026-03-08 23:31:33'),(38,15,'Commission NettmobFrance (20%)',NULL,1.00,196.00,196.00,0,'2026-03-08 23:31:33'),(39,16,'Heures travaillées - 08/03/2026 au 14/03/2026',11,40.00,15.00,600.00,0,'2026-03-09 00:12:13'),(40,16,'Commission NettmobFrance (20%)',NULL,1.00,120.00,120.00,0,'2026-03-09 00:12:14');
/*!40000 ALTER TABLE `invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mission_id` int NOT NULL,
  `automob_id` int NOT NULL,
  `client_id` int NOT NULL,
  `period_start` date DEFAULT NULL,
  `period_end` date DEFAULT NULL,
  `total_hours` decimal(10,2) DEFAULT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `commission_rate` decimal(5,2) DEFAULT '0.00',
  `commission_amount` decimal(10,2) DEFAULT '0.00',
  `amount` decimal(10,2) NOT NULL,
  `pdf_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('en_attente','payee','annulee') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `generated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `paid_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES (7,10,24,26,'2025-11-10','2025-11-15',53.00,18.00,0.00,0.00,954.00,NULL,'en_attente','2025-11-15 20:49:17',NULL),(8,10,24,26,'2025-11-10','2025-11-15',53.00,18.00,20.00,190.80,954.00,NULL,'en_attente','2025-11-15 20:49:28',NULL),(9,46,24,26,'2026-03-08','2026-03-08',27.00,15.00,0.00,0.00,405.00,NULL,'en_attente','2026-03-08 03:56:16',NULL),(10,46,24,26,'2026-03-08','2026-03-08',27.00,15.00,20.00,81.00,405.00,NULL,'en_attente','2026-03-08 03:56:21',NULL),(11,46,24,26,'2026-03-08','2026-03-08',27.00,15.00,0.00,0.00,405.00,NULL,'en_attente','2026-03-08 03:56:31',NULL),(12,46,24,26,'2026-03-08','2026-03-08',27.00,15.00,20.00,81.00,405.00,NULL,'en_attente','2026-03-08 03:56:36',NULL),(13,48,27,28,'2026-03-08','2026-03-14',40.00,15.00,0.00,0.00,600.00,NULL,'en_attente','2026-03-08 23:30:04',NULL),(14,50,27,28,'2026-03-08','2026-03-14',49.00,20.00,0.00,0.00,980.00,NULL,'en_attente','2026-03-08 23:31:03',NULL),(15,50,27,28,'2026-03-08','2026-03-14',49.00,20.00,20.00,196.00,980.00,NULL,'en_attente','2026-03-08 23:31:33',NULL),(16,48,27,28,'2026-03-08','2026-03-14',40.00,15.00,20.00,120.00,600.00,NULL,'en_attente','2026-03-09 00:12:13',NULL);
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `location_types`
--

DROP TABLE IF EXISTS `location_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `location_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `value` varchar(50) NOT NULL,
  `label` varchar(100) NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `location_types`
--

LOCK TABLES `location_types` WRITE;
/*!40000 ALTER TABLE `location_types` DISABLE KEYS */;
INSERT INTO `location_types` VALUES (1,'sur_site','Sur site',1,'2025-11-13 11:49:07','2025-11-13 11:49:07'),(2,'a_distance','À distance',1,'2025-11-13 11:49:07','2025-11-13 11:49:07'),(3,'hybride','Hybride',1,'2025-11-13 11:49:07','2025-11-13 11:49:07');
/*!40000 ALTER TABLE `location_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mission_applications`
--

DROP TABLE IF EXISTS `mission_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mission_applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mission_id` int NOT NULL,
  `automob_id` int NOT NULL,
  `status` enum('en_attente','accepte','refuse') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mission_applications`
--

LOCK TABLES `mission_applications` WRITE;
/*!40000 ALTER TABLE `mission_applications` DISABLE KEYS */;
INSERT INTO `mission_applications` VALUES (6,9,24,'accepte','Test re-candidature après refus','2025-11-15 16:15:34','2025-11-15 19:34:44'),(7,10,24,'accepte','','2025-11-15 16:33:46','2025-11-15 16:44:30'),(8,46,24,'accepte','','2026-03-07 22:18:45','2026-03-07 23:57:06'),(9,44,24,'en_attente','','2026-03-07 22:20:06','2026-03-07 22:20:06'),(10,48,27,'accepte','','2026-03-08 20:30:32','2026-03-08 23:20:51'),(11,50,27,'accepte','','2026-03-08 23:19:41','2026-03-08 23:21:05');
/*!40000 ALTER TABLE `mission_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mission_automobs`
--

DROP TABLE IF EXISTS `mission_automobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mission_automobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mission_id` int NOT NULL,
  `automob_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('actif','en_cours','termine','annule') DEFAULT 'en_cours',
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_mission_automob` (`mission_id`,`automob_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mission_automobs`
--

LOCK TABLES `mission_automobs` WRITE;
/*!40000 ALTER TABLE `mission_automobs` DISABLE KEYS */;
INSERT INTO `mission_automobs` VALUES (2,10,24,'2025-11-15 16:44:31','2025-11-15 16:44:31','termine','2026-03-08 00:07:54'),(3,9,24,'2025-11-15 16:50:06','2025-11-15 16:50:06','termine','2026-03-08 00:08:07'),(4,46,24,'2026-03-07 23:57:06','2026-03-07 23:57:06','termine','2026-03-08 03:56:30'),(5,48,27,'2026-03-08 23:20:52','2026-03-08 23:20:52','termine','2026-03-08 23:30:04'),(6,50,27,'2026-03-08 23:21:05','2026-03-08 23:21:05','termine','2026-03-08 23:31:33');
/*!40000 ALTER TABLE `mission_automobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mission_competences`
--

DROP TABLE IF EXISTS `mission_competences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mission_competences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mission_id` int NOT NULL,
  `competence_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=145 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mission_competences`
--

LOCK TABLES `mission_competences` WRITE;
/*!40000 ALTER TABLE `mission_competences` DISABLE KEYS */;
INSERT INTO `mission_competences` VALUES (19,9,6,'2025-11-14 14:38:41'),(20,9,5,'2025-11-14 14:38:42'),(21,9,8,'2025-11-14 14:38:42'),(22,10,6,'2025-11-14 19:29:40'),(23,10,5,'2025-11-14 19:29:40'),(24,10,8,'2025-11-14 19:29:40'),(25,10,7,'2025-11-14 19:29:40'),(54,19,6,'2025-11-20 05:47:25'),(55,19,5,'2025-11-20 05:47:25'),(56,19,8,'2025-11-20 05:47:25'),(113,39,6,'2025-11-21 02:55:28'),(114,39,5,'2025-11-21 02:55:29'),(115,40,6,'2025-11-21 07:39:40'),(116,40,5,'2025-11-21 07:39:40'),(117,41,6,'2025-11-21 08:10:47'),(118,41,5,'2025-11-21 08:10:47'),(119,42,6,'2025-11-21 10:22:04'),(120,42,5,'2025-11-21 10:22:04'),(121,42,8,'2025-11-21 10:22:04'),(122,43,6,'2025-11-21 11:47:20'),(123,43,5,'2025-11-21 11:47:20'),(124,43,8,'2025-11-21 11:47:20'),(125,44,6,'2025-11-21 11:48:43'),(126,44,5,'2025-11-21 11:48:44'),(127,44,8,'2025-11-21 11:48:44'),(128,45,1,'2025-12-14 13:55:15'),(129,45,2,'2025-12-14 13:55:15'),(130,46,6,'2026-03-07 10:24:07'),(131,46,5,'2026-03-07 10:24:08'),(132,46,8,'2026-03-07 10:24:08'),(133,47,5,'2026-03-08 03:55:46'),(134,47,6,'2026-03-08 03:55:47'),(135,47,8,'2026-03-08 03:55:47'),(136,48,6,'2026-03-08 19:55:55'),(137,48,5,'2026-03-08 19:55:55'),(138,48,8,'2026-03-08 19:55:55'),(139,49,6,'2026-03-08 23:16:58'),(140,49,5,'2026-03-08 23:16:59'),(141,49,8,'2026-03-08 23:16:59'),(142,50,6,'2026-03-08 23:18:53'),(143,50,5,'2026-03-08 23:18:53'),(144,50,8,'2026-03-08 23:18:53');
/*!40000 ALTER TABLE `mission_competences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `missions`
--

DROP TABLE IF EXISTS `missions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `missions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `mission_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `work_time` enum('jour','nuit') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'jour',
  `secteur_id` int DEFAULT NULL,
  `billing_frequency` enum('jour','semaine','mois') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'jour',
  `max_hours` int DEFAULT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `location_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'sur_site',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nb_automobs` int DEFAULT '1',
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `postal_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `budget` decimal(10,2) NOT NULL,
  `start_date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `total_hours` decimal(8,2) DEFAULT NULL COMMENT 'Nombre total d''heures pour la mission',
  `end_time` time DEFAULT NULL,
  `status` enum('ouvert','en_cours','termine','annule') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'ouvert',
  `assigned_automob_id` int DEFAULT NULL,
  `automobs_needed` int DEFAULT '1',
  `max_applications` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `missions`
--

LOCK TABLES `missions` WRITE;
/*!40000 ALTER TABLE `missions` DISABLE KEYS */;
INSERT INTO `missions` VALUES (9,26,'hhjhjhhj hjhb  jh jh jh jh','jour',2,'semaine',40,18.00,'sur_site','hhjhjhhj hjhb  jh jh jh jh','jkdjdsjksdjksdjkdjkdjkjksdjksdjksdjkdsjksdjksdjsd',1,'Paris','75008','34 Avenue Des Champs-Élysées, 75008 Paris, France',48.86996500,2.30816400,720.00,'2025-11-14','08:30:00','2025-11-17',40.00,'16:30:00','termine',24,12,NULL,'2025-11-14 14:38:38','2026-03-08 00:08:07'),(10,26,'mission nettoyage boss','jour',2,'semaine',42,18.00,'sur_site','mission nettoyage boss','34 Avenue des champs Elysées,75008 Paris34 Avenue des champs Elysées,75008 Paris34 Avenue des champs Elysées,75008 Paris34 Avenue des champs Elysées,75008 Paris34 Avenue des champs Elysées,75008 Paris34 Avenue des champs Elysées,75008 Paris34 Avenue des champs Elysées,75008 Paris34 Avenue des champs Elysées,75008 Paris34 Avenue des champs Elysées,75008 Paris',1,'Paris',NULL,'Avenue Des Champs Elysées, 75008 Paris, France',48.87009400,2.30663300,756.00,'2025-11-15','08:00:00','2025-11-20',42.00,'17:00:00','termine',24,4,NULL,'2025-11-14 19:29:38','2026-03-08 00:07:54'),(45,26,'Mission Test Verification','jour',1,'jour',4,25.00,'sur_site','Mission Test Verification','Mission de test pour vérifier les notifications',1,'Nice',NULL,'10 Rue de Paris',43.70520300,7.26861900,100.00,'2025-12-15','09:00:00','2025-12-16',8.00,'13:00:00','ouvert',NULL,1,NULL,'2025-12-14 13:55:14','2025-12-14 13:55:14'),(46,26,'babana fatigeue','jour',2,'jour',20,15.00,'sur_site','babana fatigeue',' dans le layout pour comprendre pourquoi elle affiche l\'email. J\'ai déjà terminé les corrections sur les notifications push et l\'avatar public. J\'ai également harmonisé les initiales et la commission. J\'ai également terminé les corrections sur les notifications push et l\'avatar public.',1,'Paris',NULL,'34 Avenue Des Champs-Élysées, 75008 Paris, France',48.86996500,2.30816400,300.00,'2026-03-09','08:00:00','2026-03-18',20.00,'17:00:00','termine',24,1,NULL,'2026-03-07 10:24:07','2026-03-08 03:14:56'),(47,26,'bonjour a tous','jour',2,'semaine',40,15.00,'sur_site','bonjour a tous','Fin de mission globale : Lorsqu\'un client marque la prestation d\'un candidat comme terminée, le système vérifie si d\'autres candidats sont encore en poste. S\'il s\'agissait du dernier candidat actif, la mission est automatiquement marquée comme termine globalement.\n',1,'Corte',NULL,'34 Avenue De La République, 20250 Corte, France',NULL,NULL,600.00,'2026-03-09','08:00:00','2026-03-15',40.00,'17:00:00','ouvert',NULL,1,NULL,'2026-03-08 03:55:45','2026-03-08 03:55:45'),(48,28,'Mission BTP','jour',2,'semaine',40,15.00,'sur_site','Mission BTP','Correction des données existantes : J\'ai exécuté une commande pour synchroniser les photos des utilisateurs actuels qui ne s\'affichaient pas (comme pour Thierry et Ulrich).\n',1,'Paris',NULL,'10 Rue Du Colisée, 75008 Paris, France',48.87055600,2.30798600,600.00,'2026-03-10','08:00:00','2026-03-16',40.00,'17:00:00','termine',27,1,NULL,'2026-03-08 19:55:54','2026-03-08 23:30:04'),(49,28,'babana fatigeue','jour',2,'semaine',46,20.00,'sur_site','babana fatigeue','Comme les serveurs sont en mode \"dev\", la correction est déjà active ! Tu as juste à rafraîchir la page de ton compte client sur ton navigateur, et le badge global apparaîtra bien dans le menu de gauche sous tes autres statistiques.\n\n',1,'Paris',NULL,'10 Rue Du Colisée, 75008 Paris, France',48.87055600,2.30798600,1051.43,'2026-03-10','08:00:00','2026-03-17',52.57,'17:00:00','ouvert',NULL,1,NULL,'2026-03-08 23:16:58','2026-03-08 23:16:58'),(50,28,'babana fatigeue','jour',2,'semaine',46,20.00,'sur_site','babana fatigeue','Comme les serveurs sont en mode \"dev\", la correction est déjà active ! Tu as juste à rafraîchir la page de ton compte client sur ton navigateur, et le badge global apparaîtra bien dans le menu de gauche sous tes autres statistiques.\n\n',1,'Paris',NULL,'10 Rue Du Colisée, 75008 Paris, France',48.87055600,2.30798600,1051.43,'2026-03-10','08:00:00','2026-03-17',52.57,'17:00:00','termine',27,1,NULL,'2026-03-08 23:18:53','2026-03-08 23:31:03');
/*!40000 ALTER TABLE `missions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('info','success','warning','error') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'info',
  `related_id` int DEFAULT NULL,
  `category` enum('system','mission','message','payment','verification','account','support') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'system',
  `is_read` tinyint(1) DEFAULT '0',
  `action_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=304 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (4,1,'👋 Bienvenue !','Bonjour et bienvenue sur NettmobFrance ! Merci de faire partie de notre communauté.','success',NULL,'system',1,NULL,'2025-11-04 18:47:16','2025-11-13 15:08:44'),(5,1,'👋 Bonjour à tous !','Bonjour à tous les utilisateurs de NettmobFrance ! Nous espérons que vous passez une excellente journée.','info',NULL,'system',1,'/missions','2025-11-04 22:57:02','2025-11-13 15:08:44'),(28,1,'📋 Nouvelle demande de vérification','Thierry Ninja (Automob) a soumis une demande de vérification d\'identité','warning',NULL,'verification',1,'/admin/verification','2025-11-10 07:43:19','2025-11-13 15:08:44'),(61,24,'🎉 Bienvenue sur NettmobFrance !','Votre compte a été créé avec succès ! Complétez votre profil et vérifiez votre identité pour accéder à toutes les fonctionnalités.','success',NULL,'account',1,'/automob/profile','2025-11-12 07:57:57','2025-11-12 12:01:07'),(62,24,'🆔 Vérification d\'identité requise','Pour accéder à toutes les fonctionnalités, veuillez vérifier votre identité d\'auto-entrepreneur. Documents acceptés : Carte ID, Passeport, Permis.','warning',NULL,'verification',1,'/automob/verify-identity','2025-11-12 07:57:57','2025-11-12 12:01:07'),(63,24,'🎉 Bienvenue sur NettmobFrance !','Votre email a été vérifié avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités de la plateforme.','success',NULL,'account',1,'/automob/dashboard','2025-11-12 07:58:06','2025-11-12 12:01:07'),(64,25,'🎉 Bienvenue sur NettmobFrance !','Votre email a été vérifié avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités de la plateforme.','success',NULL,'account',1,'/automob/dashboard','2025-11-12 08:53:50','2025-11-18 23:33:06'),(65,25,'🎉 Bienvenue sur NettmobFrance !','Votre compte a été créé avec succès ! Complétez votre profil et vérifiez votre identité pour accéder à toutes les fonctionnalités.','success',NULL,'account',1,'/automob/profile','2025-11-12 08:54:10','2025-11-18 23:33:06'),(66,25,'🆔 Vérification d\'identité requise','Pour accéder à toutes les fonctionnalités, veuillez vérifier votre identité d\'auto-entrepreneur. Documents acceptés : Carte ID, Passeport, Permis.','warning',NULL,'verification',1,'/automob/verify-identity','2025-11-12 08:54:10','2025-11-18 23:33:06'),(67,1,'📋 Nouvelle demande de vérification','Patrice Raoul Geoffroy (Automob) a soumis une demande de vérification d\'identité','warning',NULL,'verification',1,'/admin/verification','2025-11-12 11:18:28','2025-11-13 15:08:44'),(68,1,'📋 Nouvelle demande de vérification','Patrice Raoul Geoffroy (Automob) a soumis une demande de vérification d\'identité','warning',NULL,'verification',1,'/admin/verification','2025-11-12 11:19:06','2025-11-13 15:08:44'),(69,24,'✅ Identité vérifiée','Félicitations ! Votre identité a été vérifiée avec succès. Vous avez maintenant accès à toutes les fonctionnalités.','success',NULL,'verification',1,'/automob/profile','2025-11-12 16:43:01','2025-11-14 15:54:32'),(70,1,'👋 Bonjour à tous !','Bonjour à tous les utilisateurs de NettmobFrance ! Nous espérons que vous passez une excellente journée.','info',NULL,'system',1,'/lio','2025-11-13 11:27:51','2025-11-13 15:08:44'),(71,24,'👋 Bonjour à tous !','Bonjour à tous les utilisateurs de NettmobFrance ! Nous espérons que vous passez une excellente journée.','info',NULL,'system',1,'/lio','2025-11-13 11:27:51','2025-11-14 15:54:32'),(72,25,'👋 Bonjour à tous !','Bonjour à tous les utilisateurs de NettmobFrance ! Nous espérons que vous passez une excellente journée.','info',NULL,'system',1,'/lio','2025-11-13 11:27:51','2025-11-18 23:33:06'),(73,24,'🧪 Test Notification Admin','Ceci est un test du système de notifications. Si vous voyez ce message, tout fonctionne ! Envoyé à 13:18:39','info',NULL,'system',1,'/notifications','2025-11-13 12:18:45','2025-11-14 15:54:32'),(74,1,'👋 Bonjour à tous !','Bonjour à tous les utilisateurs de NettmobFrance ! Nous espérons que vous passez une excellente journée.','info',NULL,'system',1,'/jkouihjhjhjh','2025-11-13 15:08:22','2025-11-13 15:08:44'),(75,24,'👋 Bonjour à tous !','Bonjour à tous les utilisateurs de NettmobFrance ! Nous espérons que vous passez une excellente journée.','info',NULL,'system',1,'/jkouihjhjhjh','2025-11-13 15:08:22','2025-11-14 15:54:32'),(76,25,'👋 Bonjour à tous !','Bonjour à tous les utilisateurs de NettmobFrance ! Nous espérons que vous passez une excellente journée.','info',NULL,'system',1,'/jkouihjhjhjh','2025-11-13 15:08:22','2025-11-18 23:33:06'),(77,26,'🎉 Bienvenue sur NettmobFrance !','Votre compte a été créé avec succès ! Complétez votre profil et vérifiez votre identité pour accéder à toutes les fonctionnalités.','success',NULL,'account',1,'/client/profile','2025-11-14 01:09:56','2025-11-14 14:39:32'),(78,26,'🆔 Vérification d\'identité requise','Pour accéder à toutes les fonctionnalités, veuillez vérifier votre identité de gérant. Documents acceptés : Carte ID, Passeport, Permis.','warning',NULL,'verification',1,'/client/verify-identity','2025-11-14 01:09:57','2025-11-14 14:39:32'),(79,26,'🎉 Bienvenue sur NettmobFrance !','Votre email a été vérifié avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités de la plateforme.','success',NULL,'account',1,'/client/dashboard','2025-11-14 01:10:09','2025-11-14 14:39:32'),(80,26,'⏳ Demande en cours de traitement','Votre demande de vérification d\'identité a été soumise avec succès. Nos équipes l\'examineront sous 24-48 heures.','info',NULL,'verification',1,'/client/verify-identity','2025-11-14 01:12:02','2025-11-14 14:39:32'),(81,1,'📋 Nouvelle demande de vérification','Mounchili thierry (Client) a soumis une demande de vérification d\'identité','warning',NULL,'verification',1,'/admin/verifications-new','2025-11-14 01:12:02','2025-11-15 15:32:36'),(82,24,'✅ Identité vérifiée','Votre identité a été approuvée. Vous avez maintenant accès à toutes les fonctionnalités.','success',NULL,'verification',1,'/automob/profile','2025-11-14 10:43:57','2025-11-14 15:54:32'),(83,26,'✅ Identité vérifiée','Votre identité a été approuvée. Vous avez maintenant accès à toutes les fonctionnalités.','success',NULL,'verification',1,'/client/profile','2025-11-14 10:43:58','2025-11-14 14:39:32'),(84,26,'✅ Mission publiée avec succès','Votre mission \"hhjhjhhj hjhb  jh jh jh jh\" a été publiée et 0 automobs qualifiés ont été notifiés (0 Web Push + 0 emails envoyés)','success',NULL,'mission',1,'/client/missions/9','2025-11-14 14:38:44','2025-11-14 14:39:32'),(85,1,'🔧 Maintenance programmée','Une maintenance de la plateforme est prévue ce weekend. Le service sera temporairement indisponible.','warning',NULL,'system',1,NULL,'2025-11-14 15:56:55','2025-11-15 15:32:36'),(86,24,'🔧 Maintenance programmée','Une maintenance de la plateforme est prévue ce weekend. Le service sera temporairement indisponible.','warning',NULL,'system',1,NULL,'2025-11-14 15:56:55','2025-11-14 19:30:54'),(87,25,'🔧 Maintenance programmée','Une maintenance de la plateforme est prévue ce weekend. Le service sera temporairement indisponible.','warning',NULL,'system',1,NULL,'2025-11-14 15:56:55','2025-11-18 23:33:06'),(88,26,'🔧 Maintenance programmée','Une maintenance de la plateforme est prévue ce weekend. Le service sera temporairement indisponible.','warning',NULL,'system',1,NULL,'2025-11-14 15:56:55','2025-11-14 19:28:11'),(89,1,'💰 Programme de parrainage','Nouveau : parrainez vos amis et gagnez des récompenses ! En savoir plus dans votre profil.','info',NULL,'mission',1,'/lio','2025-11-14 19:19:44','2025-11-15 15:32:36'),(90,24,'💰 Programme de parrainage','Nouveau : parrainez vos amis et gagnez des récompenses ! En savoir plus dans votre profil.','info',NULL,'mission',1,'/lio','2025-11-14 19:19:44','2025-11-14 19:30:54'),(91,25,'💰 Programme de parrainage','Nouveau : parrainez vos amis et gagnez des récompenses ! En savoir plus dans votre profil.','info',NULL,'mission',1,'/lio','2025-11-14 19:19:44','2025-11-18 23:33:06'),(92,26,'💰 Programme de parrainage','Nouveau : parrainez vos amis et gagnez des récompenses ! En savoir plus dans votre profil.','info',NULL,'mission',1,'/lio','2025-11-14 19:19:44','2025-11-14 19:28:11'),(93,26,'✅ Mission publiée avec succès','Votre mission \"mission nettoyage boss\" a été publiée et 0 automobs qualifiés ont été notifiés (0 Web Push + 0 emails envoyés)','success',NULL,'mission',1,'/client/missions/10','2025-11-14 19:29:40','2025-11-15 15:11:37'),(94,1,'💰 Programme de parrainage','Nouveau : parrainez vos amis et gagnez des récompenses ! En savoir plus dans votre profil.','info',NULL,'account',1,'/lio','2025-11-15 11:07:51','2025-11-15 15:32:36'),(95,24,'💰 Programme de parrainage','Nouveau : parrainez vos amis et gagnez des récompenses ! En savoir plus dans votre profil.','info',NULL,'account',1,'/lio','2025-11-15 11:07:51','2025-11-15 14:48:02'),(96,25,'💰 Programme de parrainage','Nouveau : parrainez vos amis et gagnez des récompenses ! En savoir plus dans votre profil.','info',NULL,'account',1,'/lio','2025-11-15 11:07:51','2025-11-18 23:33:06'),(97,26,'💰 Programme de parrainage','Nouveau : parrainez vos amis et gagnez des récompenses ! En savoir plus dans votre profil.','info',NULL,'account',1,'/lio','2025-11-15 11:07:51','2025-11-15 15:11:37'),(98,25,'🙏 Merci pour votre contribution !','Votre avis nous a été précieux pour améliorer NettMobFrance. Merci de votre confiance et de votre engagement !','success',NULL,'system',1,'/dashboard','2025-11-15 15:09:38','2025-11-18 23:33:06'),(99,26,'🙏 Merci pour votre contribution !','Votre avis nous a été précieux pour améliorer NettMobFrance. Merci de votre confiance et de votre engagement !','success',NULL,'system',1,'/dashboard','2025-11-15 15:09:42','2025-11-15 15:11:37'),(100,25,'🙏 Merci pour votre contribution !','Votre avis nous a été précieux pour améliorer NettMobFrance. Merci de votre confiance et de votre engagement !','success',NULL,'system',1,'/dashboard','2025-11-15 15:19:48','2025-11-18 23:33:06'),(101,1,'🎉 Nouvelle fonctionnalité','Une nouvelle fonctionnalité est maintenant disponible sur la plateforme. Découvrez-la dès maintenant !','success',NULL,'system',1,'/jkouihjhjhjh','2025-11-15 15:34:29','2025-11-18 12:32:37'),(102,24,'🎉 Nouvelle fonctionnalité','Une nouvelle fonctionnalité est maintenant disponible sur la plateforme. Découvrez-la dès maintenant !','success',NULL,'system',1,'/jkouihjhjhjh','2025-11-15 15:34:29','2025-11-15 15:48:59'),(103,25,'🎉 Nouvelle fonctionnalité','Une nouvelle fonctionnalité est maintenant disponible sur la plateforme. Découvrez-la dès maintenant !','success',NULL,'system',1,'/jkouihjhjhjh','2025-11-15 15:34:29','2025-11-18 23:33:06'),(104,26,'🎉 Nouvelle fonctionnalité','Une nouvelle fonctionnalité est maintenant disponible sur la plateforme. Découvrez-la dès maintenant !','success',NULL,'system',1,'/jkouihjhjhjh','2025-11-15 15:34:29','2025-11-15 20:27:16'),(105,24,'🎉 Nouvelle fonctionnalité','Une nouvelle fonctionnalité est maintenant disponible sur la plateforme. Découvrez-la dès maintenant !','success',NULL,'mission',1,'/jkouihjhjhjh','2025-11-15 15:35:20','2025-11-15 15:48:59'),(106,25,'🎉 Nouvelle fonctionnalité','Une nouvelle fonctionnalité est maintenant disponible sur la plateforme. Découvrez-la dès maintenant !','success',NULL,'mission',1,'/jkouihjhjhjh','2025-11-15 15:35:20','2025-11-18 23:33:06'),(107,25,'🧪 Test Socket.io 1763221659643','Message de test pour ulrichthierry47@gmail.com - Toast + Notification système','info',NULL,'system',1,'/dashboard','2025-11-15 15:47:39','2025-11-18 23:33:06'),(108,26,'🔔 Notifications activées !','Merci Mounchili d\'avoir activé les notifications ! Vous recevrez désormais des alertes pour les nouvelles opportunités et mises à jour importantes.','success',NULL,'system',1,'/client/dashboard','2025-11-15 16:06:51','2025-11-15 20:27:16'),(109,26,'⏰ Feuille de temps à approuver','Nouvelle feuille de temps pour \"mission nettoyage boss\" - 45.00h','warning',NULL,'mission',1,'/client/timesheet/5','2025-11-15 17:09:15','2025-11-15 20:27:16'),(110,24,'📤 Feuille de temps envoyée','Votre feuille de temps pour \"mission nettoyage boss\" a été envoyée au client - En attente d\'approbation','info',NULL,'mission',1,'/automob/my-missions','2025-11-15 17:09:19','2025-11-16 00:20:56'),(111,24,'✅ Feuille de temps approuvée','Votre feuille de temps a été approuvée - 45.00h = 810.00€','success',NULL,'payment',1,'/automob/wallet','2025-11-15 17:14:47','2025-11-16 00:20:56'),(112,24,'✅ Feuille de temps approuvée','Votre feuille de temps a été approuvée - 8.00h = 144.00€','success',NULL,'payment',1,'/automob/wallet','2025-11-15 19:06:24','2025-11-16 00:20:56'),(113,24,'🎉 Mission terminée !','Félicitations ! Le client a marqué la mission \"mission nettoyage boss\" comme terminée.','success',NULL,'mission',1,'/automob/my-missions','2025-11-15 20:00:29','2025-11-16 00:20:56'),(114,24,'⭐ Nouvel avis reçu !','Le client vous a laissé un avis 4/5 étoiles pour la mission \"mission nettoyage boss\"','success',NULL,'mission',1,'/automob/reviews','2025-11-15 20:00:31','2025-11-16 00:20:56'),(115,24,'📄 Nouvelle facture générée','Votre facture FA-202511-8474 de 954.00€ a été générée pour la mission \"mission nettoyage boss\"','success',NULL,'payment',1,'/automob/invoices','2025-11-15 20:49:21','2025-11-16 00:20:56'),(116,26,'📄 Nouvelle facture générée','Votre facture FC-202511-7338 de 1144.80€ a été générée pour la mission \"mission nettoyage boss\"','info',NULL,'payment',1,'/client/invoices','2025-11-15 20:49:29','2025-11-18 18:57:38'),(117,24,'💰 Demande de retrait envoyée','Votre demande de retrait de 500.00€ a été envoyée. Elle sera traitée sous 48h.','info',NULL,'payment',1,'/automob/wallet','2025-11-16 00:10:29','2025-11-16 00:20:56'),(118,1,'💰 Nouvelle demande de retrait','Patrice Raoul Geoffroy a demandé un retrait de 500.00€','warning',NULL,'payment',1,'/admin/wallet-management','2025-11-16 00:10:37','2025-11-18 12:32:37'),(119,24,'✅ Retrait approuvé','Votre demande de retrait de 500.00€ a été approuvée. Le virement sera effectué sous 3-5 jours ouvrés.','success',NULL,'payment',1,'/automob/wallet','2025-11-16 00:16:49','2025-11-16 00:20:56'),(120,26,'Nouveau litige','Un litige a été créé concernant la mission \"hhjhjhhj hjhb  jh jh jh jh\"','warning',3,'mission',1,NULL,'2025-11-16 01:09:28','2025-11-18 18:57:38'),(121,1,'Nouveau litige à traiter','Un litige a été créé par un automob concernant la mission \"hhjhjhhj hjhb  jh jh jh jh\"','warning',3,'system',1,NULL,'2025-11-16 01:09:28','2025-11-18 12:32:37'),(122,24,'Litige résolu','Le litige #3 a été résolu. Décision: automob','success',3,'mission',1,NULL,'2025-11-16 07:49:37','2025-11-18 16:02:51'),(123,26,'Litige résolu','Le litige #3 a été résolu. Décision: automob','success',3,'mission',1,NULL,'2025-11-16 07:49:37','2025-11-18 18:57:38'),(124,25,'💰 Fonds ajoutés','70.00€ ont été ajoutés à votre wallet. Raison: kbbbjkbjjbj','success',NULL,'payment',1,'/automob/wallet','2025-11-16 10:07:45','2025-11-18 23:33:06'),(125,25,'⚠️ Fonds soustraits','1000.00€ ont été soustraits de votre wallet. Raison: buiobuiouiohio','warning',NULL,'payment',1,'/automob/wallet','2025-11-16 10:08:00','2025-11-18 23:33:06'),(126,24,'🔄 Wallet remis à zéro','Votre wallet a été remis à zéro (ancien solde: 1254.00€). Raison: jbbbubbbuib','warning',NULL,'payment',1,'/automob/wallet','2025-11-16 10:08:12','2025-11-18 16:02:51'),(127,1,'👋 Bonjour à tous !','Bonjour à tous les utilisateurs de NettmobFrance ! Nous espérons que vous passez une excellente journée.','info',NULL,'system',1,NULL,'2025-11-18 12:28:46','2025-11-18 12:32:37'),(128,24,'👋 Bonjour à tous !','Bonjour à tous les utilisateurs de NettmobFrance ! Nous espérons que vous passez une excellente journée.','info',NULL,'system',1,NULL,'2025-11-18 12:28:46','2025-11-18 16:02:51'),(129,25,'👋 Bonjour à tous !','Bonjour à tous les utilisateurs de NettmobFrance ! Nous espérons que vous passez une excellente journée.','info',NULL,'system',1,NULL,'2025-11-18 12:28:46','2025-11-18 23:33:06'),(130,26,'👋 Bonjour à tous !','Bonjour à tous les utilisateurs de NettmobFrance ! Nous espérons que vous passez une excellente journée.','info',NULL,'system',1,NULL,'2025-11-18 12:28:46','2025-11-18 18:57:38'),(131,24,'💬 Nouvelle réponse support','Un admin a répondu à votre ticket: hdhsdjhhjsdhjd','info',NULL,'support',1,'/automob/support/1','2025-11-18 22:58:51','2025-11-18 23:29:06'),(132,1,'💬 Nouveau message support','mounchilithierry432@gmail.com a répondu au ticket: hdhsdjhhjsdhjd','info',NULL,'support',1,'/admin/support/1','2025-11-18 23:00:17','2025-11-18 23:03:06'),(133,1,'💬 Nouveau message support','mounchilithierry432@gmail.com a répondu au ticket: hdhsdjhhjsdhjd','info',NULL,'support',1,'/admin/support/1','2025-11-18 23:01:00','2025-11-18 23:03:06'),(134,24,'💬 Nouvelle réponse support','Un admin a répondu à votre ticket: hdhsdjhhjsdhjd','info',NULL,'support',1,'/automob/support/1','2025-11-18 23:01:51','2025-11-18 23:29:06'),(135,24,'💬 Nouvelle réponse support','Un admin a répondu à votre ticket: hdhsdjhhjsdhjd','info',NULL,'support',1,'/automob/support/1','2025-11-18 23:02:10','2025-11-18 23:29:06'),(136,24,'📋 Statut ticket mis à jour','Votre ticket \"hdhsdjhhjsdhjd\" est maintenant: resolved','info',NULL,'support',1,'/admin/support/1','2025-11-18 23:03:40','2025-11-18 23:29:06'),(137,24,'📋 Statut ticket mis à jour','Votre ticket \"hdhsdjhhjsdhjd\" est maintenant: resolved','info',NULL,'support',1,'/admin/support/1','2025-11-18 23:03:42','2025-11-18 23:29:06'),(138,24,'📋 Statut ticket mis à jour','Votre ticket \"hdhsdjhhjsdhjd\" est maintenant: closed','info',NULL,'support',1,'/admin/support/1','2025-11-18 23:04:00','2025-11-18 23:29:06'),(139,24,'📋 Statut ticket mis à jour','Votre ticket \"hdhsdjhhjsdhjd\" est maintenant: closed','info',NULL,'support',1,'/admin/support/1','2025-11-18 23:04:01','2025-11-18 23:29:06'),(140,24,'📋 Statut ticket mis à jour','Votre ticket \"hdhsdjhhjsdhjd\" est maintenant: closed','info',NULL,'support',1,'/admin/support/1','2025-11-18 23:04:03','2025-11-18 23:29:06'),(141,25,'⏳ Demande en cours de traitement','Votre demande de vérification d\'identité a été soumise avec succès. Nos équipes l\'examineront sous 24-48 heures.','info',NULL,'verification',1,'/automob/verify-identity','2025-11-18 23:36:49','2025-11-18 23:38:15'),(142,1,'📋 Nouvelle demande de vérification','Patrice Geoffroy (Automob) a soumis une demande de vérification d\'identité','warning',NULL,'verification',1,'/admin/verifications-new','2025-11-18 23:36:51','2025-11-18 23:37:58'),(143,25,'✅ Identité vérifiée','Félicitations ! Votre identité a été vérifiée avec succès. Vous avez maintenant accès à toutes les fonctionnalités.','success',NULL,'verification',1,'/automob/profile','2025-11-18 23:37:41','2025-11-18 23:38:15'),(144,26,'✅ Mission publiée avec succès','Votre mission \"Besoin de chef\" a été publiée et 0 automobs qualifiés ont été notifiés (0 Web Push + 0 emails envoyés)','success',NULL,'mission',1,'/client/missions/11','2025-11-18 23:40:43','2025-11-19 07:35:21'),(145,25,'🎯 Nouvelle mission disponible','Besoin de chef de patrouille - 18.00€/h à Paris. Cliquez pour voir les détails !','info',NULL,'mission',1,'/automob/missions/12','2025-11-19 07:37:12','2025-11-19 15:58:30'),(146,26,'✅ Mission publiée avec succès','Votre mission \"Besoin de chef de patrouille\" a été publiée et 1 automobs qualifiés ont été notifiés (0 Web Push + 1 emails envoyés)','success',NULL,'mission',1,'/client/missions/12','2025-11-19 07:39:21','2025-11-19 20:25:25'),(147,25,'🎯 Nouvelle mission disponible','Besoin de chef bla bla - 18.00€/h à Paris. Cliquez pour voir les détails !','info',NULL,'mission',1,'/automob/missions/14','2025-11-19 10:20:46','2025-11-19 15:58:30'),(148,26,'✅ Mission publiée avec succès','Votre mission \"Besoin de chef bla bla\" a été publiée et 1 automobs qualifiés ont été notifiés (1 Web Push + 1 emails + 0 SMS envoyés)','success',NULL,'mission',1,'/client/missions/14','2025-11-19 10:21:05','2025-11-19 20:25:25'),(149,25,'🎯 Nouvelle mission disponible','bak bababbaa - 18.00€/h à Paris. Cliquez pour voir les détails !','info',NULL,'mission',1,'/automob/missions/15','2025-11-19 11:29:50','2025-11-19 13:53:50'),(150,26,'✅ Mission publiée avec succès','Votre mission \"bak bababbaa\" a été publiée et 1 automobs qualifiés ont été notifiés (1 Web Push + 1 emails + 1 SMS envoyés)','success',NULL,'mission',1,'/client/missions/15','2025-11-19 11:30:02','2025-11-19 20:25:25'),(151,1,'💬 Nouveau ticket support','Raymond Salazar a créé un ticket: test','info',NULL,'support',1,'/admin/support/2','2025-11-19 13:55:20','2026-03-03 23:55:41'),(152,25,'💬 Nouvelle réponse support','Un admin a répondu à votre ticket: test','info',NULL,'support',1,'/automob/support/2','2025-11-19 14:08:15','2025-11-19 15:58:30'),(153,25,'💬 Nouvelle réponse support','Un admin a répondu à votre ticket: test','info',NULL,'support',1,'/automob/support/2','2025-11-19 14:09:22','2025-11-19 15:58:30'),(154,25,'💬 Nouvelle réponse support','Un admin a répondu à votre ticket: test','info',NULL,'support',1,'/automob/support/2','2025-11-19 14:09:48','2025-11-19 15:58:30'),(155,25,'💬 Nouvelle réponse support','Un admin a répondu à votre ticket: test','info',NULL,'support',1,'/automob/support/2','2025-11-19 15:42:53','2025-11-19 15:58:30'),(156,1,'💬 Nouveau message support','Raymond Salazar a répondu au ticket: test','info',NULL,'support',1,'/admin/support/2','2025-11-19 15:44:17','2026-03-03 23:55:41'),(157,1,'💬 Nouveau message support','Raymond Salazar a répondu au ticket: test','info',NULL,'support',1,'/admin/support/2','2025-11-19 15:58:00','2026-03-03 23:55:41'),(158,1,'💬 Nouveau message support','Raymond Salazar a répondu au ticket: test','info',NULL,'support',1,'/admin/support/2','2025-11-19 16:08:28','2026-03-03 23:55:41'),(159,1,'💬 Nouveau message support','Raymond Salazar a répondu au ticket: test','info',NULL,'support',1,'/admin/support/2','2025-11-19 16:11:00','2026-03-03 23:55:41'),(160,1,'💬 Nouveau message support','Raymond Salazar a répondu au ticket: test','info',NULL,'support',1,'/admin/support/2','2025-11-19 16:55:14','2026-03-03 23:55:41'),(161,1,'💬 Nouveau message support','Raymond Salazar a répondu au ticket: test','info',NULL,'support',1,'/admin/support/2','2025-11-19 19:21:46','2026-03-03 23:55:41'),(162,1,'💬 Nouveau message support','Raymond Salazar a répondu au ticket: test','info',NULL,'support',1,'/admin/support/2','2025-11-19 19:23:08','2026-03-03 23:55:41'),(163,1,'💬 Nouveau message support','Raymond Salazar a répondu au ticket: test','info',NULL,'support',1,'/admin/support/2','2025-11-19 19:24:42','2026-03-03 23:55:41'),(164,1,'💬 Nouveau message support','Raymond Salazar a répondu au ticket: test','info',NULL,'support',1,'/admin/support/2','2025-11-19 19:26:53','2026-03-03 23:55:41'),(165,25,'💬 Nouvelle réponse support','Un admin a répondu à votre ticket: test','info',NULL,'support',1,'/automob/support/2','2025-11-19 19:57:28','2025-11-20 09:58:15'),(166,1,'💬 Nouveau message support','Raymond Salazar a répondu au ticket: test','info',NULL,'support',1,'/admin/support/2','2025-11-19 20:03:06','2026-03-03 23:55:41'),(167,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"bababa bababa bababa\" - 22€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/16','2025-11-19 20:16:07','2025-11-20 09:58:15'),(168,26,'✅ Mission publiée avec succès','Votre mission \"bababa bababa bababa\" a été publiée et 1 automobs qualifiés ont été notifiés (1 Web Push + 1 emails + 1 SMS envoyés)','success',NULL,'mission',1,'/client/missions/16','2025-11-19 20:16:24','2025-11-19 20:25:25'),(169,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"bonjour paris\" - 18€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/17','2025-11-19 20:35:09','2025-11-20 09:58:15'),(170,26,'✅ Mission publiée avec succès','Votre mission \"bonjour paris\" a été publiée et 1 automobs qualifiés ont été notifiés (1 Web Push + 1 emails + 1 SMS envoyés)','success',NULL,'mission',1,'/client/missions/17','2025-11-19 20:35:25','2025-11-19 20:54:47'),(171,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"Besoin de chef bla bla\" - 18€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/18','2025-11-19 22:34:20','2025-11-20 09:58:15'),(172,26,'✅ Mission publiée avec succès','Votre mission \"Besoin de chef bla bla\" a été publiée et 1 automobs qualifiés ont été notifiés (1 Web Push + 1 emails + 1 SMS envoyés)','success',NULL,'mission',1,'/client/missions/18','2025-11-19 22:34:34','2025-11-20 04:54:33'),(173,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"mission nettoyage boss\" - 18.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/10','2025-11-20 05:29:13','2025-11-20 09:58:15'),(174,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"mission nettoyage boss\" - 18.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/10','2025-11-20 05:46:08','2025-11-20 09:58:15'),(175,26,'✅ Mission publiée avec succès','Votre mission \"boss lady\" a été publiée et 0 automobs qualifiés ont été notifiés (0 Web Push + 0 emails + 0 SMS envoyés)','success',NULL,'mission',1,'/client/missions/19','2025-11-20 05:47:27','2025-11-20 10:07:25'),(176,25,'🆕 Nouvelle mission disponible !','Mission \"boss lady\" disponible à France (20.00€/h)','info',NULL,'mission',1,'/automob/missions/19','2025-11-20 08:00:45','2025-11-20 09:58:15'),(177,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"my lady\" - 15€/h à France. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/20','2025-11-20 08:30:01','2025-11-20 09:58:15'),(178,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"my lady\" - 18€/h à France. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/21','2025-11-20 08:33:33','2025-11-20 09:58:15'),(179,26,'✅ Mission publiée avec succès','Votre mission \"my lady\" a été publiée et 1 automobs qualifiés ont été notifiés (0 Web Push + 1 emails + 0 SMS envoyés)','success',NULL,'mission',1,'/client/missions/20','2025-11-20 08:34:25','2025-11-20 10:07:25'),(180,26,'✅ Mission publiée avec succès','Votre mission \"my lady\" a été publiée et 1 automobs qualifiés ont été notifiés (0 Web Push + 1 emails + 0 SMS envoyés)','success',NULL,'mission',1,'/client/missions/21','2025-11-20 08:37:17','2025-11-20 10:07:25'),(181,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"Besoin de chef bla bla\" - 18.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/18','2025-11-20 08:59:09','2025-11-20 09:58:15'),(182,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"besoin d\'un chauffeur\" - 18€/h à France. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/22','2025-11-20 09:00:42','2025-11-20 09:58:15'),(183,26,'✅ Mission publiée avec succès','Votre mission \"besoin d\'un chauffeur\" a été publiée et 1 automobs qualifiés ont été notifiés (0 Web Push + 1 emails + 0 SMS envoyés)','success',NULL,'mission',1,'/client/missions/22','2025-11-20 09:01:00','2025-11-20 10:07:25'),(184,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"besoin d\'un sapeur\" - 15€/h à France. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/23','2025-11-20 09:31:14','2025-11-20 09:58:15'),(185,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"besoin d\'un sapeur\" - 15€/h à France. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/24','2025-11-20 09:31:45','2025-11-20 09:58:15'),(186,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"hhjhjhhj hjhb  jh jh jh jh\" - 18.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/9','2025-11-20 09:34:10','2025-11-20 09:58:15'),(187,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"hhjhjhhj hjhb  jh jh jh jh\" - 18.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/9','2025-11-20 09:34:40','2025-11-20 09:58:15'),(188,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"rechercher\" - 18€/h à France. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/25','2025-11-20 09:35:26','2025-11-20 09:58:15'),(189,26,'✅ Mission publiée avec succès','Votre mission \"besoin d\'un sapeur\" a été publiée et 1 automobs qualifiés ont été notifiés (0 Web Push + 1 emails + 0 SMS envoyés)','success',NULL,'mission',1,'/client/missions/23','2025-11-20 09:35:30','2025-11-20 10:07:25'),(190,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"rechercher\" - 18€/h à France. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/26','2025-11-20 09:35:54','2025-11-20 09:58:15'),(191,26,'✅ Mission publiée avec succès','Votre mission \"besoin d\'un sapeur\" a été publiée et 1 automobs qualifiés ont été notifiés (0 Web Push + 1 emails + 0 SMS envoyés)','success',NULL,'mission',1,'/client/missions/24','2025-11-20 09:35:56','2025-11-20 10:07:25'),(192,26,'✅ Mission publiée avec succès','Votre mission \"rechercher\" a été publiée et 1 automobs qualifiés ont été notifiés (0 Web Push + 1 emails + 0 SMS envoyés)','success',NULL,'mission',1,'/client/missions/26','2025-11-20 09:38:21','2025-11-20 10:07:25'),(193,26,'✅ Mission publiée avec succès','Votre mission \"rechercher\" a été publiée et 1 automobs qualifiés ont été notifiés (0 Web Push + 1 emails + 0 SMS envoyés)','success',NULL,'mission',1,'/client/missions/25','2025-11-20 09:38:21','2025-11-20 10:07:25'),(194,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"Besoin de vendeur\" - 18€/h à France. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/27','2025-11-20 10:08:03','2025-11-20 10:19:14'),(195,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"Besoin de vendeur\" - 18€/h à France. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/28','2025-11-20 10:08:32','2025-11-20 10:19:14'),(196,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"hhjhjhhj hjhb  jh jh jh jh\" - 18.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/9','2025-11-20 10:23:20','2025-11-20 23:19:32'),(197,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"hhjhjhhj hjhb  jh jh jh jh\" - 18.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/9','2025-11-20 10:29:06','2025-11-20 23:19:32'),(198,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"hhjhjhhj hjhb  jh jh jh jh\" - 18.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/9','2025-11-20 10:29:35','2025-11-20 23:19:32'),(199,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"Besoin de chef\" - 20.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/11','2025-11-20 10:41:34','2025-11-20 23:19:32'),(200,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"Besoin de chef\" - 18.00€/h à France. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/35','2025-11-20 10:54:17','2025-11-20 23:19:32'),(201,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"Besoin de chef\" - 18.00€/h à France. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/35','2025-11-20 11:04:26','2025-11-20 23:19:32'),(202,26,'✅ Mission publiée avec succès','Votre mission \"Besoin de chef\" a été publiée et 1 automobs qualifiés ont été notifiés (0 Web Push + 0 FCM + 0 emails + 0 SMS envoyés)','success',NULL,'mission',1,'/client/missions/35','2025-11-20 11:08:55','2025-11-21 10:22:46'),(203,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"instagram pub\" - 15€/h à Paris. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/36','2025-11-20 23:18:25','2025-11-20 23:19:32'),(204,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"instagram pub\" - 15.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/36','2025-11-20 23:18:27','2025-11-20 23:19:32'),(205,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"instagram pub\" - 15.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/36','2025-11-20 23:18:31','2025-11-20 23:19:32'),(206,26,'✅ Mission publiée avec succès','Votre mission \"instagram pub\" a été publiée et 1 automobs qualifiés ont été notifiés (0 Web Push + 0 FCM + 1 emails + 1 SMS envoyés)','success',NULL,'mission',1,'/client/missions/36','2025-11-20 23:18:35','2025-11-21 10:22:46'),(207,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"instagram pub\" - 15.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/36','2025-11-20 23:18:36','2025-11-20 23:19:32'),(208,26,'✅ Mission publiée avec succès','Votre mission \"love u man\" a été publiée et 0 automobs qualifiés ont été notifiés (0 Web Push + 0 FCM + 0 emails + 0 SMS envoyés)','success',NULL,'mission',1,'/client/missions/37','2025-11-21 00:32:40','2025-11-21 10:22:46'),(209,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"hello miss\" - 18€/h à France. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/38','2025-11-21 00:44:08','2025-11-21 02:45:08'),(210,26,'✅ Mission publiée avec succès','Votre mission \"hello miss\" a été publiée et 1 automobs qualifiés ont été notifiés (0 Web Push + 1 FCM + 1 emails + 0 SMS envoyés)','success',NULL,'mission',1,'/client/missions/38','2025-11-21 00:44:30','2025-11-21 10:22:46'),(211,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"boss lady\" - 20.00€/h à France. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/19','2025-11-21 01:19:22','2025-11-21 02:45:08'),(212,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"boss lady\" - 20.00€/h à France. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/19','2025-11-21 01:25:16','2025-11-21 02:45:08'),(213,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"boss lady\" - 20.00€/h à France. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/19','2025-11-21 01:43:56','2025-11-21 02:45:08'),(214,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"boss lady\" - 20.00€/h à France. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/19','2025-11-21 01:55:38','2025-11-21 02:45:08'),(215,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"boss lady\" - 20.00€/h à France. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/19','2025-11-21 02:05:35','2025-11-21 02:45:08'),(216,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"boss lady\" - 20.00€/h à France. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/19','2025-11-21 02:43:13','2025-11-21 02:45:08'),(217,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"Last one\" - 18€/h à France. Cliquez pour voir les détails et postuler !','info',NULL,'mission',0,'/automob/missions/39','2025-11-21 02:55:34',NULL),(218,26,'✅ Mission publiée avec succès','Votre mission \"Last one\" a été publiée et 1 automobs qualifiés ont été notifiés (0 Web Push + 0 FCM + 1 emails + 0 SMS envoyés)','success',NULL,'mission',1,'/client/missions/39','2025-11-21 02:56:36','2025-11-21 10:22:46'),(219,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"dernier testt\" - 18€/h à Marseille. Cliquez pour voir les détails et postuler !','info',NULL,'mission',0,'/automob/missions/40','2025-11-21 07:39:41',NULL),(220,26,'✅ Mission publiée avec succès','Votre mission \"dernier testt\" a été publiée et 1 automobs qualifiés ont été notifiés (0 Web Push + 0 FCM + 1 emails + 0 SMS envoyés)','success',NULL,'mission',1,'/client/missions/40','2025-11-21 07:39:55','2025-11-21 10:22:46'),(221,26,'✅ Mission publiée avec succès','Votre mission \"test fatiguer\" a été publiée et 0 automobs qualifiés ont été notifiés (0 Web Push + 0 FCM + 0 emails + 0 SMS envoyés)','success',NULL,'mission',1,'/client/missions/41','2025-11-21 08:10:48','2025-11-21 10:22:46'),(222,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"Besoin de chef\" - 18€/h à Marseille. Cliquez pour voir les détails et postuler !','info',NULL,'mission',0,'/automob/missions/42','2025-11-21 10:22:05',NULL),(223,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"Besoin de chef\" - 18.00€/h à Marseille. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',0,'/automob/missions/42','2025-11-21 10:22:06',NULL),(224,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"Besoin de chef\" - 18.00€/h à Marseille. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',0,'/automob/missions/42','2025-11-21 10:22:09',NULL),(225,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"Besoin de chef\" - 18.00€/h à Marseille. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',0,'/automob/missions/42','2025-11-21 10:22:15',NULL),(226,26,'✅ Mission publiée avec succès','Votre mission \"Besoin de chef\" a été publiée et 1 automobs qualifiés ont été notifiés (0 Web Push + 1 FCM + 1 emails + 0 SMS envoyés)','success',NULL,'mission',1,'/client/missions/42','2025-11-21 10:22:15','2025-11-21 10:22:46'),(227,26,'✅ Mission publiée avec succès','Votre mission \"babana fatigeue\" a été publiée et 0 automobs qualifiés ont été notifiés (0 Web Push + 0 FCM + 0 emails + 0 SMS envoyés)','success',NULL,'mission',1,'/client/missions/43','2025-11-21 11:47:20','2026-03-04 00:35:30'),(228,24,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"1 place des marsellais 94220 Charenton le pont\" - 18€/h à Paris. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/44','2025-11-21 11:48:44','2026-03-07 22:16:47'),(229,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"1 place des marsellais 94220 Charenton le pont\" - 18€/h à Paris. Cliquez pour voir les détails et postuler !','info',NULL,'mission',0,'/automob/missions/44','2025-11-21 11:48:44',NULL),(230,24,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"1 place des marsellais 94220 Charenton le pont\" - 18.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/44','2025-11-21 11:48:45','2026-03-07 22:16:47'),(231,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"1 place des marsellais 94220 Charenton le pont\" - 18.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',0,'/automob/missions/44','2025-11-21 11:48:45',NULL),(232,24,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"1 place des marsellais 94220 Charenton le pont\" - 18.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/44','2025-11-21 11:48:47','2026-03-07 22:16:47'),(233,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"1 place des marsellais 94220 Charenton le pont\" - 18.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',0,'/automob/missions/44','2025-11-21 11:48:47',NULL),(234,26,'✅ Mission publiée avec succès','Votre mission \"1 place des marsellais 94220 Charenton le pont\" a été publiée et 2 automobs qualifiés ont été notifiés (0 Web Push + 2 FCM + 2 emails + 2 SMS envoyés)','success',NULL,'mission',1,'/client/missions/44','2025-11-21 11:48:50','2026-03-04 00:35:30'),(235,24,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"1 place des marsellais 94220 Charenton le pont\" - 18.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/44','2025-11-21 11:48:52','2026-03-07 22:16:47'),(236,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"1 place des marsellais 94220 Charenton le pont\" - 18.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',0,'/automob/missions/44','2025-11-21 11:48:52',NULL),(237,26,'✅ Mission publiée avec succès','Votre mission \"Mission Test Verification\" a été publiée et 0 automobs qualifiés ont été notifiés (0 Web Push + 0 FCM + 0 emails + 0 SMS envoyés)','success',NULL,'mission',1,'/client/missions/45','2025-12-14 13:55:15','2026-03-04 00:35:30'),(238,1,'📄 Nouvelle demande de devis','Demande de devis B2B de Test (Test Inc) pour le secteur Autre.','info',NULL,'system',1,'/admin/messages','2026-03-06 21:03:10','2026-03-08 17:22:06'),(239,1,'📄 Nouvelle demande de devis','Demande de devis B2B de Mounchili thierry (Btp Afrique) pour le secteur Logistique Entrepôt.','info',NULL,'system',1,'/admin/messages','2026-03-06 21:04:37','2026-03-08 17:22:06'),(240,1,'📄 Nouvelle demande de devis','Demande de devis B2B de Ulrich Thierry (Nettmob Test) pour le secteur Nettoyage Industriel.','info',NULL,'system',1,'/admin/messages','2026-03-06 21:14:27','2026-03-08 17:22:06'),(241,1,'📄 Nouvelle demande de devis','Demande de devis B2B de Ulrich Thierry (Nettmob Test Premium) pour le secteur Nettoyage Industriel.','info',NULL,'system',1,'/admin/messages','2026-03-06 21:15:04','2026-03-08 17:22:06'),(242,1,'📄 Nouvelle demande de devis','Demande de devis B2B de Mounchili thierry (Mounchili thierry) pour le secteur Logistique Entrepôt.','info',NULL,'system',1,'/admin/messages','2026-03-06 21:51:02','2026-03-08 17:22:06'),(243,1,'💬 Nouveau ticket support','Mounchili thierry a créé un ticket: kjjkjk kj j jkk j','info',NULL,'support',1,'/admin/support/3','2026-03-06 23:12:23','2026-03-08 17:22:06'),(244,1,'💬 Nouveau message support','Mounchili thierry a répondu au ticket: kjjkjk kj j jkk j','info',NULL,'support',1,'/admin/support/3','2026-03-06 23:12:32','2026-03-08 17:22:06'),(245,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"babana fatigeue\" - 15€/h à Paris. Cliquez pour voir les détails et postuler !','info',NULL,'mission',0,'/automob/missions/46','2026-03-07 10:24:08',NULL),(246,24,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"babana fatigeue\" - 15€/h à Paris. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/46','2026-03-07 10:24:08','2026-03-07 22:16:47'),(247,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"babana fatigeue\" - 15.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',0,'/automob/missions/46','2026-03-07 10:24:10',NULL),(248,24,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"babana fatigeue\" - 15.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/46','2026-03-07 10:24:10','2026-03-07 22:16:47'),(249,24,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"babana fatigeue\" - 15.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/46','2026-03-07 10:24:11','2026-03-07 22:16:47'),(250,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"babana fatigeue\" - 15.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',0,'/automob/missions/46','2026-03-07 10:24:11',NULL),(251,26,'✅ Mission publiée avec succès','Votre mission \"babana fatigeue\" a été publiée et 2 automobs qualifiés ont été notifiés (0 Web Push + 1 FCM + 2 emails + 2 SMS envoyés)','success',NULL,'mission',1,'/client/missions/46','2026-03-07 10:24:16','2026-03-08 00:03:43'),(252,25,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"babana fatigeue\" - 15.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',0,'/automob/missions/46','2026-03-07 10:24:19',NULL),(253,24,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"babana fatigeue\" - 15.00€/h à Paris. Secteur: Logistique – Entrepôt. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/46','2026-03-07 10:24:19','2026-03-07 22:16:47'),(254,24,'🎉 Mission terminée !','Félicitations ! Le client a marqué la mission \"babana fatigeue\" comme terminée.','success',NULL,'mission',1,'/automob/my-missions','2026-03-08 00:07:25','2026-03-08 01:21:05'),(255,24,'⭐ Nouvel avis reçu !','Le client vous a laissé un avis 5/5 étoiles pour la mission \"babana fatigeue\"','success',NULL,'mission',1,'/automob/reviews','2026-03-08 00:07:26','2026-03-08 00:54:04'),(256,24,'🎉 Mission terminée !','La mission \"mission nettoyage boss\" a été marquée comme terminée par le client.','success',NULL,'mission',1,'/automob/my-missions','2026-03-08 00:07:55','2026-03-08 01:21:05'),(257,24,'🎉 Mission terminée !','La mission \"hhjhjhhj hjhb  jh jh jh jh\" a été marquée comme terminée par le client.','success',NULL,'mission',1,'/automob/my-missions','2026-03-08 00:08:08','2026-03-08 01:21:05'),(258,24,'🎉 Mission terminée !','La mission \"babana fatigeue\" a été marquée comme terminée par le client.','success',NULL,'mission',1,'/automob/my-missions','2026-03-08 00:08:19','2026-03-08 01:21:05'),(259,26,'⏰ Feuille de temps à approuver','Nouvelle feuille de temps pour \"babana fatigeue\" - 27.00h','warning',NULL,'mission',1,'/client/timesheet/9','2026-03-08 00:56:17','2026-03-08 03:56:01'),(260,24,'📤 Feuille de temps envoyée','Votre feuille de temps pour \"babana fatigeue\" a été envoyée au client - En attente d\'approbation','info',NULL,'mission',1,'/automob/my-missions','2026-03-08 00:56:17','2026-03-08 01:21:05'),(261,26,'✅ Mission publiée avec succès','Votre mission \"bonjour a tous\" a été publiée et 0 automobs qualifiés ont été notifiés (0 Web Push + 0 FCM + 0 emails + 0 SMS envoyés)','success',NULL,'mission',0,'/client/missions/47','2026-03-08 03:55:47',NULL),(262,24,'📄 Nouvelle facture générée','Votre facture FA-202603-7544 de 405.00€ a été générée pour la mission \"babana fatigeue\"','success',NULL,'payment',0,'/automob/invoices','2026-03-08 03:56:19',NULL),(263,24,'🎉 Mission terminée','Félicitations ! Toutes vos heures pour \"babana fatigeue\" ont été approuvées. La mission est maintenant terminée.','success',NULL,'mission',0,'/automob/invoices','2026-03-08 03:56:23',NULL),(264,24,'📄 Nouvelle facture générée','Votre facture FA-202603-7791 de 405.00€ a été générée pour la mission \"babana fatigeue\"','success',NULL,'payment',1,'/automob/invoices','2026-03-08 03:56:32','2026-03-08 03:59:22'),(265,24,'🎉 Mission terminée !','Félicitations ! Le client a marqué la mission \"babana fatigeue\" comme terminée.','success',NULL,'mission',0,'/automob/my-missions','2026-03-08 03:56:37',NULL),(266,27,'🎉 Bienvenue sur NettmobFrance !','Votre compte a été créé avec succès ! Complétez votre profil et vérifiez votre identité pour accéder à toutes les fonctionnalités.','success',NULL,'account',1,'/automob/profile','2026-03-08 17:37:52','2026-03-08 17:47:59'),(267,27,'🆔 Vérification d\'identité requise','Pour accéder à toutes les fonctionnalités, veuillez vérifier votre identité d\'auto-entrepreneur. Documents acceptés : Carte ID, Passeport, Permis.','warning',NULL,'verification',1,'/automob/verify-identity','2026-03-08 17:37:52','2026-03-08 17:47:59'),(268,27,'🎉 Bienvenue sur NettmobFrance !','Votre email a été vérifié avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités de la plateforme.','success',NULL,'account',1,'/automob/dashboard','2026-03-08 17:39:23','2026-03-08 17:47:59'),(269,27,'⏳ Demande en cours de traitement','Votre demande de vérification d\'identité a été soumise avec succès. Nos équipes l\'examineront sous 24-48 heures.','info',NULL,'verification',1,'/automob/verify-identity','2026-03-08 17:46:48','2026-03-08 17:47:59'),(270,1,'📋 Nouvelle demande de vérification','Thierry Ninja (Automob) a soumis une demande de vérification d\'identité','warning',NULL,'verification',1,'/admin/verifications-new','2026-03-08 17:46:48','2026-03-08 17:58:53'),(271,28,'🎉 Bienvenue sur NettmobFrance !','Votre compte a été créé avec succès ! Complétez votre profil et vérifiez votre identité pour accéder à toutes les fonctionnalités.','success',NULL,'account',1,'/client/profile','2026-03-08 19:32:41','2026-03-08 19:35:19'),(272,28,'🆔 Vérification d\'identité requise','Pour accéder à toutes les fonctionnalités, veuillez vérifier votre identité de gérant. Documents acceptés : Carte ID, Passeport, Permis.','warning',NULL,'verification',1,'/client/verify-identity','2026-03-08 19:32:41','2026-03-08 19:35:19'),(273,28,'🎉 Bienvenue sur NettmobFrance !','Votre email a été vérifié avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités de la plateforme.','success',NULL,'account',1,'/client/dashboard','2026-03-08 19:33:16','2026-03-08 19:35:19'),(274,28,'⏳ Demande en cours de traitement','Votre demande de vérification d\'identité a été soumise avec succès. Nos équipes l\'examineront sous 24-48 heures.','info',NULL,'verification',1,'/client/verify-identity','2026-03-08 19:34:46','2026-03-08 19:35:19'),(275,1,'📋 Nouvelle demande de vérification','Henry Durant (Client) a soumis une demande de vérification d\'identité','warning',NULL,'verification',1,'/admin/verifications-new','2026-03-08 19:34:46','2026-03-08 19:53:45'),(276,28,'✅ Identité vérifiée','Félicitations ! Votre identité a été vérifiée avec succès. Vous avez maintenant accès à toutes les fonctionnalités.','success',NULL,'verification',1,'/client/profile','2026-03-08 19:42:33','2026-03-08 19:54:07'),(277,27,'✅ Identité vérifiée','Félicitations ! Votre identité a été vérifiée avec succès. Vous avez maintenant accès à toutes les fonctionnalités.','success',NULL,'verification',0,'/automob/profile','2026-03-08 19:53:39',NULL),(278,27,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"Mission BTP\" - 15€/h à Paris. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/48','2026-03-08 19:55:55','2026-03-08 19:57:19'),(279,28,'✅ Mission publiée avec succès','Votre mission \"Mission BTP\" a été publiée et 1 automobs qualifiés ont été notifiés (0 Web Push + 4 FCM + 1 emails + 1 SMS envoyés)','success',NULL,'mission',1,'/client/missions/48','2026-03-08 19:56:07','2026-03-08 19:57:04'),(280,27,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"babana fatigeue\" - 20€/h à Paris. Cliquez pour voir les détails et postuler !','info',NULL,'mission',0,'/automob/missions/49','2026-03-08 23:16:59',NULL),(281,28,'✅ Mission publiée avec succès','Votre mission \"babana fatigeue\" a été publiée et 1 automobs qualifiés ont été notifiés (0 Web Push + 4 FCM + 1 emails + 0 SMS envoyés)','success',NULL,'mission',1,'/client/missions/49','2026-03-08 23:17:50','2026-03-08 23:54:41'),(282,27,'🎯 Nouvelle Mission Disponible','Btp Afrique a publié \"babana fatigeue\" - 20€/h à Paris. Cliquez pour voir les détails et postuler !','info',NULL,'mission',1,'/automob/missions/50','2026-03-08 23:18:54','2026-03-08 23:19:15'),(283,28,'✅ Mission publiée avec succès','Votre mission \"babana fatigeue\" a été publiée et 1 automobs qualifiés ont été notifiés (0 Web Push + 4 FCM + 1 emails + 1 SMS envoyés)','success',NULL,'mission',1,'/client/missions/50','2026-03-08 23:19:01','2026-03-08 23:20:29'),(284,28,'Nouvelle candidature','Thierry Ninja a postulé pour \"babana fatigeue\"','info',NULL,'mission',1,'/client/missions/50','2026-03-08 23:19:42','2026-03-08 23:54:41'),(285,27,'Candidature envoyée','Votre candidature pour \"babana fatigeue\" a été envoyée avec succès.','info',NULL,'mission',0,'/automob/my-applications','2026-03-08 23:19:48',NULL),(286,27,'🎉 Candidature acceptée','Votre candidature pour \"Mission BTP\" a été acceptée ! La mission est maintenant en cours.','success',NULL,'mission',0,'/automob/missions/48','2026-03-08 23:20:52',NULL),(287,28,'Mission en cours','La mission \"Mission BTP\" est maintenant en cours avec Thierry Ninja.','success',NULL,'mission',1,'/client/missions/48','2026-03-08 23:20:55','2026-03-08 23:54:41'),(288,27,'🎉 Candidature acceptée','Votre candidature pour \"babana fatigeue\" a été acceptée ! La mission est maintenant en cours.','success',NULL,'mission',0,'/automob/missions/50','2026-03-08 23:21:06',NULL),(289,28,'Mission en cours','La mission \"babana fatigeue\" est maintenant en cours avec Thierry Ninja.','success',NULL,'mission',1,'/client/missions/50','2026-03-08 23:21:10','2026-03-08 23:54:41'),(290,28,'⏰ Feuille de temps à approuver','Nouvelle feuille de temps pour \"Mission BTP\" - 40.00h','warning',NULL,'mission',1,'/client/timesheet/11','2026-03-08 23:26:13','2026-03-08 23:29:38'),(291,27,'📤 Feuille de temps envoyée','Votre feuille de temps pour \"Mission BTP\" a été envoyée au client - En attente d\'approbation','info',NULL,'mission',0,'/automob/my-missions','2026-03-08 23:26:13',NULL),(292,28,'⏰ Feuille de temps à approuver','Nouvelle feuille de temps pour \"babana fatigeue\" - 49.00h','warning',NULL,'mission',1,'/client/timesheet/10','2026-03-08 23:26:39','2026-03-08 23:54:41'),(293,27,'📤 Feuille de temps envoyée','Votre feuille de temps pour \"babana fatigeue\" a été envoyée au client - En attente d\'approbation','info',NULL,'mission',0,'/automob/my-missions','2026-03-08 23:26:39',NULL),(294,27,'🎉 Mission terminée','Félicitations ! Toutes vos heures pour \"Mission BTP\" ont été approuvées. La mission est maintenant terminée.','success',NULL,'mission',0,'/automob/invoices','2026-03-08 23:29:48',NULL),(295,28,'✅ Mission terminée','La mission \"Mission BTP\" avec Thierry Ninja est désormais terminée. Toutes les heures ont été validées.','success',NULL,'mission',1,'/client/invoices','2026-03-08 23:29:48','2026-03-08 23:54:41'),(296,27,'📄 Nouvelle facture générée','Votre facture FA-202603-0866 de 600.00€ a été générée pour la mission \"Mission BTP\"','success',NULL,'payment',0,'/automob/invoices','2026-03-08 23:30:05',NULL),(297,27,'🎉 Mission terminée !','Félicitations ! Le client a marqué la mission \"Mission BTP\" comme terminée.','success',NULL,'mission',0,'/automob/my-missions','2026-03-08 23:30:15',NULL),(298,27,'⭐ Nouvel avis reçu !','Le client vous a laissé un avis 4/5 étoiles pour la mission \"Mission BTP\"','success',NULL,'mission',0,'/automob/reviews','2026-03-08 23:30:15',NULL),(299,27,'🎉 Mission terminée','Félicitations ! Toutes vos heures pour \"babana fatigeue\" ont été approuvées. La mission est maintenant terminée.','success',NULL,'mission',0,'/automob/invoices','2026-03-08 23:30:59',NULL),(300,28,'✅ Mission terminée','La mission \"babana fatigeue\" avec Thierry Ninja est désormais terminée. Toutes les heures ont été validées.','success',NULL,'mission',1,'/client/invoices','2026-03-08 23:30:59','2026-03-08 23:54:41'),(301,27,'📄 Nouvelle facture générée','Votre facture FA-202603-7335 de 980.00€ a été générée pour la mission \"babana fatigeue\"','success',NULL,'payment',0,'/automob/invoices','2026-03-08 23:31:04',NULL),(302,27,'🎉 Mission terminée !','Félicitations ! Le client a marqué la mission \"babana fatigeue\" comme terminée.','success',NULL,'mission',0,'/automob/my-missions','2026-03-08 23:31:23',NULL),(303,27,'🎉 Mission terminée !','Félicitations ! Le client a marqué la mission \"babana fatigeue\" comme terminée.','success',NULL,'mission',0,'/automob/my-missions','2026-03-08 23:31:33',NULL);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_codes`
--

DROP TABLE IF EXISTS `otp_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_codes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `otp_code` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('verification','login') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'verification',
  `expires_at` datetime NOT NULL,
  `verified` tinyint(1) DEFAULT '0',
  `attempts` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_codes`
--

LOCK TABLES `otp_codes` WRITE;
/*!40000 ALTER TABLE `otp_codes` DISABLE KEYS */;
INSERT INTO `otp_codes` VALUES (8,1,'admin@nettmobfrance.fr','439221','login','2025-11-04 18:14:49',0,0,'2025-11-04 17:04:49'),(22,24,'mounchilithierry432@gmail.com','947846','verification','2025-11-12 09:07:41',1,2,'2025-11-12 07:57:41'),(23,25,'ulrichthierry47@gmail.com','988050','verification','2025-11-12 10:02:55',1,1,'2025-11-12 08:52:55'),(24,25,'ulrichthierry47@gmail.com','510306','verification','2025-11-12 10:03:52',0,0,'2025-11-12 08:53:52'),(25,26,'antoinepaulcm@gmail.com','131104','verification','2025-11-14 02:19:34',1,1,'2025-11-14 01:09:33'),(26,24,'mounchilithierry432@gmail.com','723422','login','2025-11-18 17:09:37',1,1,'2025-11-18 15:59:36'),(27,26,'antoinepaulcm@gmail.com','693607','login','2025-11-18 20:05:48',1,1,'2025-11-18 18:55:48'),(28,25,'ulrichthierry47@gmail.com','144822','login','2025-11-19 00:41:56',1,1,'2025-11-18 23:31:56'),(29,26,'antoinepaulcm@gmail.com','518675','login','2026-03-04 01:42:56',1,0,'2026-03-04 00:32:56'),(30,26,'antoinepaulcm@gmail.com','146926','login','2026-03-04 01:43:03',1,2,'2026-03-04 00:33:02'),(31,24,'mounchilithierry432@gmail.com','486272','login','2026-03-07 22:21:46',1,1,'2026-03-07 21:11:46'),(32,27,'mounchilithierry432@gmail.com','326645','verification','2026-03-08 18:47:30',1,1,'2026-03-08 17:37:29'),(33,28,'ulrichthierry47@gmail.com','175798','verification','2026-03-08 20:42:27',1,1,'2026-03-08 19:32:27');
/*!40000 ALTER TABLE `otp_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mission_id` int NOT NULL,
  `automob_id` int NOT NULL,
  `client_id` int NOT NULL,
  `rating` int NOT NULL,
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `secteurs`
--

DROP TABLE IF EXISTS `secteurs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `secteurs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `secteurs`
--

LOCK TABLES `secteurs` WRITE;
/*!40000 ALTER TABLE `secteurs` DISABLE KEYS */;
INSERT INTO `secteurs` VALUES (1,'Logistique – Grande Surface','Travail en grande surface avec gestion de stocks et rayons',1,'2025-11-02 18:14:12','2025-11-02 18:14:12'),(2,'Logistique – Entrepôt','Manutention et gestion d\'entrepôt',1,'2025-11-02 18:14:12','2025-11-02 18:14:12'),(3,'Hôtellerie','Services hôteliers et accueil clientèle',1,'2025-11-02 18:14:12','2025-11-02 18:14:12'),(4,'Nettoyage professionnel','Nettoyage de locaux et entretien',1,'2025-11-02 18:14:12','2025-11-02 18:14:12');
/*!40000 ALTER TABLE `secteurs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_messages`
--

DROP TABLE IF EXISTS `support_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `support_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` int NOT NULL,
  `sender_id` int NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_admin` tinyint(1) DEFAULT '0',
  `is_read` tinyint(1) DEFAULT '0',
  `attachments` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_messages`
--

LOCK TABLES `support_messages` WRITE;
/*!40000 ALTER TABLE `support_messages` DISABLE KEYS */;
INSERT INTO `support_messages` VALUES (1,1,24,'jjkjsdjksdjsd jsdjsd jsd  sd jsd sdjk sdsdjk sdj sd sd sdjksd jk sdj sd sdsd jkds kjsdsdjksd ',0,1,NULL,'2025-11-18 22:40:54'),(2,1,24,'jkxfjfjkkdfjn dfjkfd d fj df jk jdf',0,1,NULL,'2025-11-18 22:41:23'),(3,1,1,'jdjkjkd djk jsd sd jkj  ds jksd sd  jsdk sdjksd  jsdk',1,1,NULL,'2025-11-18 22:42:45'),(4,1,1,'jdjkjkd djk jsd sd jkj  ds jksd sd  jsdk sdjksd  jsdk',1,1,NULL,'2025-11-18 22:42:53'),(5,1,1,'jdjkjkd djk jsd sd jkj  ds jksd sd  jsdk sdjksd  jsdk',1,1,NULL,'2025-11-18 22:42:54'),(6,1,1,'gfgfggggfgg',1,1,NULL,'2025-11-18 22:58:50'),(7,1,24,'sddgssggdgd',0,1,NULL,'2025-11-18 23:00:16'),(8,1,24,'vous',0,1,NULL,'2025-11-18 23:00:59'),(9,1,1,'cgdfngn',1,1,NULL,'2025-11-18 23:01:51'),(10,1,1,'dggdddddvvvv',1,1,NULL,'2025-11-18 23:02:10'),(11,2,25,'jkjkj jjkj jk j   k jjk jkh h kh h kh k hk h hhkhkh ',0,1,NULL,'2025-11-19 13:55:19'),(12,2,1,'ggdfdffdffd',1,1,NULL,'2025-11-19 14:08:14'),(13,2,1,'ggdddgdgg',1,1,NULL,'2025-11-19 14:09:21'),(14,2,1,'dfddfdfddgdgdg',1,1,NULL,'2025-11-19 14:09:48'),(15,2,1,'gffggfgfgfggfg',1,1,NULL,'2025-11-19 15:42:50'),(16,2,25,'vccvvccvv',0,1,NULL,'2025-11-19 15:44:17'),(17,2,25,'dfdffdfdgdgdgdddfgdfdfgdfg',0,1,NULL,'2025-11-19 15:57:56'),(18,2,25,'gdgggdgdgdddggg',0,1,NULL,'2025-11-19 16:07:53'),(20,2,25,'gdgggdgdgdddggg',0,1,NULL,'2025-11-19 16:10:44'),(21,2,25,'fdjjfdjkdfjkdf',0,1,NULL,'2025-11-19 16:55:13'),(22,2,25,'jhkhfhjhhjdfhfd',0,1,NULL,'2025-11-19 19:21:46'),(23,2,25,'jhkhfhjhhjdfhfd',0,1,NULL,'2025-11-19 19:23:07'),(24,2,25,'salut',0,1,NULL,'2025-11-19 19:24:42'),(25,2,25,'bonsoir',0,1,NULL,'2025-11-19 19:26:53'),(26,2,1,'salut',1,1,NULL,'2025-11-19 19:57:27'),(27,2,25,'ghello',0,0,NULL,'2025-11-19 20:03:06'),(28,3,26,'jh bhjb hj hjh hj h h  h h  h hj',0,0,NULL,'2026-03-06 23:12:23'),(29,3,26,'jhhhvhjvjvhjvjhvhjh',0,0,NULL,'2026-03-06 23:12:32');
/*!40000 ALTER TABLE `support_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_tickets`
--

DROP TABLE IF EXISTS `support_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `support_tickets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `subject` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('open','in_progress','resolved','closed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'open',
  `priority` enum('low','normal','high','urgent') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'normal',
  `category` enum('technical','account','payment','mission','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'other',
  `assigned_admin_id` int DEFAULT NULL,
  `last_message_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_tickets`
--

LOCK TABLES `support_tickets` WRITE;
/*!40000 ALTER TABLE `support_tickets` DISABLE KEYS */;
INSERT INTO `support_tickets` VALUES (1,24,'hdhsdjhhjsdhjd','closed','high','other',1,'2025-11-18 23:02:10','2025-11-18 22:40:53','2025-11-18 23:03:59','2025-11-18 23:03:42'),(2,25,'test','open','normal','other',1,'2025-11-19 20:03:06','2025-11-19 13:55:18','2025-11-19 20:03:06',NULL),(3,26,'kjjkjk kj j jkk j','open','high','technical',NULL,NULL,'2026-03-06 23:12:22','2026-03-06 23:12:22',NULL);
/*!40000 ALTER TABLE `support_tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text,
  `setting_type` enum('boolean','string','number') DEFAULT 'string',
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES (1,'maintenance_mode','true','boolean',NULL,'2025-11-18 13:52:13','2025-11-18 13:52:36'),(2,'signup_enabled','true','boolean',NULL,'2025-11-18 13:52:14','2025-11-18 13:52:14'),(3,'default_hourly_rate','15','number',NULL,'2025-11-18 13:52:14','2025-11-18 13:52:14'),(4,'app_name','NettMobFrance','string',NULL,'2025-11-18 13:52:15','2025-11-18 13:52:15');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `time_logs`
--

DROP TABLE IF EXISTS `time_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `time_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mission_id` int NOT NULL,
  `automob_id` int NOT NULL,
  `date` date NOT NULL,
  `hours` decimal(5,2) NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `validated` tinyint(1) DEFAULT '0',
  `validated_by` int DEFAULT NULL,
  `validated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `time_logs`
--

LOCK TABLES `time_logs` WRITE;
/*!40000 ALTER TABLE `time_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `time_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `timesheet_entries`
--

DROP TABLE IF EXISTS `timesheet_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `timesheet_entries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `timesheet_id` int NOT NULL,
  `work_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `break_duration` decimal(4,2) DEFAULT '0.00',
  `hours_worked` decimal(5,2) NOT NULL,
  `is_overtime` tinyint(1) DEFAULT '0' COMMENT 'Indique si cette entrée est une heure supplémentaire',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timesheet_entries`
--

LOCK TABLES `timesheet_entries` WRITE;
/*!40000 ALTER TABLE `timesheet_entries` DISABLE KEYS */;
INSERT INTO `timesheet_entries` VALUES (20,5,'2025-11-15','09:00:00','17:30:00',0.00,8.50,0,NULL,'2025-11-15 17:23:46','2025-11-15 17:23:46'),(21,5,'2025-11-16','09:00:00','17:30:00',0.00,8.50,0,NULL,'2025-11-15 17:23:46','2025-11-15 17:23:46'),(22,5,'2025-11-17','09:00:00','17:30:00',0.00,8.50,0,NULL,'2025-11-15 17:23:47','2025-11-15 17:23:47'),(23,5,'2025-11-18','09:00:00','17:30:00',0.00,8.50,0,NULL,'2025-11-15 17:23:47','2025-11-15 17:23:47'),(24,5,'2025-11-19','09:00:00','20:00:00',0.00,11.00,0,NULL,'2025-11-15 17:23:47','2025-11-15 17:23:47'),(25,9,'2026-03-08','08:00:00','17:00:00',0.00,9.00,0,'','2026-03-08 00:54:48','2026-03-08 00:54:48'),(26,9,'2026-03-09','08:00:00','17:00:00',0.00,9.00,0,'','2026-03-08 00:55:12','2026-03-08 00:55:12'),(27,9,'2026-03-10','08:00:00','17:00:00',0.00,9.00,1,'','2026-03-08 00:55:55','2026-03-08 00:55:55'),(28,10,'2026-03-10','08:00:00','17:00:00',0.00,9.00,0,'','2026-03-08 23:22:28','2026-03-08 23:22:28'),(29,10,'2026-03-11','08:00:00','17:00:00',0.00,9.00,0,'','2026-03-08 23:22:39','2026-03-08 23:22:39'),(30,10,'2026-03-12','08:00:00','17:00:00',0.00,9.00,0,'','2026-03-08 23:22:48','2026-03-08 23:22:48'),(31,10,'2026-03-13','08:00:00','17:00:00',0.00,9.00,0,'','2026-03-08 23:22:54','2026-03-08 23:22:54'),(32,10,'2026-03-14','08:00:00','17:00:00',0.00,9.00,0,'','2026-03-08 23:23:07','2026-03-08 23:23:07'),(33,10,'2026-03-17','08:00:00','12:00:00',0.00,4.00,1,'','2026-03-08 23:24:08','2026-03-08 23:24:08'),(34,11,'2026-03-10','08:00:00','17:00:00',0.00,9.00,0,'','2026-03-08 23:24:44','2026-03-08 23:24:44'),(35,11,'2026-03-11','08:00:00','17:00:00',0.00,9.00,0,'','2026-03-08 23:24:53','2026-03-08 23:24:53'),(36,11,'2026-03-12','08:00:00','17:00:00',0.00,9.00,0,'','2026-03-08 23:25:03','2026-03-08 23:25:03'),(37,11,'2026-03-13','08:00:00','17:00:00',0.00,9.00,0,'','2026-03-08 23:25:14','2026-03-08 23:25:14'),(38,11,'2026-03-14','08:00:00','12:00:00',0.00,4.00,0,'','2026-03-08 23:25:30','2026-03-08 23:25:30');
/*!40000 ALTER TABLE `timesheet_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `timesheets`
--

DROP TABLE IF EXISTS `timesheets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `timesheets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mission_id` int NOT NULL,
  `automob_id` int NOT NULL,
  `period_type` enum('jour','semaine','mois') NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `total_hours` decimal(6,2) NOT NULL DEFAULT '0.00',
  `overtime_hours` decimal(6,2) DEFAULT '0.00' COMMENT 'Heures supplémentaires',
  `overtime_reason` text COMMENT 'Raison des heures supplémentaires',
  `status` enum('brouillon','soumis','approuve','rejete') DEFAULT 'brouillon',
  `submitted_at` timestamp NULL DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `reviewed_by` int DEFAULT NULL,
  `rejection_reason` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timesheets`
--

LOCK TABLES `timesheets` WRITE;
/*!40000 ALTER TABLE `timesheets` DISABLE KEYS */;
INSERT INTO `timesheets` VALUES (5,10,24,'semaine','2025-11-10','2025-11-16',45.00,3.00,NULL,'approuve','2025-11-15 17:09:15','2025-11-15 17:14:44',26,NULL,'2025-11-15 17:06:13','2025-11-15 17:23:46'),(6,10,24,'semaine','2025-11-10','2025-11-16',0.00,0.00,NULL,'brouillon',NULL,NULL,NULL,NULL,'2025-11-15 17:06:14','2025-11-15 17:06:14'),(7,10,24,'jour','2025-11-15','2025-11-15',8.00,0.00,NULL,'approuve',NULL,'2025-11-15 19:06:23',26,NULL,'2025-11-15 17:28:13','2025-11-15 19:06:23'),(9,46,24,'jour','2026-03-08','2026-03-08',27.00,7.00,NULL,'approuve','2026-03-08 00:56:16','2026-03-08 03:56:15',26,NULL,'2026-03-08 00:54:28','2026-03-08 03:56:15'),(10,50,27,'semaine','2026-03-08','2026-03-14',49.00,3.00,NULL,'approuve','2026-03-08 23:26:39','2026-03-08 23:30:59',28,NULL,'2026-03-08 23:22:00','2026-03-08 23:30:59'),(11,48,27,'semaine','2026-03-08','2026-03-14',40.00,0.00,NULL,'approuve','2026-03-08 23:26:13','2026-03-08 23:29:48',28,NULL,'2026-03-08 23:24:35','2026-03-08 23:29:48');
/*!40000 ALTER TABLE `timesheets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `automob_id` int NOT NULL,
  `type` enum('credit','debit') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `reference_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tutoriels`
--

DROP TABLE IF EXISTS `tutoriels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tutoriels` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `video_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('auto-entrepreneur','enterprise') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'auto-entrepreneur',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tutoriels`
--

LOCK TABLES `tutoriels` WRITE;
/*!40000 ALTER TABLE `tutoriels` DISABLE KEYS */;
INSERT INTO `tutoriels` VALUES (1,'Créer un compte client','/videos/client/Creer-un-compte-en-tant-que-client.mp4','enterprise','2026-03-06 18:59:09'),(2,'Vérification KYC','/videos/client/Verification-KYC-du-compte-client.mp4','enterprise','2026-03-06 18:59:09'),(3,'Paramétrer son compte','/videos/client/Comment-parametrer-son-compte-client.mp4','enterprise','2026-03-06 18:59:09'),(4,'Publier une mission (Méthode 1)','/videos/client/Comment-publier-une-mission-methode-1-sur-NETTMOB-FRANCE_2.mp4','enterprise','2026-03-06 18:59:09'),(5,'Publier une mission (Méthode 2)','/videos/client/publier-une-lmision-methode-2-1.mp4','enterprise','2026-03-06 18:59:09'),(6,'Création du compte','/videos/creer-un-compte.mp4','auto-entrepreneur','2026-03-06 18:59:09'),(7,'Vérification KYC','/videos/verification-kyc.mp4','auto-entrepreneur','2026-03-06 18:59:09'),(8,'Postuler à une mission','/videos/accepter-mission.mp4','auto-entrepreneur','2026-03-06 18:59:09'),(9,'Gérer ses disponibilités','/videos/configurer-compte.mp4','auto-entrepreneur','2026-03-06 18:59:09'),(10,'Comment pointer ses heures','/videos/presentation-panel.mp4','auto-entrepreneur','2026-03-06 18:59:09');
/*!40000 ALTER TABLE `tutoriels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_feedback`
--

DROP TABLE IF EXISTS `user_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_feedback` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `user_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_role` enum('client','automob') COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_display_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rating` int NOT NULL,
  `feedback` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `suggestions` text COLLATE utf8mb4_unicode_ci,
  `category` enum('general','performance','interface','fonctionnalites','bugs') COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `is_read` tinyint(1) DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_feedback`
--

LOCK TABLES `user_feedback` WRITE;
/*!40000 ALTER TABLE `user_feedback` DISABLE KEYS */;
INSERT INTO `user_feedback` VALUES (1,24,'mounchilithierry432@gmail.com','automob','Patrice Raoul Geoffroy',5,'xcjkjxc cxjkc cx xc j xcxcjkxc','cjkjcx  xc jxc cx j xckxc xc jxc','interface',1,'2025-11-15 11:07:10','2025-11-14 20:28:17'),(2,24,'mounchilithierry432@gmail.com','automob','mounchilithierry432@gmail.com',5,'njhhjhhjh','jhhhhjh','interface',0,NULL,'2025-11-15 14:37:11'),(3,24,'mounchilithierry432@gmail.com','automob','mounchilithierry432@gmail.com',5,'jhjhjhjhjhjh','jhjjhhjhjhjjh','bugs',0,NULL,'2025-11-15 14:39:50'),(4,24,'mounchilithierry432@gmail.com','automob','mounchilithierry432@gmail.com',5,'xcccccccccccccccccccc','xccccccccccccccccccccc','general',0,NULL,'2025-11-15 14:47:10'),(5,24,'mounchilithierry432@gmail.com','automob','mounchilithierry432@gmail.com',5,'jkjkjkjkjkjjjkjk','jkjkjkjkjkjk','general',0,NULL,'2025-11-15 14:49:47'),(6,26,'antoinepaulcm@gmail.com','client','Btp Afrique',5,'sdffsdfsdfsfsdfsdf',NULL,'general',0,NULL,'2025-11-15 15:11:49'),(7,25,'ulrichthierry47@gmail.com','automob','Patrice Geoffroy',5,'lkkljgjgjkrjkrrrjkjkrjrkrj','jkrjrjkrjkrjkjkrjkrjk','general',0,NULL,'2025-11-18 23:33:25'),(8,27,'mounchilithierry432@gmail.com','automob','Thierry Ninja',5,'Bonjour ! 👋 Je suis l\'Assistant IA de NettmobFrance. Comment puis-je vous aider aujourd\'hui ? Que ce soit pour comprendre le fonctionnement, écrire une belle description de mission ou créer un profil parfait, je suis là !','Bonjour ! 👋 Je suis l\'Assistant IA de NettmobFrance. Comment puis-je vous aider aujourd\'hui ? Que ce soit pour comprendre le fonctionnement, écrire une belle description de mission ou créer un profil parfait, je suis là !','general',0,NULL,'2026-03-08 17:48:22'),(9,28,'ulrichthierry47@gmail.com','client','Btp Afrique',5,'Tu as tout à fait raison ! J\'avais modifié le mauvais fichier (UsersManagement.jsx au lieu de UsersList.jsx). C\'est pour ça que rien ne changeait sur ton écran.\n\nJ\'ai maintenant appliqué les modifications au bon fichier (UsersList.jsx) :','Tu as tout à fait raison ! J\'avais modifié le mauvais fichier (UsersManagement.jsx au lieu de UsersList.jsx). C\'est pour ça que rien ne changeait sur ton écran.\n\nJ\'ai maintenant appliqué les modifications au bon fichier (UsersList.jsx) :','general',0,NULL,'2026-03-08 19:35:12');
/*!40000 ALTER TABLE `user_feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `login_at` datetime NOT NULL,
  `logout_at` datetime DEFAULT NULL,
  `duration_seconds` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=278 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
INSERT INTO `user_sessions` VALUES (10,1,'2025-11-04 18:57:51','2025-11-04 19:12:11',860,'2025-11-04 17:57:51'),(11,1,'2025-11-04 19:12:13','2025-11-05 10:09:55',53862,'2025-11-04 18:12:13'),(12,1,'2025-11-05 10:09:57','2025-11-08 16:40:17',282620,'2025-11-05 09:09:57'),(18,1,'2025-11-08 16:40:17','2025-11-08 16:43:27',190,'2025-11-08 15:40:17'),(21,1,'2025-11-08 18:03:27','2025-11-10 08:55:49',139942,'2025-11-08 17:03:27'),(34,1,'2025-11-10 08:55:54','2025-11-12 12:41:12',186318,'2025-11-10 07:55:54'),(45,24,'2025-11-12 08:58:05','2025-11-12 08:58:22',17,'2025-11-12 07:58:05'),(46,24,'2025-11-12 08:58:22','2025-11-12 12:03:14',11092,'2025-11-12 07:58:22'),(47,25,'2025-11-12 09:53:45','2025-11-19 00:32:38',571133,'2025-11-12 08:53:45'),(48,24,'2025-11-12 12:03:25','2025-11-12 12:42:35',2350,'2025-11-12 11:03:25'),(49,1,'2025-11-12 12:41:15','2025-11-12 12:53:35',739,'2025-11-12 11:41:15'),(50,24,'2025-11-12 12:42:36','2025-11-12 12:59:25',1009,'2025-11-12 11:42:36'),(51,1,'2025-11-12 12:53:43','2025-11-12 12:54:03',20,'2025-11-12 11:53:43'),(52,1,'2025-11-12 12:54:06','2025-11-12 14:59:29',7523,'2025-11-12 11:54:06'),(53,24,'2025-11-12 12:59:27','2025-11-12 14:12:40',4393,'2025-11-12 11:59:27'),(54,24,'2025-11-12 14:12:44','2025-11-12 14:22:36',592,'2025-11-12 13:12:44'),(55,24,'2025-11-12 14:22:38','2025-11-12 14:25:49',191,'2025-11-12 13:22:38'),(56,24,'2025-11-12 14:25:50','2025-11-12 14:35:42',591,'2025-11-12 13:25:50'),(57,24,'2025-11-12 14:35:45','2025-11-12 14:56:33',1248,'2025-11-12 13:35:45'),(58,24,'2025-11-12 14:56:36','2025-11-12 17:44:17',10061,'2025-11-12 13:56:36'),(59,1,'2025-11-12 14:59:34','2025-11-12 16:52:31',6777,'2025-11-12 13:59:34'),(60,1,'2025-11-12 16:52:36','2025-11-12 17:10:21',1065,'2025-11-12 15:52:36'),(61,1,'2025-11-12 17:10:28','2025-11-12 17:11:55',87,'2025-11-12 16:10:28'),(62,1,'2025-11-12 17:11:56','2025-11-12 17:52:38',2441,'2025-11-12 16:11:56'),(63,24,'2025-11-12 17:44:19','2025-11-13 16:09:54',80735,'2025-11-12 16:44:19'),(64,1,'2025-11-12 17:52:55','2025-11-13 11:24:03',63068,'2025-11-12 16:52:55'),(65,1,'2025-11-13 11:24:06','2025-11-15 12:05:44',175298,'2025-11-13 10:24:06'),(66,1,'2025-11-13 11:24:06','2025-11-13 13:06:01',6115,'2025-11-13 10:24:06'),(67,1,'2025-11-13 13:06:03','2025-11-14 04:04:05',53882,'2025-11-13 12:06:03'),(68,24,'2025-11-13 16:09:55','2025-11-14 15:40:33',84638,'2025-11-13 15:09:55'),(69,26,'2025-11-14 02:10:06','2025-11-14 03:42:42',5556,'2025-11-14 01:10:06'),(70,26,'2025-11-14 03:42:46','2025-11-14 10:07:30',23084,'2025-11-14 02:42:46'),(71,1,'2025-11-14 04:04:14','2025-11-14 04:06:17',123,'2025-11-14 03:04:14'),(72,1,'2025-11-14 04:06:21','2025-11-14 10:18:23',22322,'2025-11-14 03:06:21'),(73,26,'2025-11-14 10:07:32','2025-11-14 10:53:33',2761,'2025-11-14 09:07:32'),(74,1,'2025-11-14 10:18:25','2025-11-14 16:54:49',23784,'2025-11-14 09:18:25'),(75,26,'2025-11-14 10:53:37','2025-11-14 15:42:24',17327,'2025-11-14 09:53:37'),(76,24,'2025-11-14 15:40:34','2025-11-14 16:54:12',4418,'2025-11-14 14:40:34'),(77,26,'2025-11-14 15:42:26','2025-11-14 20:03:57',15691,'2025-11-14 14:42:26'),(78,24,'2025-11-14 16:54:15','2025-11-14 20:23:44',12569,'2025-11-14 15:54:15'),(79,1,'2025-11-14 16:54:50','2025-11-15 12:05:34',69044,'2025-11-14 15:54:50'),(80,26,'2025-11-14 20:04:00','2025-11-14 20:20:48',1008,'2025-11-14 19:04:00'),(81,26,'2025-11-14 20:20:52','2025-11-14 20:27:59',427,'2025-11-14 19:20:52'),(82,24,'2025-11-14 20:23:45','2025-11-14 20:30:44',419,'2025-11-14 19:23:45'),(83,26,'2025-11-14 20:28:00','2025-11-15 16:11:19',70999,'2025-11-14 19:28:00'),(84,24,'2025-11-14 20:30:45','2025-11-14 21:26:16',3331,'2025-11-14 19:30:45'),(85,24,'2025-11-14 21:26:21','2025-11-14 21:30:29',248,'2025-11-14 20:26:21'),(86,24,'2025-11-14 21:30:31','2025-11-15 12:11:59',52888,'2025-11-14 20:30:31'),(87,1,'2025-11-15 12:05:44','2025-11-19 00:01:34',302150,'2025-11-15 11:05:44'),(88,1,'2025-11-15 12:05:48','2025-11-15 16:12:19',14791,'2025-11-15 11:05:48'),(89,24,'2025-11-15 12:12:01','2025-11-15 16:15:51',14630,'2025-11-15 11:12:01'),(90,26,'2025-11-15 16:11:19','2025-11-15 17:06:17',3298,'2025-11-15 15:11:19'),(91,1,'2025-11-15 16:12:19','2025-11-15 16:27:43',924,'2025-11-15 15:12:19'),(92,24,'2025-11-15 16:15:53','2025-11-15 16:26:24',631,'2025-11-15 15:15:53'),(93,24,'2025-11-15 16:26:27','2025-11-15 16:31:13',286,'2025-11-15 15:26:27'),(94,1,'2025-11-15 16:27:46','2025-11-15 16:29:31',105,'2025-11-15 15:27:46'),(95,1,'2025-11-15 16:29:31','2025-11-15 16:30:26',55,'2025-11-15 15:29:31'),(96,1,'2025-11-15 16:30:27','2025-11-15 16:32:16',109,'2025-11-15 15:30:27'),(97,24,'2025-11-15 16:31:15','2025-11-15 16:35:44',269,'2025-11-15 15:31:15'),(98,1,'2025-11-15 16:32:18','2025-11-15 22:10:48',20310,'2025-11-15 15:32:18'),(99,24,'2025-11-15 16:35:46','2025-11-15 17:07:31',1905,'2025-11-15 15:35:46'),(100,26,'2025-11-15 17:06:19','2025-11-15 17:10:45',266,'2025-11-15 16:06:19'),(101,24,'2025-11-15 17:07:32','2025-11-15 17:25:24',1072,'2025-11-15 16:07:32'),(102,26,'2025-11-15 17:10:46','2025-11-15 17:37:23',1597,'2025-11-15 16:10:46'),(103,24,'2025-11-15 17:25:29','2025-11-15 18:05:08',2379,'2025-11-15 16:25:29'),(104,26,'2025-11-15 17:37:32','2025-11-15 17:38:50',78,'2025-11-15 16:37:32'),(105,26,'2025-11-15 17:38:50','2025-11-15 17:44:04',314,'2025-11-15 16:38:50'),(106,26,'2025-11-15 17:44:05','2025-11-15 18:10:05',1560,'2025-11-15 16:44:05'),(107,24,'2025-11-15 18:05:18','2025-11-15 18:21:06',948,'2025-11-15 17:05:18'),(108,26,'2025-11-15 18:10:05','2025-11-15 20:05:46',6941,'2025-11-15 17:10:05'),(109,24,'2025-11-15 18:21:07','2025-11-15 21:20:50',10783,'2025-11-15 17:21:07'),(110,26,'2025-11-15 20:05:50','2025-11-15 21:19:41',4431,'2025-11-15 19:05:50'),(111,26,'2025-11-15 21:19:45','2025-11-15 21:21:31',106,'2025-11-15 20:19:45'),(112,24,'2025-11-15 21:20:51','2025-11-15 21:21:21',30,'2025-11-15 20:20:51'),(113,24,'2025-11-15 21:21:22','2025-11-15 21:23:48',146,'2025-11-15 20:21:22'),(114,26,'2025-11-15 21:21:31','2025-11-15 21:25:17',226,'2025-11-15 20:21:31'),(115,24,'2025-11-15 21:23:49','2025-11-15 21:27:56',247,'2025-11-15 20:23:49'),(116,26,'2025-11-15 21:25:18','2025-11-15 21:59:50',2072,'2025-11-15 20:25:18'),(117,24,'2025-11-15 21:27:59','2025-11-15 23:34:20',7580,'2025-11-15 20:27:59'),(118,26,'2025-11-15 21:59:55','2025-11-15 22:44:11',2656,'2025-11-15 20:59:55'),(119,1,'2025-11-15 22:10:52','2025-11-15 22:42:23',1891,'2025-11-15 21:10:52'),(120,1,'2025-11-15 22:42:35','2025-11-15 22:43:05',30,'2025-11-15 21:42:35'),(121,1,'2025-11-15 22:43:06','2025-11-15 23:09:13',1567,'2025-11-15 21:43:06'),(122,26,'2025-11-15 22:44:13','2025-11-15 23:06:06',1312,'2025-11-15 21:44:13'),(123,26,'2025-11-15 23:06:13','2025-11-16 09:16:03',36590,'2025-11-15 22:06:13'),(124,1,'2025-11-15 23:09:14','2025-11-16 01:13:16',7442,'2025-11-15 22:09:14'),(125,24,'2025-11-15 23:34:29','2025-11-19 00:27:34',262385,'2025-11-15 22:34:29'),(126,24,'2025-11-15 23:34:29','2025-11-16 00:33:51',3562,'2025-11-15 22:34:29'),(127,24,'2025-11-16 00:33:55','2025-11-16 01:20:23',2788,'2025-11-15 23:33:55'),(128,1,'2025-11-16 01:13:17','2025-11-16 02:10:37',3440,'2025-11-16 00:13:17'),(129,24,'2025-11-16 01:20:24','2025-11-16 09:14:45',28461,'2025-11-16 00:20:24'),(130,1,'2025-11-16 02:10:39','2025-11-16 09:22:51',25932,'2025-11-16 01:10:39'),(131,24,'2025-11-16 09:14:51','2025-11-16 11:08:33',6822,'2025-11-16 08:14:51'),(132,26,'2025-11-16 09:16:09','2025-11-16 09:17:41',92,'2025-11-16 08:16:09'),(133,26,'2025-11-16 09:17:49','2025-11-18 19:56:21',211112,'2025-11-16 08:17:49'),(134,1,'2025-11-16 09:22:57','2025-11-18 13:26:40',187423,'2025-11-16 08:22:57'),(135,24,'2025-11-16 11:08:35','2025-11-18 16:59:59',193884,'2025-11-16 10:08:35'),(136,1,'2025-11-18 13:26:42','2025-11-18 13:51:09',1467,'2025-11-18 12:26:42'),(137,1,'2025-11-18 13:51:11','2025-11-18 14:12:31',1280,'2025-11-18 12:51:11'),(138,1,'2025-11-18 14:12:36','2025-11-18 14:26:30',834,'2025-11-18 13:12:36'),(139,1,'2025-11-18 14:26:32','2025-11-18 14:41:16',884,'2025-11-18 13:26:32'),(140,1,'2025-11-18 14:41:17','2025-11-18 14:43:34',137,'2025-11-18 13:41:17'),(141,1,'2025-11-18 14:43:35','2025-11-18 14:50:44',429,'2025-11-18 13:43:35'),(142,1,'2025-11-18 14:50:47','2025-11-18 16:26:33',5746,'2025-11-18 13:50:47'),(143,1,'2025-11-18 16:26:35','2025-11-18 16:51:49',1514,'2025-11-18 15:26:35'),(144,1,'2025-11-18 16:51:50','2025-11-18 17:26:58',2108,'2025-11-18 15:51:50'),(145,24,'2025-11-18 16:59:59','2025-11-18 17:00:07',8,'2025-11-18 15:59:59'),(146,24,'2025-11-18 17:00:08','2025-11-18 17:24:05',1437,'2025-11-18 16:00:08'),(147,24,'2025-11-18 17:24:09','2025-11-18 19:44:25',8416,'2025-11-18 16:24:09'),(148,1,'2025-11-18 17:26:59','2025-11-18 17:36:13',554,'2025-11-18 16:26:59'),(149,1,'2025-11-18 17:36:15','2025-11-18 23:41:48',21933,'2025-11-18 16:36:15'),(150,24,'2025-11-18 19:44:28','2025-11-18 20:06:27',1319,'2025-11-18 18:44:28'),(151,26,'2025-11-18 19:56:21','2025-11-18 19:57:24',63,'2025-11-18 18:56:21'),(152,26,'2025-11-18 19:57:25','2025-11-18 20:03:37',372,'2025-11-18 18:57:25'),(153,26,'2025-11-18 20:03:42','2025-11-19 00:38:48',16506,'2025-11-18 19:03:42'),(154,24,'2025-11-18 20:06:30','2025-11-18 23:39:44',12794,'2025-11-18 19:06:30'),(155,24,'2025-11-18 23:39:52','2025-11-18 23:59:50',1198,'2025-11-18 22:39:52'),(156,1,'2025-11-18 23:41:50','2025-11-18 23:59:42',1072,'2025-11-18 22:41:50'),(157,24,'2025-11-18 23:59:50','2025-11-19 00:01:29',99,'2025-11-18 22:59:50'),(158,1,'2025-11-19 00:01:35','2025-11-19 00:37:14',2139,'2025-11-18 23:01:35'),(159,24,'2025-11-19 00:27:38','2025-11-19 20:58:23',73845,'2025-11-18 23:27:38'),(160,25,'2025-11-19 00:32:39','2025-11-19 00:38:08',329,'2025-11-18 23:32:39'),(161,1,'2025-11-19 00:37:14','2025-11-19 15:06:22',52148,'2025-11-18 23:37:14'),(162,25,'2025-11-19 00:38:08','2025-11-19 00:41:15',187,'2025-11-18 23:38:08'),(163,26,'2025-11-19 00:38:49','2025-11-19 08:35:06',28577,'2025-11-18 23:38:49'),(164,25,'2025-11-19 00:41:15','2025-11-19 01:52:30',4275,'2025-11-18 23:41:15'),(165,25,'2025-11-19 01:52:36','2025-11-19 08:23:16',23440,'2025-11-19 00:52:36'),(166,25,'2025-11-19 08:23:20','2025-11-19 14:53:28',23408,'2025-11-19 07:23:20'),(167,26,'2025-11-19 08:35:07','2025-11-19 14:49:51',22484,'2025-11-19 07:35:07'),(168,26,'2025-11-19 14:49:56','2025-11-19 14:51:50',114,'2025-11-19 13:49:56'),(169,26,'2025-11-19 14:51:52','2025-11-19 15:04:13',741,'2025-11-19 13:51:52'),(170,25,'2025-11-19 14:53:31','2025-11-19 16:43:55',6624,'2025-11-19 13:53:31'),(171,26,'2025-11-19 15:04:24','2025-11-19 20:58:39',21255,'2025-11-19 14:04:24'),(172,1,'2025-11-19 15:06:24','2025-11-19 20:56:55',21031,'2025-11-19 14:06:24'),(173,25,'2025-11-19 16:43:56','2025-11-19 17:02:03',1087,'2025-11-19 15:43:56'),(174,25,'2025-11-19 17:02:18','2025-11-19 17:05:08',170,'2025-11-19 16:02:18'),(175,25,'2025-11-19 17:05:09','2025-11-19 17:54:52',2983,'2025-11-19 16:05:09'),(176,25,'2025-11-19 17:54:54','2025-11-19 18:38:00',2586,'2025-11-19 16:54:54'),(177,25,'2025-11-19 18:38:03','2025-11-19 18:40:09',126,'2025-11-19 17:38:03'),(178,25,'2025-11-19 18:40:10','2025-11-19 20:21:14',6064,'2025-11-19 17:40:10'),(179,25,'2025-11-19 20:21:15','2025-11-19 20:37:51',996,'2025-11-19 19:21:15'),(180,25,'2025-11-19 20:37:55','2025-11-19 20:39:08',73,'2025-11-19 19:37:55'),(181,25,'2025-11-19 20:39:10','2025-11-19 20:39:31',21,'2025-11-19 19:39:10'),(182,25,'2025-11-19 20:39:33','2025-11-19 20:44:26',293,'2025-11-19 19:39:33'),(183,25,'2025-11-19 20:44:30','2025-11-19 20:44:50',20,'2025-11-19 19:44:30'),(184,25,'2025-11-19 20:44:52','2025-11-19 20:45:25',33,'2025-11-19 19:44:52'),(185,25,'2025-11-19 20:45:27','2025-11-19 20:51:19',352,'2025-11-19 19:45:27'),(186,25,'2025-11-19 20:51:21','2025-11-19 20:51:43',22,'2025-11-19 19:51:21'),(187,25,'2025-11-19 20:51:44','2025-11-19 20:51:52',8,'2025-11-19 19:51:44'),(188,25,'2025-11-19 20:51:53','2025-11-19 20:56:19',266,'2025-11-19 19:51:53'),(189,25,'2025-11-19 20:56:20','2025-11-19 20:58:14',114,'2025-11-19 19:56:20'),(190,1,'2025-11-19 20:56:55','2025-11-19 20:58:05',70,'2025-11-19 19:56:55'),(191,25,'2025-11-19 20:58:14','2025-11-19 21:02:49',275,'2025-11-19 19:58:14'),(192,24,'2025-11-19 20:58:23','2025-11-20 09:33:59',45336,'2025-11-19 19:58:23'),(193,26,'2025-11-19 20:58:39','2025-11-19 21:03:33',294,'2025-11-19 19:58:39'),(194,25,'2025-11-19 21:02:49','2025-11-19 21:03:27',38,'2025-11-19 20:02:49'),(195,26,'2025-11-19 21:03:34','2025-11-20 09:33:46',45012,'2025-11-19 20:03:34'),(196,1,'2025-11-20 08:30:00','2025-11-20 09:00:38',1838,'2025-11-20 07:30:00'),(197,1,'2025-11-20 09:00:41','2025-12-14 13:36:24',2090143,'2025-11-20 08:00:41'),(198,24,'2025-11-20 09:33:59','2025-11-20 09:34:29',30,'2025-11-20 08:33:59'),(199,25,'2025-11-20 09:34:35','2025-11-20 09:53:02',1107,'2025-11-20 08:34:35'),(200,26,'2025-11-20 09:53:21','2025-11-20 10:36:50',2609,'2025-11-20 08:53:21'),(201,25,'2025-11-20 10:36:56','2025-11-20 10:59:51',1375,'2025-11-20 09:36:56'),(202,26,'2025-11-20 11:02:45','2025-11-20 11:12:32',587,'2025-11-20 10:02:45'),(203,25,'2025-11-20 11:12:38','2025-11-20 11:19:18',400,'2025-11-20 10:12:38'),(204,26,'2025-11-20 11:19:52','2025-11-20 11:37:28',1056,'2025-11-20 10:19:52'),(205,26,'2025-11-20 11:38:54','2025-11-21 00:15:07',45373,'2025-11-20 10:38:54'),(206,26,'2025-11-21 00:15:09','2025-11-21 01:22:10',4021,'2025-11-20 23:15:09'),(207,25,'2025-11-21 00:19:23','2025-11-21 02:41:20',8517,'2025-11-20 23:19:23'),(208,26,'2025-11-21 01:22:10','2025-11-21 02:41:00',4730,'2025-11-21 00:22:10'),(209,25,'2025-11-21 02:41:21','2025-11-21 02:41:56',35,'2025-11-21 01:41:21'),(210,26,'2025-11-21 02:42:03','2025-11-21 02:48:54',411,'2025-11-21 01:42:03'),(211,25,'2025-11-21 02:51:54',NULL,0,'2025-11-21 01:51:54'),(212,26,'2025-11-21 03:50:16','2026-03-08 00:45:57',9233741,'2025-11-21 02:50:16'),(213,26,'2025-11-21 03:50:18','2025-11-21 03:51:31',73,'2025-11-21 02:50:18'),(214,26,'2025-11-21 03:51:36','2025-11-21 12:46:04',32068,'2025-11-21 02:51:36'),(215,26,'2025-11-21 12:46:05','2026-03-04 01:34:01',8858876,'2025-11-21 11:46:05'),(216,1,'2025-12-14 13:36:26','2025-12-14 13:54:04',1058,'2025-12-14 12:36:26'),(217,1,'2025-12-14 14:02:55','2025-12-14 15:40:54',5879,'2025-12-14 13:02:55'),(218,1,'2025-12-14 15:40:56','2025-12-14 17:32:16',6680,'2025-12-14 14:40:56'),(219,1,'2025-12-14 17:32:18','2026-02-17 22:28:50',5633792,'2025-12-14 16:32:18'),(220,1,'2026-02-17 22:28:54','2026-03-02 22:29:26',1123232,'2026-02-17 21:28:54'),(221,1,'2026-03-02 22:29:32','2026-03-04 23:46:06',177394,'2026-03-02 21:29:32'),(222,26,'2026-03-04 01:34:04','2026-03-04 02:48:39',4475,'2026-03-04 00:34:04'),(223,26,'2026-03-04 02:48:45','2026-03-04 02:48:47',2,'2026-03-04 01:48:45'),(224,26,'2026-03-04 02:48:51','2026-03-04 10:05:58',26227,'2026-03-04 01:48:51'),(225,26,'2026-03-04 10:06:02','2026-03-06 20:12:28',209186,'2026-03-04 09:06:02'),(226,1,'2026-03-04 23:46:08','2026-03-06 19:01:24',155716,'2026-03-04 22:46:08'),(227,1,'2026-03-06 19:34:32','2026-03-06 20:12:19',2267,'2026-03-06 18:34:32'),(228,26,'2026-03-06 20:12:29','2026-03-06 20:12:36',7,'2026-03-06 19:12:29'),(229,26,'2026-03-06 20:12:36','2026-03-06 20:12:51',15,'2026-03-06 19:12:36'),(230,26,'2026-03-06 20:12:51','2026-03-06 20:14:16',85,'2026-03-06 19:12:51'),(231,26,'2026-03-06 20:14:17','2026-03-06 20:36:19',1322,'2026-03-06 19:14:17'),(232,26,'2026-03-06 20:36:20','2026-03-06 21:00:09',1429,'2026-03-06 19:36:20'),(233,26,'2026-03-06 21:00:10','2026-03-06 21:00:49',39,'2026-03-06 20:00:10'),(234,26,'2026-03-06 21:00:49','2026-03-06 21:31:42',1853,'2026-03-06 20:00:49'),(235,26,'2026-03-06 21:31:42','2026-03-06 21:31:58',16,'2026-03-06 20:31:42'),(236,26,'2026-03-06 21:31:58','2026-03-06 21:38:21',383,'2026-03-06 20:31:58'),(237,26,'2026-03-06 21:38:21','2026-03-06 21:39:01',40,'2026-03-06 20:38:21'),(238,26,'2026-03-06 21:39:01','2026-03-06 22:08:11',1750,'2026-03-06 20:39:01'),(239,26,'2026-03-06 22:08:12','2026-03-06 22:11:31',199,'2026-03-06 21:08:12'),(240,26,'2026-03-06 22:11:32','2026-03-06 22:21:39',607,'2026-03-06 21:11:32'),(241,26,'2026-03-06 22:21:40','2026-03-06 22:29:40',480,'2026-03-06 21:21:40'),(242,26,'2026-03-06 22:29:41','2026-03-07 22:11:36',85315,'2026-03-06 21:29:41'),(243,24,'2026-03-07 22:12:16','2026-03-08 01:53:39',13283,'2026-03-07 21:12:16'),(244,26,'2026-03-08 00:45:58','2026-03-08 04:52:58',14820,'2026-03-07 23:45:58'),(245,24,'2026-03-08 01:53:40','2026-03-08 04:59:06',11126,'2026-03-08 00:53:40'),(246,26,'2026-03-08 04:52:59','2026-03-08 04:58:58',359,'2026-03-08 03:52:59'),(247,24,'2026-03-08 04:59:07',NULL,0,'2026-03-08 03:59:07'),(248,1,'2026-03-08 18:21:51','2026-03-08 18:58:42',2211,'2026-03-08 17:21:51'),(249,27,'2026-03-08 18:39:22','2026-03-08 20:38:23',7141,'2026-03-08 17:39:22'),(250,1,'2026-03-08 18:58:42','2026-03-08 19:31:45',1983,'2026-03-08 17:58:42'),(251,1,'2026-03-08 19:31:45','2026-03-08 20:37:31',3946,'2026-03-08 18:31:45'),(252,28,'2026-03-08 20:33:15','2026-03-08 20:35:35',140,'2026-03-08 19:33:15'),(253,28,'2026-03-08 20:35:36','2026-03-08 20:53:56',1100,'2026-03-08 19:35:36'),(254,1,'2026-03-08 20:37:32','2026-03-08 20:39:00',88,'2026-03-08 19:37:32'),(255,27,'2026-03-08 20:38:24','2026-03-08 20:38:36',12,'2026-03-08 19:38:24'),(256,27,'2026-03-08 20:38:36','2026-03-08 20:57:13',1117,'2026-03-08 19:38:36'),(257,1,'2026-03-08 20:39:01','2026-03-08 20:53:47',886,'2026-03-08 19:39:01'),(258,28,'2026-03-08 20:53:57','2026-03-08 20:57:54',237,'2026-03-08 19:53:57'),(259,27,'2026-03-08 20:57:14','2026-03-08 20:58:43',89,'2026-03-08 19:57:14'),(260,28,'2026-03-08 20:57:55','2026-03-08 21:35:48',2273,'2026-03-08 19:57:55'),(261,27,'2026-03-08 20:58:43','2026-03-09 00:19:03',12020,'2026-03-08 19:58:43'),(262,28,'2026-03-08 21:35:48','2026-03-09 00:20:21',9873,'2026-03-08 20:35:48'),(263,27,'2026-03-09 00:19:03','2026-03-09 00:21:29',146,'2026-03-08 23:19:03'),(264,28,'2026-03-09 00:20:22','2026-03-09 00:29:28',546,'2026-03-08 23:20:22'),(265,27,'2026-03-09 00:21:30','2026-03-09 00:26:51',321,'2026-03-08 23:21:30'),(266,27,'2026-03-09 00:26:52','2026-03-09 00:27:21',29,'2026-03-08 23:26:52'),(267,27,'2026-03-09 00:27:22','2026-03-09 00:27:57',35,'2026-03-08 23:27:22'),(268,27,'2026-03-09 00:27:58','2026-03-09 00:28:42',44,'2026-03-08 23:27:58'),(269,27,'2026-03-09 00:28:42','2026-03-09 00:54:53',1571,'2026-03-08 23:28:42'),(270,28,'2026-03-09 00:29:29','2026-03-09 00:53:06',1417,'2026-03-08 23:29:29'),(271,1,'2026-03-09 00:39:47','2026-03-09 01:00:22',1235,'2026-03-08 23:39:47'),(272,28,'2026-03-09 00:53:07','2026-03-09 01:07:06',839,'2026-03-08 23:53:07'),(273,27,'2026-03-09 00:54:54',NULL,0,'2026-03-08 23:54:54'),(274,1,'2026-03-09 01:00:24','2026-03-09 01:09:05',521,'2026-03-09 00:00:24'),(275,28,'2026-03-09 01:07:07',NULL,0,'2026-03-09 00:07:07'),(276,1,'2026-03-09 01:09:06','2026-03-23 16:20:31',1264285,'2026-03-09 00:09:06'),(277,1,'2026-03-23 16:20:33',NULL,0,'2026-03-23 15:20:33');
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('automob','client','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `verified` tinyint(1) DEFAULT '0',
  `id_verified` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `profile_picture` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cover_picture` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `total_session_duration` int DEFAULT '0',
  `feedback_given` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'noreply@nettmobfrance.fr','$2a$10$SN2xWc9UljqfLX0DJdZGXulx.cPQXya2h.K3JaLs1OYCs5Xr94U7i','admin',1,1,'2025-11-02 18:14:11','2026-03-23 15:20:32',NULL,NULL,'2026-03-23 16:20:32',12311817,0),(27,'mounchilithierry432@gmail.com','$2a$10$tAReA15l89gK0Cc3tQTvfObGMBaeXsLvGPRQ8B9JNeHKrQXUBxZKi','automob',1,1,'2026-03-08 17:37:29','2026-03-08 23:54:53','/uploads/profile/27_1772992670478.png','/uploads/profile/27_1772992687684.png','2026-03-09 00:54:53',22525,1),(28,'ulrichthierry47@gmail.com','$2a$10$zST.wfcD6sy4jp.VaP7tu.N7IiG6mBtgfTCb2prMVBaMXM/GBZ6e.','client',1,1,'2026-03-08 19:32:27','2026-03-09 00:07:07','/uploads/profile/28_1772998604800.png','/uploads/profile/28_1772998613711.png','2026-03-09 01:07:07',16425,1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wallet_transactions`
--

DROP TABLE IF EXISTS `wallet_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallet_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `wallet_id` int NOT NULL,
  `automob_id` int NOT NULL,
  `type` enum('credit','debit','adjustment') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `balance_before` decimal(10,2) NOT NULL,
  `balance_after` decimal(10,2) NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_type` enum('invoice','withdrawal','manual_adjustment','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wallet_transactions`
--

LOCK TABLES `wallet_transactions` WRITE;
/*!40000 ALTER TABLE `wallet_transactions` DISABLE KEYS */;
INSERT INTO `wallet_transactions` VALUES (4,5,24,'credit',954.00,0.00,954.00,'Facture FA-202511-8474 - Mission mission nettoyage boss','invoice',7,NULL,'2025-11-15 20:49:20'),(5,5,24,'debit',-500.00,954.00,454.00,'Retrait approuvé - Demande #1','withdrawal',1,1,'2025-11-16 00:16:48'),(6,6,25,'adjustment',200.00,700.00,900.00,'jkkjkjkjk',NULL,NULL,1,'2025-11-16 09:09:07'),(7,6,25,'adjustment',50.00,900.00,950.00,'kjkjkjkjk',NULL,NULL,1,'2025-11-16 09:12:01'),(8,6,25,'adjustment',50.00,950.00,1000.00,'jjkjjkjjkk',NULL,NULL,1,'2025-11-16 09:57:20'),(9,6,25,'adjustment',50.00,1000.00,1050.00,'jjkjjkjjkk',NULL,NULL,1,'2025-11-16 09:57:43'),(10,6,25,'adjustment',70.00,1050.00,1120.00,'kbbbjkbjjbj',NULL,NULL,1,'2025-11-16 10:07:44'),(11,6,25,'adjustment',-1000.00,1120.00,120.00,'buiobuiouiohio',NULL,NULL,1,'2025-11-16 10:08:00'),(12,5,24,'adjustment',-1254.00,1254.00,0.00,'jbbbubbbuib',NULL,NULL,1,'2025-11-16 10:08:12'),(13,5,24,'credit',405.00,0.00,405.00,'Facture FA-202603-7544 - Mission babana fatigeue','invoice',9,NULL,'2026-03-08 03:56:18'),(14,5,24,'credit',405.00,405.00,810.00,'Facture FA-202603-7791 - Mission babana fatigeue','invoice',11,NULL,'2026-03-08 03:56:32'),(15,7,27,'credit',600.00,0.00,600.00,'Facture FA-202603-0866 - Mission Mission BTP','invoice',13,NULL,'2026-03-08 23:30:04'),(16,7,27,'credit',980.00,600.00,1580.00,'Facture FA-202603-7335 - Mission babana fatigeue','invoice',14,NULL,'2026-03-08 23:31:04');
/*!40000 ALTER TABLE `wallet_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wallets`
--

DROP TABLE IF EXISTS `wallets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `automob_id` int NOT NULL,
  `balance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_earned` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_withdrawn` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wallets`
--

LOCK TABLES `wallets` WRITE;
/*!40000 ALTER TABLE `wallets` DISABLE KEYS */;
INSERT INTO `wallets` VALUES (5,24,810.00,1764.00,500.00,'2025-11-12 07:58:23','2026-03-08 03:56:31'),(6,25,120.00,0.00,0.00,'2025-11-12 08:54:01','2025-11-16 10:07:59'),(7,27,1580.00,1580.00,0.00,'2026-03-08 17:39:29','2026-03-08 23:31:04');
/*!40000 ALTER TABLE `wallets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `withdrawal_requests`
--

DROP TABLE IF EXISTS `withdrawal_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `withdrawal_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `automob_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','approved','rejected','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `payment_method` enum('bank_transfer','paypal','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'bank_transfer',
  `bank_details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `requested_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `admin_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `withdrawal_requests`
--

LOCK TABLES `withdrawal_requests` WRITE;
/*!40000 ALTER TABLE `withdrawal_requests` DISABLE KEYS */;
INSERT INTO `withdrawal_requests` VALUES (1,24,500.00,'approved','bank_transfer','{\"accountHolderName\":\"Patrice Raoul Geoffroy\",\"iban\":\"FR76 8555 5555 8888 9999 6666 66\",\"bic\":\"BNPAFRPP234\"}',NULL,'2025-11-16 00:10:28',1,'2025-11-16 00:16:49','',NULL);
/*!40000 ALTER TABLE `withdrawal_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `withdrawals`
--

DROP TABLE IF EXISTS `withdrawals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `withdrawals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `automob_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('en_attente','approuve','refuse') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `iban` varchar(34) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `processed_by` int DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `withdrawals`
--

LOCK TABLES `withdrawals` WRITE;
/*!40000 ALTER TABLE `withdrawals` DISABLE KEYS */;
/*!40000 ALTER TABLE `withdrawals` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-04 22:36:39
