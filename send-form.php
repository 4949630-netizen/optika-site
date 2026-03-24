<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

if (is_file(__DIR__ . '/okocrm_config.php')) {
    require_once __DIR__ . '/okocrm_config.php';
}

$to = 'info@optikadobryhcen.ru';
$fromEmail = 'info@optikadobryhcen.ru';
$fromName = 'Оптика добрых цен';

// Режим проверки: откройте в браузере send-form.php?test=1
if (isset($_GET['test']) && $_GET['test'] === '1') {
    $testSubject = 'Тест отправки с сайта optikadobryhcen.ru';
    $testBody = "Это тестовое письмо. Если вы его получили — форма работает.\nВремя: " . date('Y-m-d H:i:s');
    $testHeaders = "From: $fromName <$fromEmail>\r\n";
    $testHeaders .= "Content-Type: text/plain; charset=utf-8\r\n";
    $testHeaders .= "X-Mailer: PHP/" . phpversion() . "\r\n";
    $testSent = @mail($to, $testSubject, $testBody, $testHeaders);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Тест</title></head><body>';
    echo '<p>mail() вернул: ' . ($testSent ? 'true (письмо отправлено)' : 'false (ошибка)'). '</p>';
    echo '<p>Проверьте почту <strong>' . htmlspecialchars($to) . '</strong> и папку «Спам».</p>';
    echo '<p>Если письма нет — на хостинге REG.RU часто блокируют mail(). Используйте Formspree (см. инструкцию в script.js).</p>';
    echo '</body></html>';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$name    = isset($_POST['name'])    ? trim((string) $_POST['name'])    : '';
$phone   = isset($_POST['phone'])  ? trim((string) $_POST['phone'])  : '';
$salon   = isset($_POST['salon'])  ? trim((string) $_POST['salon'])  : '';
$message = isset($_POST['message']) ? trim((string) $_POST['message']) : '';

/**
 * Приводит ввод к 11 цифрам, начинающимся с 7, или возвращает null.
 */
function normalize_ru_phone_digits(string $phone): ?string {
    $d = preg_replace('/\D/u', '', $phone);
    if (strlen($d) === 11 && $d[0] === '8') {
        $d = '7' . substr($d, 1);
    }
    if (strlen($d) === 10) {
        $d = '7' . $d;
    }
    if (strlen($d) === 11 && $d[0] === '7') {
        return $d;
    }
    return null;
}

function format_ru_phone_display(string $d11): string {
    return '+7 (' . substr($d11, 1, 3) . ') ' . substr($d11, 4, 3) . '-' . substr($d11, 7, 2) . '-' . substr($d11, 9, 2);
}

if ($name === '' || $phone === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Укажите имя и телефон']);
    exit;
}

$phoneDigits = normalize_ru_phone_digits($phone);
if ($phoneDigits === null) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Укажите полный номер: 10 цифр или с 7/8 в начале.']);
    exit;
}
$phone = format_ru_phone_display($phoneDigits);

$subject = 'Новая заявка с сайта optikadobryhcen.ru';
$body = "Имя: $name\n";
$body .= "Телефон: $phone\n";
$body .= "Салон: " . ($salon !== '' ? $salon : '— не указан') . "\n";
$body .= "Комментарий: " . ($message !== '' ? $message : '—') . "\n";

$headers = "From: $fromName <$fromEmail>\r\n";
$headers .= "Reply-To: $fromEmail\r\n";
$headers .= "Content-Type: text/plain; charset=utf-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

$sent = @mail($to, $subject, $body, $headers);

$logFile = __DIR__ . '/okocrm_debug.log';
if (!defined('OKOCRM_API_TOKEN') || OKOCRM_API_TOKEN === '' || !defined('OKOCRM_PIPELINE_ID') || !defined('OKOCRM_STAGE_ID')) {
    $msg = date('Y-m-d H:i:s') . " | Oko CRM: конфиг не загружен или не заданы токен/pipeline/stage. Проверьте, что okocrm_config.php лежит в корне сайта и в нём заданы OKOCRM_API_TOKEN, OKOCRM_PIPELINE_ID, OKOCRM_STAGE_ID.\n";
    @file_put_contents($logFile, $msg, FILE_APPEND | LOCK_EX);
} else {
    $noteText = 'Салон: ' . ($salon !== '' ? $salon : '— не указан') . "\nКомментарий: " . ($message !== '' ? $message : '—');
    $postFields = [
        'name' => 'Заявка с сайта: ' . $name,
        'pipeline_id' => (string) OKOCRM_PIPELINE_ID,
        'stages_id' => (string) OKOCRM_STAGE_ID,
        'contact[name]' => $name,
        'contact[phone]' => '+' . $phoneDigits,
        'note[text]' => $noteText,
    ];
    $ch = curl_init('https://api.okocrm.com/v2/leads/');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postFields,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Authorization: Bearer ' . trim(OKOCRM_API_TOKEN),
        ],
        CURLOPT_TIMEOUT => 15,
    ]);
    $responseBody = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);
    $logLine = date('Y-m-d H:i:s') . " | Oko CRM запрос выполнен | HTTP $httpCode" . ($curlErr ? " | cURL ошибка: $curlErr" : '') . " | Ответ: " . trim(preg_replace('/\s+/', ' ', $responseBody)) . "\n";
    @file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);
}

// Уведомление в Telegram о новой заявке (если заданы TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в okocrm_config.php)
if (defined('TELEGRAM_BOT_TOKEN') && TELEGRAM_BOT_TOKEN !== '' && defined('TELEGRAM_CHAT_ID') && TELEGRAM_CHAT_ID !== '') {
    $telegramText = "🆕 Новая заявка с сайта\n\n";
    $telegramText .= "👤 Имя: " . $name . "\n";
    $telegramText .= "📞 Телефон: " . $phone . "\n";
    $telegramText .= "📍 Салон: " . ($salon !== '' ? $salon : '— не указан') . "\n";
    if ($message !== '') {
        $telegramText .= "💬 Комментарий: " . $message . "\n";
    }
    $telegramText .= "\n" . date('d.m.Y H:i');
    $telegramPayload = [
        'chat_id' => TELEGRAM_CHAT_ID,
        'text' => $telegramText,
    ];
    $tg = curl_init('https://api.telegram.org/bot' . trim(TELEGRAM_BOT_TOKEN) . '/sendMessage');
    curl_setopt_array($tg, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $telegramPayload,
        CURLOPT_TIMEOUT => 10,
    ]);
    $tgResponse = curl_exec($tg);
    $tgHttpCode = curl_getinfo($tg, CURLINFO_HTTP_CODE);
    curl_close($tg);
    $logLine = date('Y-m-d H:i:s') . " | Telegram отправка | HTTP $tgHttpCode | " . trim(preg_replace('/\s+/', ' ', (string) $tgResponse)) . "\n";
    @file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);
} else {
    @file_put_contents($logFile, date('Y-m-d H:i:s') . " | Telegram: не отправлено (нет TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID в okocrm_config.php)\n", FILE_APPEND | LOCK_EX);
}

if ($sent) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Ошибка отправки письма']);
}
