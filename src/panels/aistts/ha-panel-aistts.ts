import "../../layouts/ha-app-layout";
import "@polymer/app-layout/app-header/app-header";
import "@polymer/app-layout/app-toolbar/app-toolbar";
import "@polymer/paper-checkbox/paper-checkbox";
import "../../components/ha-icon-button";
import "@polymer/paper-item/paper-icon-item";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-item/paper-item-body";
import "@polymer/paper-listbox/paper-listbox";
import "@polymer/paper-dropdown-menu/paper-dropdown-menu-light";
import "@material/mwc-list/mwc-list-item";
import "@polymer/paper-input/paper-textarea";
import "@polymer/paper-radio-button/paper-radio-button";
import "@polymer/paper-radio-group/paper-radio-group";
import "../../components/ha-button-menu";
import "../../components/ha-card";
import "../../components/ha-menu-button";
import "../../components/ha-slider";
import "../../components/ha-expansion-panel";
import { showVoiceCommandDialog } from "../../dialogs/voice-command-dialog/show-ha-voice-command-dialog";
import { repeat } from "lit-html/directives/repeat";
import { HomeAssistant } from "../../types";
import { haStyle } from "../../resources/styles";
import { PaperInputElement } from "@polymer/paper-input/paper-input";
import { UnsubscribeFunc } from "home-assistant-js-websocket";
import { guard } from "lit-html/directives/guard";
import { mdiDrag } from "@mdi/js";
import {
  css,
  customElement,
  html,
  LitElement,
  property,
  PropertyValues,
  internalProperty,
  query,
} from "lit-element";

import {
  addItem,
  clearItems,
  fetchItems,
  AisTtsItem,
  updateItem,
  reorderItems,
} from "./aistts";

interface Language {
  key: string;
  name: string;
}

interface Voice {
  key: string;
  name: string;
  lang: string;
}

const languages: Language[] = [
  {
    key: "pl_PL",
    name: "Polski (pl_PL)",
  },
  {
    key: "en_GB",
    name: "English (en_GB)",
  },
  {
    key: "uk_UA",
    name: "Український (uk_UA)",
  },
];

let voices: Voice[] = [];

const allVoices: Voice[] = [
  {
    key: "jola",
    name: "Jola",
    lang: "pl_PL",
  },
  {
    key: "celina",
    name: "Celina",
    lang: "pl_PL",
  },
  {
    key: "anżela",
    name: "Anżela",
    lang: "pl_PL",
  },
  {
    key: "asia",
    name: "Asia",
    lang: "pl_PL",
  },
  {
    key: "sebastian",
    name: "Sebastian",
    lang: "pl_PL",
  },
  {
    key: "bartek",
    name: "Bartek",
    lang: "pl_PL",
  },
  {
    key: "andrzej",
    name: "Andrzej",
    lang: "pl_PL",
  },
  {
    key: "mariya",
    name: "Mariya",
    lang: "uk_UA",
  },
  {
    key: "allison",
    name: "Allison",
    lang: "en_GB",
  },
  {
    key: "jon",
    name: "Jon",
    lang: "en_GB",
  },
  {
    key: "sophia",
    name: "Sophia",
    lang: "en_GB",
  },
  {
    key: "sam",
    name: "Sam",
    lang: "en_GB",
  },
];

let Sortable;

@customElement("ha-panel-aistts")
export class HaPanelAisTts extends LitElement {
  @property() hass!: HomeAssistant;

  @property() public narrow!: boolean;

  @internalProperty() private _uncheckedItems?: AisTtsItem[];

  @internalProperty() private _checkedItems?: AisTtsItem[];

  @internalProperty() private _selectedLanguage = "pl_PL";

  @internalProperty() private _selectedVoice = "pl-pl-x-oda-local";

  @internalProperty() private _speedValue = 1;

  @internalProperty() private _pitchValue = 1;

  @internalProperty() private _reordering = false;

  @internalProperty() private _renderEmptySortable = false;

  private _sortable?;

