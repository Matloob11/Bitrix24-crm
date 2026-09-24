<?php
// A7_INLINE_CRM_AUDIO_PLAYER
// Loads inline CRM timeline voice-note player assets on CRM detail pages.
if (!function_exists('a7_inline_crm_audio_player')) {
    AddEventHandler('main', 'OnEndBufferContent', 'a7_inline_crm_audio_player');

    function a7_inline_crm_audio_player(&$content)
    {
        if (defined('ADMIN_SECTION') && ADMIN_SECTION === true) {
            return;
        }

        $uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
        if (!preg_match('#^/crm/(lead|deal|contact|company)/details/[0-9]+/#', $uri)) {
            return;
        }

        if (strpos($content, 'A7_INLINE_CRM_AUDIO_PLAYER_ASSET') !== false) {
            return;
        }

        $asset = '<link id="A7_INLINE_CRM_AUDIO_PLAYER_ASSET_CSS" rel="stylesheet" href="/bitrix/css/a7_inline_crm_audio_player.css?v=20260621a">' . "
" .
            '<script id="A7_INLINE_CRM_AUDIO_PLAYER_ASSET" src="/bitrix/js/a7_inline_crm_audio_player.js?v=20260621a" defer></script>' . "
";

        if (stripos($content, '</body>') !== false) {
            $content = preg_replace('#</body>#i', $asset . '</body>', $content, 1);
        } else {
            $content .= $asset;
        }
    }
}

// A7 3CX Click-to-Call bridge: inject on CRM pages for logged-in users.
if (function_exists('AddEventHandler')) {
    AddEventHandler('main', 'OnProlog', static function () {
        global $APPLICATION, $USER;
        $uri = (string)($_SERVER['REQUEST_URI'] ?? '');
        if (strpos($uri, '/crm/') !== 0) {
            return;
        }
        if (!is_object($USER) || !$USER->IsAuthorized()) {
            return;
        }
        if (!is_object($APPLICATION) || !method_exists($APPLICATION, 'AddHeadScript')) {
            return;
        }
        $scriptPath = '/bitrix/js/a7_3cx_click_to_call.js';
        $fullPath = (string)($_SERVER['DOCUMENT_ROOT'] ?? '') . $scriptPath;
        $version = is_readable($fullPath) ? (string)@filemtime($fullPath) : (string)time();
        $APPLICATION->AddHeadScript($scriptPath . '?v=' . $version);
    });
}

// A7_OWNER_DATA_CUSTOM_CALL: Owner Data (SPA 1042) custom Call button.
if (function_exists('AddEventHandler')) {
    AddEventHandler('main', 'OnProlog', static function () {
        global $APPLICATION, $USER;
        $uri = (string)($_SERVER['REQUEST_URI'] ?? '');
        if (strpos($uri, '/crm/type/1042/') !== 0) {
            return;
        }
        if (!is_object($USER) || !$USER->IsAuthorized()) {
            return;
        }
        if (!is_object($APPLICATION) || !method_exists($APPLICATION, 'AddHeadScript')) {
            return;
        }
        $scriptPath = '/bitrix/js/a7_owner_data_call.js';
        $fullPath = (string)($_SERVER['DOCUMENT_ROOT'] ?? '') . $scriptPath;
        $version = is_readable($fullPath) ? (string)@filemtime($fullPath) : (string)time();
        $APPLICATION->AddHeadScript($scriptPath . '?v=' . $version);
    });
}

// A7_RENEWALS_CUSTOM_CALL: Renewals deals (category 9) custom Call button → Voiso.
if (function_exists('AddEventHandler')) {
    AddEventHandler('main', 'OnProlog', static function () {
        global $APPLICATION, $USER;
        $uri = (string)($_SERVER['REQUEST_URI'] ?? '');
        if (strpos($uri, '/crm/deal/') !== 0) {
            return;
        }
        if (!is_object($USER) || !$USER->IsAuthorized()) {
            return;
        }
        if (!is_object($APPLICATION) || !method_exists($APPLICATION, 'AddHeadScript')) {
            return;
        }
        $scriptPath = '/bitrix/js/a7_renewals_call.js';
        $fullPath = (string)($_SERVER['DOCUMENT_ROOT'] ?? '') . $scriptPath;
        $version = is_readable($fullPath) ? (string)@filemtime($fullPath) : (string)time();
        $APPLICATION->AddHeadScript($scriptPath . '?v=' . $version);
    });
}


