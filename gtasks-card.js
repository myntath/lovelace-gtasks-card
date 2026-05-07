customElements.whenDefined("card-tools").then(() => {
  let cardTools = customElements.get("card-tools");

  class GtasksCard extends cardTools.LitElement {

    setConfig(config) {
      if (!config.entity && !config.entities) {
        throw new Error("Please define entity or entities");
      }
      this.config = config;
      this.tasks = [];
      this.notShowing = [];

      // Set initial active entity
      if (config.entity) {
        this._activeEntity = config.entity;
      } else {
        this._activeEntity = config.entities[0];
      }

      this._isTodo = this._activeEntity.startsWith("todo.");
      this._dropdownOpen = false;
      this._lastStateToken = null;
      this._lastEntityToken = null;
    }

    // ─── Due date helpers ─────────────────────────────────────────────────────

    calculateDueDate(dueDate){
      if (!dueDate) {
        return -1;
      }
      var oneDay = 24*60*60*1000;
      var today = new Date();
      today.setHours(0,0,0,0);

      var splitDate = dueDate.split(/[- :T]/);
      var parsedDueDate = new Date(splitDate[0], splitDate[1]-1, splitDate[2]);
      parsedDueDate.setHours(0,0,0,0);

      var dueInDays;
      if(today > parsedDueDate) {
        dueInDays = -1;
      }
      else
        dueInDays = Math.round(Math.abs((today.getTime() - parsedDueDate.getTime())/(oneDay)));

      return dueInDays;
    }

    checkDueClass(dueInDays) {
      if (dueInDays == 0)
        return "due-today";
      else if (dueInDays < 0)
        return "overdue";
      else
        return "not-due";
    }

    formatDueDate(dueDate, dueInDays, dateFormat) {
      if (dueInDays < 0)
        return "Overdue";
      else if (dueInDays == 0)
        return "Today";
      else {
        if (dateFormat == "MDY") {
          var splitDate = dueDate.split(/[- :T]/)
          return `${splitDate[1]}-${splitDate[2]}-${splitDate[0]}`;
        } else if (dateFormat == "DMY") {
          var splitDate = dueDate.split(/[- :T]/)
          return `${splitDate[2]}-${splitDate[1]}-${splitDate[0]}`;
        }
        else {
          return dueDate.substr(0, 10);
        }
      }
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    render(){
      // Show dropdown when: multiple entities defined AND no external list_select
      const showDropdown = this.config.entities &&
                           this.config.entities.length > 1 &&
                           !this.config.list_select;

      return cardTools.LitHtml
      `
        ${this._renderStyle()}
        ${cardTools.LitHtml
          `<ha-card>
            <h1 class="card-header">
              ${showDropdown ? cardTools.LitHtml`
                <div class="list-select-trigger" @click=${ev => this._toggleDropdown(ev)}>
                  ${this.show_icon != false ? cardTools.LitHtml`
                    <ha-icon class="title_icon" .icon="${this.icon}"></ha-icon>
                  ` : ''}
                  <span class="list-select-title">${this.header}</span>
                  <span class="list-select-chevron">${this._dropdownOpen ? '▲' : '▾'}</span>
                </div>
                ${this._dropdownOpen ? cardTools.LitHtml`
                <div class="list-select-dropdown">
                  ${this.config.entities.map(entityId => cardTools.LitHtml`
                    <div class="list-select-item ${entityId === this._activeEntity ? 'active' : ''}"
                         @click=${ev => this._switchList(ev, entityId)}>
                      <ha-icon .icon="${this._hass.states[entityId] ? (this._hass.states[entityId].attributes.icon || 'mdi:checkbox-marked-circle-outline') : 'mdi:checkbox-marked-circle-outline'}"></ha-icon>
                      <span>${this._hass.states[entityId] ? (this._hass.states[entityId].attributes.friendly_name || entityId) : entityId}</span>
                    </div>
                  `)}
                </div>
                ` : ''}
              ` : cardTools.LitHtml`
                <ha-icon class=title_icon .icon="${this.icon}"></ha-icon>${this.header}
              `}
            </h1>
            <div>
              ${this.tasks.length > 0 ? cardTools.LitHtml`
              ${this.tasks.map((task, index) => cardTools.LitHtml`
              <div class="info flex task" id=${"main_div_" + index}>
                <div>
                  <div class="task-title">
                    ${this.task_prefix}${task.task_title}
                  </div>
                  <div class="secondary">
                    <span class="${task.due_date ? this.checkDueClass(task.dueInDays) : ""}">
                      ${task.due_date ? "Due: " + this.formatDueDate(task.due_date, task.dueInDays, this.date_format): ""}
                    </span>
                  </div>
                </div>
                ${this.show_check != false ? cardTools.LitHtml`
                <div class="checkbox">
                  <button class="button"
                          id=${"task_" + index}
                          @click=${ev => this._complete(task, index)}
                          @mouseover=${ev => this.darkenBg('main_div_' + index, true)}
                          @mouseout=${ev => this.darkenBg('main_div_' + index, false)}>
                   ✓
                </button>
                </div>` : ""}
              </div>
              ${task.children.map((child, subindex) => cardTools.LitHtml`
              <div class="info flex child" id=${"main_div_" + index + "_" + subindex}>
                <div>
                  <div class="child-title">
                    ${this.task_prefix}${child.task_title}
                  </div>
                  <div class="secondary">
                    <span class="${child.due_date ? this.checkDueClass(this.calculateDueDate(child.due_date)) : ""}">
                      ${child.due_date ? "Due: " + this.formatDueDate(child.due_date, this.calculateDueDate(child.due_date), this.date_format): ""}
                    </span>
                  </div>
                </div>
                ${this.show_check != false ? cardTools.LitHtml`
                <div class="checkbox">
                  <button class="button"
                          id=${"task_" + index + "_" + subindex}
                          @mouseover=${ev => this.darkenBg('main_div_' + index + "_" + subindex, true)}
                          @mouseout=${ev => this.darkenBg('main_div_' + index + "_" + subindex, false)}
                          @click=${ev => this._complete(child, index + "_" + subindex)}>
                    ✓
                  </button>
                </div>
                `: ""}
              </div>
              `)}
              ${(this.show_hr && ( this.hr_end || (index < this.tasks.length-1) )) ? cardTools.LitHtml`<div class="hr-separator"></div>` : ""}
              `)}` : cardTools.LitHtml`
              <div class="info flex">- No tasks...</div>
              `}
            </div>
            ${this.notShowing.length > 0 ? cardTools.LitHtml`
            <div class="secondary">${this.notShowing.length + " more task(s) not shown..."}</div>`
            : ""}
            ${this.show_add != false ? cardTools.LitHtml`
            <div class="new-task">
              ${customElements.get('wa-input') ? cardTools.LitHtml`
                <wa-input
                  placeholder="New Task"
                  id="new_task_input"
                  type="text"
                  appearance="outlined"
                  style="flex:1"
                  @keydown=${ev => ev.key === 'Enter' && this._new_task()}
                ></wa-input>
              ` : cardTools.LitHtml`
                <ha-textfield
                  label="New Task"
                  id="new_task_input"
                  type="text"
                  style="flex:1"
                  @keydown=${ev => ev.key === 'Enter' && this._new_task()}
                ></ha-textfield>
              `}
              <button class="button add-button" id="new_task_button" @click=${ev => this._new_task()}>+</button>
            </div>` : "" }
          </ha-card>`}
      `;
    }

    // ─── Dropdown ─────────────────────────────────────────────────────────────

    _toggleDropdown(ev) {
      ev.stopPropagation();
      this._dropdownOpen = !this._dropdownOpen;
      this.requestUpdate();

      // Close on outside click
      if (this._dropdownOpen) {
        const close = () => {
          this._dropdownOpen = false;
          this.requestUpdate();
          document.removeEventListener('click', close);
        };
        document.addEventListener('click', close);
      }
    }

    _switchList(ev, entityId) {
      ev.stopPropagation();
      this._activeEntity = entityId;
      this._isTodo = entityId.startsWith("todo.");
      this._lastStateToken = null;       // force re-fetch on todo path
      this._lastGtasksStateToken = null; // force re-fetch on gtasks path
      this._dropdownOpen = false;
      this.requestUpdate();
    }

    // ─── Sync input_select options ────────────────────────────────────────────
    // Called once at init via entity token guard.
    // Warns once if existing options differ — possible conflict with another card.

    _syncInputSelect() {
      const newOptions = this.config.entities.map(entityId => {
        const state = this._hass.states[entityId];
        return state ? (state.attributes.friendly_name || entityId) : entityId;
      });

      const currentOptions = this._hass.states[this.config.list_select]
        ? (this._hass.states[this.config.list_select].attributes.options || [])
        : [];

      // One-time conflict detection
      if (currentOptions.length > 0) {
        const currentStr = JSON.stringify([...currentOptions].sort());
        const newStr = JSON.stringify([...newOptions].sort());
        if (currentStr !== newStr) {
          console.warn(
            `gtasks-card: input_select "${this.config.list_select}" already has options ` +
            `[${currentOptions}] which differ from this card's entities. ` +
            `Possible conflict with another card or automation. Overwriting.`
          );
        }
      }

      this._hass.callService('input_select', 'set_options', {
        entity_id: this.config.list_select,
        options: newOptions
      });

      // If current value not in new options, select first
      const currentValue = this._hass.states[this.config.list_select]
        ? this._hass.states[this.config.list_select].state
        : null;
      if (!currentValue || !newOptions.includes(currentValue)) {
        this._hass.callService('input_select', 'select_option', {
          entity_id: this.config.list_select,
          option: newOptions[0]
        });
      }
    }

    // ─── Hover effect ─────────────────────────────────────────────────────────

    darkenBg(index, value) {
      if (value) {
        var el = this.shadowRoot.querySelector("#" + index);
        if (el) el.classList.add("darken");
      } else {
        var el = this.shadowRoot.querySelector("#" + index);
        if (el) el.classList.remove("darken");
      }
    }

    // ─── Complete task ────────────────────────────────────────────────────────
    // task object passed directly so uid is available for todo path.

    async _complete(task, index){
      this.shadowRoot.querySelector("#task_" + index).setAttribute("disabled", "true");
      this.shadowRoot.querySelector("#main_div_" + index).classList.remove("darken");

      if (this._isTodo) {
        await this._hass.callService("todo", "update_item", {
          item: task.id,
          status: "completed"
        }, { entity_id: this._activeEntity });
        await this._fetchTodoItems();
      } else {
        await this._hass.callService("gtasks", "complete_task", {
          task_title: task.task_title,
          tasks_list: this.list_name
        });
        await this._hass.callService("homeassistant", "update_entity", {
          entity_id: this._activeEntity
        });
      }

      const btn = this.shadowRoot.querySelector("#task_" + index);
      if (btn) btn.removeAttribute("disabled");
    }

    // ─── New task ─────────────────────────────────────────────────────────────

    async _new_task(){
      var new_task_name = (this.shadowRoot.querySelector("#new_task_input").value || "").trim();
      if (!new_task_name) return;

      this.shadowRoot.querySelector("#new_task_input").setAttribute("disabled", "true");
      this.shadowRoot.querySelector("#new_task_button").setAttribute("disabled", "true");

      if (this._isTodo) {
        await this._hass.callService("todo", "add_item", {
          item: new_task_name
        }, { entity_id: this._activeEntity });
        await this._fetchTodoItems();
      } else {
        await this._hass.callService("gtasks", "new_task", {
          task_title: new_task_name,
          tasks_list: this.list_name
        });
        await this._hass.callService("homeassistant", "update_entity", {
          entity_id: this._activeEntity
        });
      }

      this.shadowRoot.querySelector("#new_task_input").value = "";
      this.shadowRoot.querySelector("#new_task_input").removeAttribute("disabled");
      this.shadowRoot.querySelector("#new_task_button").removeAttribute("disabled");
    }

    // ─── Fetch todo items ─────────────────────────────────────────────────────
    // Calls todo.get_items, normalizes to gtasks shape, triggers re-render.

    async _fetchTodoItems() {
      try {
        const result = await this._hass.callService(
          "todo", "get_items",
          { status: ["needs_action"] },
          { entity_id: this._activeEntity },
          true,   // notifyOnError
          true    // returnResponse
        );

        const items = result &&
                      result.response &&
                      result.response[this._activeEntity] &&
                      result.response[this._activeEntity].items
                      ? result.response[this._activeEntity].items
                      : [];

        // Normalize to gtasks shape: { task_title, id, due_date, children }
        const normalized = items.map(item => ({
          task_title: item.summary,
          id:         item.uid,
          due_date:   item.due || null,
          children:   []  // flat for now; hierarchy support future
        }));

        this._processTasks(normalized);
      } catch(e) {
        console.error("gtasks-card: failed to fetch todo items", e);
        this.tasks = [];
        this.notShowing = [];
        this.requestUpdate();
      }
    }

    // ─── Process and sort tasks ───────────────────────────────────────────────
    // Shared by both gtasks and todo paths.

    _processTasks(tasks) {
      var allTasks = [];

      if (tasks != null && tasks.length > 0) {
        tasks.sort(function(a, b){
          if (a.due_date != null && b.due_date != null) {
            var aSplitDate = a.due_date.split(/[- :T]/);
            var bSplitDate = b.due_date.split(/[- :T]/);
            var aParsedDueDate = new Date(aSplitDate[0], aSplitDate[1]-1, aSplitDate[2]);
            var bParsedDueDate = new Date(bSplitDate[0], bSplitDate[1]-1, bSplitDate[2]);
            return bParsedDueDate - aParsedDueDate;
          }
          return;
        });

        tasks.map(task => {
          var dueInDays = task.due_date ? this.calculateDueDate(task.due_date) : null;
          task.dueInDays = dueInDays;
          if (this.show_days != null) {
            if (dueInDays != null && dueInDays <= this.show_days) {
              allTasks.unshift(task);
            }
          } else {
            if (task.due_date == null) {
              allTasks.push(task);
            } else {
              allTasks.unshift(task);
            }
          }
        });

        if (this.show_quantity != null) {
          this.tasks = allTasks.slice(0, this.show_quantity);
          this.notShowing = allTasks.slice(this.show_quantity);
        } else {
          this.tasks = allTasks;
          this.notShowing = [];
        }
      } else {
        this.tasks = [];
        this.notShowing = [];
      }

      this.requestUpdate();
    }

    // ─── Styles ───────────────────────────────────────────────────────────────

    _renderStyle() {
      return cardTools.LitHtml
      `
        <style>
          .card-header {
            padding: 0 0 10px !important;
            position: relative;
          }
          ha-card {
            padding: 16px;
            height: 100%;
          }
          .header {
            padding: 0;
            @apply --paper-font-headline;
            text-align: center;
            color: var(--primary-text-color);
            padding: 4px 0 12px;
          }
          .checkbox {
            display: flex;
          }
          .task {
            padding: 3px 0 3px 10px;
          }
          .new-task {
            display: flex;
            align-items: center;
            padding: 8px 4px 4px;
            gap: 4px;
          }
          .new-task ha-textfield {
            flex: 1;
            width: 100%;
          }
          .add-button {
            font-size: 1.4em;
            padding: 0 4px;
            flex-shrink: 0;
          }
          .task-title {
            padding-left: 12px;
            text-indent: -12px;
          }
          .title_icon {
            ${this.show_icon ? "" : "display: none;" }
            margin-right: 5px;
            --mdc-icon-size: ${this.icon_size};
            color: ${this.icon_color};
          }
          .info {
            padding-bottom: 5px;
            font-size: 1.2em;
            align-items: center;
          }
          .flex {
            display: flex;
            justify-content: space-between;
          }
          .overdue {
            color: red !important;
          }
          .due-today {
            color: orange !important;
          }
          .secondary {
            display: block;
            font-size: 0.8em;
            color: #8c96a5;
            padding-left: 15px;
            margin-top: -4px;
          }
          .button {
            background: transparent;
            border: none;
            color: var(--accent-color);
            font-weight: 700;
          }
          .button:hover {
            cursor: pointer;
          }
          .button:disabled {
            color: var(--disabled-text-color);
            cursor: not-allowed;
          }
          .child {
            padding: 3px 0 3px 35px;
          }
          .darken {
            background: linear-gradient(rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.25));
          }
          .hr-separator {
            width: auto;
            height: 1px;
            background-color: ${this.hr_color};
            margin: 2px 8px;
          }

          /* ── List select dropdown ── */
          .list-select-trigger {
            display: inline-flex;
            align-items: center;
            cursor: pointer;
            user-select: none;
            gap: 4px;
          }
          .list-select-trigger:hover {
            opacity: 0.8;
          }
          .list-select-title {
            font-size: inherit;
            font-weight: inherit;
            color: inherit;
          }
          .list-select-chevron {
            --mdc-icon-size: 20px;
            opacity: 0.7;
            flex-shrink: 0;
          }
          .list-select-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            z-index: 999;
            background: var(--card-background-color, var(--paper-card-background-color, #1c1c1c));
            border: 1px solid var(--divider-color, rgba(255,255,255,0.12));
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.4);
            overflow: hidden;
            margin-top: 4px;
          }
          .list-select-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 14px;
            cursor: pointer;
            font-size: 1em;
            color: var(--primary-text-color);
            transition: background 0.15s;
          }
          .list-select-item:hover {
            background: rgba(255,255,255,0.08);
          }
          .list-select-item.active {
            color: var(--accent-color);
          }
          .list-select-item ha-icon {
            --mdc-icon-size: 20px;
            flex-shrink: 0;
          }
        </style>
      `;
    }

    // ─── Hass setter ─────────────────────────────────────────────────────────

    set hass(hass) {
      this._hass = hass;

      // ── Config options (same for all paths) ─────────────────────────────────
      // max_items is the current config key; show_quantity is kept for backward compatibility
      this.show_quantity = this.config.max_items != null
        ? this.config.max_items
        : (this.config.show_quantity != null ? this.config.show_quantity : null);

      // Allow input_number entity to drive max_items/show_quantity
      if (typeof this.show_quantity == "string" && this.show_quantity.startsWith("input_number")) {
        this.show_quantity = Math.max(0, parseInt(hass.states[this.show_quantity].state));
      }

      this.show_days   = this.config.show_days   == null ? null    : this.config.show_days;
      this.show_add    = this.config.show_add    == null ? null    : this.config.show_add;
      this.show_check  = this.config.show_check  == null ? null    : this.config.show_check;
      this.task_prefix = this.config.task_prefix == null ? null    : this.config.task_prefix;
      this.date_format = this.config.date_format == null ? "YMD"   : this.config.date_format;
      this.show_hr     = this.config.show_hr     == null ? false   : this.config.show_hr;
      this.hr_color    = this.config.hr_color    == null ? "white" : this.config.hr_color;
      this.hr_end      = this.config.hr_end      == null ? true    : this.config.hr_end;
      this.icon_size   = this.config.icon_size   == null ? "30px"  : this.config.icon_size;
      this.icon_color  = this.config.icon_color  == null ? "var(--primary-text-color)" : this.config.icon_color;
      this.show_icon   = this.config.show_icon   == null ? true    : this.config.show_icon;

      // ── Mode 3: sync input_select once at init ───────────────────────────────
      if (this.config.list_select && this.config.entities) {
        const entityToken = JSON.stringify(this.config.entities);
        if (entityToken !== this._lastEntityToken) {
          this._lastEntityToken = entityToken;
          this._syncInputSelect();
        }

        // Resolve active entity from input_select state via friendly name match
        const selectedName = hass.states[this.config.list_select]
          ? hass.states[this.config.list_select].state
          : null;
        if (selectedName) {
          const match = this.config.entities.find(entityId => {
            const s = hass.states[entityId];
            return s && s.attributes.friendly_name === selectedName;
          });
          if (match) {
            if (match !== this._activeEntity) {
              this._activeEntity = match;
              this._isTodo = match.startsWith("todo.");
              this._lastStateToken = null; // force re-fetch on list change
            }
          }
        }
      }

      // ── Resolve header and icon from active entity ───────────────────────────
      const entity = hass.states[this._activeEntity];
      if (!entity) return;

      if (this._isTodo) {
        const friendly = entity.attributes.friendly_name || this._activeEntity.split(".")[1];
        this.header = this.config.title == null ? friendly : this.config.title;
        this.icon   = this.config.icon  == null ? (entity.attributes.icon || "mdi:checkbox-marked-circle-outline") : this.config.icon;

        // Fetch only when state token changes
        const stateToken = entity.state + "_" + (entity.last_changed || "");
        if (stateToken !== this._lastStateToken) {
          this._lastStateToken = stateToken;
          this._fetchTodoItems();
        }

      } else {
        // ── Legacy gtasks sensor path ──────────────────────────────────────────
        const raw_title = entity.attributes.friendly_name || "";

        let list_title;
        if (raw_title.toLowerCase().startsWith("gtasks_")) {
          list_title = raw_title.split("_")[1];
        } else {
          list_title = raw_title;
        }

        this.list_name = list_title;
        this.header    = this.config.title == null ? list_title : this.config.title;
        this.icon      = this.config.icon  == null ? entity.attributes.icon : this.config.icon;

        if (entity.state == "unknown")
          throw new Error("The Gtasks sensor is unknown.");

        if (entity.attributes == null)
          throw new Error("The Gtasks sensor attributes are null.");

        const gtasksToken = entity.state + "_" + (entity.last_changed || "");
        if (gtasksToken !== this._lastGtasksStateToken) {
          this._lastGtasksStateToken = gtasksToken;
          this._processTasks(entity.attributes.tasks || []);
        }
      }
    }

    getCardSize() {
      return 4 + parseInt(this.tasks.length / 4);
    }
  }

  customElements.define("gtasks-card", GtasksCard);
});

window.setTimeout(() => {
  if(customElements.get("card-tools")) return;
  customElements.define("gtasks-card", class extends HTMLElement{
    setConfig() { throw new Error("Can't find card-tools. See https://github.com/thomasloven/lovelace-card-tools");}
  });
}, 2000);
