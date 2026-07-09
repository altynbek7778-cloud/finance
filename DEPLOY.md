# Деплой на бесплатный хостинг

Схема: **Neon** (база данных Postgres, бесплатно) → **Render** (бэкенд Express, бесплатный Web Service) → **Cloudflare Pages** (два отдельных сайта — семейное приложение и админ-панель, бесплатно).

Итого 4 бесплатных аккаунта: GitHub, Neon, Render, Cloudflare. Банковская карта нигде не требуется.

## 0. Подготовка: репозиторий на GitHub

1. Создайте пустой репозиторий на [github.com](https://github.com/new) (можно приватный).
2. В папке проекта:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<ваш-логин>/<репозиторий>.git
   git push -u origin main
   ```

## 1. База данных — Neon

1. Зарегистрируйтесь на [neon.tech](https://neon.tech) (через Google/GitHub — быстрее всего).
2. Создайте новый проект (Create Project), любое имя, регион — ближайший к вам.
3. На странице проекта найдите **Connection string** и переключите его в режим **Pooled connection** (там, где написано `-pooler` в адресе). Скопируйте строку — она понадобится дальше как `DATABASE_URL`. Выглядит примерно так://neondb_owner:npg_DfdU8LZQx6Rc@ep-long-wind-ato2ivtz-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

## 2. Секреты, которые нужно сгенерировать заранее

Выполните на своём компьютере (Node.js должен быть установлен):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # это JWT_SECRET — запустите ДВАЖДЫ,
                                                                              # один результат — JWT_SECRET, второй — ADMIN_JWT_SECRET
npx web-push generate-vapid-keys                                            # это VAPID_PUBLIC_KEY и VAPID_PRIVATE_KEY
```
de5b8f578cb36eadb4bbdbb78643b1ff1006975a2f01c3ab7510f5e66e582737e625534f02a3e98fb69dabda2336441d

4cb1ca9782992c084658e01a1dc28b360d26e46b35bc4d34abd546f27563c1c6f642b4bd4c0812b066bdca93fa600b8f

Public Key:
BHQvq3MuTDJQslasZf8mX4tsOOkpSUQQ8n1bapD5jz-IpUz6LoQ0xbjJWyLUgBE60eVMulIj0DjzwGlatOm1PjM

Private Key:
ckGmUBThhS4UtMZHYJ_UaC6hCi1QaY8-SyoQly0Rpok

Также решите:
- `ADMIN_SEED_USERNAME` / `ADMIN_SEED_PASSWORD` — логин и пароль, под которыми вы будете заходить в админ-панель.

## 3. Бэкенд — Render

1. Зарегистрируйтесь на [render.com](https://render.com), подключите свой GitHub-аккаунт.
2. **New → Web Service**, выберите ваш репозиторий.
3. Настройки сервиса — **Root Directory оставьте пустым** (корень репозитория): это монорепозиторий на npm workspaces, `@adel/shared` должен собраться и связаться из корня, иначе сервер не найдёт этот пакет.
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run prisma:generate --workspace server && npm run build --workspace server && npm exec --workspace server -- prisma migrate deploy`
   - **Start Command**: `npm run start --workspace server`
   - **Instance Type**: Free
4. В разделе **Environment** добавьте переменные (значения — из шагов 1-2 выше):
   ```
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=<pooled-строка из Neon>
   JWT_SECRET=<сгенерированный>
   ADMIN_JWT_SECRET=<другой сгенерированный>
   WEB_ORIGIN=<заполните после шага 5, временно можно http://localhost:5173>
   ADMIN_ORIGIN=<заполните после шага 5, временно можно http://localhost:5174>
   VAPID_PUBLIC_KEY=<сгенерированный>
   VAPID_PRIVATE_KEY=<сгенерированный>
   VAPID_SUBJECT=mailto:ваш-email@пример.com
   ADMIN_SEED_USERNAME=<ваш выбор>
   ADMIN_SEED_PASSWORD=<ваш выбор>


cat > ~/upload_to_git.sh << 'EOF'
#!/bin/bash

echo "Введи полный путь до папки проекта (например /Users/altynbek/Проект финансы):"
read PROJECT_PATH

cd "$PROJECT_PATH" || { echo "Такой папки не существует. Проверь путь."; exit 1; }

echo ""
echo "Ты сейчас здесь:"
pwd

echo ""
echo "Проверяю, настроен ли тут git..."
if [ ! -d ".git" ]; then
  echo "Git ещё не настроен, инициализирую..."
  git init
  git branch -M main
fi

echo ""
echo "Вот все файлы и папки в этом месте:"
ls -la

echo ""
echo "Файлы/папки, которые НЕ будут загружены (введи через пробел, или просто нажми Enter чтобы загрузить всё):"
echo "Пример: node_modules .nvm .env"
read -a IGNORE_LIST

for item in "${IGNORE_LIST[@]}"; do
  if ! grep -qxF "$item" .gitignore 2>/dev/null; then
    echo "$item" >> .gitignore
  fi
done

echo ""
echo "Добавляю файлы..."
git add .

echo ""
echo "Что добавилось (проверь список):"
git status

echo ""
echo "Введи адрес репозитория на GitHub (или Enter, если уже подключен):" https://github.com/altynbek7778-cloud/finance.git
read REPO_URL https://github.com/altynbek7778-cloud/finance.git

if [ -n "$REPO_URL" ]; then
  git remote remove origin 2>/dev/null
  git remote add origin "$REPO_URL"
fi

echo ""
echo "Введи сообщение для коммита (или Enter для 'update'):"
read COMMIT_MSG
COMMIT_MSG=${COMMIT_MSG:-update}

git commit -m "$COMMIT_MSG"

echo ""
echo "Отправляю на GitHub..."
git push -u origin main

echo ""
echo "Готово. Проверь github.com — файлы должны появиться."
EOF

srv-d96ij8e7r5hc738h5eq0
   ```
5. Нажмите **Create Web Service**. Render соберёт и запустит бэкенд — это применит и миграции базы данных автоматически (`prisma migrate deploy` в build-команде). Скопируйте адрес вида `https://adel-finance-api.onrender.com`.
6. Создайте первого администратора — во вкладке **Shell** у сервиса на Render выполните:
   ```bash
   npm run seed:admin --workspace server
   ```

## 4. Семейное приложение — Cloudflare Pages

1. Зарегистрируйтесь на [pages.cloudflare.com](https://pages.cloudflare.com), подключите GitHub.
2. **Create a project → Connect to Git**, выберите репозиторий.
3. Настройки сборки — **Root directory снова оставьте пустым** (по той же причине — `@adel/shared` должен собраться из корня монорепозитория):
   - **Build command**: `npm install && npm run build --workspace web`
   - **Build output directory**: `web/dist`
4. В **Environment variables** добавьте:
   ```
   VITE_API_URL=https://adel-finance-api.onrender.com
   ```
   (адрес из шага 3.5, без слэша на конце).
5. Deploy. Получите адрес вида `https://adel-finance.pages.dev` — это и есть ссылка, которую вы с женой открываете на телефонах и добавляете на экран «Домой».

## 5. Админ-панель — второй проект на Cloudflare Pages

Повторите шаг 4 ещё раз, но:
   - **Build command**: `npm install && npm run build --workspace admin`
   - **Build output directory**: `admin/dist`
   - `VITE_API_URL` — тот же адрес Render
   - Получите отдельный адрес, например `https://adel-finance-admin.pages.dev`

## 6. Досвязать CORS

Вернитесь в Render → Environment и обновите:
```
WEB_ORIGIN=https://adel-finance.pages.dev
ADMIN_ORIGIN=https://adel-finance-admin.pages.dev
```
Сохраните — Render перезапустит сервис. Теперь бэкенд принимает запросы именно с этих двух адресов (и ни с каких других — это защита).

## 7. Не дать бэкенду «засыпать» (опционально, но рекомендуется)

Бесплатный план Render останавливает сервис после 15 минут без запросов; следующий запрос будит его за 30-60 секунд. Чтобы это не мешало:

1. Зарегистрируйтесь на [uptimerobot.com](https://uptimerobot.com) (бесплатно).
2. Создайте монитор типа **HTTP(s)**, адрес — `https://adel-finance-api.onrender.com/healthz`, интервал — 10 минут.

Это не официальная гарантия от Render, а обходной приём: он держит сервис «тёплым» в часы, когда вы им пользуетесь. Если захотите совсем убрать это ограничение — на Render есть платный план Starter (от $7/мес).

## 8. Финальная проверка

1. Откройте `https://adel-finance.pages.dev` с телефона, зарегистрируйтесь, создайте пространство.
2. Добавьте операцию через быстрый ввод (клавиатура сумм + выбор категории).
3. На iPhone: Safari → «Поделиться» → «На экран Домой» — только после этого на iOS заработают push-уведомления (ограничение самой Apple, не хостинга). На Android push работают и без установки на экран.
4. Пригласите жену: Настройки → Приглашения → скопировать ссылку, отправить ей — она откроет ссылку, зарегистрируется и присоединится к тому же пространству.
5. Откройте `https://adel-finance-admin.pages.dev`, войдите под `ADMIN_SEED_USERNAME`/`ADMIN_SEED_PASSWORD` — там должно быть видно созданное пространство и обоих пользователей.

## Особенности бесплатных тарифов, которые стоит знать

- **Neon**: 0.5 ГБ хранилища и лёгкое «засыпание» базы при простое (просыпается почти мгновенно при следующем запросе) — этого более чем достаточно на годы для семьи из нескольких человек.
- **Render**: 750 часов бесплатно в месяц на один сервис — это ровно один непрерывно работающий сервис; засыпание после 15 минут простоя (см. пункт 7).
- **Cloudflare Pages**: практически без ограничений по трафику для такого маленького сайта — сюда переживать не о чем.

Если один из этих сервисов в будущем изменит бесплатные условия — эта архитектура не привязана намертво ни к одному провайдеру: бэкенд можно перенести на любой другой хостинг, который умеет просто "запустить Node.js процесс" (например, Fly.io, Railway), а базу — на любой Postgres.
