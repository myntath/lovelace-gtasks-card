[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)

# gtasks-card

A Lovelace custom card for [GTasks custom component for HA](https://github.com/BlueBlueBlob/gtasks) in Home Assistant.

Easiest installation via [HACS](https://custom-components.github.io/hacs/).

For manual installation see [this guide](https://github.com/thomasloven/hass-config/wiki/Lovelace-Plugins).


**This card reqires [card tools](https://github.com/thomasloven/lovelace-card-tools).**

it's a fork from [lovelace-grocy-chores-card](https://github.com/isabellaalstrom/lovelace-grocy-chores-card) thx !

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
      entity: sensor.gtasks_chores
```

## Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| type | string | **Required** | `custom:gtasks-card`
| entity | string | **Required** | The entity id of your Grocy chores sensor.
| show_quantity | number | **Optional** | The number of chores you want to show in the card.
| show_days | number | **Optional** | `7` to only show chores that's due within 7 days.


## Advanced options
You can translate the english in the card to whatever you like.

```yaml
custom_translation:
  overdue: "Dépassée"
  today: "Aujourd'hui"
  due: "Date"
  track: Terminé"
  empty: "Vide"
```