// A7 Tenancy Contract button on Sign page
if (function_exists('AddEventHandler')) {
    AddEventHandler('main', 'OnProlog', static function () {
        global $APPLICATION, $USER;
        $uri = (string)($_SERVER['REQUEST_URI'] ?? '');
        if (strpos($uri, '/sign/') !== 0) {
            return;
        }
        if (!is_object($USER) || !$USER->IsAuthorized()) {
            return;
        }
        if (!is_object($APPLICATION) || !method_exists($APPLICATION, 'AddHeadScript')) {
            return;
        }
        $scriptPath = '/bitrix/js/a7_tenancy_sign_button.js';
        $fullPath = (string)($_SERVER['DOCUMENT_ROOT'] ?? '') . $scriptPath;
        $version = is_readable($fullPath) ? (string)@filemtime($fullPath) : (string)time();
        $APPLICATION->AddHeadScript($scriptPath . '?v=' . $version);
    });
}

// A7_TL_PHONE_MASK: Team leads see masked phones (last 4 hidden) on CRM + Owner Data + Telephony.
if (function_exists('AddEventHandler')) {
    AddEventHandler('main', 'OnProlog', static function () {
        global $APPLICATION, $USER;
        $uri = (string)($_SERVER['REQUEST_URI'] ?? '');
        $onOwner = strpos($uri, '/crm/type/1042/') === 0;
        $onLead = strpos($uri, '/crm/lead/') === 0;
        $onTelephony = stripos($uri, 'telephony/detail') !== false
            || stripos($uri, 'voximplant.statistic.detail') !== false
            || stripos($uri, '/telephony/') !== false;
        if (!$onOwner && !$onLead && !$onTelephony) {
            return;
        }
        if (!is_object($USER) || !$USER->IsAuthorized()) {
            return;
        }
        $uid = (int)$USER->GetID();
        $cfgPath = (string)($_SERVER['DOCUMENT_ROOT'] ?? '') . '/bitrix/php_interface/a7_tl_phone_mask.config.php';
        $cfg = is_readable($cfgPath) ? include $cfgPath : [];
        $leaders = (is_array($cfg) && isset($cfg['leaders']) && is_array($cfg['leaders'])) ? $cfg['leaders'] : [];
        if (!isset($leaders[$uid])) {
            return;
        }
        if (!is_object($APPLICATION) || !method_exists($APPLICATION, 'AddHeadScript')) {
            return;
        }
        $scriptPath = '/bitrix/js/a7_tl_phone_mask.js';
        $fullPath = (string)($_SERVER['DOCUMENT_ROOT'] ?? '') . $scriptPath;
        $version = is_readable($fullPath) ? (string)@filemtime($fullPath) : (string)time();
        $APPLICATION->AddHeadScript($scriptPath . '?v=' . $version);
    });
}

// A7_SALES_DEALS_CUSTOM_CALL: Sales deals (category 1) Zadarma + Voiso Call buttons.
if (function_exists('AddEventHandler')) {
    AddEventHandler('main', 'OnProlog', static function () {
        global $APPLICATION, $USER;
        $uri = (string)($_SERVER['REQUEST_URI'] ?? '');
        if (strpos($uri, '/crm/deal/') !== 0) {
            return;
        }
        if (!is_object($USER) || !$USER->IsAuthorized()) {
            return;
        }
        if (!is_object($APPLICATION) || !method_exists($APPLICATION, 'AddHeadScript')) {
            return;
        }
        $scriptPath = '/bitrix/js/a7_deals_call.js';
        $fullPath = (string)($_SERVER['DOCUMENT_ROOT'] ?? '') . $scriptPath;
        $version = is_readable($fullPath) ? (string)@filemtime($fullPath) : (string)time();
        $APPLICATION->AddHeadScript($scriptPath . '?v=' . $version);
    });
}


