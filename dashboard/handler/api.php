<?php
use Bitrix\Main\Web\HttpClient;

function getPropertiesData(int $ownerId): array
{
    $base  = 'https://youtupia.com/a7group/api/data-properties';
    $query = http_build_query([
        'key'       => 'A7675gr6oup48478A7',
        'bitrix_id' => $ownerId,
        'order'     => [ ['column' => 0, 'dir' => 'asc'] ]
    ]);
    $url = $base.'?'.$query;

    $http = new HttpClient([
        'timeout'         => 7,
        'streamTimeout'   => 7,
        'redirect'        => true,
        'redirectMax'     => 3,
        'version'         => HttpClient::HTTP_1_1,
        'socketTimeout'   => 7,
        'disableSslVerification' => false, // set true only if your SSL is broken
    ]);

    $response = $http->get($url);

    if ($response === false) {
        $err = $http->getError();
        \Bitrix\Main\Diag\Debug::writeToFile(
            ['ownerId'=>$ownerId, 'url'=>$url, 'httpError'=>$err],
            'getPropertiesData transport error',
            '/dashboard_log.txt'
        );
        return [
            'properties'     => [],
            'saleCount'      => 0,
            'rentCount'      => 0,
            'latestListings' => [],
            'url'            => $url,
            'error'          => 'Transport error',
            'errorDetail'    => $err,
        ];
    }

    // Check HTTP status code
    $status = $http->getStatus();
    if ($status < 200 || $status >= 300) {
        \Bitrix\Main\Diag\Debug::writeToFile(
            ['ownerId'=>$ownerId, 'url'=>$url, 'status'=>$status, 'body'=>$response],
            'getPropertiesData bad status',
            '/dashboard_log.txt'
        );
        return [
            'properties'     => [],
            'saleCount'      => 0,
            'rentCount'      => 0,
            'latestListings' => [],
            'url'            => $url,
            'error'          => "HTTP $status",
        ];
    }

    // Decode JSON as array
    $data = json_decode($response, true);
    if (!is_array($data)) {
        \Bitrix\Main\Diag\Debug::writeToFile(
            ['ownerId'=>$ownerId, 'url'=>$url, 'raw'=>$response],
            'getPropertiesData invalid JSON',
            '/dashboard_log.txt'
        );
        return [
            'properties'     => [],
            'saleCount'      => 0,
            'rentCount'      => 0,
            'latestListings' => [],
            'url'            => $url,
            'error'          => 'Invalid JSON',
        ];
    }

    $properties = $data['data'] ?? [];
    if (!is_array($properties)) {
        $properties = [];
    }

    // Count purposes
    $saleCount = 0;
    $rentCount = 0;
    foreach ($properties as $p) {
        $purpose = $p['property_purpose'] ?? null; // 'S' or 'R'
        if ($purpose === 'S') $saleCount++;
        if ($purpose === 'R') $rentCount++;
    }

    // Sort by date desc (defensive)
    usort($properties, function ($a, $b) {
        $da = isset($a['Listing_Created_Date']) ? strtotime($a['Listing_Created_Date']) : 0;
        $db = isset($b['Listing_Created_Date']) ? strtotime($b['Listing_Created_Date']) : 0;
        return $db <=> $da;
    });

    return [
        'properties'     => $properties,
        'saleCount'      => $saleCount,
        'rentCount'      => $rentCount,
        'latestListings' => array_slice($properties, 0, 3),
        'url'            => $url,
        'error'          => null,
    ];
}
