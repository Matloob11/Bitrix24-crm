<?php
require('api.php');
use Bitrix\Main\Loader;
use Bitrix\Main\UserTable;
use Bitrix\Main\Type\DateTime as BxDateTime;
use Bitrix\Crm\LeadTable;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\PhaseSemantics;
use Bitrix\Crm\StatusTable;
use Bitrix\Crm\DealTable;
use Bitrix\Crm\Category\DealCategory;

Loader::includeModule('main');
Loader::includeModule('intranet');
Loader::includeModule('crm');
Loader::includeModule('tasks');

global $USER;


function formatAmount($amount)
{
    return number_format($amount, 0, '.', ',');
}



$viewerId     = ($USER && $USER->IsAuthorized()) ? (int)$USER->GetID() : 0;
$targetUserId = isset($_GET['agent']) ? (int)$_GET['agent'] : $viewerId;

$isAdmin = ($USER && $USER->IsAdmin())
    || \CCrmPerms::IsAdmin($viewerId)
    || \Bitrix\Tasks\Util\User::isSuper($viewerId);

$agentsList = [];
$allowedIds = [];

if ($isAdmin) {
    $res = UserTable::getList([
        'filter' => [
            '=ACTIVE'        => 'Y',
            '!UF_DEPARTMENT' => false,  // has at least one department
        ],
        'select' => ['ID','NAME','LAST_NAME'],
        'order'  => ['ID' => 'ASC'],
    ]);
    while ($u = $res->fetch()) {
        $agentsList[] = $u;
        $allowedIds[] = (int)$u['ID'];
    }
} else {
    // your existing subordinate logic is already "by department" (company structure)
    $dbRes = \CIntranetUtils::GetSubordinateEmployees($viewerId, true, ['ID','NAME','LAST_NAME']);
    while ($u = $dbRes->fetch()) {
        $agentsList[] = $u;
        $allowedIds[] = (int)$u['ID'];
    }

    $self = UserTable::getByPrimary($viewerId, ['select' => ['ID','NAME','LAST_NAME']])->fetch();
    if ($self) {
        $agentsList[] = $self;
        $allowedIds[] = (int)$self['ID'];
    }

    $byId = [];
    foreach ($agentsList as $u) {
        $byId[(int)$u['ID']] = $u;
    }
    $agentsList = array_values($byId);
    $allowedIds = array_values(array_unique($allowedIds));
}


if (!in_array($targetUserId, $allowedIds, true)) {
    $targetUserId = $viewerId;
    if (!in_array($viewerId, $allowedIds, true) && $viewerId > 0) {
        $allowedIds[] = $viewerId;
        // Also push self into agents list if missing
        $self = UserTable::getByPrimary($viewerId, ['select' => ['ID','NAME','LAST_NAME']])->fetch();
        if ($self) {
            $agentsList[] = $self;
        }
    }
}

$ownerId = $targetUserId;

$currentUser = null;
if ($ownerId > 0) {
    $currentUser = UserTable::getByPrimary($ownerId, [
        'select' => ['ID','NAME','LAST_NAME','PERSONAL_PHOTO','PERSONAL_PROFESSION','WORK_POSITION'],
    ])->fetch();
}

$userName = $userPhoto = $userDesignation = '';

if ($currentUser) {
    $userName        = trim(($currentUser['NAME'] ?: '').' '.($currentUser['LAST_NAME'] ?: ''));
    $userDesignation = $currentUser['PERSONAL_PROFESSION'] ?: $currentUser['WORK_POSITION'];
    $img             = \CFile::GetPath($currentUser['PERSONAL_PHOTO']); // capital F
    $userPhoto       = $img ?: 'data:image/png;base64,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';
}

$result = getPropertiesData($ownerId);
if($result){
    $properties = $result['properties'] ?? [];
    $saleCount  = $result['saleCount']  ?? 0;
    $rentCount  = $result['rentCount']  ?? 0;
    $latestListings = $result['latestListings'] ?? [];

}

$LOCAL_TZ = new \DateTimeZone('Asia/Dubai');

// date and time

$todayStartPHP     = new \DateTime('today',    $LOCAL_TZ);
$tomorrowStartPHP  = new \DateTime('tomorrow', $LOCAL_TZ);

$monthStartPHP     = new \DateTime(date('Y-m-01 00:00:00'), $LOCAL_TZ);
$nextMonthStartPHP = (clone $monthStartPHP)->modify('+1 month');

$yearStartPHP      = new \DateTime(date('Y-01-01 00:00:00'), $LOCAL_TZ);
$nextYearStartPHP  = (clone $yearStartPHP)->modify('+1 year');

$todayStart     = BxDateTime::createFromPhp($todayStartPHP);
$tomorrowStart  = BxDateTime::createFromPhp($tomorrowStartPHP);

$monthStart     = BxDateTime::createFromPhp($monthStartPHP);
$nextMonthStart = BxDateTime::createFromPhp($nextMonthStartPHP);

$yearStart      = BxDateTime::createFromPhp($yearStartPHP);
$nextYearStart  = BxDateTime::createFromPhp($nextYearStartPHP);



// --------------------- Listings ---------------------

// Set this to whatever timezone the API strings are in.
$API_TZ   = new \DateTimeZone('UTC');         // or 'Asia/Dubai' if API sends local time
$LOCAL_TZ = new \DateTimeZone('Asia/Dubai');  // your local reporting tz

function parseListingTsExact(?string $s, ?\DateTimeZone $apiTz = null): ?int {
    if (!$s) return null;
    // Native PHP parser (NOT Bitrix)
    $dt = \DateTime::createFromFormat('Y-m-d H:i:s', $s, $apiTz ?? new \DateTimeZone('UTC'));
    if (!$dt) return null;
    return $dt->getTimestamp();
}

