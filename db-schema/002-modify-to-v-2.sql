
user time; 
ALTER TABLE `time`.`tblrequestqueuevac` 
CHANGE COLUMN `requeststatuschange` `requeststatuschange` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP ;


ALTER TABLE `time`.`tblrequestqueuevac` 
CHANGE COLUMN `userid` `userid` INT(11) NOT NULL ,
CHANGE COLUMN `requesttimestart` `requesttimestart` DATETIME NOT NULL ,
CHANGE COLUMN `requesttimeto` `requesttimeto` DATETIME NOT NULL ,
DROP PRIMARY KEY,
ADD PRIMARY KEY (`userid`, `requesttimestart`, `requesttimeto`);


