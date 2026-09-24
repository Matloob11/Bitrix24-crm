<?php

/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2026 Bitrix
 */

use Bitrix\Main;
use Bitrix\Main\Session\Legacy\HealerEarlySessionStart;
use Bitrix\Main\Config\Option;
use Dev\Main\Migrator\ModuleUpdater;

require_once __DIR__ . '/start.php';

$application = Main\HttpApplication::getInstance();
$application->initialize([
	'get' => $_GET,
	'post' => $_POST,
	'files' => $_FILES,
	'cookie' => $_COOKIE,
	'server' => $_SERVER,
	'env' => $_ENV
]);

if (class_exists('\Dev\Main\Migrator\ModuleUpdater'))
{
	ModuleUpdater::checkUpdates('main', __DIR__);
}

if (!Main\ModuleManager::isModuleInstalled('bitrix24'))
{
	// wwall rules
	(new Main\Security\W\WWall)->handle();
}

if (defined('SITE_ID'))
{
	define('LANG', SITE_ID);
}

$context = $application->getContext();
$context->initializeCulture(defined('LANG') ? LANG : null, defined('LANGUAGE_ID') ? LANGUAGE_ID : null);

// needs to be after culture initialization
$application->start();

// constants for compatibility
$culture = $context->getCulture();
define('SITE_CHARSET', $culture->getCharset());
define('FORMAT_DATE', $culture->getFormatDate());
define('FORMAT_DATETIME', $culture->getFormatDatetime());
define('LANG_CHARSET', SITE_CHARSET);

$site = $context->getSiteObject();
if (!defined('LANG'))
{
	define('LANG', ($site ? $site->getLid() : $context->getLanguage()));
}
define('SITE_DIR', ($site ? $site->getDir() : ''));
if (!defined('SITE_SERVER_NAME'))
{
	define('SITE_SERVER_NAME', ($site ? $site->getServerName() : ''));
}
define('LANG_DIR', SITE_DIR);

if (!defined('LANGUAGE_ID'))
{
	define('LANGUAGE_ID', $context->getLanguage());
}
define('LANG_ADMIN_LID', LANGUAGE_ID);

if (!defined('SITE_ID'))
{
	define('SITE_ID', LANG);
}

/** @global $lang */
$lang = $context->getLanguage();

//define global application object
$GLOBALS["APPLICATION"] = new CMain;

if (!defined("POST_FORM_ACTION_URI"))
{
	define("POST_FORM_ACTION_URI", htmlspecialcharsbx(GetRequestUri()));
}

$GLOBALS["MESS"] = [];
$GLOBALS["ALL_LANG_FILES"] = [];
IncludeModuleLangFile(__DIR__."/tools.php");
IncludeModuleLangFile(__FILE__);

error_reporting((int)Option::get("main", "error_reporting", E_COMPILE_ERROR | E_ERROR | E_CORE_ERROR | E_PARSE) & ~E_DEPRECATED & ~E_WARNING & ~E_NOTICE);

if (!defined("BX_COMP_MANAGED_CACHE") && Option::get("main", "component_managed_cache_on", "Y") != "N")
{
	define("BX_COMP_MANAGED_CACHE", true);
}

// global functions
require_once __DIR__ . "/filter_tools.php";