function inRange(?int $ts, int $startTs, int $endTs): bool {
    return $ts !== null && $ts >= $startTs && $ts < $endTs;
}

// ---- Local month/year boundaries (native PHP) ----
$nowLocal    = new \DateTime('now', $LOCAL_TZ);
$monthStartD = (clone $nowLocal)->modify('first day of this month 00:00:00');
$monthEndD   = (clone $monthStartD)->modify('first day of next month');
$yearStartD  = (clone $nowLocal)->setDate((int)$nowLocal->format('Y'), 1, 1)->setTime(0,0,0);
$yearEndD    = (clone $yearStartD)->modify('+1 year');

// Timestamps used for comparing API Listing_Created_Date
$monthStartTs = $monthStartD->getTimestamp();
$monthEndTs   = $monthEndD->getTimestamp();
$yearStartTs  = $yearStartD->getTimestamp();
$yearEndTs    = $yearEndD->getTimestamp();

// === Aggregate top agents by API dates ===
function aggregateTopAgentsExact(array $properties, int $startTs, int $endTs, int $limit, \DateTimeZone $apiTz): array {
    $map = [];
    foreach ($properties as $p) {
        $ts = parseListingTsExact($p['Listing_Created_Date'] ?? null, $apiTz);
        if (!inRange($ts, $startTs, $endTs)) continue;

        $id    = $p['agent_id']   ?? $p['Agent_ID']   ?? $p['owner_id'] ?? $p['ownerId'] ?? null;
        $name  = $p['agent_name'] ?? $p['Agent_Name'] ?? $p['owner_name'] ?? $p['ownerName'] ?? '—';
        $photo = $p['agent_photo']?? $p['Agent_Photo']?? $p['photo'] ?? null;
        if ($id === null) $id = $name;

        if (!isset($map[$id])) $map[$id] = ['id'=>$id,'name'=>$name,'photo'=>$photo,'count'=>0];
        $map[$id]['count']++;
        if (!$map[$id]['photo'] && $photo) $map[$id]['photo'] = $photo;
        if ($name && $map[$id]['name'] === '—') $map[$id]['name'] = $name;
    }
    usort($map, fn($a,$b) => $a['count'] === $b['count'] ? strcmp($a['name'],$b['name']) : $b['count'] <=> $a['count']);
    return array_slice($map, 0, $limit);
}

$top3Month = aggregateTopAgentsExact($properties, $monthStartTs, $monthEndTs, 3, $API_TZ);
$top10Year = aggregateTopAgentsExact($properties, $yearStartTs,  $yearEndTs,  10, $API_TZ);

// For your view helpers, if needed:
$top3MonthData = array_map(fn($a)=>['name'=>$a['name'],'photo'=>$a['photo']??'','value'=>$a['count']], $top3Month);
$top10YearData = array_map(fn($a)=>['name'=>$a['name'],'photo'=>$a['photo']??'','value'=>$a['count']], $top10Year);

// --------------------- SPA  (Views/Meetings) ---------------------

$spaTypeId     = 1096;
$spaCategoryId = null;

$spaDailyTotal   = 0;
$spaMonthlyTotal = 0;
$spaYearlyTotal  = 0;
$spaAllTimeTotal = 0;

$spaFactory = \Bitrix\Crm\Service\Container::getInstance()->getFactory($spaTypeId);
if ($spaFactory) {
    $spaDataClass = $spaFactory->getDataClass();

    // base filter
    $spaBase = ['=ASSIGNED_BY_ID' => $ownerId];
    if ($spaCategoryId !== null) {
        $spaBase['=CATEGORY_ID'] = (int)$spaCategoryId;
    }

    // Daily (Today)
    $spaDailyTotal = $spaDataClass::getCount($spaBase + [
            '>=CREATED_TIME' => $todayStart,
            '<CREATED_TIME'  => $tomorrowStart,
        ]);

    // MTD
    $spaMonthlyTotal = $spaDataClass::getCount($spaBase + [
            '>=CREATED_TIME' => $monthStart,
            '<CREATED_TIME'  => $nextMonthStart,
        ]);

    // YTD
    $spaYearlyTotal = $spaDataClass::getCount($spaBase + [
            '>=CREATED_TIME' => $yearStart,
            '<CREATED_TIME'  => $nextYearStart,
        ]);

    // All-time (optional)
    $spaAllTimeTotal = $spaDataClass::getCount($spaBase);
}

$dealPeriod = isset($_GET['period']) ? strtolower($_GET['period']) : 'today';
if (!in_array($dealPeriod, ['today', 'mtd', 'ytd'], true)) {
    $dealPeriod = 'today';
}

switch ($dealPeriod) {
    case 'mtd':
        $viewTotal = (int) $spaMonthlyTotal;
        break;
    case 'ytd':
        $viewTotal = (int) $spaYearlyTotal;
        break;
    default: // today
        $viewTotal = (int) $spaDailyTotal;
        break;
}

// -----------------------------------------------------------------------------

function countLeads($ownerId, $status = null, $from, $to)
{
    $filter = [
        'ASSIGNED_BY_ID' => $ownerId,
        '>=DATE_CREATE'  => $from,
        '<DATE_CREATE'   => $to
    ];

    if (!is_null($status)) {
        $filter['STATUS_ID'] = $status;
    }

    return \Bitrix\Crm\LeadTable::getCount($filter);
}

// this is primary lead table fetching

$todayAllLeads   = countLeads($ownerId, null, $todayStart, $tomorrowStart);
$monthlyAllLeads = countLeads($ownerId, null, $monthStart, $nextMonthStart);
$yearlyAllLeads  = countLeads($ownerId, null, $yearStart, $nextYearStart);

