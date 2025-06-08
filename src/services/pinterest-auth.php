<?php
// pinterest-auth.php

// Load environment variables (if available)
$client_id = getenv('MJPIN_PINTEREST_CLIENT_ID');
$client_secret = getenv('MJPIN_PINTEREST_CLIENT_SECRET');
$redirect_uri = getenv('MJPIN_PINTEREST_REDIRECT_URI');

$code = $_GET['code'] ?? null;
$state = $_GET['state'] ?? null;

if (!$code || !$state) {
    http_response_code(400);
    echo "Missing code or state parameter.";
    exit;
}

// Exchange code for access token
$token_url = 'https://api.pinterest.com/v5/oauth/token';
$data = [
    'grant_type' => 'authorization_code',
    'code' => $code,
    'redirect_uri' => $redirect_uri,
];

$basic_auth = base64_encode("$client_id:$client_secret");

$options = [
    CURLOPT_URL => $token_url,
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/x-www-form-urlencoded',
        "Authorization: Basic $basic_auth"
    ],
    CURLOPT_POSTFIELDS => http_build_query($data),
];

$ch = curl_init();
curl_setopt_array($ch, $options);
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($http_code !== 200) {
    http_response_code(500);
    echo "Pinterest authentication failed: " . htmlspecialchars($response ?: $error);
    exit;
}

$response_data = json_decode($response, true);
$access_token = $response_data['access_token'] ?? null;

if (!$access_token) {
    http_response_code(500);
    echo "No access token received from Pinterest.";
    exit;
}

// Store the token in pinterest_tokens.json
$tokens_file = __DIR__ . '/pinterest_tokens.json';
$tokens = [];
if (file_exists($tokens_file)) {
    $tokens = json_decode(file_get_contents($tokens_file), true) ?: [];
}
$tokens[$state] = $access_token;
file_put_contents($tokens_file, json_encode($tokens, JSON_PRETTY_PRINT));

// Success message
echo "Pinterest authentication successful! You can now use the bot.";