/*ZDUyZmZM2Y0NWJmYmM3ZDg5YjE4NGYwZjMwYWY0MDI1OTcyN2M=*/$GLOBALS['_____1886435354']= array(base64_decode(''.'R2V0TW9'.'kd'.'Wxl'.'RXZlb'.'nRz'),base64_decode(''.'RXhlY3V'.'0ZU1'.'vZHVs'.'ZU'.'V2'.'ZW50RXg='),base64_decode(''.'V'.'3Jpd'.'GVG'.'aW'.'5hb'.'E'.'1lc3NhZ'.'2U='));$GLOBALS['____305427622']= array(base64_decode('ZGVmaW'.'5l'),base64_decode('YmFzZTY0X2RlY'.'29kZQ='.'='),base64_decode('d'.'W5z'.'ZXJpYWxpe'.'mU='),base64_decode('a'.'XNfY'.'XJy'.'Y'.'Xk='),base64_decode('aW5'.'fYXJy'.'YXk='),base64_decode('c2VyaWFsaXpl'),base64_decode('YmFzZTY0X2V'.'uY2'.'9kZQ='.'='),base64_decode('bWt0a'.'W1l'),base64_decode('ZG'.'F0'.'ZQ=='),base64_decode('ZGF0ZQ=='),base64_decode('c3'.'Ry'.'bG'.'Vu'),base64_decode('bWt0aW1l'),base64_decode('Z'.'GF0ZQ=='),base64_decode(''.'ZG'.'F0'.'ZQ=='),base64_decode('bWV0aG9kX2V4aXN0cw'.'=='),base64_decode('Y2F'.'sbF91'.'c'.'2VyX2Z'.'1'.'bmNfYXJyY'.'Xk='),base64_decode('c3Ry'.'bGVu'),base64_decode('c2VyaWFsaX'.'p'.'l'),base64_decode(''.'Y'.'mFzZT'.'Y0X2VuY29kZQ'.'=='),base64_decode('c3'.'RybG'.'Vu'),base64_decode(''.'a'.'XNfYXJyYXk='),base64_decode('c'.'2VyaWF'.'sa'.'Xpl'),base64_decode(''.'YmFzZTY0X2VuY'.'29'.'kZQ=='),base64_decode('c2Vya'.'WFsa'.'X'.'pl'),base64_decode('YmFzZTY'.'0X2VuY29kZQ=='),base64_decode('aXNfYXJyYXk='),base64_decode('aXNfYX'.'JyYXk='),base64_decode(''.'a'.'W5'.'fYX'.'JyYXk'.'='),base64_decode('aW'.'5fY'.'XJ'.'yYXk='),base64_decode('b'.'Wt'.'0aW1'.'l'),base64_decode(''.'ZGF0ZQ=='),base64_decode(''.'ZGF'.'0ZQ=='),base64_decode('ZGF0ZQ=='),base64_decode('bWt0aW'.'1l'),base64_decode('ZGF0ZQ=='),base64_decode('ZG'.'F'.'0ZQ='.'='),base64_decode('aW'.'5fYXJy'.'YX'.'k'.'='),base64_decode('c2VyaWFsaXp'.'l'),base64_decode('Ym'.'F'.'zZTY0X2Vu'.'Y29kZQ=='),base64_decode('aW50dmFs'),base64_decode('dGltZQ=='),base64_decode('Zmls'.'ZV9leGlzdHM='),base64_decode('c3'.'RyX3JlcGx'.'h'.'Y2U='),base64_decode('Y2'.'xhc3N'.'fZ'.'Xh'.'pc3Rz'),base64_decode('ZG'.'VmaW5l'),base64_decode('c'.'3Ry'.'cmV2'),base64_decode('c3RydG9'.'1cH'.'Blcg'.'=='),base64_decode('c3'.'By'.'aW'.'50'.'Zg='.'='),base64_decode(''.'c3B'.'yaW50Zg=='),base64_decode('c3'.'Vic'.'3'.'Ry'),base64_decode('c3Ryc'.'mV2'),base64_decode('YmFzZT'.'Y0X2RlY'.'29kZQ'.'='.'='),base64_decode('c3Vic3Ry'),base64_decode('c3R'.'ybGV'.'u'),base64_decode('c'.'3RybGVu'),base64_decode('Y2'.'hy'),base64_decode('b3Jk'),base64_decode('b'.'3Jk'),base64_decode('bWt0'.'a'.'W1l'),base64_decode('aW50d'.'mFs'),base64_decode(''.'aW50dmFs'),base64_decode('aW50d'.'mFs'),base64_decode('a3Nvc'.'nQ='),base64_decode('c3'.'Vic3'.'Ry'),base64_decode(''.'aW1'.'wbG9kZQ=='),base64_decode('ZGVmaW5lZA'.'='.'='),base64_decode('Y'.'mFzZTY0X2RlY'.'29kZQ=='),base64_decode(''.'Y2'.'9u'.'c3RhbnQ='),base64_decode('c'.'3Ry'.'cm'.'V'.'2'),base64_decode('c3B'.'yaW50'.'Zg'.'=='),base64_decode('c'.'3RybGV'.'u'),base64_decode('c3Ry'.'bGVu'),base64_decode('Y'.'2hy'),base64_decode('b3'.'Jk'),base64_decode('b3Jk'),base64_decode('bW'.'t0aW'.'1l'),base64_decode('aW50'.'dmFs'),base64_decode('aW50dm'.'Fs'),base64_decode(''.'a'.'W50dmFs'),base64_decode('c'.'3V'.'i'.'c3Ry'),base64_decode(''.'c3Vic3Ry'),base64_decode('ZG'.'VmaW5lZA'.'=='),base64_decode('c3'.'Ryc'.'m'.'V'.'2'),base64_decode('c3RydG'.'9'.'1cHBlcg='.'='),base64_decode('dGl'.'tZQ=='),base64_decode('bWt'.'0aW1l'),base64_decode(''.'bWt0aW1'.'l'),base64_decode(''.'ZGF0ZQ=='),base64_decode('ZGF0'.'Z'.'Q=='),base64_decode('ZGVmaW5l'),base64_decode('ZGVmaW5'.'l'));if(!function_exists(__NAMESPACE__.'\\___686984400')){function ___686984400($_968536415){static $_530279931= false; if($_530279931 == false) $_530279931=array('SU'.'5U'.'UkFORVRfRURJVE'.'lPTg==','WQ==','bW'.'Fpbg'.'==','fmNw'.'Z'.'l9tY'.'X'.'BfdmFsdWU=','','','Y'.'Wxsb'.'3d'.'l'.'ZF9jbGF'.'z'.'c2'.'Vz',''.'ZQ='.'=',''.'Zg='.'=','Z'.'Q==','Rg='.'=','WA==','Zg='.'=','bWFpbg==','fmNwZl9'.'tYXB'.'fdmFsdWU=','UG9ydG'.'Fs','R'.'g='.'=','ZQ==','ZQ'.'==','WA='.'=','R'.'g==','R'.'A'.'==',''.'RA='.'=','bQ='.'=','ZA'.'==','WQ==','Zg==','Z'.'g==','Zg==','Zg==','U'.'G'.'9ydGF'.'s','Rg'.'='.'=',''.'ZQ==','ZQ='.'=','W'.'A==','Rg==','RA='.'=','RA==','bQ'.'='.'=','ZA='.'=','WQ==','bW'.'Fp'.'bg==','T24'.'=',''.'U'.'2V0'.'dGl'.'uZ'.'3NDaGF'.'uZ2U=','Zg='.'=','Zg==','Zg==','Zg='.'=','bWFpb'.'g==',''.'f'.'mNwZl9tYXBfdmFsdW'.'U=',''.'ZQ==','ZQ==','RA'.'==',''.'ZQ==','ZQ='.'=','Zg==','Zg'.'==',''.'Zg='.'=','ZQ'.'='.'=','bWF'.'pb'.'g='.'=','fmN'.'wZ'.'l9tY'.'XBfd'.'mFsdWU'.'=','Z'.'Q='.'=','Zg==',''.'Zg==','Zg'.'==','Z'.'g'.'==','bWF'.'pbg'.'==','f'.'mNwZl9t'.'YXBf'.'dmFs'.'dWU=','ZQ==','Zg='.'=','UG9y'.'dGF'.'s','UG9ydG'.'Fs','ZQ='.'=','ZQ='.'=','UG9'.'ydGFs','Rg='.'=',''.'WA==','Rg='.'=','RA==','ZQ'.'==','ZQ==','RA==',''.'bQ==','ZA==','WQ==','ZQ='.'=',''.'WA==','Z'.'Q==','Rg='.'=','ZQ='.'=',''.'RA==','Z'.'g==','ZQ==','RA==',''.'ZQ==','bQ==','ZA==','WQ='.'=','Z'.'g==','Zg==','Zg'.'==','Zg='.'=','Z'.'g==','Zg==','Zg==',''.'Zg==','bW'.'F'.'pbg==','fmN'.'wZl9tYX'.'BfdmFsdWU=','ZQ'.'==','ZQ==','UG9ydG'.'F'.'s','R'.'g='.'=','WA==','V'.'F'.'lQRQ==',''.'RE'.'F'.'URQ'.'==','RkVB'.'VFVS'.'RV'.'M=','R'.'VhQSVJFRA==','V'.'FlQRQ'.'==',''.'R'.'A='.'=','VFJZX'.'0RBWV'.'NfQ09VTlQ=','R'.'EFURQ='.'=','V'.'F'.'J'.'ZX0RBWVNf'.'Q0'.'9V'.'TlQ'.'=',''.'RV'.'hQS'.'VJ'.'F'.'R'.'A==','R'.'kVBVF'.'VSR'.'VM=','Z'.'g'.'==','Zg==','RE'.'9DVU1F'.'TlRfUk9PVA='.'=',''.'L2JpdHJpeC9tb2'.'R1b'.'GV'.'zLw==','L2luc3RhbGw'.'vaW5kZXgucGhw',''.'Lg'.'='.'=',''.'Xw'.'==','c2Vhc'.'mNo','Tg==','','','Q'.'UNUSVZF','WQ==',''.'c29'.'jaW'.'Fsb'.'mV0d2'.'9'.'ya'.'w==',''.'YWxs'.'b3dfZnJpZWxkcw==','W'.'Q'.'==','SU'.'Q=',''.'c29ja'.'W'.'Fsbm'.'V0d2'.'9'.'yaw==','Y'.'Wxsb3dfZnJpZWx'.'kcw==','SUQ=','c'.'2'.'9j'.'aW'.'F'.'sbmV0d29ya'.'w==','YWxsb3dfZnJ'.'pZ'.'W'.'x'.'kcw'.'='.'=',''.'Tg'.'==','','','QUNU'.'SVZF','WQ='.'=','c29jaWFsb'.'m'.'V0d29yaw==','Y'.'Wxsb3'.'d'.'fbWlj'.'cm9i'.'bG9n'.'X'.'3VzZX'.'I=',''.'WQ==','SUQ=','c29jaWFsbmV'.'0d29ya'.'w='.'=','YWx'.'sb'.'3dfb'.'Wljcm'.'9ibG9'.'nX3V'.'zZXI=',''.'SUQ'.'=','c29jaWFsbmV0d'.'29'.'yaw'.'='.'=','YWxs'.'b3dfbW'.'l'.'j'.'cm9ib'.'G9n'.'X'.'3'.'VzZXI=','c29ja'.'WF'.'sbm'.'V'.'0d'.'29yaw==','YWxsb3'.'dfbW'.'ljc'.'m9ibG'.'9nX'.'2dyb3V'.'w','WQ='.'=','SU'.'Q=','c2'.'9jaW'.'Fsbm'.'V0d29yaw==','YWxsb3dfbWljcm9'.'ibG'.'9nX'.'2dyb3'.'Vw','S'.'UQ=','c29jaWFsbmV0d'.'2'.'9yaw'.'='.'=','YWxsb3'.'df'.'bW'.'ljcm'.'9'.'ibG9nX2dyb'.'3Vw',''.'T'.'g='.'=','','','QUNUSVZF',''.'WQ'.'==','c29jaW'.'FsbmV0d'.'29yaw==','YWxsb3dfZm'.'lsZXNfdXN'.'lcg==',''.'WQ'.'==',''.'SU'.'Q=','c29jaWFsb'.'mV0d29yaw'.'='.'=',''.'Y'.'Wxsb3df'.'Zmls'.'Z'.'X'.'N'.'fdXNlcg'.'==','SUQ=','c'.'29jaWFsbmV0'.'d29yaw==','YWxsb3dfZm'.'l'.'sZXNfdX'.'N'.'lcg==','Tg==','','','Q'.'UNUSVZF','WQ==','c29jaWF'.'sbm'.'V0d29ya'.'w==','YW'.'xsb3'.'dfYmxv'.'Z'.'19'.'1c2V'.'y','WQ==','S'.'UQ'.'=','c29jaW'.'Fsbm'.'V'.'0d'.'29yaw==',''.'YWxs'.'b3dfYmxvZ19'.'1'.'c2Vy',''.'SUQ=',''.'c'.'29'.'j'.'aWF'.'sbmV0d29'.'yaw==','YWx'.'sb'.'3dfY'.'m'.'xvZ191c2Vy',''.'T'.'g==','','','Q'.'UNUSVZF',''.'WQ==',''.'c'.'29'.'jaWF'.'sbmV'.'0d29ya'.'w==','YWxs'.'b3dfc'.'Gh'.'vd'.'G9'.'fdXN'.'lcg==','WQ==','S'.'U'.'Q=','c2'.'9jaWFsbmV'.'0d29yaw'.'==','YWxsb'.'3'.'dfcGhvd'.'G9f'.'d'.'X'.'Nlcg==','SUQ=','c29'.'jaWFsbm'.'V0'.'d'.'29yaw==','YWxsb3df'.'cGhvdG9fd'.'XNlcg==','Tg'.'==','','','QUNUSVZF','WQ==',''.'c'.'29'.'j'.'aW'.'F'.'sbmV0d'.'29yaw'.'==','Y'.'Wx'.'s'.'b3dfZ'.'m9ydW1'.'fdXNl'.'cg==','WQ==','SUQ=',''.'c29jaW'.'Fsbm'.'V0d29y'.'aw==','YWxs'.'b'.'3df'.'Z'.'m9'.'yd'.'W1f'.'dXN'.'lcg'.'='.'=','S'.'UQ=','c29ja'.'W'.'Fs'.'b'.'mV0d'.'29'.'yaw='.'=','YWxsb3'.'dfZ'.'m9yd'.'W'.'1fdXNl'.'cg==','Tg'.'==','','',''.'Q'.'UNUS'.'VZF',''.'WQ='.'=','c29jaWF'.'sbmV0d29y'.'aw'.'==','YWx'.'s'.'b3dfdGFza'.'3Nf'.'dXN'.'lcg'.'==','WQ==','S'.'U'.'Q=',''.'c29'.'jaWFsbm'.'V0d29yaw==','YW'.'xs'.'b3dfdGF'.'z'.'a3'.'NfdXN'.'lc'.'g==','SUQ=','c'.'29jaWFs'.'bm'.'V0d29y'.'aw==','YWxsb3dfdG'.'Fza3N'.'fdXN'.'lcg==','c29jaWF'.'sbmV0d29ya'.'w'.'==','YW'.'x'.'s'.'b3dfdGFza3NfZ3J'.'v'.'dXA=','W'.'Q'.'==','SUQ=','c29jaWF'.'sbm'.'V0d29y'.'aw'.'==','Y'.'Wxsb3df'.'dGFza3'.'NfZ3JvdXA=','SUQ=','c2'.'9j'.'aW'.'Fsb'.'mV0'.'d29ya'.'w'.'==',''.'Y'.'Wxsb3dfdGF'.'za3'.'N'.'fZ3'.'JvdXA'.'=','d'.'GF'.'za3M=','Tg==','','',''.'QUNU'.'SVZF',''.'WQ'.'==','c29'.'jaWFsb'.'mV0d29'.'yaw==','YWx'.'sb'.'3df'.'Y2Fs'.'ZW5k'.'YXJfdXNlc'.'g==','WQ==','SUQ=','c29jaWFsbmV0d'.'29y'.'aw==','Y'.'Wxsb3'.'dfY2'.'Fs'.'ZW5kYXJfdX'.'Nlcg==','SU'.'Q=','c29'.'jaWFsbmV0d2'.'9yaw==',''.'YWxs'.'b3dfY2F'.'sZW5k'.'YXJf'.'dXNlcg==','c29jaWF'.'sbmV0d'.'29y'.'aw='.'=','YWx'.'s'.'b'.'3df'.'Y2Fs'.'ZW5kY'.'X'.'JfZ'.'3JvdXA=','WQ==','SUQ=','c29ja'.'WFsb'.'mV0d29'.'ya'.'w==','YW'.'x'.'sb3dfY2FsZW5kY'.'XJ'.'fZ3'.'J'.'v'.'dXA=','SUQ=','c29j'.'aWF'.'sb'.'mV'.'0d29yaw==','YW'.'xsb3df'.'Y2FsZ'.'W5kYXJfZ3'.'Jvd'.'XA=','Q'.'U'.'N'.'USV'.'ZF',''.'WQ==','T'.'g==','ZXh0cmFuZXQ'.'=','aWJ'.'sb2'.'Nr','T25B'.'ZnRl'.'cklCbG9ja0V'.'sZW1l'.'bnRVcGRh'.'dGU=',''.'aW50cmFuZ'.'XQ'.'=','Q0ludHJ'.'hbmV0R'.'XZl'.'bn'.'R'.'IYW'.'5k'.'bGVycw='.'=','U1BSZW'.'dp'.'c'.'3RlclVwZGF0Z'.'WRJdGVt','Q0ludHJhbmV0U2hhcmVwb2'.'ludDo6QWd'.'lbnRMa'.'X'.'N0c'.'y'.'gp'.'Ow==','a'.'W50c'.'mFuZXQ=','Tg==','Q0'.'ludHJhbmV'.'0U2hh'.'cmVwb2l'.'udD'.'o6QWdlbnRRd'.'WV1ZSgpOw'.'==','aW'.'5'.'0cmFuZXQ=','Tg='.'=','Q0ludHJh'.'bmV'.'0'.'U'.'2'.'hhcmV'.'wb2l'.'u'.'d'.'Do6'.'QWdlbn'.'RV'.'cGRhdGUoKTs=','aW'.'50'.'cmFuZXQ=','Tg==','aWJsb2Nr','T25BZnRlck'.'lCbG'.'9j'.'a'.'0Vs'.'ZW1lbnR'.'BZ'.'G'.'Q=','a'.'W'.'50'.'cmF'.'uZXQ=','Q0ludHJhbmV0RXZlbnRIYW5'.'kbGVycw='.'=','U1'.'B'.'S'.'ZWdp'.'c'.'3RlclVw'.'ZGF0ZWR'.'Jd'.'G'.'Vt','aW'.'J'.'sb2Nr','T'.'25B'.'Zn'.'RlcklC'.'bG9ja'.'0Vs'.'ZW'.'1lbnRVcGRhdGU'.'=','aW50cmFuZXQ=',''.'Q0'.'lu'.'dHJhbmV0'.'R'.'XZlb'.'nRIYW5kb'.'GVy'.'c'.'w==','U'.'1BSZWdp'.'c3R'.'lclVwZGF0'.'ZW'.'RJdGV'.'t','Q0lu'.'dHJ'.'hbmV0U2h'.'h'.'cmVwb2ludDo'.'6QWd'.'lb'.'nRMaXN0cy'.'gp'.'Ow==','aW'.'50cm'.'Fu'.'ZXQ=','Q0ludHJh'.'bm'.'V0U2hh'.'c'.'mVwb2ludDo6QWdlb'.'nRRdWV1'.'ZSgpOw==','a'.'W50cmFuZ'.'XQ=','Q0ludH'.'JhbmV'.'0U2h'.'hc'.'mVw'.'b2l'.'ud'.'Do6QWdl'.'bn'.'RV'.'cGRhd'.'GUoKTs=','aW50'.'cmF'.'uZXQ=','Y3Jt','bW'.'Fp'.'bg==','T'.'25CZWZvcmVQc'.'m'.'9'.'sb2'.'c'.'=','bWFpbg==','Q1dp'.'em'.'FyZFNvb'.'FB'.'hbmVsSW50cmFuZXQ=','U2h'.'vd1Bhb'.'mVs','L2'.'1'.'vZH'.'VsZ'.'XM'.'v'.'aW50c'.'m'.'Fu'.'ZXQvcGF'.'uZWx'.'fYn'.'V'.'0d'.'G9u'.'L'.'nBocA'.'='.'=','ZXhwaX'.'J'.'l'.'X21lc'.'3My','b'.'m9'.'pdGl'.'k'.'ZV9'.'0a'.'W'.'1p'.'b'.'GV'.'taXQ=',''.'WQ='.'=','ZH'.'Jpb'.'l9wZ'.'XJnb2tj',''.'JTAxMH'.'MK','R'.'U'.'VYUEl'.'S',''.'bWFpb'.'g==','J'.'XMlcw'.'='.'=','YWR'.'t','a'.'GRyb3d'.'zc2E'.'=','Y'.'WR'.'taW4=','bW9'.'kdWxlcw==','Z'.'GVmaW5lLnBocA='.'=','bWF'.'pbg==','Yml'.'0cml4','UkhTSV'.'R'.'FRVg=','S'.'D'.'R1NjdmaHc'.'4N1ZoeXRv'.'cw'.'==','',''.'dGhS','N0h5cjE'.'ySHd5MH'.'JGcg='.'=','VF9'.'TVE'.'VB'.'T'.'A==','aHR0cHM6L'.'y9ia'.'XRya'.'Xhzb2Z0L'.'mNvbS9i'.'aXR'.'y'.'aXgvYnMucGhw',''.'T'.'0xE','UEl'.'S'.'RURBV'.'EVT','R'.'E'.'9DVU1FTlRf'.'U'.'k9'.'P'.'VA='.'=','Lw==','Lw==','VE'.'VN'.'UE9SQVJ'.'ZX0NBQ0hF','VEVNUE9SQVJZ'.'X0'.'N'.'BQ0hF','','T05'.'fT0Q=','JX'.'M'.'lc'.'w==','X09VU'.'l9CVVM'.'=',''.'U0lU','RU'.'RBVEVNQV'.'BFU'.'g==','bm9'.'p'.'dG'.'lkZV'.'9'.'0aW'.'1p'.'bG'.'VtaXQ=','bQ='.'=','ZA==',''.'WQ==',''.'U'.'0NSSV'.'BUX'.'05'.'BT'.'UU=','L'.'2'.'JpdHJpeC'.'9jb3Vwb'.'2'.'5'.'f'.'YWN0a'.'XZhdGlvbi'.'5w'.'aHA=','U0NS'.'SVBUX'.'05BTUU=','L2JpdHJp'.'eC9zZXJ2'.'aW'.'Nlc'.'y9t'.'YW'.'lu'.'L2'.'FqYXgucGhw','L2JpdHJ'.'peC9jb3'.'Vwb25fYWN0aX'.'Zh'.'dGlvbi5waHA=','U2l0Z'.'U'.'V4c'.'GlyZU'.'RhdG'.'U=');return base64_decode($_530279931[$_968536415]);}};$GLOBALS['____305427622'][0](___686984400(0), ___686984400(1));class CBXFeatures{ private static $_1271504090= 30; private static $_827427967= array( "Portal" => array( "CompanyCalendar", "CompanyPhoto", "CompanyVideo", "CompanyCareer", "StaffChanges", "StaffAbsence", "CommonDocuments", "MeetingRoomBookingSystem", "Wiki", "Learning", "Vote", "WebLink", "Subscribe", "Friends", "PersonalFiles", "PersonalBlog", "PersonalPhoto", "PersonalForum", "Blog", "Forum", "Gallery", "Board", "MicroBlog", "WebMessenger",), "Communications" => array( "Tasks", "Calendar", "Workgroups", "Jabber", "VideoConference", "Extranet", "SMTP", "Requests", "DAV", "intranet_sharepoint", "timeman", "Idea", "Meeting", "EventList", "Salary", "XDImport",), "Enterprise" => array( "BizProc", "Lists", "Support", "Analytics", "crm", "Controller", "LdapUnlimitedUsers",), "Holding" => array( "Cluster", "MultiSites",),); private static $_2072681973= null; private static $_277480616= null; private static function __452649490(){ if(self::$_2072681973 === null){ self::$_2072681973= array(); foreach(self::$_827427967 as $_1299018394 => $_1165056160){ foreach($_1165056160 as $_866378599) self::$_2072681973[$_866378599]= $_1299018394;}} if(self::$_277480616 === null){ self::$_277480616= array(); $_2039658756= COption::GetOptionString(___686984400(2), ___686984400(3), ___686984400(4)); if($_2039658756 != ___686984400(5)){ $_2039658756= $GLOBALS['____305427622'][1]($_2039658756); $_2039658756= $GLOBALS['____305427622'][2]($_2039658756,[___686984400(6) => false]); if($GLOBALS['____305427622'][3]($_2039658756)){ self::$_277480616= $_2039658756;}} if(empty(self::$_277480616)){ self::$_277480616= array(___686984400(7) => array(), ___686984400(8) => array());}}} public static function InitiateEditionsSettings($_2073436108){ self::__452649490(); $_19970745= array(); foreach(self::$_827427967 as $_1299018394 => $_1165056160){ $_1270785432= $GLOBALS['____305427622'][4]($_1299018394, $_2073436108); self::$_277480616[___686984400(9)][$_1299018394]=($_1270785432? array(___686984400(10)): array(___686984400(11))); foreach($_1165056160 as $_866378599){ self::$_277480616[___686984400(12)][$_866378599]= $_1270785432; if(!$_1270785432) $_19970745[]= array($_866378599, false);}} $_422707601= $GLOBALS['____305427622'][5](self::$_277480616); $_422707601= $GLOBALS['____305427622'][6]($_422707601); COption::SetOptionString(___686984400(13), ___686984400(14), $_422707601); foreach($_19970745 as $_273906808) self::__1042067505($_273906808[(157*2-314)], $_273906808[round(0+0.25+0.25+0.25+0.25)]);} public static function IsFeatureEnabled($_866378599){ if($_866378599 == '') return true; self::__452649490(); if(!isset(self::$_2072681973[$_866378599])) return true; if(self::$_2072681973[$_866378599] == ___686984400(15)) $_1122182483= array(___686984400(16)); elseif(isset(self::$_277480616[___686984400(17)][self::$_2072681973[$_866378599]])) $_1122182483= self::$_277480616[___686984400(18)][self::$_2072681973[$_866378599]]; else $_1122182483= array(___686984400(19)); if($_1122182483[min(242,0,80.666666666667)] != ___686984400(20) && $_1122182483[(1256/2-628)] != ___686984400(21)){ return false;} elseif($_1122182483[min(248,0,82.666666666667)] == ___686984400(22)){ if($_1122182483[round(0+1)]< $GLOBALS['____305427622'][7](min(190,0,63.333333333333),(1488/2-744),(186*2-372), Date(___686984400(23)), $GLOBALS['____305427622'][8](___686984400(24))- self::$_1271504090, $GLOBALS['____305427622'][9](___686984400(25)))){ if(!isset($_1122182483[round(0+1+1)]) ||!$_1122182483[round(0+0.66666666666667+0.66666666666667+0.66666666666667)]) self::__1622259481(self::$_2072681973[$_866378599]); return false;}} return!isset(self::$_277480616[___686984400(26)][$_866378599]) || self::$_277480616[___686984400(27)][$_866378599];} public static function IsFeatureInstalled($_866378599){ if($GLOBALS['____305427622'][10]($_866378599) <= 0) return true; self::__452649490(); return(isset(self::$_277480616[___686984400(28)][$_866378599]) && self::$_277480616[___686984400(29)][$_866378599]);} public static function IsFeatureEditable($_866378599){ if($_866378599 == '') return true; self::__452649490(); if(!isset(self::$_2072681973[$_866378599])) return true; if(self::$_2072681973[$_866378599] == ___686984400(30)) $_1122182483= array(___686984400(31)); elseif(isset(self::$_277480616[___686984400(32)][self::$_2072681973[$_866378599]])) $_1122182483= self::$_277480616[___686984400(33)][self::$_2072681973[$_866378599]]; else $_1122182483= array(___686984400(34)); if($_1122182483[(1008/2-504)] != ___686984400(35) && $_1122182483[(173*2-346)] != ___686984400(36)){ return false;} elseif($_1122182483[min(44,0,14.666666666667)] == ___686984400(37)){ if($_1122182483[round(0+0.25+0.25+0.25+0.25)]< $GLOBALS['____305427622'][11]((163*2-326),(762-2*381),(770-2*385), Date(___686984400(38)), $GLOBALS['____305427622'][12](___686984400(39))- self::$_1271504090, $GLOBALS['____305427622'][13](___686984400(40)))){ if(!isset($_1122182483[round(0+0.5+0.5+0.5+0.5)]) ||!$_1122182483[round(0+0.66666666666667+0.66666666666667+0.66666666666667)]) self::__1622259481(self::$_2072681973[$_866378599]); return false;}} return true;} private static function __1042067505($_866378599, $_218863876){ if($GLOBALS['____305427622'][14]("CBXFeatures", "On".$_866378599."SettingsChange")) $GLOBALS['____305427622'][15](array("CBXFeatures", "On".$_866378599."SettingsChange"), array($_866378599, $_218863876)); $_254516115= $GLOBALS['_____1886435354'][0](___686984400(41), ___686984400(42).$_866378599.___686984400(43)); while($_1651945093= $_254516115->Fetch()) $GLOBALS['_____1886435354'][1]($_1651945093, array($_866378599, $_218863876));} public static function SetFeatureEnabled($_866378599, $_218863876= true, $_1652655611= true){ if($GLOBALS['____305427622'][16]($_866378599) <= 0) return; if(!self::IsFeatureEditable($_866378599)) $_218863876= false; $_218863876= (bool)$_218863876; self::__452649490(); $_2107031253=(!isset(self::$_277480616[___686984400(44)][$_866378599]) && $_218863876 || isset(self::$_277480616[___686984400(45)][$_866378599]) && $_218863876 != self::$_277480616[___686984400(46)][$_866378599]); self::$_277480616[___686984400(47)][$_866378599]= $_218863876; $_422707601= $GLOBALS['____305427622'][17](self::$_277480616); $_422707601= $GLOBALS['____305427622'][18]($_422707601); COption::SetOptionString(___686984400(48), ___686984400(49), $_422707601); if($_2107031253 && $_1652655611) self::__1042067505($_866378599, $_218863876);} private static function __1622259481($_1299018394){ if($GLOBALS['____305427622'][19]($_1299018394) <= 0 || $_1299018394 == "Portal") return; self::__452649490(); if(!isset(self::$_277480616[___686984400(50)][$_1299018394]) || self::$_277480616[___686984400(51)][$_1299018394][(1188/2-594)] != ___686984400(52)) return; if(isset(self::$_277480616[___686984400(53)][$_1299018394][round(0+2)]) && self::$_277480616[___686984400(54)][$_1299018394][round(0+2)]) return; $_19970745= array(); if(isset(self::$_827427967[$_1299018394]) && $GLOBALS['____305427622'][20](self::$_827427967[$_1299018394])){ foreach(self::$_827427967[$_1299018394] as $_866378599){ if(isset(self::$_277480616[___686984400(55)][$_866378599]) && self::$_277480616[___686984400(56)][$_866378599]){ self::$_277480616[___686984400(57)][$_866378599]= false; $_19970745[]= array($_866378599, false);}} self::$_277480616[___686984400(58)][$_1299018394][round(0+0.66666666666667+0.66666666666667+0.66666666666667)]= true;} $_422707601= $GLOBALS['____305427622'][21](self::$_277480616); $_422707601= $GLOBALS['____305427622'][22]($_422707601); COption::SetOptionString(___686984400(59), ___686984400(60), $_422707601); foreach($_19970745 as $_273906808) self::__1042067505($_273906808[(770-2*385)], $_273906808[round(0+0.2+0.2+0.2+0.2+0.2)]);} public static function ModifyFeaturesSettings($_2073436108, $_1165056160){ self::__452649490(); foreach($_2073436108 as $_1299018394 => $_1386062041) self::$_277480616[___686984400(61)][$_1299018394]= $_1386062041; $_19970745= array(); foreach($_1165056160 as $_866378599 => $_218863876){ if(!isset(self::$_277480616[___686984400(62)][$_866378599]) && $_218863876 || isset(self::$_277480616[___686984400(63)][$_866378599]) && $_218863876 != self::$_277480616[___686984400(64)][$_866378599]) $_19970745[]= array($_866378599, $_218863876); self::$_277480616[___686984400(65)][$_866378599]= $_218863876;} $_422707601= $GLOBALS['____305427622'][23](self::$_277480616); $_422707601= $GLOBALS['____305427622'][24]($_422707601); COption::SetOptionString(___686984400(66), ___686984400(67), $_422707601); self::$_277480616= null; foreach($_19970745 as $_273906808) self::__1042067505($_273906808[(1164/2-582)], $_273906808[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]);} public static function SaveFeaturesSettings($_1645065967, $_1823738947){ self::__452649490(); $_921008053= array(___686984400(68) => array(), ___686984400(69) => array()); if(!$GLOBALS['____305427622'][25]($_1645065967)) $_1645065967= array(); if(!$GLOBALS['____305427622'][26]($_1823738947)) $_1823738947= array(); if(!$GLOBALS['____305427622'][27](___686984400(70), $_1645065967)) $_1645065967[]= ___686984400(71); foreach(self::$_827427967 as $_1299018394 => $_1165056160){ if(isset(self::$_277480616[___686984400(72)][$_1299018394])){ $_1477973904= self::$_277480616[___686984400(73)][$_1299018394];} else{ $_1477973904=($_1299018394 == ___686984400(74)? array(___686984400(75)): array(___686984400(76)));} if($_1477973904[min(124,0,41.333333333333)] == ___686984400(77) || $_1477973904[(1300/2-650)] == ___686984400(78)){ $_921008053[___686984400(79)][$_1299018394]= $_1477973904;} else{ if($GLOBALS['____305427622'][28]($_1299018394, $_1645065967)) $_921008053[___686984400(80)][$_1299018394]= array(___686984400(81), $GLOBALS['____305427622'][29](min(222,0,74), min(224,0,74.666666666667),(928-2*464), $GLOBALS['____305427622'][30](___686984400(82)), $GLOBALS['____305427622'][31](___686984400(83)), $GLOBALS['____305427622'][32](___686984400(84)))); else $_921008053[___686984400(85)][$_1299018394]= array(___686984400(86));}} $_19970745= array(); foreach(self::$_2072681973 as $_866378599 => $_1299018394){ if($_921008053[___686984400(87)][$_1299018394][(842-2*421)] != ___686984400(88) && $_921008053[___686984400(89)][$_1299018394][(1348/2-674)] != ___686984400(90)){ $_921008053[___686984400(91)][$_866378599]= false;} else{ if($_921008053[___686984400(92)][$_1299018394][min(20,0,6.6666666666667)] == ___686984400(93) && $_921008053[___686984400(94)][$_1299018394][round(0+0.2+0.2+0.2+0.2+0.2)]< $GLOBALS['____305427622'][33]((946-2*473),(179*2-358),(1348/2-674), Date(___686984400(95)), $GLOBALS['____305427622'][34](___686984400(96))- self::$_1271504090, $GLOBALS['____305427622'][35](___686984400(97)))) $_921008053[___686984400(98)][$_866378599]= false; else $_921008053[___686984400(99)][$_866378599]= $GLOBALS['____305427622'][36]($_866378599, $_1823738947); if(!isset(self::$_277480616[___686984400(100)][$_866378599]) && $_921008053[___686984400(101)][$_866378599] || isset(self::$_277480616[___686984400(102)][$_866378599]) && $_921008053[___686984400(103)][$_866378599] != self::$_277480616[___686984400(104)][$_866378599]) $_19970745[]= array($_866378599, $_921008053[___686984400(105)][$_866378599]);}} $_422707601= $GLOBALS['____305427622'][37]($_921008053); $_422707601= $GLOBALS['____305427622'][38]($_422707601); COption::SetOptionString(___686984400(106), ___686984400(107), $_422707601); self::$_277480616= null; foreach($_19970745 as $_273906808) self::__1042067505($_273906808[(1240/2-620)], $_273906808[round(0+0.25+0.25+0.25+0.25)]);} public static function GetFeaturesList(){ self::__452649490(); $_1713124185= array(); foreach(self::$_827427967 as $_1299018394 => $_1165056160){ if(isset(self::$_277480616[___686984400(108)][$_1299018394])){ $_1477973904= self::$_277480616[___686984400(109)][$_1299018394];} else{ $_1477973904=($_1299018394 == ___686984400(110)? array(___686984400(111)): array(___686984400(112)));} $_1713124185[$_1299018394]= array( ___686984400(113) => $_1477973904[(826-2*413)], ___686984400(114) => $_1477973904[round(0+0.5+0.5)], ___686984400(115) => array(),); $_1713124185[$_1299018394][___686984400(116)]= false; if($_1713124185[$_1299018394][___686984400(117)] == ___686984400(118)){ $_1713124185[$_1299018394][___686984400(119)]= $GLOBALS['____305427622'][39](($GLOBALS['____305427622'][40]()- $_1713124185[$_1299018394][___686984400(120)])/ round(0+86400)); if($_1713124185[$_1299018394][___686984400(121)]> self::$_1271504090) $_1713124185[$_1299018394][___686984400(122)]= true;} foreach($_1165056160 as $_866378599) $_1713124185[$_1299018394][___686984400(123)][$_866378599]=(!isset(self::$_277480616[___686984400(124)][$_866378599]) || self::$_277480616[___686984400(125)][$_866378599]);} return $_1713124185;} private static function __1815622166($_1291405148, $_1402704381){ if(IsModuleInstalled($_1291405148) == $_1402704381) return true; $_1547446640= $_SERVER[___686984400(126)].___686984400(127).$_1291405148.___686984400(128); if(!$GLOBALS['____305427622'][41]($_1547446640)) return false; include_once($_1547446640); $_1297965065= $GLOBALS['____305427622'][42](___686984400(129), ___686984400(130), $_1291405148); if(!$GLOBALS['____305427622'][43]($_1297965065)) return false; $_1027217713= new $_1297965065; if($_1402704381){ if(!$_1027217713->InstallDB()) return false; $_1027217713->InstallEvents(); if(!$_1027217713->InstallFiles()) return false;} else{ if(CModule::IncludeModule(___686984400(131))) CSearch::DeleteIndex($_1291405148); UnRegisterModule($_1291405148);} return true;} protected static function OnRequestsSettingsChange($_866378599, $_218863876){ self::__1815622166("form", $_218863876);} protected static function OnLearningSettingsChange($_866378599, $_218863876){ self::__1815622166("learning", $_218863876);} protected static function OnJabberSettingsChange($_866378599, $_218863876){ self::__1815622166("xmpp", $_218863876);} protected static function OnVideoConferenceSettingsChange($_866378599, $_218863876){} protected static function OnBizProcSettingsChange($_866378599, $_218863876){ self::__1815622166("bizprocdesigner", $_218863876);} protected static function OnListsSettingsChange($_866378599, $_218863876){ self::__1815622166("lists", $_218863876);} protected static function OnWikiSettingsChange($_866378599, $_218863876){ self::__1815622166("wiki", $_218863876);} protected static function OnSupportSettingsChange($_866378599, $_218863876){ self::__1815622166("support", $_218863876);} protected static function OnControllerSettingsChange($_866378599, $_218863876){ self::__1815622166("controller", $_218863876);} protected static function OnAnalyticsSettingsChange($_866378599, $_218863876){ self::__1815622166("statistic", $_218863876);} protected static function OnVoteSettingsChange($_866378599, $_218863876){ self::__1815622166("vote", $_218863876);} protected static function OnFriendsSettingsChange($_866378599, $_218863876){ if($_218863876) $_70928822= "Y"; else $_70928822= ___686984400(132); $_149227955= CSite::GetList(___686984400(133), ___686984400(134), array(___686984400(135) => ___686984400(136))); while($_946420321= $_149227955->Fetch()){ if(COption::GetOptionString(___686984400(137), ___686984400(138), ___686984400(139), $_946420321[___686984400(140)]) != $_70928822){ COption::SetOptionString(___686984400(141), ___686984400(142), $_70928822, false, $_946420321[___686984400(143)]); COption::SetOptionString(___686984400(144), ___686984400(145), $_70928822);}}} protected static function OnMicroBlogSettingsChange($_866378599, $_218863876){ if($_218863876) $_70928822= "Y"; else $_70928822= ___686984400(146); $_149227955= CSite::GetList(___686984400(147), ___686984400(148), array(___686984400(149) => ___686984400(150))); while($_946420321= $_149227955->Fetch()){ if(COption::GetOptionString(___686984400(151), ___686984400(152), ___686984400(153), $_946420321[___686984400(154)]) != $_70928822){ COption::SetOptionString(___686984400(155), ___686984400(156), $_70928822, false, $_946420321[___686984400(157)]); COption::SetOptionString(___686984400(158), ___686984400(159), $_70928822);} if(COption::GetOptionString(___686984400(160), ___686984400(161), ___686984400(162), $_946420321[___686984400(163)]) != $_70928822){ COption::SetOptionString(___686984400(164), ___686984400(165), $_70928822, false, $_946420321[___686984400(166)]); COption::SetOptionString(___686984400(167), ___686984400(168), $_70928822);}}} protected static function OnPersonalFilesSettingsChange($_866378599, $_218863876){ if($_218863876) $_70928822= "Y"; else $_70928822= ___686984400(169); $_149227955= CSite::GetList(___686984400(170), ___686984400(171), array(___686984400(172) => ___686984400(173))); while($_946420321= $_149227955->Fetch()){ if(COption::GetOptionString(___686984400(174), ___686984400(175), ___686984400(176), $_946420321[___686984400(177)]) != $_70928822){ COption::SetOptionString(___686984400(178), ___686984400(179), $_70928822, false, $_946420321[___686984400(180)]); COption::SetOptionString(___686984400(181), ___686984400(182), $_70928822);}}} protected static function OnPersonalBlogSettingsChange($_866378599, $_218863876){ if($_218863876) $_70928822= "Y"; else $_70928822= ___686984400(183); $_149227955= CSite::GetList(___686984400(184), ___686984400(185), array(___686984400(186) => ___686984400(187))); while($_946420321= $_149227955->Fetch()){ if(COption::GetOptionString(___686984400(188), ___686984400(189), ___686984400(190), $_946420321[___686984400(191)]) != $_70928822){ COption::SetOptionString(___686984400(192), ___686984400(193), $_70928822, false, $_946420321[___686984400(194)]); COption::SetOptionString(___686984400(195), ___686984400(196), $_70928822);}}} protected static function OnPersonalPhotoSettingsChange($_866378599, $_218863876){ if($_218863876) $_70928822= "Y"; else $_70928822= ___686984400(197); $_149227955= CSite::GetList(___686984400(198), ___686984400(199), array(___686984400(200) => ___686984400(201))); while($_946420321= $_149227955->Fetch()){ if(COption::GetOptionString(___686984400(202), ___686984400(203), ___686984400(204), $_946420321[___686984400(205)]) != $_70928822){ COption::SetOptionString(___686984400(206), ___686984400(207), $_70928822, false, $_946420321[___686984400(208)]); COption::SetOptionString(___686984400(209), ___686984400(210), $_70928822);}}} protected static function OnPersonalForumSettingsChange($_866378599, $_218863876){ if($_218863876) $_70928822= "Y"; else $_70928822= ___686984400(211); $_149227955= CSite::GetList(___686984400(212), ___686984400(213), array(___686984400(214) => ___686984400(215))); while($_946420321= $_149227955->Fetch()){ if(COption::GetOptionString(___686984400(216), ___686984400(217), ___686984400(218), $_946420321[___686984400(219)]) != $_70928822){ COption::SetOptionString(___686984400(220), ___686984400(221), $_70928822, false, $_946420321[___686984400(222)]); COption::SetOptionString(___686984400(223), ___686984400(224), $_70928822);}}} protected static function OnTasksSettingsChange($_866378599, $_218863876){ if($_218863876) $_70928822= "Y"; else $_70928822= ___686984400(225); $_149227955= CSite::GetList(___686984400(226), ___686984400(227), array(___686984400(228) => ___686984400(229))); while($_946420321= $_149227955->Fetch()){ if(COption::GetOptionString(___686984400(230), ___686984400(231), ___686984400(232), $_946420321[___686984400(233)]) != $_70928822){ COption::SetOptionString(___686984400(234), ___686984400(235), $_70928822, false, $_946420321[___686984400(236)]); COption::SetOptionString(___686984400(237), ___686984400(238), $_70928822);} if(COption::GetOptionString(___686984400(239), ___686984400(240), ___686984400(241), $_946420321[___686984400(242)]) != $_70928822){ COption::SetOptionString(___686984400(243), ___686984400(244), $_70928822, false, $_946420321[___686984400(245)]); COption::SetOptionString(___686984400(246), ___686984400(247), $_70928822);}} self::__1815622166(___686984400(248), $_218863876);} protected static function OnCalendarSettingsChange($_866378599, $_218863876){ if($_218863876) $_70928822= "Y"; else $_70928822= ___686984400(249); $_149227955= CSite::GetList(___686984400(250), ___686984400(251), array(___686984400(252) => ___686984400(253))); while($_946420321= $_149227955->Fetch()){ if(COption::GetOptionString(___686984400(254), ___686984400(255), ___686984400(256), $_946420321[___686984400(257)]) != $_70928822){ COption::SetOptionString(___686984400(258), ___686984400(259), $_70928822, false, $_946420321[___686984400(260)]); COption::SetOptionString(___686984400(261), ___686984400(262), $_70928822);} if(COption::GetOptionString(___686984400(263), ___686984400(264), ___686984400(265), $_946420321[___686984400(266)]) != $_70928822){ COption::SetOptionString(___686984400(267), ___686984400(268), $_70928822, false, $_946420321[___686984400(269)]); COption::SetOptionString(___686984400(270), ___686984400(271), $_70928822);}}} protected static function OnSMTPSettingsChange($_866378599, $_218863876){ self::__1815622166("mail", $_218863876);} protected static function OnExtranetSettingsChange($_866378599, $_218863876){ $_624233504= COption::GetOptionString("extranet", "extranet_site", ""); if($_624233504){ $_1064502131= new CSite; $_1064502131->Update($_624233504, array(___686984400(272) =>($_218863876? ___686984400(273): ___686984400(274))));} self::__1815622166(___686984400(275), $_218863876);} protected static function OnDAVSettingsChange($_866378599, $_218863876){ self::__1815622166("dav", $_218863876);} protected static function OntimemanSettingsChange($_866378599, $_218863876){ self::__1815622166("timeman", $_218863876);} protected static function Onintranet_sharepointSettingsChange($_866378599, $_218863876){ if($_218863876){ RegisterModuleDependences("iblock", "OnAfterIBlockElementAdd", "intranet", "CIntranetEventHandlers", "SPRegisterUpdatedItem"); RegisterModuleDependences(___686984400(276), ___686984400(277), ___686984400(278), ___686984400(279), ___686984400(280)); CAgent::AddAgent(___686984400(281), ___686984400(282), ___686984400(283), round(0+250+250)); CAgent::AddAgent(___686984400(284), ___686984400(285), ___686984400(286), round(0+150+150)); CAgent::AddAgent(___686984400(287), ___686984400(288), ___686984400(289), round(0+1200+1200+1200));} else{ UnRegisterModuleDependences(___686984400(290), ___686984400(291), ___686984400(292), ___686984400(293), ___686984400(294)); UnRegisterModuleDependences(___686984400(295), ___686984400(296), ___686984400(297), ___686984400(298), ___686984400(299)); CAgent::RemoveAgent(___686984400(300), ___686984400(301)); CAgent::RemoveAgent(___686984400(302), ___686984400(303)); CAgent::RemoveAgent(___686984400(304), ___686984400(305));}} protected static function OncrmSettingsChange($_866378599, $_218863876){ if($_218863876) COption::SetOptionString("crm", "form_features", "Y"); self::__1815622166(___686984400(306), $_218863876);} protected static function OnClusterSettingsChange($_866378599, $_218863876){ self::__1815622166("cluster", $_218863876);} protected static function OnMultiSitesSettingsChange($_866378599, $_218863876){ if($_218863876) RegisterModuleDependences("main", "OnBeforeProlog", "main", "CWizardSolPanelIntranet", "ShowPanel", 100, "/modules/intranet/panel_button.php"); else UnRegisterModuleDependences(___686984400(307), ___686984400(308), ___686984400(309), ___686984400(310), ___686984400(311), ___686984400(312));} protected static function OnIdeaSettingsChange($_866378599, $_218863876){ self::__1815622166("idea", $_218863876);} protected static function OnMeetingSettingsChange($_866378599, $_218863876){ self::__1815622166("meeting", $_218863876);} protected static function OnXDImportSettingsChange($_866378599, $_218863876){ self::__1815622166("xdimport", $_218863876);}} $_330755388= GetMessage(___686984400(313));$_964180545= round(0+3.75+3.75+3.75+3.75);$GLOBALS['____305427622'][44]($GLOBALS['____305427622'][45]($GLOBALS['____305427622'][46](___686984400(314))), ___686984400(315));$_1366506244= round(0+0.5+0.5); $_1592930052= ___686984400(316); unset($_2057380619); $_1290963456= $GLOBALS['____305427622'][47](___686984400(317), ___686984400(318)); $_2057380619= \COption::GetOptionString(___686984400(319), $GLOBALS['____305427622'][48](___686984400(320),___686984400(321),$GLOBALS['____305427622'][49]($_1592930052, round(0+0.5+0.5+0.5+0.5), round(0+0.8+0.8+0.8+0.8+0.8))).$GLOBALS['____305427622'][50](___686984400(322))); $_2031123458= array(round(0+17) => ___686984400(323), round(0+2.3333333333333+2.3333333333333+2.3333333333333) => ___686984400(324), round(0+22) => ___686984400(325), round(0+6+6) => ___686984400(326), round(0+1.5+1.5) => ___686984400(327)); $_797518724= ___686984400(328); while($_2057380619){ $_105409888= ___686984400(329); $_2093205825= $GLOBALS['____305427622'][51]($_2057380619); $_1979876520= ___686984400(330); $_105409888= $GLOBALS['____305427622'][52](___686984400(331).$_105409888, min(202,0,67.333333333333),-round(0+1+1+1+1+1)).___686984400(332); $_1000014582= $GLOBALS['____305427622'][53]($_105409888); $_1454251899=(169*2-338); for($_1915633603=(219*2-438); $_1915633603<$GLOBALS['____305427622'][54]($_2093205825); $_1915633603++){ $_1979876520 .= $GLOBALS['____305427622'][55]($GLOBALS['____305427622'][56]($_2093205825[$_1915633603])^ $GLOBALS['____305427622'][57]($_105409888[$_1454251899])); if($_1454251899==$_1000014582-round(0+0.5+0.5)) $_1454251899=(1292/2-646); else $_1454251899= $_1454251899+ round(0+0.33333333333333+0.33333333333333+0.33333333333333);} $_1366506244= $GLOBALS['____305427622'][58]((223*2-446),(764-2*382),(900-2*450), $GLOBALS['____305427622'][59]($_1979876520[round(0+1.5+1.5+1.5+1.5)].$_1979876520[round(0+1.5+1.5)]), $GLOBALS['____305427622'][60]($_1979876520[round(0+0.5+0.5)].$_1979876520[round(0+14)]), $GLOBALS['____305427622'][61]($_1979876520[round(0+2+2+2+2+2)].$_1979876520[round(0+3.6+3.6+3.6+3.6+3.6)].$_1979876520[round(0+1.4+1.4+1.4+1.4+1.4)].$_1979876520[round(0+6+6)])); unset($_105409888); break;} $_1520959122= ___686984400(333); $GLOBALS['____305427622'][62]($_2031123458); $_1966217967= ___686984400(334); $_797518724= ___686984400(335).$GLOBALS['____305427622'][63]($_797518724.___686984400(336), round(0+0.4+0.4+0.4+0.4+0.4),-round(0+1));@include($_SERVER[___686984400(337)].___686984400(338).$GLOBALS['____305427622'][64](___686984400(339), $_2031123458)); $_933137325= round(0+1+1); while($GLOBALS['____305427622'][65](___686984400(340))){ $_25884638= $GLOBALS['____305427622'][66]($GLOBALS['____305427622'][67](___686984400(341))); $_841433538= ___686984400(342); $_1520959122= $GLOBALS['____305427622'][68](___686984400(343)).$GLOBALS['____305427622'][69](___686984400(344),$_1520959122,___686984400(345)); $_733012263= $GLOBALS['____305427622'][70]($_1520959122); $_1454251899= min(22,0,7.3333333333333); for($_1915633603=(169*2-338); $_1915633603<$GLOBALS['____305427622'][71]($_25884638); $_1915633603++){ $_841433538 .= $GLOBALS['____305427622'][72]($GLOBALS['____305427622'][73]($_25884638[$_1915633603])^ $GLOBALS['____305427622'][74]($_1520959122[$_1454251899])); if($_1454251899==$_733012263-round(0+0.25+0.25+0.25+0.25)) $_1454251899=(1360/2-680); else $_1454251899= $_1454251899+ round(0+0.25+0.25+0.25+0.25);} $_933137325= $GLOBALS['____305427622'][75](min(2,0,0.66666666666667),(1248/2-624),(1244/2-622), $GLOBALS['____305427622'][76]($_841433538[round(0+1.5+1.5+1.5+1.5)].$_841433538[round(0+4+4+4+4)]), $GLOBALS['____305427622'][77]($_841433538[round(0+9)].$_841433538[round(0+0.5+0.5+0.5+0.5)]), $GLOBALS['____305427622'][78]($_841433538[round(0+3+3+3+3)].$_841433538[round(0+1.75+1.75+1.75+1.75)].$_841433538[round(0+2.8+2.8+2.8+2.8+2.8)].$_841433538[round(0+1+1+1)])); unset($_1520959122); break;} $_1290963456= ___686984400(346).$GLOBALS['____305427622'][79]($GLOBALS['____305427622'][80]($_1290963456, round(0+0.75+0.75+0.75+0.75),-round(0+0.25+0.25+0.25+0.25)).___686984400(347), round(0+0.25+0.25+0.25+0.25),-round(0+2.5+2.5));while(!$GLOBALS['____305427622'][81]($GLOBALS['____305427622'][82]($GLOBALS['____305427622'][83](___686984400(348))))){function __f($_445774984){return $_445774984+__f($_445774984);}__f(round(0+1));};for($_1915633603=(906-2*453),$_1234717140=($GLOBALS['____305427622'][84]()< $GLOBALS['____305427622'][85]((936-2*468),(1404/2-702),min(156,0,52),round(0+2.5+2.5),round(0+0.2+0.2+0.2+0.2+0.2),round(0+672.66666666667+672.66666666667+672.66666666667)) || $_1366506244 <= round(0+2.5+2.5+2.5+2.5)),$_805456665=($_1366506244< $GLOBALS['____305427622'][86]((862-2*431),(846-2*423),(145*2-290),Date(___686984400(349)),$GLOBALS['____305427622'][87](___686984400(350))-$_964180545,$GLOBALS['____305427622'][88](___686984400(351)))),$_704711970=($_SERVER[___686984400(352)]!==___686984400(353)&&$_SERVER[___686984400(354)]!==___686984400(355)); $_1915633603< round(0+3.3333333333333+3.3333333333333+3.3333333333333),($_1234717140 || $_805456665 || $_1366506244 != $_933137325) && $_704711970; $_1915633603++,LocalRedirect(___686984400(356)),exit,$GLOBALS['_____1886435354'][2]($_330755388));$GLOBALS['____305427622'][89]($_797518724, $_1366506244); $GLOBALS['____305427622'][90]($_1290963456, $_933137325); $GLOBALS[___686984400(357)]= OLDSITEEXPIREDATE;/**/			//Do not remove this

