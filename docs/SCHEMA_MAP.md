> **Координата v3:** docs/SCHEMA_MAP.md · v1 · мем-OK · TASK-0148

# SCHEMA_MAP — донесение → карточка (v1)

Маппинг колонок сырого CSV (ЦАМО, `data/raw/…/`) на поля карточки.
Карточка = неизменяемая копия донесения; служебное — в `meta` (см. types донора).

| Колонка CSV             | Поле карточки                        | Слой        |
|-------------------------|--------------------------------------|-------------|
| фамилия/имя/отчество    | `identities.{surname,name,patronymic}`| ЦАМО (RO)   |
| `document_id` / `url`   | ключ `cards[portal+id]`, `external_id`| ключ        |
| `place_birth`           | `meta.volunteerKeys.placeBirth`      | служебный   |
| `conscription_location` | `meta.volunteerKeys.conscriptionLocation` | служебный |
| `primary_burial`        | `meta.volunteerKeys.primaryBurial`   | служебный   |
| `current_burial`        | `meta.volunteerKeys.currentBurial`   | служебный   |
| `notes`                 | технический сигнал парсера (НЕ публикуется) | парсер |
| obd-memorial URL        | `meta.primaryUrl`                    | служебный   |
| «Дата» (сканирование)   | ОТСЕКАЕТСЯ (не публикуется)          | —           |

Повторы по ключу при загрузке ИСКЛЮЧАЮТСЯ (лог — `reports/ingest-log.md` донора).