// A7_CALL_INTELLIGENCE: extra columns on Telephony → Call details only.
if (function_exists('AddEventHandler')) {
    $a7CiAttachAssets = static function () {
        global $APPLICATION, $USER;
        if (!is_object($USER) || !$USER->IsAuthorized()) {
            return;
        }
        if (!is_object($APPLICATION)) {
            return;
        }
        $doc = (string)($_SERVER['DOCUMENT_ROOT'] ?? '');
        $css = '/bitrix/css/a7_call_intelligence.css';
        $js = '/bitrix/js/a7_call_intelligence.js';
        $cssVer = is_readable($doc . $css) ? (string)@filemtime($doc . $css) : (string)time();
        $jsVer = is_readable($doc . $js) ? (string)@filemtime($doc . $js) : (string)time();
        if (method_exists($APPLICATION, 'SetAdditionalCSS')) {
            $APPLICATION->SetAdditionalCSS($css . '?v=' . $cssVer);
        }
        if (method_exists($APPLICATION, 'AddHeadScript')) {
            $APPLICATION->AddHeadScript($js . '?v=' . $jsVer);
        }
        if (method_exists($APPLICATION, 'AddHeadString')) {
            $APPLICATION->AddHeadString(
                '<link rel="stylesheet" href="' . $css . '?v=' . $cssVer . '">'
                . '<script src="' . $js . '?v=' . $jsVer . '"></script>',
                true
            );
        }
    };

    $a7CiLoadLib = static function () {
        $lib = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? ''), '/\\')
            . '/bitrix/php_interface/include/a7_call_intelligence.php';
        if (!function_exists('a7_ci_crm_boot_script') && is_readable($lib)) {
            if (!defined('A7_CI_LIB_ONLY')) {
                define('A7_CI_LIB_ONLY', true);
            }
            require_once $lib;
        }
    };

    $a7CiAttachHealthToggle = static function () {
        global $APPLICATION, $USER;
        if (!is_object($USER) || !$USER->IsAuthorized() || !is_object($APPLICATION)) {
            return;
        }
        $doc = (string)($_SERVER['DOCUMENT_ROOT'] ?? '');
        $css = '/bitrix/css/a7_call_intelligence.css';
        $js = '/bitrix/js/a7_conversation_health_toggle.js';
        $cssVer = is_readable($doc . $css) ? (string)@filemtime($doc . $css) : (string)time();
        $jsVer = is_readable($doc . $js) ? (string)@filemtime($doc . $js) : (string)time();
        if (method_exists($APPLICATION, 'SetAdditionalCSS')) {
            $APPLICATION->SetAdditionalCSS($css . '?v=' . $cssVer);
        }
        if (method_exists($APPLICATION, 'AddHeadScript')) {
            $APPLICATION->AddHeadScript($js . '?v=' . $jsVer);
        }
    };

    $a7CiAttachCrmAssets = static function () use ($a7CiLoadLib, $a7CiAttachHealthToggle) {
        global $APPLICATION, $USER;
        if (!is_object($USER) || !$USER->IsAuthorized() || !is_object($APPLICATION)) {
            return;
        }
        $doc = (string)($_SERVER['DOCUMENT_ROOT'] ?? '');
        $css = '/bitrix/css/a7_call_intelligence.css';
        $js = '/bitrix/js/a7_call_intelligence_crm.js';
        $cssVer = is_readable($doc . $css) ? (string)@filemtime($doc . $css) : (string)time();
        $jsVer = is_readable($doc . $js) ? (string)@filemtime($doc . $js) : (string)time();
        if (method_exists($APPLICATION, 'SetAdditionalCSS')) {
            $APPLICATION->SetAdditionalCSS($css . '?v=' . $cssVer);
        }
        if (method_exists($APPLICATION, 'AddHeadScript')) {
            $APPLICATION->AddHeadScript($js . '?v=' . $jsVer);
        }
        if (method_exists($APPLICATION, 'AddHeadString')) {
            $APPLICATION->AddHeadString(
                '<link rel="stylesheet" href="' . $css . '?v=' . $cssVer . '">'
                . '<script src="' . $js . '?v=' . $jsVer . '"></script>',
                true
            );
        }
        $a7CiAttachHealthToggle();
        $a7CiLoadLib();
        if (function_exists('a7_ci_crm_boot_script') && method_exists($APPLICATION, 'AddHeadString')) {
            $boot = a7_ci_crm_boot_script();
            if ($boot !== '') {
                $APPLICATION->AddHeadString($boot, true);
            }
        }
    };

    // A7_CI: page detection that also works for Bitrix sliders (IFRAME=Y) and SEF-rewritten CRM pages.
    // Collects every URL hint PHP/Bitrix knows about for this request, not only REQUEST_URI.
    $a7CiRequestHints = static function (): string {
        global $APPLICATION;
        $parts = [
            (string)($_SERVER['REQUEST_URI'] ?? ''),
            (string)($_SERVER['REAL_FILE_PATH'] ?? ''),
            (string)($_SERVER['SCRIPT_NAME'] ?? ''),
            (string)($_SERVER['REDIRECT_URL'] ?? ''),
        ];
        if (is_object($APPLICATION)) {
            try {
                if (method_exists($APPLICATION, 'GetCurPage')) {
                    $parts[] = (string)$APPLICATION->GetCurPage(true);
                }
                if (method_exists($APPLICATION, 'GetCurUri')) {
                    $parts[] = (string)$APPLICATION->GetCurUri();
                }
            } catch (\Throwable $e) {
            }
        }
        try {
            if (class_exists('\Bitrix\Main\Context')) {
                $ctx = \Bitrix\Main\Context::getCurrent();
                if ($ctx && $ctx->getRequest()) {
                    $parts[] = (string)$ctx->getRequest()->getRequestUri();
                }
            }
        } catch (\Throwable $e) {
        }
        return implode(' ', $parts);
    };
    $a7CiIsCrmEntityPage = static function (string $hints): bool {
        return stripos($hints, '/crm/contact/details/') !== false
            || stripos($hints, '/crm/lead/details/') !== false
            || stripos($hints, 'crm.contact.details') !== false
            || stripos($hints, 'crm.lead.details') !== false;
    };
    AddEventHandler('main', 'OnProlog', static function () use ($a7CiAttachCrmAssets, $a7CiAttachHealthToggle, $a7CiRequestHints, $a7CiIsCrmEntityPage) {
        $hints = $a7CiRequestHints();
        if (
            stripos($hints, 'telephony/detail') !== false
            || stripos($hints, 'voximplant.statistic.detail') !== false
        ) {
            // /telephony/detail.php includes a7_call_intelligence.js itself; the OnEndBufferContent
            // fallback below covers other telephony pages. Do not add it twice (no double-include guard).
            return;
        }
        if ($a7CiIsCrmEntityPage($hints)) {
            $a7CiAttachCrmAssets();
            return;
        }
        if (
            stripos($hints, '/crm/deal/details/') !== false
            || stripos($hints, 'crm.deal.details') !== false
        ) {
            $a7CiAttachHealthToggle();
        }
    });

    AddEventHandler('main', 'OnEndBufferContent', static function (&$content) use ($a7CiRequestHints, $a7CiIsCrmEntityPage) {
        if (!is_string($content) || $content === '') {
            return;
        }
        $hints = $a7CiRequestHints();
        $isDeal = stripos($hints, '/crm/deal/details/') !== false
            || stripos($hints, 'crm.deal.details') !== false;
        $isCrm = $a7CiIsCrmEntityPage($hints);
        if (
            !$isCrm
            && (stripos($hints, '/crm/lead/') !== false || stripos($hints, '/crm/contact/') !== false)
            && strpos($content, 'ui-entity-editor') !== false
            && (strpos($content, 'crm-entity-stream') !== false || strpos($content, 'crm-timeline') !== false)
        ) {
            // Lead/Contact details rendered inside a slider or via SEF where the URL hints are incomplete.
            $isCrm = true;
        }
        if (($isCrm || $isDeal) && strpos($content, 'a7_conversation_health_toggle.js') === false) {
            $trimHealth = ltrim($content);
            if ($trimHealth === '' || ($trimHealth[0] !== '{' && $trimHealth[0] !== '[')) {
                global $USER;
                if (is_object($USER) && $USER->IsAuthorized()) {
                    $doc = (string)($_SERVER['DOCUMENT_ROOT'] ?? '');
                    $css = '/bitrix/css/a7_call_intelligence.css';
                    $toggleJs = '/bitrix/js/a7_conversation_health_toggle.js';
                    $cssVer = is_readable($doc . $css) ? (string)@filemtime($doc . $css) : (string)time();
                    $toggleVer = is_readable($doc . $toggleJs) ? (string)@filemtime($doc . $toggleJs) : (string)time();
                    $healthSnippet = '<link rel="stylesheet" href="' . $css . '?v=' . $cssVer . '">'
                        . '<script src="' . $toggleJs . '?v=' . $toggleVer . '"></script>';
                    if (stripos($content, '</body>') !== false) {
                        $content = preg_replace('/<\/body>/i', $healthSnippet . '</body>', $content, 1);
                    } else {
                        $content .= $healthSnippet;
                    }
                }
            }
        }
        if ($isCrm && strpos($content, '/bitrix/js/a7_call_intelligence_crm.js') === false) {
            $trimCrm = ltrim($content);
            if ($trimCrm === '' || ($trimCrm[0] !== '{' && $trimCrm[0] !== '[')) {
                global $USER;
                if (is_object($USER) && $USER->IsAuthorized()) {
                    $doc = (string)($_SERVER['DOCUMENT_ROOT'] ?? '');
                    $css = '/bitrix/css/a7_call_intelligence.css';
                    $js = '/bitrix/js/a7_call_intelligence_crm.js';
                    $cssVer = is_readable($doc . $css) ? (string)@filemtime($doc . $css) : (string)time();
                    $jsVer = is_readable($doc . $js) ? (string)@filemtime($doc . $js) : (string)time();
                    $boot = '';
                    $lib = rtrim($doc, '/\\') . '/bitrix/php_interface/include/a7_call_intelligence.php';
                    if (!function_exists('a7_ci_crm_boot_script') && is_readable($lib)) {
                        if (!defined('A7_CI_LIB_ONLY')) {
                            define('A7_CI_LIB_ONLY', true);
                        }
                        require_once $lib;
                    }
                    if (function_exists('a7_ci_crm_boot_script')) {
                        $boot = a7_ci_crm_boot_script();
                    }
                    $crmSnippet = $boot
                        . '<link rel="stylesheet" href="' . $css . '?v=' . $cssVer . '">'
                        . '<script src="' . $js . '?v=' . $jsVer . '"></script>';
                    if (stripos($content, '</body>') !== false) {
                        $content = preg_replace('/<\/body>/i', $crmSnippet . '</body>', $content, 1);
                    } else {
                        $content .= $crmSnippet;
                    }
                }
            }
        }
        if (strpos($content, '/bitrix/js/a7_call_intelligence.js') !== false) {
            return;
        }
        $trim = ltrim($content);
        if ($trim !== '' && ($trim[0] === '{' || $trim[0] === '[')) {
            return;
        }
        $uri = (string)($_SERVER['REQUEST_URI'] ?? '');
        $hasGrid = strpos($content, 'voximplant_statistic_detail') !== false
            || strpos($content, 'tel-stat-grid-container') !== false;
        if (!$hasGrid && stripos($uri, 'telephony/detail') === false) {
            return;
        }
        global $USER;
        if (!is_object($USER) || !$USER->IsAuthorized()) {
            return;
        }
        $doc = (string)($_SERVER['DOCUMENT_ROOT'] ?? '');
        $css = '/bitrix/css/a7_call_intelligence.css';
        $js = '/bitrix/js/a7_call_intelligence.js';
        $cssVer = is_readable($doc . $css) ? (string)@filemtime($doc . $css) : (string)time();
        $jsVer = is_readable($doc . $js) ? (string)@filemtime($doc . $js) : (string)time();
        $snippet = '<link rel="stylesheet" href="' . $css . '?v=' . $cssVer . '">'
            . '<script src="' . $js . '?v=' . $jsVer . '"></script>';
        if (stripos($content, '</body>') !== false) {
            $content = preg_replace('/<\/body>/i', $snippet . '</body>', $content, 1);
        } else {
            $content .= $snippet;
        }
    });

    AddEventHandler('voximplant', 'onCallEnd', static function ($call = null) {
        $lib = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? ''), '/\\')
            . '/bitrix/php_interface/include/a7_call_intelligence.php';
        if (!function_exists('a7_ci_on_call_finished') && is_readable($lib)) {
            if (!defined('A7_CI_LIB_ONLY')) {
                define('A7_CI_LIB_ONLY', true);
            }
            require_once $lib;
        }
        if (function_exists('a7_ci_on_call_finished')) {
            a7_ci_on_call_finished($call);
        }
    });
}