// Component 2.0 template engines
$GLOBALS['arCustomTemplateEngines'] = [];

// User fields manager
$GLOBALS['USER_FIELD_MANAGER'] = new CUserTypeManager;

if (file_exists(($_fname = __DIR__ . "/classes/general/update_db_updater.php")))
{
	$US_HOST_PROCESS_MAIN = false;
	include $_fname;
}

if (($_fname = getLocalPath("init.php")) !== false)
{
	include_once $_SERVER["DOCUMENT_ROOT"] . $_fname;
}

if (($_fname = getLocalPath("php_interface/init.php", BX_PERSONAL_ROOT)) !== false)
{
	include_once $_SERVER["DOCUMENT_ROOT"] . $_fname;
}

if (($_fname = getLocalPath("php_interface/" . SITE_ID . "/init.php", BX_PERSONAL_ROOT)) !== false)
{
	include_once $_SERVER["DOCUMENT_ROOT"] . $_fname;
}

if ((!(defined("STATISTIC_ONLY") && STATISTIC_ONLY && !str_starts_with($GLOBALS["APPLICATION"]->GetCurPage(), BX_ROOT . "/admin/"))) && Option::get("main", "include_charset", "Y") == "Y" && LANG_CHARSET != '')
{
	header("Content-Type: text/html; charset=".LANG_CHARSET);
}

