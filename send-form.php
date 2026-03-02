<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

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

if ($name === '' || $phone === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Укажите имя и телефон']);
    exit;
}

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

if ($sent) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Ошибка отправки письма']);
}