// A7_LEAD_REMINDER_NOTIFY: lead responsible ping 2 min before, then every 2h till 7pm if no activity.
if (!defined('A7_LEAD_REMINDER_LIB')) {
    define('A7_LEAD_REMINDER_LIB', true);
}
$a7LeadReminderLib = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? ''), '/\\')
    . '/bitrix/php_interface/include/a7_lead_reminder_notify.php';
// A7_LEAD_REMINDER_HOOKED: registered once only (local/php_interface/init.php may hook it too).
if (!defined('A7_LEAD_REMINDER_HOOKED') && is_readable($a7LeadReminderLib)) {
    define('A7_LEAD_REMINDER_HOOKED', true);
    require_once $a7LeadReminderLib;
    if (function_exists('AddEventHandler') && function_exists('a7_lead_reminder_on_activity_saved')) {
        AddEventHandler('crm', 'OnAfterCrmActivityAdd', 'a7_lead_reminder_on_activity_saved');
        AddEventHandler('crm', 'OnAfterCrmActivityUpdate', 'a7_lead_reminder_on_activity_saved');
    }
    if (function_exists('a7_lead_reminder_ensure_agent')) {
        a7_lead_reminder_ensure_agent();
    }
    if (function_exists('AddEventHandler')) {
        AddEventHandler('main', 'OnProlog', static function () {
            if (function_exists('a7_lead_reminder_on_prolog')) {
                a7_lead_reminder_on_prolog();
            }
        });
    }
}