  @query("#sortable-tts", true) private _sortableEl?: HTMLElement;

  protected firstUpdated(changedProps: PropertyValues): void {
    super.firstUpdated(changedProps);
    this.hassSubscribeListUpdate();
    this.hassSubscribeSayText();
  }

  protected render() {
    return html`
      <ha-app-layout>
        <app-header slot="header" fixed>
          <app-toolbar>
            <ha-menu-button
              .hass=${this.hass}
              .narrow=${this.narrow}
            ></ha-menu-button>
            <div main-title>AIS TTS</div>
            <ha-icon-button
              aria-label="Rozpocznij rozmowę"
              icon="hass:microphone"
              @click=${this._showVoiceCommandDialog}
            ></ha-icon-button>
            <ha-button-menu corner="BOTTOM_START">
              <ha-icon-button
                icon="hass:dots-vertical"
                label="Menu"
                slot="trigger"
              >
              </ha-icon-button>
              <mwc-list-item @click=${this._clearItems}>
                Usuń zaznaczone
              </mwc-list-item>
            </ha-button-menu>
          </app-toolbar>
        </app-header>

        <div class="content">
          <ha-card>
            <paper-radio-group
              name="selectedLanguage"
              .selected=${this._selectedLanguage}
              @selected-changed=${this._setLanguage}
            >
              <paper-radio-button name="pl_PL" lang="pl_PL">
                <img
                  style="width: 50px;"
                  src="/static/ais_dom/Flag_of_Poland.svg"
                />
                Polski
              </paper-radio-button>
              <paper-radio-button name="en_GB" lang="en_GB">
                <img
                  style="width: 50px;"
                  src="/static/ais_dom/Flag_of_the_United_Kingdom.svg"
                />
                English
              </paper-radio-button>
              <paper-radio-button name="uk_UA" lang="uk_UA">
                <img
                  style="width: 50px;"
                  src="/static/ais_dom/Flag_of_Ukraine.svg"
                />
                Український
              </paper-radio-button>
            </paper-radio-group>
            <paper-icon-item>
              <paper-item-body>
                <paper-textarea
                  class="addBox"
                  label="Tekst do przeczytania"
                  placeholder="wpisz nowy tekst do przeczytania"
                  name="description"
                  maxRows="1"
                  @keydown=${this._addKeyPress}
                ></paper-textarea>
                <div class="AisTtsLang">
                  <paper-dropdown-menu-light
                    label="Głos"
                    style="margin-left: 30px; width:250px;"
                  >
                    <paper-listbox
                      slot="dropdown-content"
                      attr-for-selected="voice"
                      .selected=${this._selectedVoice}
                      @iron-select=${this._setVoice}
                    >
                      ${voices.map((voice) => {
                        return html`
                          <paper-item voice=${voice.key}
                            >${voice.name}</paper-item
                          >
                        `;
                      })}
                    </paper-listbox>
                  </paper-dropdown-menu-light>
                  <label
                    class="label-is-floating"
                    style=" font-size: 12px; color: var(--primary-color);"
                    >Prędkość</label
                  >
                  <ha-slider
                    editable
                    pin
                    step="0.1"
                    min="0.3"
                    max="4"
                    .value="${Number(this._speedValue)}"
                    @change="${this._speedValueChanged}"
                  ></ha-slider>
                  <label
                    class="label-is-floating"
                    style="margin-left: 30px; font-size: 12px; color: var(--primary-color);"
                    >Ton</label
                  >
                  <ha-slider
                    editable
                    pin
                    step="0.1"
                    min="0.3"
                    max="4"
                    .value="${Number(this._pitchValue)}"
                    @change="${this._pitchValueChanged}"
                  ></ha-slider>
                </div>
                <div class="AisTtsSliders"></div>
                <div class="AisButtons">
                  <ha-icon-button
                    slot="item-icon"
                    icon="hass:play"
                    @click=${this._playItem}
                  ></ha-icon-button>
                  <ha-icon-button
                    slot="item-icon"
                    icon="hass:plus"
                    @click=${this._addItem}
                  ></ha-icon-button>
                </div>
              </paper-item-body>
            </paper-icon-item>
          </ha-card>
          <div class="tip">
            Wpisz tekst, wybierz język i parametry, a następnie kliknij „Play”,
            aby usłyszeć czytany tekst.<br />Żeby dodać pozycję do listy
            naciśnij "Plus".
          </div>
          <ha-card>
            ${this._reordering
              ? html`
                  ${guard(
                    [this._uncheckedItems, this._renderEmptySortable],
                    () =>
                      this._renderEmptySortable
                        ? ""
                        : this._renderItems(this._uncheckedItems!)
                  )}
                `
              : this._renderItems(this._uncheckedItems!)}
            ${this._checkedItems && this._checkedItems!.length > 0
              ? html`
                  <div class="divider"></div>
                  <div class="checked">
                    <span>
                      Pozycje zaznaczone
                    </span>
                    <ha-icon
                      class="clearall"
                      tabindex="0"
                      icon="hass:delete"
                      title="Usuń zaznaczone"
                      @click=${this._clearItems}
                    >
                    </ha-icon>
                  </div>
                  ${repeat(
                    this._checkedItems!,
                    (item) => item.id,
                    (item) =>
                      html`
                        <div class="editRow">
                          <paper-checkbox
                            tabindex="0"
                            ?checked=${item.complete}
                            .itemId=${item.id}
                            @click=${this._completeItem}
                          ></paper-checkbox>
                          <paper-input
                            no-label-float
                            .value=${item.name}
                            .itemId=${item.id}
                            @change=${this._saveEdit}
                          ></paper-input>
                        </div>
                      `
                  )}
                `
              : ""}
          </ha-card>
        </div>
      </ha-app-layout>
    `;
  }

