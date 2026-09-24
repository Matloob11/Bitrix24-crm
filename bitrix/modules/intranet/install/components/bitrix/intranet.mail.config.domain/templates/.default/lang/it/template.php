<?
$MESS["INTR_MAIL_AJAX_ERROR"] = "Errore nell'esecuzione della query";
$MESS["INTR_MAIL_CHECK_JUST_NOW"] = "secondi fa";
$MESS["INTR_MAIL_CHECK_TEXT"] = "Ultimo controllo il #DATE#";
$MESS["INTR_MAIL_CHECK_TEXT_NA"] = "Nessun dato per lo stato del dominio";
$MESS["INTR_MAIL_CHECK_TEXT_NEXT"] = "Controllo posta successivo il #DATE#";
$MESS["INTR_MAIL_DOMAINREMOVE_CONFIRM"] = "Disconnettere il dominio?";
$MESS["INTR_MAIL_DOMAINREMOVE_CONFIRM_TEXT"] = "Scollegare il dominio?<br>Anche tutte le caselle di posta aggiunte al portale saranno rimosse!";
$MESS["INTR_MAIL_DOMAIN_BAD_NAME"] = "nome non valido";
$MESS["INTR_MAIL_DOMAIN_BAD_NAME_HINT"] = "Il nome di dominio può includere caratteri latini, cifre e trattini; non può iniziare o terminare con un trattino, né ripetere il trattino alle posizioni 3 e 4. Termina il nome con <b>.ru</b>.";
$MESS["INTR_MAIL_DOMAIN_CHECK"] = "Verifica";
$MESS["INTR_MAIL_DOMAIN_CHOOSE_HINT"] = "Scegli un nome nel dominio .ru";
$MESS["INTR_MAIL_DOMAIN_CHOOSE_TITLE"] = "Scegli dominio";
$MESS["INTR_MAIL_DOMAIN_EMPTY_NAME"] = "inserisci nome";
$MESS["INTR_MAIL_DOMAIN_EULA_CONFIRM"] = "Accetto i termini del <a href=\"http://www.bitrix24.ru/about/domain.php\" target=\"_blank\">Contratto di licenza</a>";
$MESS["INTR_MAIL_DOMAIN_HELP"] = "Se non hai un dominio configurato per l'uso con Yandex Hosted E-Mail, provvedi ora.
<br/><br/>
- <a href=\"https://passport.yandex.com/registration/\" target=\"_blank\">Crea un account Yandex Hosted E-Mail</a> oppure utilizza una casella di posta esistente se la possiedi.
- <a href=\"https://pdd.yandex.ru/domains_add/\" target=\"_blank\">Aggiungi il tuo dominio</a> a Yandex Hosted E-Mail<sup> (<a href=\"http://help.yandex.ru/pdd/add-domain/add-exist.xml\" target=\"_blank\" title=\"How do I do it?\">?</a>)</sup><br/>
- Verifica la proprietà del tuo dominio <sup>(<a href=\"http://help.yandex.ru/pdd/confirm-domain.xml\" target=\"_blank\" title=\"How do I do it?\">?</a>)</sup><br/>
- Configura i record MX <sup>(<a href=\"http://help.yandex.ru/pdd/records.xml#mx\" target=\"_blank\" title=\"How do I do it?\">?</a>)</sup> o delega il tuo dominio a Yandex <sup>(<a href=\"http://help.yandex.ru/pdd/hosting.xml#delegate\" target=\"_blank\" title=\"How do I do it?\">?</a>)</sup>
<br/><br/>
Una volta configurato il tuo account Yandex Hosted E-Mail, aggiungi il dominio al tuo Bitrix24:
<br/><br/>
- <a href=\"https://pddimp.yandex.ru/api2/admin/get_token\" target=\"_blank\" onclick=\"window.open(this.href, '_blank', 'height=480,width=720,top='+parseInt(screen.height/2-240)+',left='+parseInt(screen.width/2-360)); return false; \">Ottieni un token</a> (riempi i campi del modulo e clicca su \"Ottieni un token&quot;. Quando il token appare, copialo negli Appunti)<br/>
- Aggiungi il dominio e il token ai parametri.";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1"] = "Passaggio&nbsp;1.&nbsp;&nbsp;Conferma proprietà del dominio";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_A"] = "Carica un file denominato <b>#SECRET_N#.html</b> nella directory principale del tuo sito web. Il file deve contenere il testo: <b>#SECRET_C#</b>";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_B"] = "Per configurare il record CNAME, devi avere accesso in scrittura ai record DNS del tuo dominio sulla funzione di registrazione o sul servizio di web hosting con il quale hai registrato il tuo dominio. Troverai queste impostazioni nel tuo account o nel pannello di controllo.";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_B_NAME"] = "Nome record: ";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_B_NAMEV"] = "<b>yamail-#SECRET_N#</b> (o <b>yamail-#SECRET_N#.#DOMAIN#.</b>, in base all'interfaccia. Non dimenticare il punto alla fine.)";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_B_PROMPT"] = "Specifica questi valori:";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_B_TYPE"] = "Tipo record: ";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_B_VALUE"] = "Valore: ";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_B_VALUEV"] = "<b>mail.yandex.ru.</b> (di nuovo, nota il punto)";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_C"] = "Imposta l'indirizzo e-mail del contatto nelle info di registrazione del dominio su <b>#SECRET_N#@yandex.ru</b>. Usa il pannello di controllo della funzione di registrazione per impostare l'indirizzo e-mail.";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_C_HINT"] = "Modifica questo indirizzo nella tua e-mail reale non appena il dominio è confermato.";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_HINT"] = "In caso di dubbi sulla verifica della proprietà del dominio, contatta l'helpdesk all'indirizzo <a href=\"https://helpdesk.bitrix24.com/\" target=\"_blank\">helpdesk.bitrix24.com</a>.";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_OR"] = "o";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_PROMPT"] = "Devi confermare di essere il proprietario del nome di dominio specificato utilizzando uno dei seguenti metodi:";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2"] = "Passaggio&nbsp;2.&nbsp;&nbsp;Configura record MX";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2_HINT"] = "Elimina tutti gli altri record MX e TXT che non sono correlati a Yandex. Le modifiche apportate ai record MX potrebbero richiedere da un paio di ore a tre giorni per consentire un aggiornamento complessivo in Internet.";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2_MXPROMPT"] = "Crea un nuovo record MX con i seguenti parametri:";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2_NAME"] = "Nome record:";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2_NAMEV"] = "<b>@</b> (o <b>#DOMAIN#.</b>, se richiesto. Non dimenticare il punto alla fine)";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2_PRIORITY"] = "Priorità: ";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2_PROMPT"] = "Dopo aver confermato la proprietà del dominio, dovrai modificare i record MX corrispondenti sul tuo hosting web.";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2_TITLE"] = "Configura record MX";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2_TYPE"] = "Tipo record:";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2_VALUE"] = "Valore:";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2_VALUEV"] = "<b>mx.yandex.net.</b>";
$MESS["INTR_MAIL_DOMAIN_INSTR_TITLE"] = "Per connettere il tuo dominio a Bitrix24, sono necessari alcuni passaggi.";
$MESS["INTR_MAIL_DOMAIN_LONG_NAME"] = "max. 63 caratteri prima di .ru";
$MESS["INTR_MAIL_DOMAIN_NAME_FREE"] = "questo nome è disponibile";
$MESS["INTR_MAIL_DOMAIN_NAME_OCCUPIED"] = "questo nome non è disponibile";
$MESS["INTR_MAIL_DOMAIN_NOCONFIRM"] = "Dominio non confermato";
$MESS["INTR_MAIL_DOMAIN_NOMX"] = "Record MX non configurati";
$MESS["INTR_MAIL_DOMAIN_REG_CONFIRM_TEXT"] = "Una volta connesso, non potrai modificare il nome del dominio<br>o ottenere un altro nome poiché puoi registrare<br>un solo dominio per il tuo Bitrix24.<br><br>Se trovi che il nome <b>#DOMAIN#</b> sia corretto, conferma il nuovo dominio.";
$MESS["INTR_MAIL_DOMAIN_REG_CONFIRM_TITLE"] = "Verifica di aver inserito correttamente il nome di dominio.";
$MESS["INTR_MAIL_DOMAIN_REMOVE"] = "Scollega";
$MESS["INTR_MAIL_DOMAIN_SAVE"] = "Salva";
$MESS["INTR_MAIL_DOMAIN_SAVE2"] = "Aggiungi";
$MESS["INTR_MAIL_DOMAIN_SETUP_HINT"] = "Il nome di dominio potrebbe richiedere da 1 ora a diversi giorni per la conferma.";
$MESS["INTR_MAIL_DOMAIN_SHORT_NAME"] = "almeno due caratteri prima di .ru";
$MESS["INTR_MAIL_DOMAIN_STATUS_CONFIRM"] = "Confermato";
$MESS["INTR_MAIL_DOMAIN_STATUS_NOCONFIRM"] = "Non confermato";
$MESS["INTR_MAIL_DOMAIN_STATUS_NOMX"] = "Record MX non configurati";
$MESS["INTR_MAIL_DOMAIN_STATUS_TITLE"] = "Stato link dominio";
$MESS["INTR_MAIL_DOMAIN_STATUS_TITLE2"] = "Dominio confermato";
$MESS["INTR_MAIL_DOMAIN_SUGGEST_MORE"] = "Mostra altre opzioni";
$MESS["INTR_MAIL_DOMAIN_SUGGEST_TITLE"] = "Cerca un altro nome o scegline uno";
$MESS["INTR_MAIL_DOMAIN_SUGGEST_WAIT"] = "Ricerca di possibili nomi...";
$MESS["INTR_MAIL_DOMAIN_TITLE"] = "Se il tuo dominio è configurato per funzionare in Yandex.Mail per domini, inserisci il nome di dominio e il token nel modulo seguente";
$MESS["INTR_MAIL_DOMAIN_TITLE2"] = "Il dominio è ora collegato al tuo portale";
$MESS["INTR_MAIL_DOMAIN_TITLE3"] = "Dominio per la tua e-mail";
$MESS["INTR_MAIL_DOMAIN_WAITCONFIRM"] = "In attesa di conferma";
$MESS["INTR_MAIL_DOMAIN_WAITMX"] = "Record MX non configurati";
$MESS["INTR_MAIL_DOMAIN_WHOIS"] = "Controlla";
$MESS["INTR_MAIL_GET_TOKEN"] = "ottieni";
$MESS["INTR_MAIL_INP_CANCEL"] = "Annulla";
$MESS["INTR_MAIL_INP_DOMAIN"] = "Nome di dominio";
$MESS["INTR_MAIL_INP_PUBLIC_DOMAIN"] = "I dipendenti possono registrare caselle di posta in questo dominio";
$MESS["INTR_MAIL_INP_TOKEN"] = "Token";
$MESS["INTR_MAIL_MANAGE"] = "Configura caselle di posta dipendente";
?>