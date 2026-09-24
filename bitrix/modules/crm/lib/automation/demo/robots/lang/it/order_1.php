<?
$MESS["CRM_AUTOMATION_DEMO_ORDER_1_ALLOW_DELIVERY_TITLE"] = "Consenti consegna";
$MESS["CRM_AUTOMATION_DEMO_ORDER_1_EMAIL_TITLE"] = "Invia messaggio";
$MESS["CRM_AUTOMATION_DEMO_ORDER_1_FOOTER"] = "Cordiali saluti,<br> #A1#Online store#A2#";
$MESS["CRM_AUTOMATION_DEMO_ORDER_1_MAIL_1_BODY"] = "<p style=\"margin-top:30px; margin-bottom: 28px; font-weight: bold; font-size: 19px;\">
Gentile {=Document:CONTACT.NAME} {=Document:CONTACT.SECOND_NAME} {=Document:CONTACT.LAST_NAME},
</p>
<p style=\"margin-top: 0; margin-bottom: 20px; line-height: 20px;\">
il tuo ordine {=Document:ACCOUNT_NUMBER} del {=Document:DATE_INSERT} è stato confermato.<br>
<br>
Totale ordine: {=Document:PRICE_FORMATTED}.<br>
<br>
Puoi tracciare lo stato del tuo ordine dal tuo account su {=Document:SHOP_TITLE}.<br>
<br>
Nota che avrai bisogno dell'ID di accesso e la password che hai utilizzato per registrarti su {=Document:SHOP_TITLE}.<br>
<br>
Se desideri annullare il tuo ordine, puoi farlo dal tuo account personale.<br>
<br>
Assicurati di menzionare il tuo numero d'ordine {=Document:ACCOUNT_NUMBER} nel caso in cui contattassi l'amministrazione di {=Document:SHOP_TITLE}.<br>
<br>
Ti ringraziamo per il tuo ordine!<br>
</p>";
$MESS["CRM_AUTOMATION_DEMO_ORDER_1_MAIL_1_TITLE"] = "Hai effettuato un ordine con {=Document:SHOP_TITLE}";
$MESS["CRM_AUTOMATION_DEMO_ORDER_1_MAIL_2_BODY"] = "<p style=\"margin-top:30px; margin-bottom: 28px; font-weight: bold; font-size: 19px;\">
Gentile {=Document:CONTACT.NAME} {=Document:CONTACT.SECOND_NAME} {=Document:CONTACT.LAST_NAME},
</p>
<p style=\"margin-top: 0; margin-bottom: 20px; line-height: 20px;\">
hai effettuato l'ordine {=Document:ACCOUNT_NUMBER} il {=Document:DATE_INSERT} per {=Document:PRICE_FORMATTED}.<br>
<br>
Sfortunatamente, non hai ancora inviato il pagamento.<br>
<br>
Puoi tracciare lo stato del tuo ordine dal tuo account su {=Document:SHOP_TITLE}.<br>
<br>
Nota che avrai bisogno dell'ID di accesso e la password che hai utilizzato per registrarti su {=Document:SHOP_TITLE}.<br>
<br>
Se desideri annullare il tuo ordine, puoi farlo dal tuo account personale.<br>
<br>
Assicurati di menzionare il tuo numero d'ordine {=Document:ACCOUNT_NUMBER} nel caso in cui contattassi l'amministrazione di {=Document:SHOP_TITLE}.<br>
<br>
Ti ringraziamo per il tuo ordine!<br>
</p>";
$MESS["CRM_AUTOMATION_DEMO_ORDER_1_MAIL_2_TITLE"] = "Non dimenticare di pagare il tuo ordine con {=Document:SHOP_TITLE}";
$MESS["CRM_AUTOMATION_DEMO_ORDER_1_MAIL_3_BODY"] = "<p style=\"margin-top:30px; margin-bottom: 28px; font-weight: bold; font-size: 19px;\">
L'ordine {=Document:ACCOUNT_NUMBER} del {=Document:DATE_INSERT} è stato pagato.
</p>
<p style=\"margin-top: 0; margin-bottom: 20px; line-height: 20px;\">
Usa questo link per maggiori informazioni: {=Document:SHOP_PUBLIC_URL}
</p>";
$MESS["CRM_AUTOMATION_DEMO_ORDER_1_MAIL_3_TITLE"] = "Il tuo pagamento per l'ordine con {=Document:SHOP_TITLE}";
$MESS["CRM_AUTOMATION_DEMO_ORDER_1_MAIL_4_BODY"] = "<p style=\"margin-top:30px; margin-bottom: 28px; font-weight: bold; font-size: 19px;\">
L'ordine {=Document:ACCOUNT_NUMBER} del {=Document:DATE_INSERT} è stato annullato.
</p>
<p style=\"margin-top: 0; margin-bottom: 20px; line-height: 20px;\">
{=Document:REASON_CANCELED}<br>
<br>
Usa questo link per maggiori informazioni: {=Document:SHOP_PUBLIC_URL}
</p>";
$MESS["CRM_AUTOMATION_DEMO_ORDER_1_MAIL_4_TITLE"] = "{=Document:SHOP_TITLE}: Annulla ordine {=Document:ACCOUNT_NUMBER}";
$MESS["CRM_AUTOMATION_DEMO_ORDER_1_NEW_ORDER_PAYMENT_TITLE"] = "{=Document:SHOP_TITLE}: Promemoria pagamento ordine {=Document:ACCOUNT_NUMBER}";
$MESS["CRM_AUTOMATION_DEMO_ORDER_1_NEW_ORDER_TITLE"] = "{=Document:SHOP_TITLE}: Nuovo ordine {=Document:ACCOUNT_NUMBER}";
$MESS["CRM_AUTOMATION_DEMO_ORDER_1_ORDER_CANCELED_TITLE"] = "{=Document:SHOP_TITLE}: Annulla ordine {=Document:ACCOUNT_NUMBER}";
$MESS["CRM_AUTOMATION_DEMO_ORDER_1_ORDER_PAYED_TITLE"] = "{=Document:SHOP_TITLE}: Ordine {=Document:ACCOUNT_NUMBER} pagato.";
?>