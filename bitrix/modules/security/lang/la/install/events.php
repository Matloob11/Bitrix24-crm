<?php
$MESS["SECURITY_INSTALL_SMS_TEMPLATE_OTP_CONFIRM_MESS"] = "#CODE# es el código de confirmación para el inicio de sesión de Bitrix24.";
$MESS["SEC_TEMPLATE_USER_OTP_CONFIRM_MESSAGE"] = "Copie el código y péguelo en su Bitrix24:
				
#CODE#
				
Ignore este mensaje si no lo esperaba.

Su Bitrix24: #SERVER_NAME#
Inicio de sesión: #LOGIN#
Fecha: #DATE#";
$MESS["SEC_TEMPLATE_USER_OTP_CONFIRM_SUBJECT"] = "#SITE_NAME#: Código de confirmación por correo electrónico";
$MESS["SEC_TEMPLATE_USER_OTP_MESSAGE"] = "Alguien inició sesión en su cuenta en #SERVER_NAME# y solicitó una contraseña de un solo uso:
				
#CODE#
				
Verifique la siguiente información y asegúrese de que fue usted.

Fecha: #DATE#
Usuario: #LOGIN#
Dispositivo: #DEVICE_INFO#
Navegador: #USER_AGENT#
Dirección IP: #IP#
Ubicación: #LOCATION#

Si no puede confirmar que fue usted, cambie su contraseña lo más pronto posible.

Obtenga más información sobre la seguridad de la cuenta aquí: #HELP_URL#";
$MESS["SEC_TEMPLATE_USER_OTP_SUBJECT"] = "#SITE_NAME#: Contraseña de un solo uso";
$MESS["VIRUS_DETECTED_DESC"] = "#EMAIL# - Dirección de e-mail del administrador del sitio web (desde las configuraciones del Módulo Principal)";
$MESS["VIRUS_DETECTED_MESSAGE"] = "Mensaje informativo de #SITE_NAME#
------------------------------------------
Usted recibe este mensaje debido a que la Protección Proactiva ha #SERVER_NAME# ha detectado un código potencialmente peligroso.
1.  El código potencialmente peligroso, ha sido retirado del sitio web.
2. Revise el log de eventos para asegurarse de que el código es realmente perjudicial, y no se trata de un simple contador o framework.
  (link: http://#SERVER_NAME#/bitrix/admin/event_log.php?lang=la&set_filter=Y&find_type=audit_type_id&find_audit_type[]=SECURITY_VIRUS)
3.  Si el código no es peligroso, agréguelo en el listado de excepciones en la página de configuraciones del Antivirus.
  (link: http://#SERVER_NAME#/bitrix/admin/security_antivirus.php?lang=la&tabControl_active_tab=exceptions )
4.  Si el código es un virus. Complete los siguientes pasos:

        a) Cambie la contraseña del administrador y de otras personas responsables del sitio web.
        b) Cambie el login, y contraseña de los accesos ssh y ftp. 
        c) Compruebe y elimine el virus de las computadoras de los administradores que tienen accesos ssh o ftp al sitio web.
         d) Cambie a apagado el guardado de contraseñas en programas que proveen acceso al sitio web mediante ssh o ftp. 
        e) Elimine el código peligros desde los archivos infectados. Por ejemplo, reinstale los archivos infectados usando el más reciente backup realizado. 

---------------------------------------------------------------------
  Este mensaje se generó automáticamente.";
$MESS["VIRUS_DETECTED_NAME"] = "Virus detectado";
$MESS["VIRUS_DETECTED_SUBJECT"] = "#SITE_NAME#:  Virus detectado";
