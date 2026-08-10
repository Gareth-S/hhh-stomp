<?php

/*
 * Save a setlist received from setlists.js.
 *
 * The browser sends:
 *     filename
 *     songs
 *
 * The filename is checked before being used so that
 * files can only be written inside the setlists/ directory.
 */


/* Only accept POST requests. */
if ($_SERVER["REQUEST_METHOD"] !== "POST")
{
    http_response_code(405);
    exit("POST required");
}


/* Read the JSON sent by the browser. */
$json =
    file_get_contents("php://input");


if ($json === false || $json === "")
{
    http_response_code(400);
    exit("No data received");
}


/* Decode the JSON. */
$data =
    json_decode(
        $json,
        true
    );


if (!is_array($data))
{
    http_response_code(400);
    exit("Invalid JSON");
}


/* Check that a filename was supplied. */
if (
    !isset($data["filename"]) ||
    !is_string($data["filename"])
)
{
    http_response_code(400);
    exit("No filename supplied");
}


/*
 * Allow only simple filenames.
 *
 * This prevents paths such as:
 *     ../something
 *     ../../something
 *
 * from being used as the destination.
 */
$filename =
    trim($data["filename"]);


$filename =
    preg_replace(
        "/[^A-Za-z0-9._-]/",
        "-",
        $filename
    );


if ($filename === "")
{
    http_response_code(400);
    exit("Invalid filename");
}


/* Add the setlist extension. */
$filename .= ".setlist.json";


$path =
    __DIR__ .
    "/../setlists/" .
    $filename;


/* Remove the filename before saving the song data. */
unset(
    $data["filename"]
);


/* Write the setlist JSON file. */
$result =
    file_put_contents(
        $path,
        json_encode(
            $data,
            JSON_PRETTY_PRINT |
            JSON_UNESCAPED_SLASHES
        )
    );


if ($result === false)
{
    http_response_code(500);
    exit("Unable to save setlist");
}


/* Tell the browser that the save worked. */
header(
    "Content-Type: application/json"
);

echo json_encode(
    [
        "success" => true
    ]
);
