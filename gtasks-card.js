customElements.whenDefined("card-tools").then(() => {
  let cardTools = customElements.get("card-tools");

  class GtasksCard extends cardTools.LitElement {

    setConfig(config) {
      if (!config.entity) {
        throw new Error("Please define entity");
      }
      this.config = config;
    }

    calculateDueDate(dueDate){
      if (!dueDate) {
        return -1;
      }
      var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
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

    render(){
      return cardTools.LitHtml
      `
        ${this._renderStyle()}
        ${cardTools.LitHtml
          `<ha-card>
            <h1 class="card-header">${this.header}</h1>
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
                          @click=${ev => this._complete(task.task_title, index)}
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
                          @click=${ev => this._complete(child.task_title, index + "_" + subindex)}>
                    ✓
                  </button>
                </div>
                `: ""}
              </div>
              `)}
              `)}` : cardTools.LitHtml`
              <div class="info flex">- No tasks...</div>
              `}
            </div>
            ${this.notShowing.length > 0 ? cardTools.LitHtml`
            <div class="secondary">${"Look in Google Tasks for " + this.notShowing.length + " more tasks..."}</div>`
            : ""}
            ${this.show_add != false ? cardTools.LitHtml`
            <div class="info flex new-task">
              <div>
                <paper-input label="New Task" id="new_task_input" type="text" no-label-float>New Task</paper-input>
              </div>
              <div>
                <button class="button" id="new_task_button" @click=${ev => this._new_task()}>+</button>
              </div>
            </div>` : "" }
          </ha-card>`}
      `;
    }

    darkenBg(index, value) {
      if (value) {
        var el = this.shadowRoot.querySelector("#" + index);
        if (el) {
          el.classList.add("darken");
        }
      } else {
        var el = this.shadowRoot.querySelector("#" + index);
        if (el) {
          el.classList.remove("darken");
        }
      }
    }

    async _complete(task_name, index){
      this.shadowRoot.querySelector("#task_" + index).setAttribute("disabled", "true");
      this.shadowRoot.querySelector("#main_div_" + index).classList.remove("darken");
      await this._hass.callService("gtasks", "complete_task", {
        task_title: task_name,
        tasks_list: this.list_name
      });
      await this._hass.callService("homeassistant", "update_entity", {
        entity_id: this.config.entity 
      });
      this.shadowRoot.querySelector("#task_" + index).removeAttribute("disabled");
    }

    async _new_task(new_task_name){
      var new_task_name = this.shadowRoot.querySelector("#new_task_input").value;
      this.shadowRoot.querySelector("#new_task_input").setAttribute("disabled", "true");
      this.shadowRoot.querySelector("#new_task_button").setAttribute("disabled", "true");
      await this._hass.callService("gtasks", "new_task", {
        task_title: new_task_name,
        tasks_list: this.list_name
      });
      await this._hass.callService("homeassistant", "update_entity", {
        entity_id: this.config.entity
      });
      this.shadowRoot.querySelector("#new_task_input").value = "";
      this.shadowRoot.querySelector("#new_task_input").removeAttribute("disabled");
      this.shadowRoot.querySelector("#new_task_button").removeAttribute("disabled");
    }

    _renderStyle() {
        return cardTools.LitHtml
        `
          <style>
            .card-header {
              padding: 0 0 10px !important;
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
              padding-top: 5px;
              line-height: normal !important;
              padding-left: 15px;
            }
            .task-title {
              padding-left: 12px;
              text-indent: -12px;
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
          </style>
        `;
      }

    set hass(hass) {
      this._hass = hass;

      const entity = hass.states[this.config.entity];
      const list_title = entity.attributes.friendly_name.split("_")[1]
      this.list_name = list_title
      this.header = this.config.title == null ? list_title : this.config.title;

      this.show_quantity = this.config.show_quantity == null ? null : this.config.show_quantity;
      this.show_days = this.config.show_days == null ? null : this.config.show_days;
      this.show_add = this.config.show_add == null ? null : this.config.show_add;
      this.show_check = this.config.show_check == null ? null : this.config.show_check;
      this.task_prefix = this.config.task_prefix == null ? null : this.config.task_prefix;
      //options for date_format are "YMD" "DMY" "MDY"
      this.date_format = this.config.date_format == null ? "YMD" : this.config.date_format;

      if (entity.state == "unknown")
        throw new Error("The Gtasks sensor is unknown.");

      var tasks = entity.attributes.tasks;
      var allTasks = []

      if(tasks != null){
        tasks.sort(function(a,b){
          if (a.due_date != null && b.due_date != null) {
            var aSplitDate = a.due_date.split(/[- :T]/)
            var bSplitDate = b.due_date.split(/[- :T]/)

            var aParsedDueDate = new Date(aSplitDate[0], aSplitDate[1]-1, aSplitDate[2]);
            var bParsedDueDate = new Date(bSplitDate[0], bSplitDate[1]-1, bSplitDate[2]);

            return bParsedDueDate - aParsedDueDate;
          }
            return;
        })

        tasks.map(task =>{
          var dueInDays = task.due_date ? this.calculateDueDate(task.due_date) : null;
          task.dueInDays = dueInDays;
          if(this.show_days != null) {
            if(dueInDays != null && dueInDays <= this.show_days){
              allTasks.unshift(task);
            }
          }
          else {
            if(task.due_date == null){
              allTasks.push(task)
            }
            else
              allTasks.unshift(task);
          }
        })

        if(this.show_quantity != null){
          this.tasks = allTasks.slice(0, this.show_quantity);
          this.notShowing = allTasks.slice(this.show_quantity);
        }
        else{
          this.tasks = allTasks;
          this.notShowing = 0;
        }
      }
      else
        this.tasks = allTasks;

      this.state = entity.state
      this.requestUpdate();
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