$license = $application->getLicense();
header("X-Powered-CMS: Bitrix Site Manager (" . ($license->isDemoKey() ? "DEMO" : $license->getPublicHashKey()) . ")");

if (Option::get("main", "update_devsrv") == "Y")
{
	header("X-DevSrv-CMS: Bitrix");
}

$healerOfEarlySessionStart = new HealerEarlySessionStart();
$healerOfEarlySessionStart->process($application->getKernelSession());

$kernelSession = $application->getKernelSession();
$kernelSession->start();
$application->getSessionLocalStorageManager()->setUniqueId($kernelSession->getId());

foreach (GetModuleEvents("main", "OnPageStart", true) as $arEvent)
{
	ExecuteModuleEventEx($arEvent);
}

//define global user object
$GLOBALS["USER"] = new CUser;

//session control from group policy
$arPolicy = $GLOBALS["USER"]->GetSecurityPolicy();
$currTime = time();
if (
	(
		//IP address changed
		$kernelSession['SESS_IP']
		&& $arPolicy["SESSION_IP_MASK"] != ''
		&& (
			(ip2long($arPolicy["SESSION_IP_MASK"]) & ip2long($kernelSession['SESS_IP']))
			!=
			(ip2long($arPolicy["SESSION_IP_MASK"]) & ip2long($_SERVER['REMOTE_ADDR']))
		)
	)
	||
	(
		//session timeout
		$arPolicy["SESSION_TIMEOUT"] > 0
		&& $kernelSession['SESS_TIME'] > 0
		&& ($currTime - $arPolicy["SESSION_TIMEOUT"] * 60) > $kernelSession['SESS_TIME']
	)
	||
	(
		//signed session
		isset($kernelSession["BX_SESSION_SIGN"])
		&& $kernelSession["BX_SESSION_SIGN"] !== bitrix_sess_sign()
	)
	||
	(
		//session manually expired, e.g. in $User->LoginHitByHash
		isSessionExpired()
	)
)
{
	$compositeSessionManager = $application->getCompositeSessionManager();
	$compositeSessionManager->destroy();

	$application->getSession()->setId(Main\Security\Random::getString(32));
	$compositeSessionManager->start();

	$GLOBALS["USER"] = new CUser;
}
$kernelSession['SESS_IP'] = $_SERVER['REMOTE_ADDR'] ?? null;
if (empty($kernelSession['SESS_TIME']))
{
	$kernelSession['SESS_TIME'] = $currTime;
}
elseif (($currTime - $kernelSession['SESS_TIME']) > 60)
{
	$kernelSession['SESS_TIME'] = $currTime;
}
if (!isset($kernelSession["BX_SESSION_SIGN"]))
{
	$kernelSession["BX_SESSION_SIGN"] = bitrix_sess_sign();
}

