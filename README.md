[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)

# gtasks-card

A Lovelace custom card for Home Assistant supporting both the [GTasks custom component](https://github.com/myntath/gtasks-ha) and the native Home Assistant [Todo integration](https://www.home-assistant.io/integrations/todo/) (including CalDAV/Nextcloud tasks).

Easiest installation via [HACS](https://hacs.xyz/).

For manual installation see [this guide](https://github.com/thomasloven/hass-config/wiki/Lovelace-Plugins).

**This card requires [card-tools](https://github.com/thomasloven/lovelace-card-tools).**

Forked from [myntath/lovelace-gtasks-card](https://github.com/myntath/lovelace-gtasks-card), which is itself a fork from [@BlueBlueBlob](https://github.com/blueblueblob) and [lovelace-grocy-chores-card](https://github.com/isabellaalstrom/lovelace-grocy-chores-card). Thanks to all prior contributors.

---

## Entity Support

This card supports two entity types:

**`todo.*` entities** — Native HA Todo integration entities (CalDAV, Nextcloud, iCloud, Todoist, etc.). The card detects these automatically by the `todo.` prefix and uses the `todo.get_items`, `todo.add_item`, and `todo.update_item` services.

**`sensor.gtasks_*` entities** — Legacy GTasks custom component sensors. Fully supported for backward compatibility.

Both entity types can be mixed in the same `entities` list.

---

## Modes

### Mode 1 — Single entity
The original card behavior. Point the card at a single entity.

```yaml
type: custom:gtasks-card
entity: todo.my_tasks
title: My Tasks
show_add: true
show_check: true
```

### Mode 2 — Multiple entities with in-card dropdown
Provide a list of entities. When more than one entity is defined and no `list_select` is configured, a dropdown selector appears in the card header allowing the user to switch between lists.

```yaml
type: custom:gtasks-card
entities:
  - todo.russ
  - todo.projects
  - todo.shopping_list
show_add: true
show_check: true
```

### Mode 3 — External `input_select` control
Provide a list of entities and a `list_select` pointing to an `input_select` helper. The card populates the helper's options automatically on load and watches it for changes. This allows other cards, automations, or voice assistants to control which list is displayed — useful for kiosk displays or shared dashboards.

```yaml
type: custom:gtasks-card
entities:
  - todo.russ
  - todo.projects
  - todo.shopping_list
list_select: input_select.active_task_list
show_add: false
show_check: false
```

The `input_select` helper must exist in HA before the card loads. It can be created with a placeholder option — the card will replace the options on first load. If the helper's options already differ from the card's entity list on load, a one-time warning is logged to the browser console indicating a possible conflict with another card or automation.

---

## Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `entity` | string | — | Single entity ID (`todo.*` or `sensor.gtasks_*`). Use this **or** `entities`, not both. |
| `entities` | list | — | List of entity IDs for multi-list mode. Enables dropdown or external `input_select` control. |
| `list_select` | string | — | Entity ID of an `input_select` helper for external list control (Mode 3). Requires `entities`. |
| `title` | string | friendly name | Override the card header title. |
| `max_items` | number / input_number entity | — | Limit the number of tasks shown. Accepts a number or an `input_number` entity ID for dynamic control. |
| `show_days` | number | — | Only show tasks due within this many days. |
| `show_add` | bool | true | Show the new task input field at the bottom of the card. |
| `show_check` | bool | true | Show checkmark buttons to complete tasks. |
| `task_prefix` | string | — | String prepended to every task title e.g. `'- '`. |
| `date_format` | string | `YMD` | Date display format. Options: `YMD`, `DMY`, `MDY`. |
| `show_icon` | bool | true | Show the list icon in the card header. |
| `icon` | string | entity icon | Override the header icon e.g. `mdi:format-list-checks`. |
| `icon_size` | string | `30px` | Header icon size. |
| `icon_color` | string | `var(--primary-text-color)` | Header icon color. |
| `show_hr` | bool | false | Show a horizontal separator line between tasks. |
| `hr_color` | string | `white` | Separator line color. |
| `hr_end` | bool | true | Show a separator after the last task. |

> **Note:** `show_quantity` is supported as a deprecated alias for `max_items` for backward compatibility with existing configurations.

---

## Examples

### Nextcloud tasks via CalDAV with dropdown

```yaml
type: custom:gtasks-card
entities:
  - todo.russ
  - todo.projects
  - todo.bills
show_add: true
show_check: true
show_hr: true
hr_color: teal
task_prefix: '- '
icon_color: teal
```

### Kiosk display controlled by external input_select

```yaml
type: custom:gtasks-card
entities:
  - todo.russ
  - todo.projects
  - todo.bills
list_select: input_select.active_task_list
show_add: false
show_check: false
show_hr: true
max_items: 10
```

### Legacy GTasks sensor (backward compatible)

```yaml
type: custom:gtasks-card
entity: sensor.gtasks_my_tasks
title: My Tasks
show_add: true
task_prefix: '- '
date_format: DMY
show_check: true
```

---

## Notes

- **`title` in multi-entity mode:** When `title` is set alongside `entities`, the header displays the static title for all lists. The dropdown remains functional but the header will not update to reflect the active list name. Omit `title` to show the active list's friendly name dynamically.
- **Children/subtasks:** The card renders subtasks when present in the entity data. The native HA Todo integration currently represents tasks as flat lists — subtask support depends on the underlying integration. The card is designed to render hierarchy when it becomes available.
- **`wa-input` vs `ha-textfield`:** The add task input field uses `wa-input` (Web Awesome) when available (HA 2025+) and falls back to `ha-textfield` for older installs.
- **CalDAV setup:** To use Nextcloud or other CalDAV task lists, add the CalDAV integration via Settings → Devices & Services → Add Integration → CalDAV. Your task lists will appear as `todo.*` entities.
