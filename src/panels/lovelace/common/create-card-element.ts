import deepClone from "deep-clone-simple";

import { fireEvent } from "../../../common/dom/fire_event";

import "../cards/hui-alarm-panel-card";
import "../cards/hui-conditional-card";
import "../cards/hui-entities-card";
import "../cards/hui-entity-button-card";
import "../cards/hui-entity-filter-card";
import {
  createErrorCardElement,
  createErrorCardConfig,
  HuiErrorCard,
} from "../cards/hui-error-card";
import "../cards/hui-glance-card";
import "../cards/hui-history-graph-card";
import "../cards/hui-horizontal-stack-card";
import "../cards/hui-iframe-card";
import "../cards/hui-light-card";
import "../cards/hui-map-card";
import "../cards/hui-markdown-card";
import "../cards/hui-media-control-card";
import "../cards/hui-picture-card";
import "../cards/hui-picture-elements-card";
import "../cards/hui-picture-entity-card";
import "../cards/hui-picture-glance-card";
import "../cards/hui-plant-status-card";
import "../cards/hui-sensor-card";
import "../cards/hui-vertical-stack-card";
import "../cards/hui-shopping-list-card";
import "../cards/hui-thermostat-card";
import "../cards/hui-weather-forecast-card";
import "../cards/hui-gauge-card";
import "../cards/hui-ais-files-list-card";
import "../cards/hui-ais-easy-picker-card";
import "../cards/hui-ais-list-card";
import "../cards/hui-ais-button-card";
import "../cards/hui-ais-mini-media-player-card";
import "../cards/hui-ais-auto-entities-card";
import "../cards/hui-ais-monster-card";
import "../cards/hui-ais-fold-entity-row-card";
import "../cards/hui-ais-zigbee2mqtt-card";
import "../cards/hui-ais-now-playing-poster-card";
import "../cards/hui-ais-color-lite-card";
import { LovelaceCard } from "../types";
import { LovelaceCardConfig } from "../../../data/lovelace";

const CARD_TYPES = new Set([
  "alarm-panel",
  "conditional",
  "entities",
  "entity-button",
  "entity-filter",
  "error",
  "gauge",
  "glance",
  "history-graph",
  "horizontal-stack",
  "iframe",
  "light",
  "map",
  "markdown",
  "media-control",
  "picture",
  "picture-elements",
  "picture-entity",
  "picture-glance",
  "plant-status",
  "sensor",
  "shopping-list",
  "thermostat",
  "vertical-stack",
  "weather-forecast",
  "ais-files-list",
  "ais-easy-picker",
  "ais-list",
  "ais-button",
  "ais-mini-media-player",
  "ais-auto-entities",
  "ais-monster",
  "ais-fold-entity-row",
  "ais-zigbee2mqtt",
  "ais-now-playing-poster",
  "ais-color-lite",
]);
const CUSTOM_TYPE_PREFIX = "custom:";
const TIMEOUT = 2000;

const _createElement = (
  tag: string,
  config: LovelaceCardConfig
): LovelaceCard | HuiErrorCard => {
  const element = document.createElement(tag) as LovelaceCard;
  try {
    element.setConfig(deepClone(config));
  } catch (err) {
    // tslint:disable-next-line
    console.error(tag, err);
    return _createErrorElement(err.message, config);
  }
  return element;
};

const _createErrorElement = (
  error: string,
  config: LovelaceCardConfig
): HuiErrorCard => createErrorCardElement(createErrorCardConfig(error, config));

export const createCardElement = (
  config: LovelaceCardConfig
): LovelaceCard | HuiErrorCard => {
  if (!config || typeof config !== "object" || !config.type) {
    return _createErrorElement("No card type configured.", config);
  }

  if (config.type.startsWith(CUSTOM_TYPE_PREFIX)) {
    const tag = config.type.substr(CUSTOM_TYPE_PREFIX.length);

    if (customElements.get(tag)) {
      return _createElement(tag, config);
    }
    const element = _createErrorElement(
      `Custom element doesn't exist: ${tag}.`,
      config
    );
    element.style.display = "None";
    const timer = window.setTimeout(() => {
      element.style.display = "";
    }, TIMEOUT);

    customElements.whenDefined(tag).then(() => {
      clearTimeout(timer);
      fireEvent(element, "ll-rebuild");
    });

    return element;
  }

  if (!CARD_TYPES.has(config.type)) {
    return _createErrorElement(
      `Unknown card type encountered: ${config.type}.`,
      config
    );
  }

  return _createElement(`hui-${config.type}-card`, config);
};
