<?php
$MESS["SECURITY_INSTALL_SMS_EVENT_OTP_CONFIRM_DESC"] = "#USER_PHONE# - телефон нөмірі
#CODE# - растау коды";
$MESS["SECURITY_INSTALL_SMS_EVENT_OTP_CONFIRM_NAME"] = "СМС арқылы кіруді растау";
$MESS["SECURITY_INSTALL_SMS_TEMPLATE_OTP_CONFIRM_MESS"] = "#CODE# — Битрикс24 кіру үшін растау коды";
$MESS["SEC_EVENT_USER_OTP_CONFIRM_DESC"] = "#USER_ID# - пайдаланушы ID-і
#EMAIL# - Бір реттік құпиясөз ұщін резервтік email
#LOGIN# - Логин
#CODE# - Растау коды
#DATE# - Күні және уақыты";
$MESS["SEC_EVENT_USER_OTP_CONFIRM_NAME"] = "Резервтік еmailдің көшірмесін растау";
$MESS["SEC_EVENT_USER_OTP_DESC"] = "#USER_ID# - Пайдаланушы  ID-і
#EMAIL# - Бір реттік құпиясөзге арналған резервтік email
#LOGIN# - Логин
#CODE# - Бір реттік құпиясөз
#DATE# - Күні мен уақыты
#DEVICE# - Құрылғы түрі
#BROWSER# - Браузер атауы
#PLATFORM# - Платформа
#DEVICE_INFO# - Құрылғы туралы біріктірілген ақпарат
#USER_AGENT# - Браузердің User Agent 
#IP# - IP-мекенжайы
#COUNTRY# - Ел
#REGION# - Аймақ
#CITY# - Қала
#LOCATION# -  Біріктірілген орын
#HELP_URL# - Құжаттамаға сілтеме";
$MESS["SEC_EVENT_USER_OTP_NAME"] = "Бір реттік құпиясөз";
$MESS["SEC_TEMPLATE_USER_OTP_CONFIRM_MESSAGE"] = "Поштаны растау үшін кодты көшіріп, оны Битрикс24-ке қойыңыз:
				
#CODE#
				
Егер сіз бұл электрондық хатты қате алсаңыз, оны елемеңіз.

Сіздің Битрикс24: #SERVER_NAME#
Кіру үшін логин: #LOGIN#
Күні: #DATE#";
$MESS["SEC_TEMPLATE_USER_OTP_CONFIRM_SUBJECT"] = "#SITE_NAME#: поштаны растау коды";
$MESS["SEC_TEMPLATE_USER_OTP_MESSAGE"] = "Сіздің #SERVER_NAME# аккаунтыңызға кіру жасалды және бір реттік құпиясөз сұралды:
				
#CODE#
				
Деректерді тексеріп, оның сіз екеніңізге көз жеткізіңіз.

Күні: #DATE#
Логин: #LOGIN#
Құрылғы: #DEVICE_INFO#
Браузер: #USER_AGENT#
IP мекенжайы: #IP#
Орналасқан жері: #LOCATION#

Егер бұл сіз болмасаңыз, құпиясөзді мүмкіндігінше тезірек өзгертуді ұсынамыз. 

Аккаунтты қорғау туралы толығырақ: #HELP_URL#";
$MESS["SEC_TEMPLATE_USER_OTP_SUBJECT"] = "#SITE_NAME#: Бір реттік құпиясөз";
$MESS["VIRUS_DETECTED_DESC"] = "#EMAIL# - сайт әкімшісінің E-Mail-і (бас модуль баптауларынан)";
$MESS["VIRUS_DETECTED_MESSAGE"] = "#SITE_NAME# сайтының ақпараттық хабарламасы
------------------------------------------

Сәлеметсіз бе!

Сіз бұл хабарламаны #SERVER_NAME# проактивті серверді қорғау модулі вирусқа ұқсас кодты тапқандықтан алып отырсыз.

1. Күдікті код html-ден қиылып тасталды.
2. Басып кіру журналын тексеріп, кодтың кез-келген санауыш немесе фреймворк коды емес, шынымен зиянды екеніне көз жеткізіңіз.
 (сілтеме: http://#SERVER_NAME#/bitrix/admin/event_log.php?lang=ru&set_filter=Y&find_type=audit_type_id&find_audit_type[]=SECURITY_VIRUS )
3. Егер код қауіпті болмаса, оны антивирусты баптау бетіндегі ерекшеліктерге қосыңыз.
 (сілтеме: http://#SERVER_NAME#/bitrix/admin/security_antivirus.php?lang=ru&tabControl_active_tab=exceptions )
4. Егер код вирустық болса, келесі әрекеттерді орындау қажет:

 а) әкімшілер мен жауапты қызметкерлердің сайтқа кіру құпиясөздерін өзгертіңіз.
 б) Ssh және ftp арқылы кіру құпиясөздерін өзгертіңіз.
 в) Ssh немесе ftp арқылы сайтқа кірген әкімшілердің компьютерлерін тексеріңіз және қалпына келтіріңіз.
 г) Ssh және ftp арқылы сайтқа кіру бағдарламаларында құпиясөздерді сақтауды өшіріңіз.
 д) Вирус жұққан файлдардан зиянды кодты жойыңыз. Мысалы, зақымдалған файлдарды ең жаңа резервтік көшірмеден қалпына келтіріңіз.

---------------------------------------------------------------------
Хабарлама автоматты түрде жазылды.
";
$MESS["VIRUS_DETECTED_NAME"] = "Вирус анықталды";
$MESS["VIRUS_DETECTED_SUBJECT"] = "#SITE_NAME#: Вирус анықталды";