// WON by semantics
$dailyWon = !empty($leadSuccessStatuses) ? LeadTable::getCount([
    '=ASSIGNED_BY_ID' => $ownerId,
    '@STATUS_ID'      => $leadSuccessStatuses,
    '>=DATE_CREATE'   => $todayStart,
    '<DATE_CREATE'    => $tomorrowStart
]) : 0;

$monthlyWon = !empty($leadSuccessStatuses) ? LeadTable::getCount([
    '=ASSIGNED_BY_ID' => $ownerId,
    '@STATUS_ID'      => $leadSuccessStatuses,
    '>=DATE_CREATE'   => $monthStart,
    '<DATE_CREATE'    => $nextMonthStart
]) : 0;

$yearlyWon = !empty($leadSuccessStatuses) ? LeadTable::getCount([
    '=ASSIGNED_BY_ID' => $ownerId,
    '@STATUS_ID'      => $leadSuccessStatuses,
    '>=DATE_CREATE'   => $yearStart,
    '<DATE_CREATE'    => $nextYearStart
]) : 0;

// JUNK/Failure by semantics
$dailyJunk = !empty($leadFailureStatuses) ? LeadTable::getCount([
    '=ASSIGNED_BY_ID' => $ownerId,
    '@STATUS_ID'      => $leadFailureStatuses,
    '>=DATE_CREATE'   => $todayStart,
    '<DATE_CREATE'    => $tomorrowStart
]) : 0;

$monthlyJunk = !empty($leadFailureStatuses) ? LeadTable::getCount([
    '=ASSIGNED_BY_ID' => $ownerId,
    '@STATUS_ID'      => $leadFailureStatuses,
    '>=DATE_CREATE'   => $monthStart,
    '<DATE_CREATE'    => $nextMonthStart
]) : 0;

$yearlyJunk = !empty($leadFailureStatuses) ? LeadTable::getCount([
    '=ASSIGNED_BY_ID' => $ownerId,
    '@STATUS_ID'      => $leadFailureStatuses,
    '>=DATE_CREATE'   => $yearStart,
    '<DATE_CREATE'    => $nextYearStart
]) : 0;

// Totals
$dailyTotal = LeadTable::getCount([
    '=ASSIGNED_BY_ID' => $ownerId,
    '>=DATE_CREATE'   => $todayStart,
    '<DATE_CREATE'    => $tomorrowStart
]);
$monthlyTotal = LeadTable::getCount([
    '=ASSIGNED_BY_ID' => $ownerId,
    '>=DATE_CREATE'   => $monthStart,
    '<DATE_CREATE'    => $nextMonthStart
]);
$yearlyTotal = LeadTable::getCount([
    '=ASSIGNED_BY_ID' => $ownerId,
    '>=DATE_CREATE'   => $yearStart,
    '<DATE_CREATE'    => $nextYearStart
]);

$dailyInProcess   = $dailyTotal   - ($dailyWon + $dailyJunk);
$monthlyInProcess = $monthlyTotal - ($monthlyWon + $monthlyJunk);
$yearlyInProcess  = $yearlyTotal  - ($yearlyWon + $yearlyJunk);

$totalLeads = LeadTable::getCount([
    '=ASSIGNED_BY_ID' => $ownerId
]);

$wonLeads  = !empty($leadSuccessStatuses) ? LeadTable::getCount([
    '=ASSIGNED_BY_ID' => $ownerId,
    '@STATUS_ID'      => $leadSuccessStatuses
]) : 0;

$junkLeads = !empty($leadFailureStatuses) ? LeadTable::getCount([
    '=ASSIGNED_BY_ID' => $ownerId,
    '@STATUS_ID'      => $leadFailureStatuses
]) : 0;

$inProcessLeads = $totalLeads - ($wonLeads + $junkLeads);

$latestLeadLimit = 3;

$leadSourceNames = \CCrmStatus::GetStatusList('SOURCE');
$leadStatusNames = \CCrmStatus::GetStatusList('STATUS');

$latestLeads = [];
$leadCursor = LeadTable::getList([
    'select' => ['ID', 'TITLE', 'SOURCE_ID', 'STATUS_ID', 'DATE_CREATE'],
    'filter' => [
        '=ASSIGNED_BY_ID' => $ownerId,
    ],
    'order'  => ['DATE_CREATE' => 'DESC'],
    'limit'  => $latestLeadLimit,
]);

while ($row = $leadCursor->fetch()) {
    $id         = (int)$row['ID'];
    $title      = (string)($row['TITLE'] ?? '');
    $sourceId   = (string)($row['SOURCE_ID'] ?? '');
    $statusId   = (string)($row['STATUS_ID'] ?? '');
    $dateCreate = $row['DATE_CREATE']; // Bitrix Main\Type\DateTime

    $latestLeads[] = [
        'ID'        => $id,
        'TITLE'     => $title !== '' ? $title : '—',
        'SOURCE'    => $leadSourceNames[$sourceId] ?? ($sourceId !== '' ? $sourceId : '—'),
        'STATUS'    => $leadStatusNames[$statusId] ?? ($statusId !== '' ? $statusId : '—'),
        'RECEIVED'  => $dateCreate instanceof \Bitrix\Main\Type\DateTime
            ? $dateCreate->toUserTime()->format('d M, Y H:i')
            : '—',
        'DETAIL_URL' => '/crm/lead/details/' . $id . '/',
    ];
}

//-----------------this is hot listing fetching --------------------

use Bitrix\Main\Entity\ReferenceField;
use Bitrix\Main\Entity\ExpressionField;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();
Loader::includeModule('crm');

