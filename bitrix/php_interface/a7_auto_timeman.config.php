<?php
/**
 * Auto clock-in / clock-out — Matloob only (Bitrix user 2311).
 * Times are Asia/Karachi. Sunday never runs (even if Auto is ON).
 */
return [
    'user_id' => 2311,
    'timezone' => 'Asia/Karachi',
    'clock_in' => '10:00',
    'clock_out' => '19:30',
    // PHP date('w'): 0 = Sunday. Only Sunday is skipped.
    'skip_weekdays' => [0],
    // Minutes after the target time when the agent may still act.
    'open_window_minutes' => 20,
    // After clock-out time, keep trying until midnight if still open.
    'close_until_midnight' => true,
    'option_module' => 'a7_auto_timeman',
    'option_enabled' => 'enabled',
    'option_last_open' => 'last_open_date',
    'option_last_close' => 'last_close_date',
];
