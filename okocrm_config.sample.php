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

// Telegram: уведомления о заявках в чат (если не нужны — не задавайте или закомментируйте)
// Создайте бота через @BotFather, получите токен. Добавьте бота в группу/канал или узнайте chat_id личного чата (например через @userinfobot).
// define('TELEGRAM_BOT_TOKEN', '123456:ABC...');
// define('TELEGRAM_CHAT_ID', '-1001234567890');
