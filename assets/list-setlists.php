<?php

/*
 * Return a list of previously saved setlists.
 *
 * Saved setlists live in /setlists and use the
 * .setlist.json filename convention.
 */

header("Content-Type: application/json");

$folder =
    __DIR__ . "/../setlists";

$files =
    glob(
        $folder . "/*.setlist.json"
    );

$setlists = [];

foreach ($files as $file)
{
    $setlists[] =
        basename($file);
}

/*
 * Keep the list alphabetically sorted.
 */
sort($setlists);

echo json_encode(
    [
        "setlists" => $setlists
    ]
);