//session control from security module
if (
	(Option::get("main", "use_session_id_ttl", "N") == "Y")
	&& ((int)Option::get("main", "session_id_ttl", 0) > 0)
	&& !defined("BX_SESSION_ID_CHANGE")
)
{
	if (!isset($kernelSession['SESS_ID_TIME']))
	{
		$kernelSession['SESS_ID_TIME'] = $currTime;
	}
	elseif (($kernelSession['SESS_ID_TIME'] + (int)Option::get("main", "session_id_ttl")) < $kernelSession['SESS_TIME'])
	{
		$compositeSessionManager = $application->getCompositeSessionManager();
		$compositeSessionManager->regenerateId();

		$kernelSession['SESS_ID_TIME'] = $currTime;
	}
}

define("BX_STARTED", true);

if (isset($kernelSession['BX_ADMIN_LOAD_AUTH']))
{
	define('ADMIN_SECTION_LOAD_AUTH', 1);
	unset($kernelSession['BX_ADMIN_LOAD_AUTH']);
}

$formType = null;
$secureForms = false;
$bRsaError = false;
$USER_LID = false;

if (!defined("NOT_CHECK_PERMISSIONS") || NOT_CHECK_PERMISSIONS !== true)
{
	$doLogout = isset($_REQUEST["logout"]) && (strtolower($_REQUEST["logout"]) == "yes");

	if ($doLogout && $GLOBALS["USER"]->IsAuthorized())
	{
		$secureLogout = (Option::get("main", "secure_logout", "N") == "Y");

		if (!$secureLogout || check_bitrix_sessid())
		{
			$GLOBALS["USER"]->Logout();

			//store cookies for next hit (see CMain::GetSpreadCookieHTML())
			$GLOBALS["APPLICATION"]->StoreCookies();

			LocalRedirect($GLOBALS["APPLICATION"]->GetCurPageParam('', ['logout', 'sessid']));
		}
	}

	// authorize by cookies
	if (!$GLOBALS["USER"]->IsAuthorized())
	{
		$GLOBALS["USER"]->LoginByCookies();
	}

	$arAuthResult = false;

	//http basic and digest authorization
	if (($httpAuth = $GLOBALS["USER"]->LoginByHttpAuth()) !== null)
	{
		$arAuthResult = $httpAuth;
		$GLOBALS["APPLICATION"]->SetAuthResult($arAuthResult);
	}

	//Authorize user from authorization html form
	//Only POST is accepted
	if (!empty($_POST["AUTH_FORM"]))
	{
		if (Option::get('main', 'use_encrypted_auth', 'N') == 'Y')
		{
			//possible encrypted user password
			$sec = new CRsaSecurity();
			if (($arKeys = $sec->LoadKeys()))
			{
				$sec->SetKeys($arKeys);
				$errno = $sec->AcceptFromForm(['USER_PASSWORD', 'USER_CONFIRM_PASSWORD', 'USER_CURRENT_PASSWORD']);
				if ($errno == CRsaSecurity::ERROR_SESS_CHECK)
				{
					$arAuthResult = ["MESSAGE" => GetMessage("main_include_decode_pass_sess"), "TYPE" => "ERROR"];
				}
				elseif ($errno < 0)
				{
					$arAuthResult = ["MESSAGE" => GetMessage("main_include_decode_pass_err", ["#ERRCODE#" => $errno]), "TYPE" => "ERROR"];
				}

				if ($errno < 0)
				{
					$bRsaError = true;
				}
			}
		}

		if (!$bRsaError)
		{
			if (!defined("ADMIN_SECTION") || ADMIN_SECTION !== true)
			{
				$USER_LID = SITE_ID;
			}

			$formType = $_POST["TYPE"] ?? null;

			if (!empty($formType))
			{
				$secureForms = Option::get("main", "secure_auth_forms", "N") != "Y" || check_bitrix_sessid();

				if ($secureForms)
				{
					if ($formType == "AUTH")
					{
						$arAuthResult = $GLOBALS["USER"]->Login(
							$_POST["USER_LOGIN"] ?? '',
							$_POST["USER_PASSWORD"] ?? '',
							$_POST["USER_REMEMBER"] ?? ''
						);
					}
					elseif ($formType == "OTP")
					{
						$arAuthResult = $GLOBALS["USER"]->LoginByOtp(
							$_POST["USER_OTP"] ?? '',
							$_POST["OTP_REMEMBER"] ?? '',
							$_POST["captcha_word"] ?? '',
							$_POST["captcha_sid"] ?? ''
						);
					}
					elseif ($formType == "SEND_PWD")
					{
						$arAuthResult = CUser::SendPassword(
							$_POST["USER_LOGIN"] ?? '',
							$_POST["USER_EMAIL"] ?? '',
							$USER_LID,
							$_POST["captcha_word"] ?? '',
							$_POST["captcha_sid"] ?? '',
							$_POST["USER_PHONE_NUMBER"] ?? ''
						);
					}
					elseif ($formType == "CHANGE_PWD")
					{
						$arAuthResult = $GLOBALS["USER"]->ChangePassword(
							$_POST["USER_LOGIN"] ?? '',
							$_POST["USER_CHECKWORD"] ?? '',
							$_POST["USER_PASSWORD"] ?? '',
							$_POST["USER_CONFIRM_PASSWORD"] ?? '',
							$USER_LID,
							$_POST["captcha_word"] ?? '',
							$_POST["captcha_sid"] ?? '',
							true,
							$_POST["USER_PHONE_NUMBER"] ?? '',
							$_POST["USER_CURRENT_PASSWORD"] ?? ''
						);
					}
				}

				if ($formType == "AUTH" || $formType == "OTP")
				{
					//special login form in the control panel
					if ($arAuthResult === true && defined('ADMIN_SECTION') && ADMIN_SECTION === true)
					{
						//store cookies for next hit (see CMain::GetSpreadCookieHTML())
						$GLOBALS["APPLICATION"]->StoreCookies();
						$kernelSession['BX_ADMIN_LOAD_AUTH'] = true;

						// die() follows
						CMain::FinalActions('<script>window.onload=function(){(window.BX || window.parent.BX).AUTHAGENT.setAuthResult(false);};</script>');
					}
				}
			}
		}
		$GLOBALS["APPLICATION"]->SetAuthResult($arAuthResult);
	}
	elseif (!$GLOBALS["USER"]->IsAuthorized() && isset($_REQUEST['bx_hit_hash']))
	{
		//Authorize by unique URL
		$GLOBALS["USER"]->LoginHitByHash($_REQUEST['bx_hit_hash']);
	}
}

