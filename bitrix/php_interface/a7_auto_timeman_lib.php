<?php
/**
 * Shared helpers for Matloob Auto Timeman (server-side).
 * Included by the HTTP tool and by the Bitrix agent.
 */

if (!function_exists('a7_auto_tm_config')) {
    function a7_auto_tm_config(): array
    {
        $path = (string)($_SERVER['DOCUMENT_ROOT'] ?? '') . '/bitrix/php_interface/a7_auto_timeman.config.php';
        if (!is_readable($path)) {
            $path = __DIR__ . '/a7_auto_timeman.config.php';
        }
        $cfg = is_readable($path) ? include $path : null;
        return is_array($cfg) ? $cfg : [];
    }

    function a7_auto_tm_user_id(): int
    {
        $cfg = a7_auto_tm_config();
        return (int)($cfg['user_id'] ?? 2311);
    }

    function a7_auto_tm_is_target_user(int $uid): bool
    {
        return $uid > 0 && $uid === a7_auto_tm_user_id();
    }

    function a7_auto_tm_opt_module(): string
    {
        $cfg = a7_auto_tm_config();
        return (string)($cfg['option_module'] ?? 'a7_auto_timeman');
    }

    function a7_auto_tm_is_enabled(): bool
    {
        $cfg = a7_auto_tm_config();
        $mod = a7_auto_tm_opt_module();
        $key = (string)($cfg['option_enabled'] ?? 'enabled');
        return COption::GetOptionString($mod, $key, 'N') === 'Y';
    }

    function a7_auto_tm_set_enabled(bool $on): void
    {
        $cfg = a7_auto_tm_config();
        $mod = a7_auto_tm_opt_module();
        $key = (string)($cfg['option_enabled'] ?? 'enabled');
        COption::SetOptionString($mod, $key, $on ? 'Y' : 'N');
    }

    function a7_auto_tm_now(): DateTimeImmutable
    {
        $cfg = a7_auto_tm_config();
        $tzName = (string)($cfg['timezone'] ?? 'Asia/Karachi');
        try {
            $tz = new DateTimeZone($tzName);
        } catch (Throwable $e) {
            $tz = new DateTimeZone('Asia/Karachi');
        }
        return new DateTimeImmutable('now', $tz);
    }

    function a7_auto_tm_is_skip_day(DateTimeImmutable $now): bool
    {
        $cfg = a7_auto_tm_config();
        $skip = $cfg['skip_weekdays'] ?? [0];
        if (!is_array($skip)) {
            $skip = [0];
        }
        $w = (int)$now->format('w');
        foreach ($skip as $d) {
            if ((int)$d === $w) {
                return true;
            }
        }
        return false;
    }

    /**
     * Parse "HH:MM" into hour/minute integers.
     * @return array{0:int,1:int}
     */
    function a7_auto_tm_parse_hm(string $hm): array
    {
        $parts = preg_split('/\s*:\s*/', trim($hm));
        $h = isset($parts[0]) ? (int)$parts[0] : 0;
        $m = isset($parts[1]) ? (int)$parts[1] : 0;
        return [$h, $m];
    }

    function a7_auto_tm_today_at(DateTimeImmutable $now, string $hm): DateTimeImmutable
    {
        [$h, $m] = a7_auto_tm_parse_hm($hm);
        return $now->setTime($h, $m, 0);
    }

    function a7_auto_tm_load_module(): bool
    {
        return (bool)CModule::IncludeModule('timeman');
    }

    /**
     * @return array{state:string,info:array}
     */
    function a7_auto_tm_status(int $userId): array
    {
        if (!a7_auto_tm_load_module() || !class_exists('CTimeManUser')) {
            return ['state' => '', 'info' => []];
        }
        $tm = new CTimeManUser($userId);
        $state = (string)$tm->State();
        $info = [];
        if (method_exists($tm, 'GetCurrentInfo')) {
            $raw = $tm->GetCurrentInfo();
            $info = is_array($raw) ? $raw : [];
        }
        return ['state' => strtoupper($state), 'info' => $info];
    }

    function a7_auto_tm_is_open_state(string $state): bool
    {
        return in_array($state, ['OPENED', 'PAUSED', 'EXPIRED'], true);
    }

    function a7_auto_tm_get_last(string $which): string
    {
        $cfg = a7_auto_tm_config();
        $mod = a7_auto_tm_opt_module();
        $key = $which === 'close'
            ? (string)($cfg['option_last_close'] ?? 'last_close_date')
            : (string)($cfg['option_last_open'] ?? 'last_open_date');
        return (string)COption::GetOptionString($mod, $key, '');
    }

    function a7_auto_tm_set_last(string $which, string $ymd): void
    {
        $cfg = a7_auto_tm_config();
        $mod = a7_auto_tm_opt_module();
        $key = $which === 'close'
            ? (string)($cfg['option_last_close'] ?? 'last_close_date')
            : (string)($cfg['option_last_open'] ?? 'last_open_date');
        COption::SetOptionString($mod, $key, $ymd);
    }

    /**
     * One agent tick. Manual Timeman state wins: already open → no open;
     * already closed → no close.
     *
     * @return array{ok:bool,action:string,detail:string,state:string}
     */
    function a7_auto_tm_tick(): array
    {
        $cfg = a7_auto_tm_config();
        $userId = a7_auto_tm_user_id();
        $now = a7_auto_tm_now();
        $ymd = $now->format('Y-m-d');
        $status = a7_auto_tm_status($userId);
        $state = $status['state'];

        if (!a7_auto_tm_is_enabled()) {
            return ['ok' => true, 'action' => 'skip', 'detail' => 'auto_off', 'state' => $state];
        }
        if (a7_auto_tm_is_skip_day($now)) {
            return ['ok' => true, 'action' => 'skip', 'detail' => 'sunday', 'state' => $state];
        }
        if (!a7_auto_tm_load_module() || !class_exists('CTimeManUser')) {
            return ['ok' => false, 'action' => 'error', 'detail' => 'timeman_missing', 'state' => $state];
        }

        $inHm = (string)($cfg['clock_in'] ?? '10:00');
        $outHm = (string)($cfg['clock_out'] ?? '19:30');
        $openAt = a7_auto_tm_today_at($now, $inHm);
        $closeAt = a7_auto_tm_today_at($now, $outHm);
        $window = (int)($cfg['open_window_minutes'] ?? 20);
        if ($window < 5) {
            $window = 5;
        }
        $openUntil = $openAt->modify('+' . $window . ' minutes');

        // --- Clock out: at/after 19:30, if still open ---
        if ($now >= $closeAt) {
            if (a7_auto_tm_get_last('close') === $ymd) {
                return ['ok' => true, 'action' => 'skip', 'detail' => 'already_auto_closed_today', 'state' => $state];
            }
            if (!a7_auto_tm_is_open_state($state)) {
                a7_auto_tm_set_last('close', $ymd);
                return ['ok' => true, 'action' => 'skip', 'detail' => 'already_closed', 'state' => $state];
            }
            $tm = new CTimeManUser($userId);
            $ts = $closeAt->getTimestamp();
            $report = 'A7 auto clock-out';
            $ok = false;
            try {
                if ($state === 'EXPIRED') {
                    $ok = (bool)$tm->CloseDay($ts, $report, false);
                } else {
                    $ok = (bool)$tm->CloseDay($ts, $report);
                }
            } catch (Throwable $e) {
                return ['ok' => false, 'action' => 'close_error', 'detail' => $e->getMessage(), 'state' => $state];
            }
            if ($ok) {
                a7_auto_tm_set_last('close', $ymd);
                return ['ok' => true, 'action' => 'closed', 'detail' => $outHm, 'state' => 'CLOSED'];
            }
            // Re-read — some builds return false even when state flipped.
            $after = a7_auto_tm_status($userId)['state'];
            if (!a7_auto_tm_is_open_state($after)) {
                a7_auto_tm_set_last('close', $ymd);
                return ['ok' => true, 'action' => 'closed', 'detail' => $outHm, 'state' => $after];
            }
            return ['ok' => false, 'action' => 'close_failed', 'detail' => $after, 'state' => $after];
        }

        // --- Clock in: only inside morning window after 10:00 ---
        if ($now >= $openAt && $now <= $openUntil) {
            if (a7_auto_tm_get_last('open') === $ymd) {
                return ['ok' => true, 'action' => 'skip', 'detail' => 'already_auto_opened_today', 'state' => $state];
            }
            if (a7_auto_tm_is_open_state($state)) {
                a7_auto_tm_set_last('open', $ymd);
                return ['ok' => true, 'action' => 'skip', 'detail' => 'already_open', 'state' => $state];
            }
            $tm = new CTimeManUser($userId);
            $ts = $openAt->getTimestamp();
            $ok = false;
            try {
                $ok = (bool)$tm->OpenDay($ts, 'A7 auto clock-in');
            } catch (Throwable $e) {
                return ['ok' => false, 'action' => 'open_error', 'detail' => $e->getMessage(), 'state' => $state];
            }
            $after = a7_auto_tm_status($userId)['state'];
            if ($ok || a7_auto_tm_is_open_state($after)) {
                a7_auto_tm_set_last('open', $ymd);
                return ['ok' => true, 'action' => 'opened', 'detail' => $inHm, 'state' => $after];
            }
            return ['ok' => false, 'action' => 'open_failed', 'detail' => $after, 'state' => $after];
        }

        return ['ok' => true, 'action' => 'skip', 'detail' => 'outside_window', 'state' => $state];
    }
}
