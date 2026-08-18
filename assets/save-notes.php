<?php

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

$filename =
    $directory .
    "/" .
    $song .
    "." .
    strtolower($user) .
    ".json";
    
    
    
$result =
    file_put_contents(
        $filename,
        json_encode(
            $data,
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
