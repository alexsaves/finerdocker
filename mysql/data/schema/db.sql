-- MySQL dump 10.13  Distrib 5.7.17, for macos10.12 (x86_64)
--
-- Host: localhost    Database: finerinkprod
-- ------------------------------------------------------
-- Server version	5.7.18

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `accounts`
--

DROP TABLE IF EXISTS `accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `accounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `email` varchar(50) NOT NULL,
  `pw_md5` varchar(32) NOT NULL,
  `accesstoken` varchar(256) DEFAULT NULL,
  `refreshtoken` varchar(256) DEFAULT NULL,
  `fbid` varchar(32) DEFAULT '0',
  `linkedinid` varchar(32) DEFAULT NULL,
  `googleid` varchar(32) DEFAULT NULL,
  `emailverified` tinyint(4) NOT NULL DEFAULT '0',
  `location` varchar(256) DEFAULT NULL,
  `salesforceid` varchar(45) DEFAULT NULL,
  `profile_image_uid` varchar(36) DEFAULT NULL,
  `is_active` tinyint(4) unsigned NOT NULL DEFAULT '1',
  `can_approve` blob,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `email_UNIQUE` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `approvals`
--

DROP TABLE IF EXISTS `approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `approvals` (
  `guid` char(14) NOT NULL,
  `sendEmail` tinyint(4) DEFAULT NULL,
  `sendSMS` tinyint(4) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `sendState` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '0 = Not sent\n1 = Sent\n',
  `created_by_account_id` int(11) DEFAULT NULL,
  `organization_id` int(11) NOT NULL DEFAULT '0',
  `crm_contact_id` varchar(45) DEFAULT NULL,
  `crm_user_id` varchar(45) DEFAULT NULL,
  `opportunity_id` varchar(36) NOT NULL,
  `survey_guid` char(14) NOT NULL,
  PRIMARY KEY (`guid`),
  UNIQUE KEY `orgactuq` (`crm_contact_id`,`organization_id`),
  KEY `orgapprovalid_idx` (`organization_id`),
  KEY `contactaccountid_idx` (`crm_contact_id`),
  KEY `oppidlink_idx` (`opportunity_id`),
  KEY `surveylnkd_idx` (`survey_guid`),
  CONSTRAINT `contactaccountid` FOREIGN KEY (`crm_contact_id`) REFERENCES `crm_contacts` (`Id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `orgapprovalid` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `surveylnkd` FOREIGN KEY (`survey_guid`) REFERENCES `surveys` (`guid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `crm_accounts`
--

DROP TABLE IF EXISTS `crm_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `crm_accounts` (
  `Id` varchar(100) NOT NULL,
  `AccountNumber` varchar(100) DEFAULT NULL,
  `Name` varchar(100) DEFAULT NULL,
  `OwnerId` varchar(100) DEFAULT NULL,
  `Metadata` blob,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `uid_UNIQUE` (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `crm_contacts`
--

DROP TABLE IF EXISTS `crm_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `crm_contacts` (
  `Id` varchar(45) NOT NULL,
  `AccountId` varchar(100) DEFAULT NULL,
  `OwnerId` varchar(100) DEFAULT NULL,
  `Title` varchar(100) DEFAULT NULL,
  `FirstName` varchar(100) DEFAULT NULL,
  `LastName` varchar(100) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `Department` varchar(100) DEFAULT NULL,
  `Metadata` blob,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `Id_UNIQUE` (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `crm_integrations`
--

DROP TABLE IF EXISTS `crm_integrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `crm_integrations` (
  `uid` varchar(45) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `crm_type` varchar(45) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `info` varchar(4000) NOT NULL,
  `uq` varchar(100) NOT NULL,
  `is_active` tinyint(4) unsigned NOT NULL DEFAULT '1',
  `connection_name` varchar(1000) DEFAULT NULL,
  `owner_names` blob,
  `owner_roles` blob,
  UNIQUE KEY `uid_UNIQUE` (`uid`),
  UNIQUE KEY `uq_UNIQUE` (`uq`),
  KEY `forgi_idx` (`organization_id`),
  CONSTRAINT `forgi` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `crm_opportunities`
--

DROP TABLE IF EXISTS `crm_opportunities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `crm_opportunities` (
  `id` varchar(36) NOT NULL,
  `AccountId` varchar(100) DEFAULT NULL,
  `Amount` bigint(20) DEFAULT NULL,
  `IsClosed` varchar(10) DEFAULT NULL,
  `IsWon` varchar(10) DEFAULT NULL,
  `OwnerId` varchar(100) DEFAULT NULL,
  `StageName` varchar(45) DEFAULT NULL,
  `Metadata` blob,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `crm_organizations`
--

DROP TABLE IF EXISTS `crm_organizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `crm_organizations` (
  `id` mediumint(40) NOT NULL AUTO_INCREMENT,
  `org_id` varchar(45) DEFAULT NULL,
  `instance_name` varchar(45) DEFAULT NULL,
  `name` varchar(45) DEFAULT NULL,
  `organization_type` varchar(45) DEFAULT NULL,
  `primary_contact` varchar(45) DEFAULT NULL,
  `country` varchar(45) DEFAULT NULL,
  `city` varchar(45) DEFAULT NULL,
  `integration_id` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_org_integration_idx` (`integration_id`),
  CONSTRAINT `fk_org_integration` FOREIGN KEY (`integration_id`) REFERENCES `crm_integrations` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `crm_roles`
--

DROP TABLE IF EXISTS `crm_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `crm_roles` (
  `uid` mediumint(45) NOT NULL AUTO_INCREMENT,
  `parents_role_id` varchar(45) DEFAULT NULL,
  `name` varchar(45) DEFAULT NULL,
  `role_id` varchar(45) DEFAULT NULL,
  `integration_id` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`uid`),
  KEY `ft_roles_integration_idx` (`integration_id`),
  CONSTRAINT `ft_roles_integration` FOREIGN KEY (`integration_id`) REFERENCES `crm_integrations` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `crm_users`
--

DROP TABLE IF EXISTS `crm_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `crm_users` (
  `Id` varchar(45) NOT NULL,
  `FirstName` varchar(100) DEFAULT NULL,
  `LastName` varchar(100) DEFAULT NULL,
  `Name` varchar(200) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `Username` varchar(45) DEFAULT NULL,
  `Metadata` blob,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `id_UNIQUE` (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `file_uploads`
--

DROP TABLE IF EXISTS `file_uploads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `file_uploads` (
  `uid` varchar(36) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `content_type` varchar(45) NOT NULL,
  `content_length` int(11) NOT NULL DEFAULT '0',
  `file_contents` longblob NOT NULL,
  `upload_type` varchar(45) NOT NULL,
  `account_id` int(11) DEFAULT '0' COMMENT 'OPTIONAL',
  `is_active` tinyint(4) unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`uid`),
  UNIQUE KEY `uid_UNIQUE` (`uid`),
  KEY `userid` (`account_id`),
  KEY `userupload` (`account_id`,`upload_type`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `org_account_associations`
--

DROP TABLE IF EXISTS `org_account_associations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `org_account_associations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `account_id` int(11) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `assoc_type` int(11) NOT NULL COMMENT '0 = admin\n1 = normal\n2 = read-only',
  `perm_level` int(11) NOT NULL DEFAULT '2',
  `is_active` tinyint(4) unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `org_assoc_idx` (`organization_id`),
  KEY `account_assoc_idx` (`account_id`),
  CONSTRAINT `account_assoc` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `org_assoc` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `org_invitations`
--

DROP TABLE IF EXISTS `org_invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `org_invitations` (
  `uid` varchar(45) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `email` varchar(45) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `assoc_type` int(11) NOT NULL,
  `invited_by_account_id` int(11) NOT NULL,
  `perm_level` int(11) NOT NULL DEFAULT '2',
  `is_active` tinyint(4) unsigned NOT NULL DEFAULT '1',
  UNIQUE KEY `emailorg` (`uid`) USING BTREE,
  KEY `invitedby_idx` (`invited_by_account_id`),
  KEY `inviteorg_idx` (`organization_id`),
  KEY `uidUQ` (`uid`),
  CONSTRAINT `invitedby` FOREIGN KEY (`invited_by_account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `inviteorg` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `organizations`
--

DROP TABLE IF EXISTS `organizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organizations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `is_active` tinyint(4) unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reset_pw_invitations`
--

DROP TABLE IF EXISTS `reset_pw_invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reset_pw_invitations` (
  `uid` varchar(36) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `account_id` int(11) NOT NULL,
  `is_active` tinyint(4) unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`uid`),
  UNIQUE KEY `id_UNIQUE` (`uid`),
  KEY `account_ref_idx` (`account_id`),
  CONSTRAINT `account_ref` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `respondents`
--

DROP TABLE IF EXISTS `respondents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `respondents` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `prospect_id` int(11) DEFAULT NULL,
  `survey_guid` char(14) NOT NULL,
  `user_agent` varchar(512) NOT NULL,
  `ip_addr` varchar(45) NOT NULL,
  `time_zone` int(11) NOT NULL,
  `is_active` tinyint(4) unsigned NOT NULL DEFAULT '1',
  `approval_guid` char(14) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `survey_assoc_idx` (`survey_guid`),
  CONSTRAINT `survey_assoc` FOREIGN KEY (`survey_guid`) REFERENCES `surveys` (`guid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER TABLE `respondents` AUTO_INCREMENT=98496;

--
-- Table structure for table `responses`
--

DROP TABLE IF EXISTS `responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `responses` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `respondent_id` bigint(20) unsigned NOT NULL,
  `survey_guid` char(14) NOT NULL,
  `name` varchar(50) NOT NULL,
  `response_md5` varchar(32) NOT NULL,
  `intval` int(11) DEFAULT NULL,
  `floatval` float DEFAULT NULL,
  `other_selected` tinyint(4) NOT NULL DEFAULT '0',
  `other_openend` varchar(256) DEFAULT NULL,
  `is_active` tinyint(4) unsigned NOT NULL DEFAULT '1',
  `openend` longtext,
  `_int0` int(11) DEFAULT NULL,
  `_int1` int(11) DEFAULT NULL,
  `_int2` int(11) DEFAULT NULL,
  `_int3` int(11) DEFAULT NULL,
  `_int4` int(11) DEFAULT NULL,
  `_int5` int(11) DEFAULT NULL,
  `_int6` int(11) DEFAULT NULL,
  `_int7` int(11) DEFAULT NULL,
  `_int8` int(11) DEFAULT NULL,
  `_int9` int(11) DEFAULT NULL,
  `_int10` int(11) DEFAULT NULL,
  `_int11` int(11) DEFAULT NULL,
  `_int12` int(11) DEFAULT NULL,
  `_int13` int(11) DEFAULT NULL,
  `_int14` int(11) DEFAULT NULL,
  `_int15` int(11) DEFAULT NULL,
  `_int16` int(11) DEFAULT NULL,
  `_int17` int(11) DEFAULT NULL,
  `_int18` int(11) DEFAULT NULL,
  `_int19` int(11) DEFAULT NULL,
  `_int20` int(11) DEFAULT NULL,
  `text0` varchar(256) DEFAULT NULL,
  `text1` varchar(256) DEFAULT NULL,
  `text2` varchar(256) DEFAULT NULL,
  `text3` varchar(256) DEFAULT NULL,
  `text4` varchar(256) DEFAULT NULL,
  `text5` varchar(256) DEFAULT NULL,
  `text6` varchar(256) DEFAULT NULL,
  `text7` varchar(256) DEFAULT NULL,
  `text8` varchar(256) DEFAULT NULL,
  `text9` varchar(256) DEFAULT NULL,
  `text10` varchar(256) DEFAULT NULL,
  `text11` varchar(256) DEFAULT NULL,
  `text12` varchar(256) DEFAULT NULL,
  `text13` varchar(256) DEFAULT NULL,
  `text14` varchar(256) DEFAULT NULL,
  `text15` varchar(256) DEFAULT NULL,
  `text16` varchar(256) DEFAULT NULL,
  `text17` varchar(256) DEFAULT NULL,
  `text18` varchar(256) DEFAULT NULL,
  `text19` varchar(256) DEFAULT NULL,
  `text20` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `respondents_assoc_idx` (`respondent_id`),
  KEY `survname` (`survey_guid`,`name`),
  CONSTRAINT `respondents_assoc` FOREIGN KEY (`respondent_id`) REFERENCES `respondents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `surveys`
--

DROP TABLE IF EXISTS `surveys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `surveys` (
  `guid` char(14) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `survey_model` blob NOT NULL,
  `name` varchar(50) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `theme` varchar(12) NOT NULL,
  `is_active` tinyint(4) unsigned NOT NULL DEFAULT '1',
  `survey_type` tinyint(4) NOT NULL,
  `opportunity_id` varchar(36) NOT NULL,
  PRIMARY KEY (`guid`),
  UNIQUE KEY `id_UNIQUE` (`guid`),
  KEY `org_assoc_idx` (`organization_id`),
  KEY `oppidlink_idx` (`opportunity_id`),
  CONSTRAINT `oppidlink` FOREIGN KEY (`opportunity_id`) REFERENCES `crm_opportunities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `org_assoc_sv` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2017-11-03 17:56:10