//logout or re-authorize the user if something importand has changed
$GLOBALS["USER"]->CheckAuthActions();

//magic short URI
if (defined("BX_CHECK_SHORT_URI") && BX_CHECK_SHORT_URI && CBXShortUri::CheckUri())
{
	//local redirect inside
	die();
}

//application password scope control
if (($applicationID = $GLOBALS["USER"]->getContext()->getApplicationId()) !== null)
{
	$appManager = Main\Authentication\ApplicationManager::getInstance();
	if ($appManager->checkScope($applicationID) !== true)
	{
		$event = new Main\Event("main", "onApplicationScopeError", ['APPLICATION_ID' => $applicationID]);
		$event->send();

		$context->getResponse()->setStatus("403 Forbidden");
		$application->end();
	}
}

//define the site template
if (!defined("ADMIN_SECTION") || ADMIN_SECTION !== true)
{
	$siteTemplate = "";
	if (!empty($_REQUEST["bitrix_preview_site_template"]) && is_string($_REQUEST["bitrix_preview_site_template"]) && $GLOBALS["USER"]->CanDoOperation('view_other_settings'))
	{
		//preview of site template
		$signer = new Main\Security\Sign\Signer();
		try
		{
			//protected by a sign
			$requestTemplate = $signer->unsign($_REQUEST["bitrix_preview_site_template"], "template_preview".bitrix_sessid());

			$aTemplates = CSiteTemplate::GetByID($requestTemplate);
			if ($template = $aTemplates->Fetch())
			{
				$siteTemplate = $template["ID"];

				//preview of unsaved template
				if (isset($_GET['bx_template_preview_mode']) && $_GET['bx_template_preview_mode'] == 'Y' && $GLOBALS["USER"]->CanDoOperation('edit_other_settings'))
				{
					define("SITE_TEMPLATE_PREVIEW_MODE", true);
				}
			}
		}
		catch (Main\Security\Sign\BadSignatureException)
		{
		}
	}
	if ($siteTemplate == "")
	{
		$siteTemplate = CSite::GetCurTemplate();
	}

	if (!defined('SITE_TEMPLATE_ID'))
	{
		define("SITE_TEMPLATE_ID", $siteTemplate);
	}

	if (!defined('SITE_TEMPLATE_PATH'))
	{
		define("SITE_TEMPLATE_PATH", getLocalPath('templates/'.SITE_TEMPLATE_ID, BX_PERSONAL_ROOT));
	}
}
else
{
	// prevents undefined constants
	if (!defined('SITE_TEMPLATE_ID'))
	{
		define('SITE_TEMPLATE_ID', '.default');
	}

	define('SITE_TEMPLATE_PATH', '/bitrix/templates/.default');
}

