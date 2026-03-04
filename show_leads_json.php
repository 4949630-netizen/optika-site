<?php
/**
 * Показывает сырой ответ API по сделкам — чтобы найти stages_id для воронки 24991.
 * Откройте: https://ваш-сайт.ru/show_leads_json.php
 * Найдите в JSON сделку с "pipeline_id": 24991 — рядом будет "stages_id". Это число вставьте в okocrm_config.php как OKOCRM_STAGE_ID.
 * После настройки удалите файл с сервера.
 */
header('Content-Type: text/html; charset=utf-8');

if (!is_file(__DIR__ . '/okocrm_config.php')) {
    echo '<p>Нет файла okocrm_config.php</p>';
    exit;
}
require_once __DIR__ . '/okocrm_config.php';
if (!defined('OKOCRM_API_TOKEN') || OKOCRM_API_TOKEN === '' || OKOCRM_API_TOKEN === 'ВАШ_ТОКЕН_ОТСЮДА') {
    echo '<p>В okocrm_config.php не задан токен.</p>';
    exit;
}

$ch = curl_init('https://api.okocrm.com/v2/leads/?page=1');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Accept: application/json',
        'Authorization: Bearer ' . OKOCRM_API_TOKEN,
    ],
    CURLOPT_TIMEOUT        => 15,
]);
$body = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo '<h2>Ответ API: GET /v2/leads/?page=1</h2>';
echo '<p>Код ответа: ' . (int) $code . '</p>';
echo '<p>Найдите в JSON ниже сделку с <strong>"pipeline_id": 24991</strong> — в ней будет <strong>"stages_id"</strong>. Это число подставьте в okocrm_config.php как OKOCRM_STAGE_ID.</p>';
echo '<pre>' . htmlspecialchars($body ?: '(пусто)') . '</pre>';
echo '<p><small>После настройки удалите show_leads_json.php с сервера.</small></p>';