  public hassSubscribeListUpdate(): Promise<UnsubscribeFunc>[] {
    this._fetchData();
    return [
      this.hass!.connection.subscribeEvents(
        () => this._fetchData(),
        "aistts_list_updated"
      ),
    ];
  }

  public hassSubscribeSayText(): Promise<UnsubscribeFunc>[] {
    this._fetchData();
    return [
      this.hass!.connection.subscribeEvents(
        () => this._playItem(""),
        "aistts_play_item"
      ),
    ];
  }

  private _renderItems(items: AisTtsItem[]) {
    if (items === undefined) {
      return html``;
    }

    return html` <div class="AisButtons">
        <ha-icon-button
          slot="item-icon"
          icon="hass:sort"
          @click=${this._toggleReorder}
        ></ha-icon-button>
      </div>
      <div class="divider"></div>
      <div class="checked">
        <span>
          Dostępne pozycje
        </span>
      </div>
      <div id="sortable-tts">
        ${repeat(
          this._uncheckedItems!,
          (item) => item.id,
          (item) =>
            html`
              <div class="editRow" tts-item-id=${item.id}>
                <ha-expansion-panel>
                  <div class="ItemInfo">
                    <span class="ItemInfoLabel">Język</span
                    ><span class="ItemInfoValue">${item.language}</span>
                    <span class="ItemInfoLabel">Prędkość</span
                    ><span class="ItemInfoValue">${item.pitch}</span>
                    <span class="ItemInfoLabel">Ton</span
                    ><span class="ItemInfoValue">${item.rate}</span>
                    <span class="ItemInfoLabel">Głos</span
                    ><span class="ItemInfoValue">${item.voice}</span>
                  </div>
                  <div>
                    <span class="ItemInfoLabel">GET Request: </span>
                    ${this._getItemRow(item, false)}
                  </div>
                </ha-expansion-panel>
                <paper-checkbox
                  tabindex="0"
                  ?checked=${item.complete}
                  .itemId=${item.id}
                  @click=${this._completeItem}
                ></paper-checkbox>
                <paper-input
                  no-label-float
                  .value=${item.name}
                  .itemId=${item.id}
                  @change=${this._saveEdit}
                ></paper-input>
                <ha-icon-button
                  slot="item-icon"
                  icon="hass:play"
                  .item=${item}
                  @click=${this._playItemRow}
                ></ha-icon-button>
                ${this._reordering
                  ? html`
                      <ha-svg-icon
                        title="Reorder"
                        class="reorderButton"
                        .path=${mdiDrag}
                      >
                      </ha-svg-icon>
                    `
                  : ""}
              </div>
            `
        )}
      </div>`;
  }