/* ===== Config ===== */
$UF_BEDROOM       = 'UF_CRM_25_1758035460242';
$UF_AMOUNT        = 'UF_CRM_25_1758035084824';
$UF_COMMUNITY     = 'UF_CRM_25_1758035324';  // SPA ID(s) of Community (type 1032)
$UF_SUBCOMMUNITY  = 'UF_CRM_25_1758035343';  // keep as enum/list unless you say it's SPA too

$HOT_TYPE_ID      = 1128;
$HOT_FIELD        = 'UF_CRM_25_1760610438867';
$HOT_YES_VALUE    = 6185;

$COMMUNITY_SPA_TYPE_ID = 1032;              // SPA "Community" Type
$MAX_ROWS         = 1000;                    // one definition only
$PER_SLIDE        = 4;
$ORDER            = ['ID' => 'DESC'];
$CURRENCY_PREFIX  = 'AED ';

/* ===== Helpers ===== */
function spItemUrl(int $typeId, int $itemId, $factory): string {
    $router = \Bitrix\Crm\Service\Container::getInstance()->getRouter();
    if (is_object($router) && method_exists($router, 'getItemDetailUrl')) {
        $uri = $router->getItemDetailUrl($typeId, $itemId);
        if ($uri) return is_object($uri) ? $uri->getUri() : (string)$uri;
    }
    if (is_object($factory) && method_exists($factory, 'getItemDetailUrl')) {
        $uri = $factory->getItemDetailUrl($itemId);
        if ($uri) return is_object($uri) ? $uri->getUri() : (string)$uri;
    }
    return "/crm/type/{$typeId}/details/{$itemId}/";
}
function agent_initials(string $fullName): string {
    $parts = preg_split('/\s+/', trim($fullName));
    $a = mb_substr($parts[0] ?? '', 0, 1);
    $b = mb_substr($parts[1] ?? '', 0, 1);
    $ini = mb_strtoupper($a.$b);
    return $ini !== '' ? $ini : 'A';
}
function resolve_enum_values($values) {
    if (is_array($values)) {
        $ids = array_filter(array_map('intval', $values));
        if (!$ids) return $values;
        $map = [];
        $enumRes = (new \CUserFieldEnum())->GetList([], ['ID' => $ids]);
        while ($e = $enumRes->Fetch()) $map[(int)$e['ID']] = (string)$e['VALUE'];
        return array_map(fn($v) => $map[(int)$v] ?? (string)$v, $values);
    }
    $id = (int)$values;
    if ($id <= 0) return $values;
    $enumRes = (new \CUserFieldEnum())->GetList([], ['ID' => $id]);
    if ($row = $enumRes->Fetch()) return (string)$row['VALUE'];
    return $values;
}
function format_amount($raw, string $prefix = ''): string {
    if ($raw === null || $raw === '') return '';
    $test = str_replace([',',' '], '', (string)$raw);
    if (is_numeric($test)) return $prefix . number_format((float)$test, 0, '.', ',');
    return (string)$raw;
}

/* ===== Step 1: Fetch RAW rows ===== */
$rawRows = [];
$listings = [];
$factory  = \Bitrix\Crm\Service\Container::getInstance()->getFactory($HOT_TYPE_ID);
$TARGET_STAGE = 'DT1128_28:NEW';

$catId = null;
if (preg_match('/^DT(\d+)_([0-9]+):(.+)$/', $TARGET_STAGE, $m)) {
    $catId = (int)$m[2];
}
//if ($factory) {
//    $dataClass = $factory->getDataClass();
//    $res = $dataClass::getList([
//        'select' => [
//            'ID','TITLE','ASSIGNED_BY_ID',
//            'UF_BEDROOM'      => $UF_BEDROOM,
//            'UF_AMOUNT'       => $UF_AMOUNT,
//            'UF_COMMUNITY'    => $UF_COMMUNITY,
//            'UF_SUBCOMMUNITY' => $UF_SUBCOMMUNITY,
//            'STAGE_ID','CATEGORY_ID',
//            'U_NAME'  => 'U.NAME',
//            'U_LAST'  => 'U.LAST_NAME',
//            'U_PHOTO' => 'U.PERSONAL_PHOTO',
//        ],
//        'filter' => array_filter([
//            "={$HOT_FIELD}" => $HOT_YES_VALUE,
//            '=STAGE_ID'     => $TARGET_STAGE,   // exact stage
//            '=CATEGORY_ID'  => $catId,          // MUST match 28 here
//        ], static fn($v) => $v !== null && $v !== ''),
//        'runtime' => [
//            new ReferenceField('U', UserTable::class, ['=this.ASSIGNED_BY_ID' => 'ref.ID'], ['join_type' => 'left']),
//        ],
//        'order' => $ORDER,
//        'limit' => $MAX_ROWS,
//    ]);
//
//    while ($row = $res->fetch()) {
//        $rawRows[] = $row;
//    }
//}

/* ===== Step 2: Build a COMMUNITY title map (SPA 1032) in ONE query ===== */
$communityIdSet = [];
foreach ($rawRows as $r) {
    $cv = $r['UF_COMMUNITY'] ?? null;
    if ($cv === null || $cv === '') continue;
    if (is_array($cv)) {
        foreach ($cv as $one) { $id = (int)$one; if ($id > 0) $communityIdSet[$id] = true; }
    } else {
        $id = (int)$cv; if ($id > 0) $communityIdSet[$id] = true;
    }
}

