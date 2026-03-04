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
$pipelinesRes = okocrmGet($pipelinesUrl, $headers);
$pipelines = null;
if ($pipelinesRes['code'] === 200 && $pipelinesRes['body'] !== '') {
    $data = @json_decode($pipelinesRes['body'], true);
    if (is_array($data)) {
        $pipelines = $data;
    }
}

if (is_array($pipelines)) {
    echo '<h3>Список воронок (GET /v2/pipelines/)</h3><pre>' . htmlspecialchars(json_encode($pipelines, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . '</pre>';
    // Ищем этапы в разных вариантах структуры
    $stagesShown = false;
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
                $stagesShown = true;
            }
        }
    }
    if (!$stagesShown && isset($pipelines['data']) && is_array($pipelines['data'])) {
        foreach ($pipelines['data'] as $p) {
            if ((isset($p['id']) ? (int) $p['id'] : 0) === $pipelineId && isset($p['stages']) && is_array($p['stages'])) {
                echo '<p><strong>Этапы воронки ' . $pipelineId . ':</strong></p><ul>';
                foreach ($p['stages'] as $s) {
                    $sid = isset($s['id']) ? $s['id'] : '?';
                    $name = isset($s['name']) ? $s['name'] : '';
                    echo '<li>stages_id = <code>' . htmlspecialchars((string) $sid) . '</code>' . ($name ? ' — ' . htmlspecialchars($name) : '') . '</li>';
                }
                echo '</ul>';
                $stagesShown = true;
            }
        }
    }
    // Пробуем запросить одну воронку: возможно, этапы приходят только там
    if (!$stagesShown && $pipelineId > 0) {
        $oneRes = okocrmGet('https://api.okocrm.com/v2/pipelines/' . $pipelineId . '/', $headers);
        if ($oneRes['code'] === 200 && $oneRes['body'] !== '') {
            $one = @json_decode($oneRes['body'], true);
            if (is_array($one) && isset($one['stages']) && is_array($one['stages'])) {
                echo '<p><strong>Этапы воронки ' . $pipelineId . ' (GET /v2/pipelines/' . $pipelineId . '/):</strong></p><ul>';
                foreach ($one['stages'] as $s) {
                    $sid = isset($s['id']) ? $s['id'] : '?';
                    $name = isset($s['name']) ? $s['name'] : '';
                    echo '<li>stages_id = <code>' . htmlspecialchars((string) $sid) . '</code>' . ($name ? ' — ' . htmlspecialchars($name) : '') . '</li>';
                }
                echo '</ul>';
                $stagesShown = true;
            }
        }
    }
    if (!$stagesShown) {
        echo '<p><strong>В ответе API нет списка этапов.</strong> См. инструкцию ниже.</p>';
    }
} else {
    echo '<p>Метод GET /v2/pipelines/ недоступен или вернул ошибку (код ' . (int) $pipelinesRes['code'] . '). Пробуем через список сделок.</p>';
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
} else {
    echo '<h3>Как узнать stages_id</h3>';
    echo '<ol>';
    echo '<li><strong>Создайте одну сделку вручную</strong> в Oko CRM: Сделки → воронка «Запись на проверку зрения» → любая колонка (например «Первый этап») → новая сделка. Сохраните.</li>';
    echo '<li>Откройте снова эту страницу с <a href="?debug=1">?debug=1</a>: <code>get_okocrm_stages.php?debug=1</code></li>';
    echo '<li>В блоке «GET /v2/leads/» найдите в JSON сделку с <code>"pipeline_id": 24991</code> — рядом будет <code>stages_id</code>. Это число подставьте в <code>okocrm_config.php</code> как <code>OKOCRM_STAGE_ID</code>.</li>';
    echo '<li>Либо напишите в поддержку Oko CRM (Telegram @OkoCRM_supportBot или support@okocrm.com): «Какой stages_id у первого этапа воронки с id 24991?»</li>';
    echo '</ol>';
}

// Режим отладки: показать сырые ответы API (откройте с ?debug=1)
$debug = isset($_GET['debug']) && $_GET['debug'] === '1';
if ($debug) {
    echo '<hr><h3>Отладка: сырые ответы API</h3>';
    echo '<p><strong>GET /v2/pipelines/</strong> — код ответа: ' . (int) $pipelinesRes['code'] . '</p>';
    echo '<pre>' . htmlspecialchars($pipelinesRes['body'] ?: '(пусто)') . '</pre>';
    $leadsRes = okocrmGet('https://api.okocrm.com/v2/leads/?page=1', $headers);
    echo '<p><strong>GET /v2/leads/?page=1</strong> — код ответа: ' . (int) $leadsRes['code'] . '</p>';
    echo '<pre>' . htmlspecialchars($leadsRes['body'] ?: '(пусто)') . '</pre>';
    echo '<p>Найдите в JSON выше поле <code>pipeline_id</code> со значением ' . $pipelineId . ' — рядом будет <code>stages_id</code>. Это число и подставьте в okocrm_config.php.</p>';
}

echo '<p><small>Если ничего не нашли — откройте с <a href="?debug=1">?debug=1</a> и посмотрите сырой ответ API. После настройки удалите <code>get_okocrm_stages.php</code> с сервера.</small></p>';