  private async _fetchData(): Promise<void> {
    if (!this.hass) {
      return;
    }
    const checkedItems: AisTtsItem[] = [];
    const uncheckedItems: AisTtsItem[] = [];
    const items = await fetchItems(this.hass);
    for (const key in items) {
      if (items[key].complete) {
        checkedItems.push(items[key]);
      } else {
        uncheckedItems.push(items[key]);
      }
    }
    this._checkedItems = checkedItems;
    this._uncheckedItems = uncheckedItems;

    if (this._reordering) {
      this._createSortable();
    }
  }

  private _completeItem(ev): void {
    updateItem(this.hass!, ev.target.itemId, {
      complete: ev.target.checked,
    }).catch(() => this._fetchData());
  }

  private _saveEdit(ev): void {
    updateItem(this.hass!, ev.target.itemId, {
      name: ev.target.value,
    }).catch(() => this._fetchData());

    ev.target.blur();
  }

  private _clearItems(): void {
    if (this.hass) {
      clearItems(this.hass).catch(() => this._fetchData());
    }
  }

  private get _newItem(): PaperInputElement {
    return this.shadowRoot!.querySelector(".addBox") as PaperInputElement;
  }

  private _playItem(ev): void {
    const newItem = this._newItem;
    let text = newItem.value;
    if (text === undefined) {
      text = "Wpisz tekst do przeczytania";
    }
    if (text === null) {
      text = "Wpisz tekst do przeczytania";
    }
    if (text.length === 0) {
      text = "Wpisz tekst do przeczytania";
    }
    this.hass.callService("ais_ai_service", "say_it", {
      text: text,
      pitch: this._pitchValue,
      rate: this._speedValue,
      language: this._selectedLanguage,
      voice: this._selectedVoice,
    });
  }

  private _getItemRow(item, encode): string {
    const sUrl =
      "http://" +
      this.hass.states["sensor.internal_ip_address"].state.trim() +
      ":8122/text_to_speech?language=" +
      item.language +
      "&voice=" +
      item.voice +
      "&rate=" +
      item.rate +
      "&pitch=" +
      item.pitch +
      "&text=" +
      item.name;
    if (encode) {
      return encodeURI(sUrl);
    }
    return sUrl;
  }

  private _playItemRow(ev): void {
    this.hass.callService("ais_ai_service", "say_it", {
      text: ev.target.item.name,
      pitch: ev.target.item.pitch,
      rate: ev.target.item.rate,
      language: ev.target.item.language,
      voice: ev.target.item.voice,
    });
  }

  private _addItem(ev): void {
    const newItem = this._newItem;

    if (newItem.value!.trim().length > 0) {
      addItem(
        this.hass!,
        newItem.value!,
        String(this._pitchValue),
        String(this._speedValue),
        this._selectedLanguage,
        this._selectedVoice
      ).catch(() => this._fetchData());
    }

    newItem.value = "";
    if (ev) {
      newItem.focus();
    }
  }

  private _addKeyPress(ev): void {
    if (ev.keyCode === 13) {
      this._addItem(null);
    }
  }

  private async _toggleReorder() {
    if (!Sortable) {
      const sortableImport = await import(
        "sortablejs/modular/sortable.core.esm"
      );
      Sortable = sortableImport.Sortable;
    }
    this._reordering = !this._reordering;
    await this.updateComplete;
    if (this._reordering) {
      this._createSortable();
    } else {
      this._sortable?.destroy();
      this._sortable = undefined;
    }
  }