$communityTitleMap = [];
if (!empty($communityIdSet)) {
    $commFactory = \Bitrix\Crm\Service\Container::getInstance()->getFactory($COMMUNITY_SPA_TYPE_ID);
    if ($commFactory) {
        $commDataClass = $commFactory->getDataClass();
        $commRes = $commDataClass::getList([
            'select' => ['ID','TITLE'],
            'filter' => ['@ID' => array_keys($communityIdSet)],
        ]);
        while ($c = $commRes->fetch()) {
            $communityTitleMap[(int)$c['ID']] = (string)$c['TITLE'];
        }
    }
}

/* ===== Step 3: Build FINAL $listings with resolved names ===== */
foreach ($rawRows as $row) {
    $itemId    = (int)$row['ID'];
    $uid       = (int)$row['ASSIGNED_BY_ID'];
    $name      = trim(($row['U_NAME'] ?? '').' '.($row['U_LAST'] ?? '')) ?: 'User #'.$uid;
    $photoPath = !empty($row['U_PHOTO']) ? \CFile::GetPath($row['U_PHOTO']) : '';

    // Bedrooms (enum) → readable
    $bedroomVal = $row['UF_BEDROOM'] ?? '';
    $bedroomResolved = resolve_enum_values($bedroomVal);
    $bedrooms = is_array($bedroomResolved) ? implode(', ', $bedroomResolved) : (string)$bedroomResolved;

    // Community (SPA IDs) → SPA TITLES via map
    $communityVal = $row['UF_COMMUNITY'] ?? '';
    if (is_array($communityVal)) {
        $communityDispArr = [];
        foreach ($communityVal as $one) {
            $id = (int)$one;
            $communityDispArr[] = $communityTitleMap[$id] ?? (string)$one;
        }
        $communityDisp = implode(', ', array_filter($communityDispArr, fn($x)=>$x!==''));
    } else {
        $id = (int)$communityVal;
        $communityDisp = $id > 0 ? ($communityTitleMap[$id] ?? (string)$communityVal) : (string)$communityVal;
    }

    // Subcommunity (enum) → readable (tell me if it’s SPA too)
    $subCommVal  = $row['UF_SUBCOMMUNITY'] ?? '';
    $subCommRes  = resolve_enum_values($subCommVal);
    $subCommunityDisp = is_array($subCommRes) ? implode(', ', $subCommRes) : (string)$subCommRes;

    $amount = format_amount($row['UF_AMOUNT'] ?? null, $CURRENCY_PREFIX);

    $listings[] = [
        'id'           => $itemId,
        'title'        => ($row['TITLE'] ?: ('#'.$itemId)),
        'agent_id'     => $uid,
        'agent_name'   => $name,
        'agent_photo'  => $photoPath,
        'bedrooms'     => $bedrooms,          // ex: "1 Bedroom"
        'amount'       => $amount,            // ex: "AED 2,300,000"
        'community'    => $communityDisp,     // SPA title(s)
        'subcommunity' => $subCommunityDisp,  // enum title(s)
        'agent_url'    => "/company/personal/user/{$uid}/",
        'detail_url'   => spItemUrl($HOT_TYPE_ID, $itemId, $factory),
    ];
}

$tableSlides = array_chunk($listings, $PER_SLIDE);
$totalSlides = count($tableSlides);
// --------------------- this is deal table fetching ---------------------

$dealCategoryId = 0; // change if you use another pipeline/category

$dealDailyTotal = $dealMonthlyTotal = $dealYearlyTotal = 0;
$dealDailyWon   = $dealMonthlyWon   = $dealYearlyWon   = 0;
$dealDailyLost  = $dealMonthlyLost  = $dealYearlyLost  = 0;
$dealDailyInProcess = $dealMonthlyInProcess = $dealYearlyInProcess = 0;

$dealTotal = $dealWon = $dealLost = $dealInProcess = 0;

$dealFactory = Container::getInstance()->getFactory(\CCrmOwnerType::Deal);
$dealSuccessStages = $dealFailureStages = [];

if ($dealFactory) {
    foreach ($dealFactory->getStages($dealCategoryId) as $stage) {
        $sem = $stage->getSemantics();
        if ($sem === PhaseSemantics::SUCCESS) {
            $dealSuccessStages[] = $stage->getId();
        } elseif ($sem === PhaseSemantics::FAILURE) {
            $dealFailureStages[] = $stage->getId();
        }
    }
}

function countDeals($ownerId, $status = null)
{
    $filter = ['=CREATED_BY_ID' => $ownerId];

    if (!is_null($status)) {
        $filter['STATUS_ID'] = $status;
    }

    return \Bitrix\Crm\DealTable::getCount($filter);
}

$totalDeals = countDeals($ownerId, null);

// ---- Daily (created today) ----
$dealDailyTotal = DealTable::getCount([
    '=CREATED_BY_ID' => $ownerId,
    '=CATEGORY_ID'    => $dealCategoryId,
    '>=DATE_CREATE'   => $todayStart,
    '<DATE_CREATE'    => $tomorrowStart,
]);
$dealDailyWon  = !empty($dealSuccessStages) ? DealTable::getCount([
    '=CREATED_BY_ID' => $ownerId,
    '=CATEGORY_ID'    => $dealCategoryId,
    '@STAGE_ID'       => $dealSuccessStages,
    '>=DATE_CREATE'   => $todayStart,
    '<DATE_CREATE'    => $tomorrowStart,
]) : 0;
$dealDailyLost = !empty($dealFailureStages) ? DealTable::getCount([
    '=CREATED_BY_ID' => $ownerId,
    '=CATEGORY_ID'    => $dealCategoryId,
    '@STAGE_ID'       => $dealFailureStages,
    '>=DATE_CREATE'   => $todayStart,
    '<DATE_CREATE'    => $tomorrowStart,
]) : 0;
$dealDailyInProcess = max(0, $dealDailyTotal - ($dealDailyWon + $dealDailyLost));

