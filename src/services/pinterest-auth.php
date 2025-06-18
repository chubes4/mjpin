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

// Get Pinterest user account info to create account name
$user_url = 'https://api.pinterest.com/v5/user_account';
$user_options = [
    CURLOPT_URL => $user_url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer $access_token",
        'Content-Type: application/json',
    ],
];

$user_ch = curl_init();
curl_setopt_array($user_ch, $user_options);
$user_response = curl_exec($user_ch);
$user_http_code = curl_getinfo($user_ch, CURLINFO_HTTP_CODE);
curl_close($user_ch);

$pinterest_user_id = null;
$username = 'Pinterest Account';
if ($user_http_code === 200) {
    $user_data = json_decode($user_response, true);
    $pinterest_user_id = $user_data['id'] ?? null;
    $username = $user_data['username'] ?? 'Pinterest Account';
}

if (!$pinterest_user_id) {
    http_response_code(500);
    echo "Failed to get Pinterest user information.";
    exit;
}

$account_name = $username . ' (' . substr($pinterest_user_id, 0, 8) . ')';

// Store the token in pinterest_tokens.json using new multi-account structure
$project_root = dirname(dirname(__DIR__)); // Go up two levels from src/services to project root
$tokens_file = $project_root . '/data/pinterest_tokens.json';
$tokens = [];
if (file_exists($tokens_file)) {
    $tokens = json_decode(file_get_contents($tokens_file), true) ?: [];
}

// Initialize user data if it doesn't exist
if (!isset($tokens[$state])) {
    $tokens[$state] = [
        'accounts' => [],
        'activeAccount' => null
    ];
}

// Add/update the Pinterest account
$tokens[$state]['accounts'][$pinterest_user_id] = [
    'accessToken' => $access_token,
    'pinterestUserId' => $pinterest_user_id,
    'accountName' => $account_name,
    'createdAt' => date('c')
];

// If this is the first account, make it active
if ($tokens[$state]['activeAccount'] === null) {
    $tokens[$state]['activeAccount'] = $pinterest_user_id;
}

// Ensure data directory exists
$data_dir = dirname($tokens_file);
if (!is_dir($data_dir)) {
    mkdir($data_dir, 0755, true);
}

file_put_contents($tokens_file, json_encode($tokens, JSON_PRETTY_PRINT));

// Success message
echo "Pinterest authentication successful! Account \"$account_name\" has been added. You can now use the bot.";
