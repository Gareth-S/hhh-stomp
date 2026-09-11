<?php

ini_set("display_errors", 1);
ini_set("display_startup_errors", 1);
error_reporting(E_ALL);



if ($_SERVER["REQUEST_METHOD"] !== "POST")
{
    http_response_code(405);
    echo "POST only";
    exit;
}

$data =
    json_decode(
        file_get_contents("php://input"),
        true
    );

if (!$data)
{
    http_response_code(400);
    echo "Invalid JSON";
    exit;
}

$user =
    $data["user"] ?? "";

if (!$user)
{
    http_response_code(400);
    echo "No user";
    exit;
}

$directory =
    __DIR__ . "/../songs";

$song =
    $data["filename"] ?? "";

if (!$song)
{
    http_response_code(400);
    echo "No filename";
    exit;
}

$speed =
    $data["scrollSpeed"] ?? null;

if (
    !is_numeric($speed) ||
    $speed <= 0
)
{
    http_response_code(400);
    echo "Invalid scroll speed";
    exit;
}

$filename =
    $directory .
    "/" .
    $song .
    "." .
    strtolower($user) .
    ".json";

/*
 * Load the existing user file if it exists.
 * Otherwise start with a basic user object.
 */
if (file_exists($filename))
{
    $existing =
        json_decode(
            file_get_contents($filename),
            true
        );

    if (!is_array($existing))
    {
        $existing = [];
    }
}
else
{
    $existing =
    [
        "user" => $user,
        "songNotes" => [],
        "sections" => new stdClass(),
        "inline" => new stdClass()
    ];
}

/*
 * Update only the scroll speed.
 * Preserve all existing notes and other data.
 */
$existing["scrollSpeed"] =
    (int) $speed;

$result =
    file_put_contents(
        $filename,
        json_encode(
            $existing,
            JSON_PRETTY_PRINT
        )
    );

if ($result === false)
{
    http_response_code(500);
    echo "Could not save file";
    exit;
}

header("Content-Type: application/json");

echo json_encode(
    [
        "success" => true
    ]
);