// ---- Monthly (MTD) ----
$dealMonthlyTotal = DealTable::getCount([
    '=CREATED_BY_ID' => $ownerId,
    '=CATEGORY_ID'    => $dealCategoryId,
    '>=DATE_CREATE'   => $monthStart,
    '<DATE_CREATE'    => $nextMonthStart,
]);
$dealMonthlyWon  = !empty($dealSuccessStages) ? DealTable::getCount([
    '=CREATED_BY_ID' => $ownerId,
    '=CATEGORY_ID'   => $dealCategoryId,
    '@STAGE_ID'      => $dealSuccessStages,
    '>=DATE_CREATE'  => $monthStart,
    '<DATE_CREATE'   => $nextMonthStart,
]) : 0;
$dealMonthlyLost = !empty($dealFailureStages) ? DealTable::getCount([
    '=CREATED_BY_ID' => $ownerId,
    '=CATEGORY_ID'    => $dealCategoryId,
    '@STAGE_ID'       => $dealFailureStages,
    '>=DATE_CREATE'   => $monthStart,
    '<DATE_CREATE'    => $nextMonthStart,
]) : 0;
$dealMonthlyInProcess = max(0, $dealMonthlyTotal - ($dealMonthlyWon + $dealMonthlyLost));

// ---- Yearly (YTD) ----
$dealYearlyTotal = DealTable::getCount([
    '=CREATED_BY_ID' => $ownerId,
    '=CATEGORY_ID'    => $dealCategoryId,
    '>=DATE_CREATE'   => $yearStart,
    '<DATE_CREATE'    => $nextYearStart,
]);
$dealYearlyWon  = !empty($dealSuccessStages) ? DealTable::getCount([
    '=CREATED_BY_ID' => $ownerId,
    '=CATEGORY_ID'    => $dealCategoryId,
    '@STAGE_ID'       => $dealSuccessStages,
    '>=DATE_CREATE'   => $yearStart,
    '<DATE_CREATE'    => $nextYearStart,
]) : 0;
$dealYearlyLost = !empty($dealFailureStages) ? DealTable::getCount([
    '=CREATED_BY_ID' => $ownerId,
    '=CATEGORY_ID'    => $dealCategoryId,
    '@STAGE_ID'       => $dealFailureStages,
    '>=DATE_CREATE'   => $yearStart,
    '<DATE_CREATE'    => $nextYearStart,
]) : 0;
$dealYearlyInProcess = max(0, $dealYearlyTotal - ($dealYearlyWon + $dealYearlyLost));

// ---- All-time ----
$dealTotal = DealTable::getCount([
    '=CREATED_BY_ID' => $ownerId,
    '=CATEGORY_ID'    => $dealCategoryId,
]);
$dealWon  = !empty($dealSuccessStages) ? DealTable::getCount([
    '=CREATED_BY_ID' => $ownerId,
    '=CATEGORY_ID'    => $dealCategoryId,
    '@STAGE_ID'       => $dealSuccessStages,
]) : 0;
$dealLost = !empty($dealFailureStages) ? DealTable::getCount([
    '=CREATED_BY_ID' => $ownerId,
    '=CATEGORY_ID'    => $dealCategoryId,
    '@STAGE_ID'       => $dealFailureStages,
]) : 0;
$dealInProcess = max(0, $dealTotal - ($dealWon + $dealLost));


$dealPeriod = isset($_GET['period']) ? strtolower($_GET['period']) : 'today';
if (!in_array($dealPeriod, ['today', 'mtd', 'ytd'], true)) {
    $dealPeriod = 'today';
}

switch ($dealPeriod) {
    case 'mtd':
        $dealDispLabel     = 'Month to Date';
        $dealDispTotal     = (int)$dealMonthlyTotal;
        $dealDispWon       = (int)$dealMonthlyWon;
        $dealDispLost      = (int)$dealMonthlyLost;
        $dealDispInProcess = (int)$dealMonthlyInProcess;
        break;
    case 'ytd':
        $dealDispLabel     = 'Year to Date';
        $dealDispTotal     = (int)$dealYearlyTotal;
        $dealDispWon       = (int)$dealYearlyWon;
        $dealDispLost      = (int)$dealYearlyLost;
        $dealDispInProcess = (int)$dealYearlyInProcess;
        break;
    default: // today
        $dealDispLabel     = 'Today';
        $dealDispTotal     = (int)$dealDailyTotal;
        $dealDispWon       = (int)$dealDailyWon;
        $dealDispLost      = (int)$dealDailyLost;
        $dealDispInProcess = (int)$dealDailyInProcess;
        break;
}


/**
 * Sum a numeric deal field with a given filter.
 * Works for OPPORTUNITY or any numeric UF (e.g. UF_CRM_1748441095).
 */



// ---------- helper to sum OPPORTUNITY with a filter ----------
function sumDealOpportunity(array $filter): float
{
    $row = DealTable::getList([
        'select'  => ['SUM_OPPORTUNITY'],
        'filter'  => $filter,
        'runtime' => [new ExpressionField('SUM_OPPORTUNITY', 'SUM(%s)', 'OPPORTUNITY')],
        'limit'   => 1,
    ])->fetch();

    return (float)($row['SUM_OPPORTUNITY'] ?? 0);
}

$totalDealAmount = sumDealOpportunity([
    '=CREATED_BY_ID'  => $ownerId,
]);

// ---------- totals for deals CREATED by this user ----------
$dealAmountDailyCreated   = sumDealOpportunity([
    '=CREATED_BY_ID'  => $ownerId,
    '>=DATE_CREATE'   => $todayStart,
    '<DATE_CREATE'    => $tomorrowStart,
]);

