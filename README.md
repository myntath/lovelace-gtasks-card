[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)

# gtasks-card

A Lovelace custom card for [GTasks custom component for HA](https://github.com/myntath/gtasks-ha) in Home Assistant.

Easiest installation via [HACS](https://custom-components.github.io/hacs/).

For manual installation see [this guide](https://github.com/thomasloven/hass-config/wiki/Lovelace-Plugins).


**This card reqires [card tools](https://github.com/thomasloven/lovelace-card-tools).**

it's a fork from [lovelace-grocy-chores-card](https://github.com/isabellaalstrom/lovelace-grocy-chores-card) thx ! and also a fork from @BlueBlueBlob also thx!

## Example configuration



```yaml
title: My awesome Lovelace config
resources:
  - url: /local/gtasks-card.js
    type: js
views:
  title: My view
  cards:
    - type: custom:gtasks-card
      entity: sensor.gtasks_my_tasks
```