  private _createSortable() {
    this._sortable = new Sortable(
      this.shadowRoot!.getElementById("sortable-tts"),
      {
        animation: 150,
        fallbackClass: "sortable-fallback",
        dataIdAttr: "tts-item-id",
        handle: "ha-svg-icon",
        onSort: async (evt) => {
          reorderItems(this.hass!, this._sortable.toArray()).catch(() =>
            this._fetchData()
          );
          // Move the shopping list item in memory.
          this._uncheckedItems!.splice(
            evt.newIndex,
            0,
            this._uncheckedItems!.splice(evt.oldIndex, 1)[0]
          );
          this._renderEmptySortable = true;
          await this.updateComplete;
          while (this._sortableEl?.lastElementChild) {
            this._sortableEl.removeChild(this._sortableEl.lastElementChild);
          }
          this._renderEmptySortable = false;
        },
      }
    );
    console.log("sortable-tts: " + this._sortable.toArray());
  }

  private _showVoiceCommandDialog(): void {
    showVoiceCommandDialog(this);
  }

  private _loadVoices(lang): void {
    voices = allVoices.filter((voice: Voice) => voice.lang === lang);
    this._selectedVoice = voices[0].key;
  }

  private async _setLanguage(ev): Promise<void> {
    const newVal = ev.detail.value;
    console.log("newVal " + newVal);
    this._selectedLanguage = newVal;
    this._loadVoices(newVal);
  }

  private async _setVoice(ev): Promise<void> {
    const voice = ev.detail.item.getAttribute("voice");
    this._selectedVoice = voice;
  }

  private _speedValueChanged(ev): void {
    const newVal = ev.target.value;
    this._speedValue = newVal;
  }

  private _pitchValueChanged(ev): void {
    const newVal = ev.target.value;
    this._pitchValue = newVal;
  }

  static get styles() {
    return [
      haStyle,
      css`
        ha-card {
          padding: 16px;
        }

        .has-header {
          padding-top: 0;
        }

        .editRow,
        .addRow,
        .checked {
          display: flex;
          flex-direction: row;
          align-items: center;
        }

        .addRow ha-icon {
          color: var(--secondary-text-color);
          --mdc-icon-size: 26px;
        }

        .addButton {
          padding-right: 16px;
          cursor: pointer;
        }

        paper-checkbox {
          padding-left: 4px;
          padding-right: 20px;
          --paper-checkbox-label-spacing: 0px;
        }

        paper-input {
          flex-grow: 1;
        }

        .checked {
          margin: 12px 0;
          justify-content: space-between;
        }

        .checked span {
          color: var(--primary-color);
        }

        .divider {
          height: 1px;
          background-color: var(--divider-color);
          margin: 10px 0;
        }

        .clearall {
          cursor: pointer;
        }
        :host {
          height: 100%;
        }
        app-toolbar paper-listbox {
          width: 150px;
        }
        app-toolbar paper-item {
          cursor: pointer;
        }
        .content {
          padding-bottom: 32px;
          max-width: 96%;
          margin: 0 auto;
        }
        paper-icon-item {
          border-top: 1px solid var(--divider-color);
        }
        paper-icon-item:first-child {
          border-top: 0;
        }
        paper-checkbox {
          padding: 11px;
        }
        paper-input {
          --paper-input-container-underline: {
            display: none;
          }
          --paper-input-container-underline-focus: {
            display: none;
          }
          position: relative;
          top: 1px;
        }
        .tip {
          padding: 24px;
          text-align: center;
          color: var(--secondary-text-color);
        }
        .AisTtsLang {
          display: flex;
        }
        .AisTtsSliders {
          display: flex;
          padding-top: 2em;
        }
        div.AisButtons {
          float: right;
          text-align: right;
        }
        div.ItemInfo {
          font-size: 12px;
        }
        span.ItemInfoLabel {
          margin-right: 6px;
          color: var(--primary-color);
        }
        ha-expansion-panel {
          width: 3em;
          height: 1em;
        }
        ha-expansion-panel[expanded] {
          width: 50%;
          height: 10em;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-panel-aistts": HaPanelAisTts;
  }
}