// A7_LEAD_GUARD: leads cannot be deleted by non-admins, edit history notes,
// share (observer) notifications + read-only lock. See bitrix-crm-access/lead-guard/.
if (is_file(__DIR__ . '/include/a7_lead_guard.php')) {
    require_once __DIR__ . '/include/a7_lead_guard.php';
}
// A7_NEHA_COMMUNITY_LEADS: Neha (U2251) can see/edit Damac Lagoons + Serena leads.
if (is_file(__DIR__ . '/include/a7_neha_community_leads.php')) {
    require_once __DIR__ . '/include/a7_neha_community_leads.php';
}


// A7_LEAD_WA_BUTTON: WhatsApp campaign on CRM lead + Owner Data / Availability list + kanban.
if (function_exists('AddEventHandler')) {
    AddEventHandler('main', 'OnProlog', static function () {
        global $APPLICATION, $USER;
        $uri = (string)($_SERVER['REQUEST_URI'] ?? '');
        $onLead = strpos($uri, '/crm/lead/') === 0;
        $onOwner = strpos($uri, '/crm/type/1042/') !== false;
        if (!$onLead && !$onOwner) {
            return;
        }
        if (preg_match('#/crm/lead/details/#', $uri) || preg_match('#/crm/type/1042/details/#', $uri)) {
            return;
        }
        if (!is_object($USER) || !$USER->IsAuthorized()) {
            return;
        }
        if (!is_object($APPLICATION) || !method_exists($APPLICATION, 'AddHeadScript')) {
            return;
        }
        $scriptPath = '/bitrix/js/a7_lead_wa.js';
        $fullPath = (string)($_SERVER['DOCUMENT_ROOT'] ?? '') . $scriptPath;
        $version = is_readable($fullPath) ? (string)@filemtime($fullPath) : (string)time();
        $APPLICATION->AddHeadScript($scriptPath . '?v=' . $version);
    });
}


