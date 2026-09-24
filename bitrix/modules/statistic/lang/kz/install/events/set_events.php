<?php
$MESS["STATISTIC_ACTIVITY_EXCEEDING_DESC"] = "#ACTIVITY_TIME_LIMIT# - тестілік уақыт аралығы
#ACTIVITY_HITS# - тестілік уақыт аралығындағы хиттер саны
#ACTIVITY_HITS_LIMIT# - тестілік уақыт аралығындағы максималды хиттер саны (белсенділік шегі)
#ACTIVITY_EXCEEDING# - хит санының асып кетуі
#CURRENT_TIME# - бұғаттау сәті (сервердегі уақыт)
#DELAY_TIME# - бұғаттау ұзақтығы
#USER_AGENT# - UserAgent
#SESSION_ID# - сессия ID 
#SESSION_LINK# - сессияға сілтеме
#SERACHER_ID# - іздеу жүйесінің ID-і
#SEARCHER_NAME# - іздеу жүйесінің атауы
#SEARCHER_LINK# - іздеу жүйесінің хиттер тізіміне сілтеме
#VISITOR_ID# - келушінің ID нөмірі
#VISITOR_LINK# - келуші профиліне сілтеме
#STOPLIST_LINK# - келушіні тоқтату тізіміне қосу үшін сілтеме 
";
$MESS["STATISTIC_ACTIVITY_EXCEEDING_MESSAGE"] = "#SERVER_NAME# сайтында келуші белгіленген белсенділік шегінен асты.

#CURRENT_TIME# бастап келуші #DELAY_TIME# секундқа бұғатталды.

Белсенділік - #ACTIVITY_HITS# хит #ACTIVITY_TIME_LIMIT# секундта. (шектеу - #ACTIVITY_HITS_LIMIT#)
Келуші  - #VISITOR_ID#
Сессия      - #SESSION_ID#
Іздеу жүйесі   - [#SERACHER_ID#] #SEARCHER_NAME#
UserAgent   - #USER_AGENT#

>===============================================================================================
Тоқтату тізіміне қосу үшін төмендегі сілтемені пайдаланыңыз:
http://#SERVER_NAME##STOPLIST_LINK#
Келушінің сессиясын көру үшін төмендегі сілтемені пайдаланыңыз:
http://#SERVER_NAME##SESSION_LINK#
Келушінің профилін көру үшін төмендегі сілтемені пайдаланыңыз:
http://#SERVER_NAME##VISITOR_LINK#
Іздеу жүйесінің хиттері статистикасын көру үшін келесі сілтемені пайдаланыңыз:
http://#SERVER_NAME##SEARCHER_LINK#
";
$MESS["STATISTIC_ACTIVITY_EXCEEDING_NAME"] = "Белсенділік шегінен асып кету";
$MESS["STATISTIC_ACTIVITY_EXCEEDING_SUBJECT"] = "#SERVER_NAME#: Белсенділік шегі асып кетті";
$MESS["STATISTIC_DAILY_REPORT_DESC"] = "#EMAIL_TO# - сайт әкімшісінің электрондық поштасы
#SERVER_TIME# - есеп жіберілген сәттегі сервердегі уақыт
#HTML_HEADER# - HTML тегін ашу + CSS стильдері
#HTML_COMMON# - сайтқа кіру статистикасы кестесі (хиттер, сессиялар, хосттар, келушілер, оқиғалар) (HTML)
#HTML_ADV# - жарнамалық науқандар кестесі (ТОП 10) (HTML)
#HTML_EVENTS# - оқиғалар түрлерінің кестесі (ТОП 10) (HTML)
#HTML_REFERERS# - сілтеме жасайтын сайттар кестесі (ТОП 10) (HTML)
#HTML_PHRASES# - іздеу сөйлемдерінің кестесі (TOP 10) (HTML)
#HTML_SEARCHERS# - сайтты индекстеу кестесі (TOP 10) (HTML)
#HTML_FOOTER# - HTML тегін жабу
";
$MESS["STATISTIC_DAILY_REPORT_MESSAGE"] = "#HTML_HEADER#
<font class='h2'>Сайттың жалпы статистикасы <font color='#A52929'>#SITE_NAME#</font><br>
Деректер <font color='#0D716F'>#SERVER_TIME#</font></font>
<br><br>
<a class='tablebodylink' href='http://#SERVER_NAME#/bitrix/admin/stat_list.php?lang=#LANGUAGE_ID#'>http://#SERVER_NAME#/bitrix/admin/stat_list.php?lang=#LANGUAGE_ID#</a>
<br>
<hr><br>
#HTML_COMMON#
<br>
#HTML_ADV#
<br>
#HTML_REFERERS#
<br>
#HTML_PHRASES#
<br>
#HTML_SEARCHERS#
<br>
#HTML_EVENTS#
<br>
<hr>
<a class='tablebodylink' href='http://#SERVER_NAME#/bitrix/admin/stat_list.php?lang=#LANGUAGE_ID#'>http://#SERVER_NAME#/bitrix/admin/stat_list.php?lang=#LANGUAGE_ID#</a>
#HTML_FOOTER#
";
$MESS["STATISTIC_DAILY_REPORT_NAME"] = "Сайттың күнделікті статистикасы";
$MESS["STATISTIC_DAILY_REPORT_SUBJECT"] = "#SERVER_NAME#: Сайт статистикасы (#SERVER_TIME#)";
