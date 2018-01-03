
user time; 
ALTER TABLE `time`.`tblrequestqueuevac` 
CHANGE COLUMN `requeststatuschange` `requeststatuschange` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP ;


-- ensuring uniqueness of keys

DELETE t1 FROM `time`.`tblrequestqueuevac` t1
        INNER JOIN
    `time`.`tblrequestqueuevac` t2 
WHERE
    t1.requestid > t2.requestid AND t1.requesttimestart = t2.requesttimestart;

ALTER TABLE `time`.`tblrequestqueuevac` 
CHANGE COLUMN `userid` `userid` INT(11) NOT NULL ,
CHANGE COLUMN `requesttimestart` `requesttimestart` DATETIME NOT NULL ,
CHANGE COLUMN `requesttimeto` `requesttimeto` DATETIME NOT NULL ,
DROP PRIMARY KEY,
ADD PRIMARY KEY (`userid`, `requesttimestart`, `requesttimeto`);


