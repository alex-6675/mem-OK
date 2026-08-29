# TEST_PROTOCOL.md — приёмка EdgeExtension на ok.ru (TASK-0154)

Ядро v07g — от донора context-vkru (provenance). Адаптированы ТОЛЬКО
manifest.json, content.js, background.js. VK-вариант у донора НЕ тронут.

## 1. Предусловия
- Запустите scripts\Build.ps1
- Edge, режим разработчика (edge://extensions), «Загрузить распакованное» ->
  dist/
- Версия в карточке: 0.1.0 («Записки ОК»). Ошибок нет.

## 2. ПКМ «Записка: ПЕР/СОО» (ok.ru)
1. Открыть https://ok.ru, найти ссылку на профиль (ok.ru/profile/N) или группу
   (ok.ru/group/N).
2. ПКМ на ссылке -> в меню «Записка: ПЕР» и «Записка: СОО».
3. Клик «Записка: ПЕР» -> SW-консоль: «записка в картотеке: ok-profile:N (PERSON) · total 1».
4. Клик «Записка: СОО» на группе -> «записка в картотеке: ok-group:N (COMMUNITY)».
5. Повтор на той же ссылке -> «уже в картотеке: ok-profile:N» (дедуп, total не растёт).
6. ПКМ по пустому месту -> пунктов «Записка» НЕТ.

## 3. База (единственный писатель)
- Карточка создана: portal=ok, identities.id, status=draft, history[1].
- Повторная запись обновляет updated_at + history (НЕ создаёт дубль).

## 4. NAME_HINT + badge
- Если у карточки пустое имя — имя берётся из первого якоря («имя сохранено»).
- Если имя задано — «имя НЕ тронуто (уже задано)».
- badge на значке: зелёный с числом карточек.

## 5. НЕ тронуты
- Ядро v07g (messaging/normalize/storage/kartoteka) — SHA256 совпадает с донором.
- VK-вариант в context-vkru — без изменений.

## 6. RunEdgeCdp (ок-профили)
- pwsh scripts/RunEdgeCdp.ps1 -Profile s_admin -> порт 9222, профиль .edge_test_s_admin.
- Порты: s_admin 9222, admin 9223, moderator 9224, editor 9225, user_01 9226.