<?php
/**
 * Вспомогательный скрипт: узнать stages_id для воронки через API.
 * Откройте в браузере: https://ваш-сайт.ru/get_okocrm_stages.php
 * После того как подставите правильный OKOCRM_STAGE_ID в okocrm_config.php — удалите этот файл с сервера.
 */
header('Content-Type: text/html; charset=utf-8');

if (!is_file(__DIR__ . '/okocrm_config.php')) {
    echo '<p>Файл <code>okocrm_config.php</code> не найден. Создайте его из <code>okocrm_config.sample.php</code>.</p>';
    exit;
}
require_once __DIR__ . '/okocrm_config.php';

if (!defined('OKOCRM_API_TOKEN') || OKOCRM_API_TOKEN === '' || OKOCRM_API_TOKEN === 'ВАШ_ТОКЕН_ОТСЮДА') {
    echo '<p>В <code>okocrm_config.php</code> не задан токен API.</p>';
    exit;
}

$token = OKOCRM_API_TOKEN;
$pipelineId = defined('OKOCRM_PIPELINE_ID') ? (int) OKOCRM_PIPELINE_ID : 0;

$headers = [
    'Accept: application/json',
    'Authorization: Bearer ' . $token,
];

function okocrmGet($url, $headers) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 15,
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code, 'body' => $body];
}

echo '<h2>Получение stages_id для воронки ' . (int) $pipelineId . '</h2>';

// 1) Пробуем получить список воронок и этапов (если API отдаёт)
$pipelinesUrl = 'https://api.okocrm.com/v2/pipelines/';
$res = okocrmGet($pipelinesUrl, $headers);
$pipelines = null;
if ($res['code'] === 200 && $res['body'] !== '') {
    $data = @json_decode($res['body'], true);
    if (is_array($data)) {
        $pipelines = $data;
    }
}

if (is_array($pipelines)) {
    echo '<h3>Список воронок и этапов (GET /v2/pipelines/)</h3><pre>' . htmlspecialchars(json_encode($pipelines, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . '</pre>';
    // Попробуем найти нашу воронку и этапы в типичных структурах
    if (isset($pipelines['pipelines']) && is_array($pipelines['pipelines'])) {
        foreach ($pipelines['pipelines'] as $p) {
            $id = isset($p['id']) ? (int) $p['id'] : 0;
            if ($id === $pipelineId && isset($p['stages']) && is_array($p['stages'])) {
                echo '<p><strong>Этапы воронки ' . $pipelineId . ':</strong></p><ul>';
                foreach ($p['stages'] as $s) {
                    $sid = isset($s['id']) ? $s['id'] : '?';
                    $name = isset($s['name']) ? $s['name'] : '';
                    echo '<li>stages_id = <code>' . htmlspecialchars((string) $sid) . '</code>' . ($name ? ' — ' . htmlspecialchars($name) : '') . '</li>';
                }
                echo '</ul>';
            }
        }
    }
} else {
    echo '<p>Метод GET /v2/pipelines/ недоступен или вернул ошибку (код ' . (int) $res['code'] . '). Пробуем через список сделок.</p>';
}

// 2) Получаем сделки и ищем stages_id по pipeline_id
$leadsUrl = 'https://api.okocrm.com/v2/leads/?page=1';
$res = okocrmGet($leadsUrl, $headers);
$foundStages = [];

if ($res['code'] === 200 && $res['body'] !== '') {
    $data = @json_decode($res['body'], true);
    if (is_array($data)) {
        $leads = isset($data['leads']) ? $data['leads'] : (isset($data['items']) ? $data['items'] : $data);
        if (is_array($leads)) {
            foreach ($leads as $lead) {
                $pid = isset($lead['pipeline_id']) ? (int) $lead['pipeline_id'] : 0;
                $sid = isset($lead['stages_id']) ? $lead['stages_id'] : null;
                if ($pid === $pipelineId && $sid !== null && $sid !== '') {
                    $foundStages[(string) $sid] = true;
                }
            }
        }
    }
}

if (!empty($foundStages)) {
    echo '<h3>Найденные stages_id по сделкам воронки ' . $pipelineId . '</h3><p>В этой воронке у сделок встречаются этапы:</p><ul>';
    foreach (array_keys($foundStages) as $sid) {
        echo '<li><strong>stages_id = <code>' . htmlspecialchars($sid) . '</code></strong> — подставьте это значение в <code>okocrm_config.php</code> как <code>OKOCRM_STAGE_ID</code>.</li>';
    }
    echo '</ul>';
} elseif (!is_array($pipelines)) {
    echo '<p>В списке сделок нет записей из воронки ' . $pipelineId . '. Варианты:</p>';
    echo '<ul><li>Создайте одну сделку вручную в Oko CRM в воронке «Запись на проверку зрения» и снова откройте эту страницу — скрипт подставит нужный stages_id.</li>';
    echo '<li>Напишите в поддержку Oko CRM (Telegram @OkoCRM_supportBot или support@okocrm.com): «Какой stages_id у первого этапа воронки с id 24991?»</li></ul>';
}

echo '<p><small>После настройки удалите <code>get_okocrm_stages.php</code> с сервера.</small></p>';
