# Как настроить автодеплой на REG.RU из GitHub

## Шаг 1. Добавить workflow в репозиторий

На GitHub в репозитории **optika-site**:

1. Нажмите **Add file** → **Create new file**.
2. В поле имени файла введите: **`.github/workflows/deploy.yml`**  
   (GitHub сам создаст папку `.github/workflows/`).
3. Вставьте этот код:

```yaml
name: Deploy to REG.RU

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Deploy files via FTP
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          server-dir: /www/optikadobryhcen.ru/
```

4. Внизу страницы нажмите **Commit changes** → **Commit new file**.

---

## Шаг 2. Узнать данные FTP в REG.RU

1. Зайдите в личный кабинет REG.RU.
2. Откройте раздел **Хостинг** → ваш тариф → **FTP-доступ** (или **Управление** → **Доступ по FTP**).
3. Там будут:
   - **Сервер (хост)** — например, `ваш-логин.ftp.tools` или `optikadobryhcen.ru`.
   - **Логин** — ваш FTP-пользователь.
   - **Пароль** — пароль от FTP (часто такой же, как у панели хостинга).

Корневая директория сайта optikadobryhcen.ru в ispmanager: **/www/optikadobryhcen.ru/** — в workflow указан именно этот путь.

---

## Шаг 3. Добавить секреты в GitHub

1. В репозитории **optika-site** откройте **Settings**.
2. Слева выберите **Secrets and variables** → **Actions**.
3. Нажмите **New repository secret** и по очереди создайте три секрета:

| Name            | Value (подставьте свои данные) |
|-----------------|---------------------------------|
| `FTP_SERVER`    | Хост FTP из REG.RU (без ftp://) |
| `FTP_USERNAME`  | Логин FTP                       |
| `FTP_PASSWORD`  | Пароль FTP                      |

Имена должны быть **ровно** такими: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`.

---

## Шаг 4. Проверить деплой

1. Сделайте любое изменение в репозитории (например, правку в `README.md`) и нажмите **Commit** в ветку **main**.
2. Откройте вкладку **Actions** — должен запуститься workflow **Deploy to REG.RU**.
3. Через 1–2 минуты шаги должны стать зелёными. Тогда файлы уже на хостинге.
4. Откройте **https://optikadobryhcen.ru** и обновите страницу с очисткой кэша (**Ctrl+F5** или Cmd+Shift+R).

Если в **Actions** красный крестик — откройте упавший запуск, нажмите на шаг **Deploy files via FTP** и посмотрите текст ошибки (часто неверный хост, логин или пароль в секретах).
