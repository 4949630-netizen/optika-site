<?php
/**
 * Настройки интеграции с Oko CRM.
 * Скопируйте этот файл как okocrm_config.php и заполните значения.
 * Файл okocrm_config.php не должен попадать в git (добавлен в .gitignore).
 */

// Токен API: Oko CRM → Профиль (иконка пользователя) → Токен для API
define('OKOCRM_API_TOKEN', 'ВАШ_ТОКЕН_ОТСЮДА');

// ID воронки и этапа: в Oko CRM откройте воронку продаж, в URL или в настройках этапов будут id.
// Либо получите через API: GET https://api.okocrm.com/v2/pipelines/ (если доступно в вашем тарифе).
define('OKOCRM_PIPELINE_ID', 1);
define('OKOCRM_STAGE_ID', 1);
