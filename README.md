[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)

# gtasks-card

A Lovelace custom card for [GTasks custom component for HA](https://github.com/myntath/gtasks-ha) in Home Assistant.

Easiest installation via [HACS](https://custom-components.github.io/hacs/).

For manual installation see [this guide](https://github.com/thomasloven/hass-config/wiki/Lovelace-Plugins).


**This card reqires [card tools](https://github.com/thomasloven/lovelace-card-tools).**

it's a fork from [lovelace-grocy-chores-card](https://github.com/isabellaalstrom/lovelace-grocy-chores-card) thx ! and also a fork from [@BlueBlueBlob](https://github.com/blueblueblob) also thx!

## Configuration

Options include:
- title: a string to change the title.
- show_quantity: a number which will limit the number of items shown.
- show_days: a number so that only tasks within that many days are shown.
- show_add: true/false whether to show add new task at the bottom of list.
- show_check: whether to show check marks to complete tasks.
- task_prefix: a string which is prefixed to all tasks i.e. ' * '.
- date_format: a string of either 'YMD', 'DMY', 'MDY' to print dates in your preferred format.

Example:
```yaml
type: custom:gtasks-card
entity: sensor.gtasks_my_tasks
title: Tasks
show_add: true
task_prefix: '- '
date_format: DMY
show_check: true
```



