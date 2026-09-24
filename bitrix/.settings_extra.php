<?php
/**
 * A7 Lead Guard: replace the CRM service container so that users a lead was SHARED with
 * (a7_lead_share + observer) get update rights on that lead only.
 * See bitrix-crm-access/lead-guard/a7_lead_guard_perms.php. Remove this file to disable.
 */
return [
    'services' => [
        'value' => [
            'crm.service.container' => [
                'constructor' => static function () {
                    require_once __DIR__ . '/php_interface/include/a7_lead_guard_perms.php';
                    return new A7CrmContainer();
                },
            ],
        ],
        'readonly' => true,
    ],
];