//magic parameters: show page creation time
if (isset($_GET["show_page_exec_time"]))
{
	if ($_GET["show_page_exec_time"] == "Y" || $_GET["show_page_exec_time"] == "N")
	{
		$kernelSession["SESS_SHOW_TIME_EXEC"] = $_GET["show_page_exec_time"];
	}
}

//magic parameters: show included file processing time
if (isset($_GET["show_include_exec_time"]))
{
	if ($_GET["show_include_exec_time"] == "Y" || $_GET["show_include_exec_time"] == "N")
	{
		$kernelSession["SESS_SHOW_INCLUDE_TIME_EXEC"] = $_GET["show_include_exec_time"];
	}
}

//magic parameters: show include areas
if (!empty($_GET["bitrix_include_areas"]))
{
	$GLOBALS["APPLICATION"]->SetShowIncludeAreas($_GET["bitrix_include_areas"]=="Y");
}

//magic sound
if ($GLOBALS["USER"]->IsAuthorized())
{
	$cookie_prefix = Option::get('main', 'cookie_name', 'BITRIX_SM');
	if (!isset($_COOKIE[$cookie_prefix.'_SOUND_LOGIN_PLAYED']))
	{
		$GLOBALS["APPLICATION"]->set_cookie('SOUND_LOGIN_PLAYED', 'Y', 0);
	}
}