$dealAmountMonthlyCreated = sumDealOpportunity([
    '=CREATED_BY_ID'  => $ownerId,
    '>=DATE_CREATE'   => $monthStart,
    '<DATE_CREATE'    => $nextMonthStart,
]);

$dealAmountYearlyCreated  = sumDealOpportunity([
    '=CREATED_BY_ID'  => $ownerId,
    '>=DATE_CREATE'   => $yearStart,
    '<DATE_CREATE'    => $nextYearStart,
]);

$dealAmountAllTimeCreated = sumDealOpportunity([
    '=CREATED_BY_ID'  => $ownerId,
]);

// ---------- hook into your ?period=today|mtd|ytd ----------
switch ($period) {
    case 'mtd':
        $dealAmountDisp = $dealAmountMonthlyCreated;
        break;
    case 'ytd':
        $dealAmountDisp = $dealAmountYearlyCreated;
        break;
    default:
        $dealAmountDisp = $dealAmountDailyCreated;
        break;
}



/**
 * Sum a numeric (commission) field over deals matching $filter.
 */
function sumDealField(array $filter, string $fieldName): float
{
    $row = DealTable::getList([
        'select'  => ['SUM_VAL'],
        'filter'  => $filter,
        'runtime' => [
            new ExpressionField('SUM_VAL', 'SUM(COALESCE(%s, 0))', $fieldName),
        ],
        'limit'   => 1,
    ])->fetch();

    return (float)($row['SUM_VAL'] ?? 0.0);
}

// ----- COMMISSION totals for deals CREATED by this user -----
$commissionField = 'UF_CRM_1731924586768';



$commissionDailyCreated   = sumDealField([
    '=CREATED_BY_ID' => $ownerId,
    '>=DATE_CREATE'  => $todayStart,
    '<DATE_CREATE'   => $tomorrowStart,
], $commissionField);

$commissionMonthlyCreated = sumDealField([
    '=CREATED_BY_ID' => $ownerId,
    '>=DATE_CREATE'  => $monthStart,
    '<DATE_CREATE'   => $nextMonthStart,
], $commissionField);

$commissionYearlyCreated  = sumDealField([
    '=CREATED_BY_ID' => $ownerId,
    '>=DATE_CREATE'  => $yearStart,
    '<DATE_CREATE'   => $nextYearStart,
], $commissionField);

$commissionAllTimeCreated = sumDealField([
    '=CREATED_BY_ID' => $ownerId,
], $commissionField);

// Hook into ?period=today|mtd|ytd
$commissionMonth = $commissionMonthlyCreated;

switch ($period) {
    case 'mtd':
        $commissionDisp = $commissionMonthlyCreated;
        break;
    case 'ytd':
        $commissionDisp = $commissionYearlyCreated;
        break;
    default:
        $commissionDisp = $commissionDailyCreated;
        break;
}

// ---------- MTD commissions for visible agents (CREATED by each agent) ----------
$rankRows = [];
foreach ($agentsList as $u) {
    $uid = (int)$u['ID'];
    if (!in_array($uid, $allowedIds, true)) { continue; }

    $fullName = trim(($u['NAME'] ?? '').' '.($u['LAST_NAME'] ?? ''));
    if ($fullName === '') { $fullName = 'User #'.$uid; }

    $sum = sumDealField([
        '=CREATED_BY_ID' => $uid,
        '>=DATE_CREATE'  => $monthStart,
        '<DATE_CREATE'   => $nextMonthStart,
    ], $commissionField);

    $rankRows[] = [
        'id'    => $uid,
        'name'  => $fullName,
        'value' => round((float)$sum, 2),
    ];
}

usort($rankRows, static function($a, $b) {
    return ($b['value'] <=> $a['value']);
});

$agentNames  = array_map(static fn($r) => $r['name'],  $rankRows);
$commissions = array_map(static fn($r) => (float)$r['value'], $rankRows);

// ---------- YTD by month for CURRENT USER as OWNER (ASSIGNED_BY_ID) ----------
$year  = (int)date('Y');
$nowM  = (int)date('n');
$labels = [];
$values = [];

for ($m = 1; $m <= $nowM; $m++) {
    $mStartPHP = new \DateTime(sprintf('%04d-%02d-01 00:00:00', $year, $m), $LOCAL_TZ);
    $mEndPHP   = (clone $mStartPHP)->modify('+1 month');

    $mStart = BxDateTime::createFromPhp($mStartPHP);
    $mEnd   = BxDateTime::createFromPhp($mEndPHP);

    $sum = sumDealField([
        '=CREATED_BY_ID' => $ownerId,
        '>=DATE_CREATE'  => $mStart,
        '<DATE_CREATE'   => $mEnd,
    ], $commissionField);

    $labels[] = $mStartPHP->format('M');
    $values[] = round((float)$sum, 2);
}


// Choose a normalization baseline for the gauge
$maxCommission = max($values) ?: 1;
$needleIndex   = max(0, $nowM - 1);

function getUserCard(int $userId): array {
    $u = \Bitrix\Main\UserTable::getByPrimary($userId, [
        'select' => ['ID','NAME','LAST_NAME','PERSONAL_PHOTO']
    ])->fetch();

    $name  = trim(($u['NAME'] ?? '').' '.($u['LAST_NAME'] ?? '')) ?: 'User #'.$userId;
    $photo = !empty($u['PERSONAL_PHOTO']) ? \CFile::GetPath($u['PERSONAL_PHOTO']) : '/upload/bitrix24/default_user.png';

    return ['name'=>$name, 'photo'=>$photo];
}

