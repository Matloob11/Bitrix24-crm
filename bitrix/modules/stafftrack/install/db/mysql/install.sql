create table if not exists b_stafftrack_shift (
	ID int auto_increment not null,
	USER_ID int not null,
	SHIFT_DATE date not null,
	DATE_CREATE datetime not null default now(),
	STATUS tinyint not null,
	LOCATION text null,
	PRIMARY KEY (ID),
	INDEX ix_st_shift_user_id (USER_ID),
	INDEX ix_st_shift_date (SHIFT_DATE),
	INDEX ix_st_shift_status (STATUS)
);

create table if not exists b_stafftrack_shift_geo (
	ID int auto_increment not null,
	SHIFT_ID int not null,
	IMAGE_URL text not null,
	ADDRESS text not null,
	PRIMARY KEY (ID),
	UNIQUE INDEX ux_st_shift_geo_shift_id (SHIFT_ID)
);

create table if not exists b_stafftrack_shift_cancellation (
	ID int auto_increment not null,
	SHIFT_ID int not null,
	REASON text not null,
	DATE_CANCEL datetime not null default now(),
	PRIMARY KEY (ID),
	UNIQUE INDEX ux_st_shift_cancellation_shift_id (SHIFT_ID)
);

create table if not exists b_stafftrack_option (
	ID int auto_increment not null,
	USER_ID int not null,
	NAME varchar(255) not null,
	VALUE varchar(255) not null,
	PRIMARY KEY (ID),
	UNIQUE INDEX ux_st_option_user_id_name (USER_ID, NAME)
);

create table if not exists b_stafftrack_counter (
	ID int auto_increment not null,
	USER_ID int not null,
	MUTE_STATUS tinyint not null default 0,
	MUTE_UNTIL datetime not null default now(),
	PRIMARY KEY (ID),
	UNIQUE INDEX ux_st_counter_user_id (USER_ID)
);

create table if not exists b_stafftrack_handled_chat (
	ID int auto_increment not null,
	CHAT_ID int not null,
	PRIMARY KEY (ID),
	INDEX ix_st_handled_chat_chat (CHAT_ID)
);

create table if not exists b_stafftrack_user_statistics_hash (
	ID int auto_increment not null,
	USER_ID int not null,
	HASH varchar(64) not null,
	PRIMARY KEY (ID),
	UNIQUE INDEX ix_st_user_statistics_hash_user_id (USER_ID)
);

create table if not exists b_stafftrack_shift_message (
	ID int auto_increment not null,
	SHIFT_ID int not null,
	MESSAGE_ID int not null,
	PRIMARY KEY (ID),
	INDEX ix_st_shift_message_shift_id (SHIFT_ID)
);

create table if not exists b_stafftrack_check_in (
	ID bigint auto_increment not null,
	USER_ID int not null,
	DATE_CREATE datetime not null default CURRENT_TIMESTAMP,
	ENTITY_TYPE int not null,
	LATITUDE TEXT NULL,
	LONGITUDE TEXT NULL,
	DESCRIPTION varchar(255) null,
	ADDRESS TEXT NULL,
	MESSAGE_IDS text NULL,
	USER_TIMEZONE INT null,
	FILE_IDS text NULL,
	PRIMARY KEY (ID),
	INDEX ix_st_check_in_user_date (USER_ID, DATE_CREATE),
	INDEX ix_st_check_in_date_user (DATE_CREATE, USER_ID)
);

create table if not exists b_stafftrack_address (
	GEOHASH_KEY varchar(64) not null,
	ADDRESS TEXT NULL,
	STATUS tinyint not null default 0,
	DATE_CREATE datetime not null default CURRENT_TIMESTAMP,
	DATE_RESOLVE datetime null,
	LAST_USED datetime not null default CURRENT_TIMESTAMP,
	PRIMARY KEY (GEOHASH_KEY),
	INDEX ix_st_addr_status (STATUS),
	INDEX ix_st_addr_last_used (LAST_USED)
);

create table if not exists b_stafftrack_address_queue (
	CHECK_IN_ID bigint not null,
	VIEWER_ID int not null default 0,
	GEOHASH_KEY varchar(64) not null,
	USER_ID int not null,
	DATE_CREATE datetime not null,
	PRIMARY KEY (CHECK_IN_ID, VIEWER_ID),
	INDEX ix_st_addr_queue_geohash_key (GEOHASH_KEY)
);

create table if not exists b_stafftrack_check_in_by_day (
	ID int auto_increment not null,
	USER_ID int not null,
	DATE_CREATE datetime not null default CURRENT_TIMESTAMP,
	DATE_END datetime not null default CURRENT_TIMESTAMP,
	GEO_DATA longtext,
	CNT int default 0,
	PRIMARY KEY (ID),
	INDEX ix_st_check_in_by_day_user_date (USER_ID, DATE_CREATE, DATE_END)
);

create table if not exists b_stafftrack_check_in_daily_stats (
	ID int auto_increment not null,
	USER_ID int not null,
	LOCAL_DATE date not null,
	CNT int not null default 0,
	HAS_OPEN_ENTER tinyint not null default 0,
	LAST_CHECK_IN_ID bigint not null default 0,
	PRIMARY KEY (ID),
	UNIQUE INDEX ux_st_check_in_daily_stats_user_date (USER_ID, LOCAL_DATE)
);