//magic cache
Main\Composite\Engine::shouldBeEnabled();

// should be before proactive filter on OnBeforeProlog
$userPassword = $_POST["USER_PASSWORD"] ?? null;
$userConfirmPassword = $_POST["USER_CONFIRM_PASSWORD"] ?? null;

foreach(GetModuleEvents("main", "OnBeforeProlog", true) as $arEvent)
{
	ExecuteModuleEventEx($arEvent);
}

// need to reinit
$GLOBALS["APPLICATION"]->SetCurPage(false);

if (!defined("NOT_CHECK_PERMISSIONS") || NOT_CHECK_PERMISSIONS !== true)
{
	//Register user from authorization html form
	//Only POST is accepted
	if (!empty($_POST["AUTH_FORM"]) && $formType == "REGISTRATION")
	{
		if (!$bRsaError && $secureForms)
		{
			if (Option::get("main", "new_user_registration", "N") == "Y" && (!defined("ADMIN_SECTION") || ADMIN_SECTION !== true))
			{
				$arAuthResult = $GLOBALS["USER"]->Register(
					$_POST["USER_LOGIN"] ?? '',
					$_POST["USER_NAME"] ?? '',
					$_POST["USER_LAST_NAME"] ?? '',
					$userPassword,
					$userConfirmPassword,
					$_POST["USER_EMAIL"] ?? '',
					$USER_LID,
					$_POST["captcha_word"] ?? '',
					$_POST["captcha_sid"] ?? '',
					false,
					$_POST["USER_PHONE_NUMBER"] ?? ''
				);

				$GLOBALS["APPLICATION"]->SetAuthResult($arAuthResult);
			}
		}
	}
}

if ((!defined("NOT_CHECK_PERMISSIONS") || NOT_CHECK_PERMISSIONS !== true) && (!defined("NOT_CHECK_FILE_PERMISSIONS") || NOT_CHECK_FILE_PERMISSIONS !== true))
{
	$real_path = $context->getRequest()->getScriptFile();

	if (!$GLOBALS["USER"]->CanDoFileOperation('fm_view_file', [SITE_ID, $real_path]) || (defined("NEED_AUTH") && NEED_AUTH && !$GLOBALS["USER"]->IsAuthorized()))
	{
		if ($GLOBALS["USER"]->IsAuthorized() && empty($arAuthResult["MESSAGE"]))
		{
			$arAuthResult = ["MESSAGE" => GetMessage("ACCESS_DENIED").' '.GetMessage("ACCESS_DENIED_FILE", ["#FILE#" => $real_path]), "TYPE" => "ERROR"];

			if (Option::get("main", "event_log_permissions_fail", "N") === "Y")
			{
				CEventLog::Log(CEventLog::SEVERITY_SECURITY, "USER_PERMISSIONS_FAIL", "main", $GLOBALS["USER"]->GetID(), $real_path);
			}
		}

		if (defined("ADMIN_SECTION") && ADMIN_SECTION === true)
		{
			if (isset($_REQUEST["mode"]) && ($_REQUEST["mode"] === "list" || $_REQUEST["mode"] === "settings"))
			{
				echo "<script>top.location='".$GLOBALS["APPLICATION"]->GetCurPage()."?".DeleteParam(["mode"])."';</script>";
				die();
			}
			elseif (isset($_REQUEST["mode"]) && $_REQUEST["mode"] === "frame")
			{
				echo "<script>
					const w = (opener? opener.window:parent.window);
					w.location.href='" .$GLOBALS["APPLICATION"]->GetCurPage()."?".DeleteParam(["mode"])."';
				</script>";
				die();
			}
			elseif (defined("MOBILE_APP_ADMIN") && MOBILE_APP_ADMIN === true)
			{
				echo json_encode(["status" => "failed"]);
				die();
			}
		}

		/** @noinspection PhpUndefinedVariableInspection */
		$GLOBALS["APPLICATION"]->AuthForm($arAuthResult);
	}
}

/*ZDUyZmZZDBhYjFlNDc2OTE0ZTQwNzEyZWJlOTM2M2ExNjY2ZTA=*/$GLOBALS['____970473944']= array(base64_decode('bXRfcmFu'.'ZA'.'=='),base64_decode(''.'Y2F'.'s'.'bF91'.'c2V'.'yX2Z1bmM='),base64_decode('c3RycG9z'),base64_decode('ZXhwbG'.'9'.'kZQ='.'='),base64_decode('c'.'GF'.'jaw=='),base64_decode('bWQ'.'1'),base64_decode('Y29uc'.'3Rhb'.'nQ='),base64_decode(''.'aGFzaF9obWF'.'j'),base64_decode(''.'c3RyY2'.'1w'),base64_decode('Y2'.'FsbF'.'91c2V'.'yX'.'2Z1bmM='),base64_decode(''.'Y2Fs'.'bF91c2VyX2Z1bm'.'M='),base64_decode('aXNf'.'b2J'.'qZWN0'),base64_decode('Y2F'.'sbF91c2VyX'.'2'.'Z'.'1bmM='),base64_decode(''.'Y2Fs'.'bF91c'.'2Vy'.'X2Z'.'1bmM'.'='),base64_decode('Y2FsbF91c2VyX2Z1bmM='),base64_decode(''.'Y2FsbF91'.'c'.'2'.'VyX'.'2'.'Z1bmM='),base64_decode('Y'.'2FsbF91c2VyX2Z'.'1bmM='),base64_decode(''.'Y2Fsb'.'F91c'.'2VyX2Z1bmM='),base64_decode('Z'.'GVmaW5l'.'ZA=='),base64_decode(''.'c3RybGVu'));if(!function_exists(__NAMESPACE__.'\\___1877262801')){function ___1877262801($_1466065394){static $_1988293869= false; if($_1988293869 == false) $_1988293869=array('XENPcHRpb'.'246OkdldE9'.'wdG'.'lv'.'blN'.'0cmluZw==','bWFp'.'bg==','flBB'.'UkFNX01BWF9VU'.'0VS'.'Uw==','Lg='.'=',''.'Lg==','S'.'Co=','Y'.'ml'.'0cml4','T'.'El'.'DRU5T'.'RV9'.'LRV'.'k=','c2hhMjU2','X'.'E'.'N'.'PcHRpb246'.'Okdl'.'dE9wd'.'GlvblN0cm'.'lu'.'Zw==','bWFpbg==','UEFSQU1fTUFYX1VTRV'.'JT','X'.'EJ'.'pdHJpe'.'Fx'.'NYWl'.'uXENvbmZpZ1xPcHRpb24'.'6OnNl'.'dA==','bWFp'.'bg='.'=','U'.'EFSQ'.'U1fTUF'.'YX1'.'VTRVJT','V'.'VNFUg'.'==','VVNFU'.'g==','VVNF'.'Ug==','S'.'XNBdXR'.'ob3JpemV'.'k',''.'VV'.'NFUg==','SXNBZG1'.'pbg==','QV'.'BQTElD'.'Q'.'VRJT'.'04=','UmVzdG'.'FydEJ1ZmZl'.'cg==',''.'TG'.'9jY'.'W'.'x'.'SZWR'.'p'.'cmVjd'.'A==','L2'.'x'.'pY2Vu'.'c'.'2Vf'.'cm'.'Vz'.'d'.'H'.'JpY3Rp'.'b24u'.'cGhw','X'.'ENPcHRpb246OkdldE9wd'.'G'.'l'.'vblN0cmluZ'.'w='.'=','bWFpbg'.'==','UE'.'F'.'S'.'Q'.'U'.'1fTUFYX1VT'.'RVJT','XE'.'Jpd'.'HJpeFxNYWluX'.'ENvb'.'m'.'Z'.'pZ1'.'xPcHRpb246O'.'nNl'.'dA==','bW'.'Fp'.'bg='.'=','UEFSQU'.'1fTU'.'FYX1VTR'.'V'.'JT','T0x'.'EU0'.'lURUVYUE'.'lSR'.'U'.'RB'.'VE'.'U=',''.'ZXhwaXJlX21lc'.'3My');return base64_decode($_1988293869[$_1466065394]);}};if($GLOBALS['____970473944'][0](round(0+0.5+0.5), round(0+10+10)) == round(0+2.3333333333333+2.3333333333333+2.3333333333333)){ $_1330275421= $GLOBALS['____970473944'][1](___1877262801(0), ___1877262801(1), ___1877262801(2)); if(!empty($_1330275421) && $GLOBALS['____970473944'][2]($_1330275421, ___1877262801(3)) !== false){ list($_1451557607, $_1325438309)= $GLOBALS['____970473944'][3](___1877262801(4), $_1330275421); $_330350090= $GLOBALS['____970473944'][4](___1877262801(5), $_1451557607); $_1726200368= ___1877262801(6).$GLOBALS['____970473944'][5]($GLOBALS['____970473944'][6](___1877262801(7))); $_983678795= $GLOBALS['____970473944'][7](___1877262801(8), $_1325438309, $_1726200368, true); if($GLOBALS['____970473944'][8]($_983678795, $_330350090) !==(1488/2-744)){ if($GLOBALS['____970473944'][9](___1877262801(9), ___1877262801(10), ___1877262801(11)) != round(0+12)){ $GLOBALS['____970473944'][10](___1877262801(12), ___1877262801(13), ___1877262801(14), round(0+12));} if(isset($GLOBALS[___1877262801(15)]) && $GLOBALS['____970473944'][11]($GLOBALS[___1877262801(16)]) && $GLOBALS['____970473944'][12](array($GLOBALS[___1877262801(17)], ___1877262801(18))) &&!$GLOBALS['____970473944'][13](array($GLOBALS[___1877262801(19)], ___1877262801(20)))){ $GLOBALS['____970473944'][14](array($GLOBALS[___1877262801(21)], ___1877262801(22))); $GLOBALS['____970473944'][15](___1877262801(23), ___1877262801(24), true);}}} else{ if($GLOBALS['____970473944'][16](___1877262801(25), ___1877262801(26), ___1877262801(27)) != round(0+3+3+3+3)){ $GLOBALS['____970473944'][17](___1877262801(28), ___1877262801(29), ___1877262801(30), round(0+4+4+4));}}} while(!$GLOBALS['____970473944'][18](___1877262801(31)) || $GLOBALS['____970473944'][19](OLDSITEEXPIREDATE) <=(130*2-260) || OLDSITEEXPIREDATE != SITEEXPIREDATE)die(GetMessage(___1877262801(32)));/**/       //Do not remove this