function buildAgentTotalsWithPhoto(
    array $agentsList,
    array $allowedIds,
    \Bitrix\Main\Type\DateTime $start,
    \Bitrix\Main\Type\DateTime $end,
    string $commissionField,
    string $agentField // '=CREATED_BY_ID' or '=ASSIGNED_BY_ID'
): array {
    $rows = [];
    foreach ($agentsList as $u) {
        $uid = (int)$u['ID'];
        if (!in_array($uid, $allowedIds, true)) { continue; }

        $sum = sumDealField([
            $agentField       => $uid,
            '>=DATE_CREATE'   => $start,
            '<DATE_CREATE'    => $end,
        ], $commissionField);

        $card = getUserCard($uid);
        $rows[] = [
            'id'    => $uid,
            'name'  => $card['name'],
            'photo' => $card['photo'],
            'value' => round((float)$sum, 2),
        ];
    }
    return $rows;
}

function commissionsByAgent(\Bitrix\Main\Type\DateTime $start,
                            \Bitrix\Main\Type\DateTime $end,
                            string $commissionField): array
{
    $res = \Bitrix\Crm\DealTable::getList([
        'select'  => ['CREATED_BY_ID', 'SUM_VAL'],
        'filter'  => [
            '>=DATE_CREATE' => $start,
            '<DATE_CREATE'  => $end,
            // IMPORTANT: if your portal enforces CRM permissions on queries,
            // switch to CCrmDeal::GetListEx with CHECK_PERMISSIONS => 'N'
            // to make this identical for every viewer.
        ],
        'runtime' => [new ExpressionField('SUM_VAL', 'SUM(COALESCE(%s,0))', $commissionField)],
        'group'   => ['CREATED_BY_ID'],
    ]);

    $rows = [];
    while ($row = $res->fetch()) {
        $uid = (int)$row['CREATED_BY_ID'];
        $card = getUserCard($uid);
        $rows[] = [
            'id'    => $uid,
            'name'  => $card['name'],
            'photo' => $card['photo'],
            'value' => round((float)$row['SUM_VAL'], 2),
        ];
    }
    return $rows;
}

function topAndBottomN(array $rows, int $n = 10): array
{
    usort($rows, static fn($a,$b) => $b['value'] <=> $a['value']); // DESC
    $top    = array_slice($rows, 0, $n);
    $bottom = array_slice($rows, -$n);
    usort($bottom, static fn($a,$b) => $a['value'] <=> $b['value']); // show lowest first
    return [$top, $bottom];
}

function topBottom(array $rows, int $n = 10): array {
    usort($rows, fn($a,$b) => $b['value'] <=> $a['value']); // DESC
    $top    = array_slice($rows, 0, $n);
    $bottom = array_slice(array_reverse($rows), 0, $n);     // smallest first
    usort($bottom, fn($a,$b) => $a['value'] <=> $b['value']);
    return [$top, $bottom];
}

$rowsMonth = commissionsByAgent($monthStart, $nextMonthStart, $commissionField);
$rowsYear  = commissionsByAgent($yearStart,  $nextYearStart,  $commissionField);

[$top3Month, $bottom3Month] = topBottom($rowsMonth, 10);
[$top3Year,  $bottom3Year ] = topBottom($rowsYear,  10);

function slot(array $arr, int $i, string $key, $default = null) {
    return isset($arr[$i][$key]) ? $arr[$i][$key] : $default;
}

function sumDealFieldGrouped(array $filter, string $valueField, string $groupField): array
{
    $res = DealTable::getList([
        'select'  => [$groupField, 'SUM_VAL'],
        'filter'  => $filter,
        'runtime' => [
            new ExpressionField('SUM_VAL', 'SUM(COALESCE(%s, 0))', $valueField),
        ],
        'group'   => [$groupField],
    ]);

    $out = [];
    while ($row = $res->fetch()) {
        $key = $row[$groupField];
        // Normalize keys so we can use them directly as labels later
        if (is_object($key) && method_exists($key, 'toString')) { $key = $key->toString(); }
        $out[(string)$key] = (float)$row['SUM_VAL'];
    }
    return $out;
}

/**
 * Resolve CATEGORY_ID to a readable name.
 */
function getCategoryName(int $categoryId): string
{
    // Bitrix modern API
    $name = DealCategory::getName($categoryId);
    if ($name) { return $name; }

    // Fallback
    if (class_exists('\CCrmDeal') && method_exists('\CCrmDeal', 'GetCategoryName')) {
        $fallback = \CCrmDeal::GetCategoryName($categoryId);
        if ($fallback) { return $fallback; }
    }
    return 'Category #'.$categoryId;
}

/**
 * Build "labels" & "values" for Chart.js for commissions grouped by CATEGORY_ID.
 * Adjust $agentDimension to '=CREATED_BY_ID' or '=ASSIGNED_BY_ID' as you need.
 */
function buildCommissionByCategoryForPeriod(
    int $ownerId,
    \Bitrix\Main\Type\DateTime $start,
    \Bitrix\Main\Type\DateTime $end,
    string $commissionField,
    string $agentDimension = '=CREATED_BY_ID'
): array {
    $grouped = sumDealFieldGrouped([
        $agentDimension   => $ownerId,
        '>=DATE_CREATE'   => $start,
        '<DATE_CREATE'    => $end,
    ], $commissionField, 'CATEGORY_ID');

    // Sort DESC by value for a nicer chart
    arsort($grouped, SORT_NUMERIC);

    // Map category IDs to readable names
    $labels = [];
    $values = [];
    foreach ($grouped as $catId => $sum) {
        $label = is_numeric($catId) ? getCategoryName((int)$catId) : (string)$catId;
        $labels[] = $label;
        $values[] = round((float)$sum, 2);
    }
    return [$labels, $values];
}