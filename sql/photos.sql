CREATE TABLE IF NOT EXISTS `photos` (
  `id` int(11) NOT NULL,
  `name` varchar(2000) NOT NULL,
  `tags`varchar(2000) NULL,
  `album_id` int(11) NOT NULL DEFAULT '0'
);
 
ALTER TABLE `photos` ADD PRIMARY KEY (`id`);
ALTER TABLE `photos` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;