// A7_C14_VISIBILITY: Availability kanban shows only the assignee (no observer leak).
if (is_file(__DIR__ . '/include/a7_c14_visibility.php')) {
    require_once __DIR__ . '/include/a7_c14_visibility.php';
}
// A7_AUTO_TIMEMAN: Matloob (2311) profile Auto button + server clock-in/out agent.
require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/php_interface/a7_auto_timeman_agent.php';
if (function_exists('AddEventHandler')) {
    AddEventHandler('main', 'OnProlog', static function () {
        global $APPLICATION, $USER;
        if (!is_object($USER) || !$USER->IsAuthorized()) {
            return;
        }
        $cfgPath = (string)($_SERVER['DOCUMENT_ROOT'] ?? '') . '/bitrix/php_interface/a7_auto_timeman.config.php';
        $cfg = is_readable($cfgPath) ? include $cfgPath : [];
        $allowed = (int)(is_array($cfg) ? ($cfg['user_id'] ?? 2311) : 2311);
        if ((int)$USER->GetID() !== $allowed) {
            return;
        }
        if (!is_object($APPLICATION) || !method_exists($APPLICATION, 'AddHeadScript')) {
            return;
        }
        $scriptPath = '/bitrix/js/a7_auto_timeman.js';
        $fullPath = (string)($_SERVER['DOCUMENT_ROOT'] ?? '') . $scriptPath;
        $version = is_readable($fullPath) ? (string)@filemtime($fullPath) : (string)time();
        $APPLICATION->AddHeadScript($scriptPath . '?v=' . $version);
    });
}
