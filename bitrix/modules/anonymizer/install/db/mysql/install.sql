CREATE TABLE IF NOT EXISTS b_anonymizer_quest
(
	ID int NOT NULL AUTO_INCREMENT,
	PROVIDER_CLASS varchar(255) not null,
	PROVIDER_DATA mediumtext default null,
	HANDLER_CLASS varchar(255) not null,
	MODULE_ID varchar(255) not null,
	primary key (ID)
);

CREATE TABLE IF NOT EXISTS b_anonymizer_request
(
	ID int NOT NULL AUTO_INCREMENT,
	QUEST_ID int(11) not null,
	COMMAND varchar(64) not null,
	HASH varchar(64) default null,
	RESULT mediumtext default null,
	ERROR text default null,
	primary key (ID),
	unique key UX_HASH (HASH)
);

CREATE TABLE IF NOT EXISTS b_anonymizer_replacements
(
	ID int NOT NULL AUTO_INCREMENT,
	QUEST_ID int(11) not null,
	CODE varchar(255) not null,
	TEXT varchar(1000) not null,
	LABEL varchar(255) not null,
	START int(11) not null,
	END int(11) not null,
	primary key (ID)
);