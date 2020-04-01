import "@polymer/app-layout/app-header/app-header";
import "@polymer/app-layout/app-toolbar/app-toolbar";
import { html } from "@polymer/polymer/lib/utils/html-tag";
import { PolymerElement } from "@polymer/polymer/polymer-element";

import "../../../layouts/hass-subpage";
import "../../../resources/ha-style";

import "./ha-config-ais-dom-navigation";
import "../../../components/ha-switch";
import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
/*
 *
 */
class HaConfigAisDomControlLogs extends PolymerElement {
  static get template() {
    return html`
      <style include="iron-flex ha-style">
        .content {
          padding-bottom: 32px;
        }

        .border {
          margin: 32px auto 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.12);
          max-width: 1040px;
        }
        .narrow .border {
          max-width: 640px;
        }
        .card-actions {
          display: flex;
        }
        ha-card > div#card-icon {
          margin: -4px 0;
          width: 3em;
          height: 3em;
          position: absolute;
          top: 1em;
          right: 1em;
          border-radius: 25px;
        }
        .center-container {
          @apply --layout-vertical;
          @apply --layout-center-center;
          height: 70px;
        }
        .config-invalid .text {
          color: var(--google-red-500);
          font-weight: 500;
        }

        @keyframes pulse {
          0% {
            background-color: var(--card-background-color);
          }
          100% {
            background-color: var(--primary-color);
          }
        }
        @keyframes pulseRed {
          0% {
            background-color: var(--card-background-color);
          }
          100% {
            background-color: var(--material-error-color);
          }
        }
      </style>

      <hass-subpage header="Konfiguracja bramki AIS dom">
        <div class$="[[computeClasses(isWide)]]">
          <ha-config-section is-wide="[[isWide]]">
            <span slot="header">Ustawienie zapisu logów systemu</span>
            <span slot="introduction"
              >Tu możesz skonfigurować zapis logów do pliku na wymiennym
              dysku</span
            >
            <ha-card header="Zapis logów systemu do pliku">
              <div id="card-icon" style$="[[logIconAnimationStyle]]">
                <paper-icon-button icon="mdi:record-rec"></paper-icon-button>
              </div>
              <div class="card-content">
                Żeby włączyć logowanie w systemie Asystent domowy, wystarczy
                wybrać lokalizację na dysku wymiennym, w której będzie
                zapisywany plik z rejestrem działań w systemie. Dodatkowo można
                też określić poziom szczegółowości logowania. <br /><br />
                Wybór dysku do zapisu logów systemu: <br />
                <paper-icon-button
                  icon="mdi:usb-flash-drive"
                ></paper-icon-button>
                <ha-paper-dropdown-menu
                  label-float="Wybrany dysk"
                  dynamic-align=""
                  label="Dyski wymienne"
                >
                  <paper-listbox
                    slot="dropdown-content"
                    selected="[[logDrive]]"
                    on-selected-changed="logDriveChanged"
                    attr-for-selected="item-name"
                  >
                    <template
                      is="dom-repeat"
                      items="[[usbDrives.attributes.options]]"
                    >
                      <paper-item item-name$="[[item]]">[[item]]</paper-item>
                    </template>
                  </paper-listbox>
                </ha-paper-dropdown-menu>
              </div>
              <div class="card-content">
                Wybór poziomu logowania: <br />
                <paper-icon-button icon="mdi:bug-check"></paper-icon-button>
                <ha-paper-dropdown-menu
                  label-float="Poziom logowania"
                  dynamic-align=""
                  label="Poziomy logowania"
                >
                  <paper-listbox
                    slot="dropdown-content"
                    selected="[[logLevel]]"
                    on-selected-changed="logLevelChanged"
                    attr-for-selected="item-name"
                  >
                    <paper-item item-name="critical">critical</paper-item>
                    <paper-item item-name="fatal">fatal</paper-item>
                    <paper-item item-name="error">error</paper-item>
                    <paper-item item-name="warning">warning</paper-item>
                    <paper-item item-name="warn">warn</paper-item>
                    <paper-item item-name="info">info</paper-item>
                    <paper-item item-name="debug">debug</paper-item>
                  </paper-listbox>
                </ha-paper-dropdown-menu>
                <br />
                <div class="config-invalid">
                  <span class="text">
                    [[logError]]
                  </span>
                </div>
              </div>
              <div class="card-content">
                [[logModeInfo]]
              </div>
            </ha-card>
          </ha-config-section>

          <ha-config-section is-wide="[[isWide]]">
            <span slot="header">Ustawienia zapisu zdarzeń systemu</span>
            <span slot="introduction">
              Tu możesz skonfigurować zapis zdarzeń do bazy danych na dysku
              wymiennym lub do zdalnego serwera bazodanowego
            </span>
            <ha-card header="Zapis zdarzeń do bazy danych">
              <div id="card-icon" style$="[[dbIconAnimationStyle]]">
                <paper-icon-button icon="mdi:database"></paper-icon-button>
              </div>
              <div class="card-content">
                Wybierz silnik bazodanowy, który chcesz użyć do rejestracji
                zdarzeń.<br /><br />Najprostszy wybór to baza SQLite, która nie
                wymaga konfiguracji i może rejestrować dane w pamięci - taka
                baza jest automatycznie używana, gdy rejestracja zdarzeń
                włączana jest przez integrację (np. Historia lub Dziennik).
                <br /><br />Gdy system generuje więcej zdarzeń lub gdy chcesz
                mieć dostęp do historii, to zalecamy zapisywać zdarzenia na
                zewnętrznym dysku lub w zdalnej bazie danych. <br /><br />
                Wybór silnika bazy danych:
                <br />
                <paper-icon-button icon="mdi:database"></paper-icon-button>
                <ha-paper-dropdown-menu
                  label-float="Silnik bazy danych"
                  dynamic-align=""
                  label="Silnik bazy danych"
                >
                  <paper-listbox
                    slot="dropdown-content"
                    selected="[[dbEngine]]"
                    on-selected-changed="dbEngineChanged"
                    attr-for-selected="item-name"
                  >
                    <paper-item item-name="-">-</paper-item>
                    <paper-item item-name="SQLite (memory)"
                      >SQLite (memory)</paper-item
                    >
                    <paper-item item-name="SQLite (file)"
                      >SQLite (file)</paper-item
                    >
                    <paper-item item-name="MariaDB">MariaDB</paper-item>
                    <paper-item item-name="MySQL">MySQL</paper-item>
                    <paper-item item-name="PostgreSQL)">PostgreSQL</paper-item>
                  </paper-listbox>
                </ha-paper-dropdown-menu>
              </div>
              <div class="card-content" style$="[[dbFileDisplayStyle]]">
                Wybór dysku do zapisu bazy danych: <br />
                <paper-icon-button
                  icon="mdi:usb-flash-drive"
                ></paper-icon-button>
                <ha-paper-dropdown-menu
                  label-float="Wybrany dysk"
                  dynamic-align=""
                  label="Dyski wymienne"
                >
                  <paper-listbox
                    slot="dropdown-content"
                    selected="[[dbDrive]]"
                    on-selected-changed="dbDriveChanged"
                    attr-for-selected="item-name"
                  >
                    <template
                      is="dom-repeat"
                      items="[[usbDrives.attributes.options]]"
                    >
                      <paper-item item-name$="[[item]]">[[item]]</paper-item>
                    </template>
                  </paper-listbox>
                </ha-paper-dropdown-menu>
              </div>
              <div class="card-content" style$="[[dbConectionDisplayStyle]]">
                Parametry połączenia z bazą danych: <br />
                <paper-input
                  placeholder="Użytkownik"
                  type="text"
                  id="db_user"
                  value="[[dbUser]]"
                  on-change="_computeDbUrl"
                >
                  <iron-icon icon="mdi:account" slot="suffix"></iron-icon>
                </paper-input>
                <paper-input
                  placeholder="Hasło"
                  no-label-float=""
                  type="password"
                  id="db_password"
                  value="[[dbPassword]]"
                  on-change="_computeDbUrl"
                  ><iron-icon icon="mdi:lastpass" slot="suffix"></iron-icon
                ></paper-input>
                <paper-input
                  placeholder="IP Serwera DB"
                  no-label-float=""
                  type="text"
                  id="db_server_ip"
                  value="[[dbServerIp]]"
                  on-change="_computeDbUrl"
                  ><iron-icon icon="mdi:ip-network" slot="suffix"></iron-icon
                ></paper-input>
                <paper-input
                  placeholder="Nazwa bazy"
                  no-label-float=""
                  type="text"
                  id="db_server_name"
                  value="[[dbServerName]]"
                  on-change="_computeDbUrl"
                  ><iron-icon
                    icon="mdi:database-check"
                    slot="suffix"
                  ></iron-icon
                ></paper-input>
              </div>
              <div class="card-content">
                [[dbUrl]]
                <br /><br />
                <div class="center-container">
                  <template is="dom-if" if="[[dbConnectionValidating]]">
                    <paper-spinner active=""></paper-spinner>
                  </template>
                  <template is="dom-if" if="[[!dbConnectionValidating]]">
                    <div class="config-invalid">
                      <span class="text">
                        [[validationError]]
                      </span>
                    </div>
                    <ha-call-service-button
                      class="warning"
                      hass="[[hass]]"
                      domain="ais_files"
                      service="check_db_connection"
                      service-data="[[_addAisDbConnectionData()]]"
                      >[[dbConnectionInfoButton]]
                    </ha-call-service-button>
                  </template>
                </div>
                <div>
                  * po zmianie połączenia z bazą wymagany jest restart serwera
                  Home Assistant.
                </div>
              </div>
            </ha-card>
          </ha-config-section>
        </div>
      </hass-subpage>
    `;
  }

  static get properties() {
    return {
      hass: Object,
      isWide: Boolean,
      logLevel: {
        type: String,
        value: "info",
      },
      logDrive: {
        type: String,
        value: "-",
      },
      logError: {
        type: String,
        computed: "_computeLogsSettings(hass)",
      },
      logIconAnimationStyle: String,
      dbIconAnimationStyle: String,
      usbDrives: {
        type: Object,
        computed: "_computeUsbDrives(hass)",
      },
      dbDrives: {
        type: Object,
        computed: "_computeDbDrives(hass)",
      },
      dbConnectionValidating: {
        type: Boolean,
        value: false,
      },
      dbConnectionInfoButton: {
        type: String,
        computed: "_computeDbConnectionSettings(hass)",
      },
      validationError: String,
      logModeInfo: String,
      dbUrl: String,
      dbConectionDisplayStyle: String,
      dbFileDisplayStyle: String,
      dbDrive: String,
      dbEngine: String,
      dbUser: String,
      dbPassword: String,
      dbServerIp: String,
      dbServerName: String,
    };
  }

  ready() {
    super.ready();
    this.hass.callService("ais_files", "get_db_log_settings_info");
    this._computeLogsSettings(this.hass);
  }

  // LOGS
  computeClasses(isWide) {
    return isWide ? "content" : "content narrow";
  }

  _computeUsbDrives(hass) {
    return hass.states["input_select.ais_usb_flash_drives"];
  }

  _computeLogsSettings(hass) {
    var connectionInfo = hass.states["sensor.ais_logs_settings_info"];
    var connInfoAttr = connectionInfo.attributes;
    this.logDrive = connInfoAttr.logDrive;
    this.logLevel = connInfoAttr.logLevel;
    if (connectionInfo.state > 0) {
      if (this.logLevel === "debug") {
        this.logIconAnimationStyle = "animation: pulseRed 2s infinite;";
      } else if (this.logLevel === "info") {
        this.logIconAnimationStyle = "animation: pulseRed 4s infinite;";
      } else if (this.logLevel === "info") {
        this.logIconAnimationStyle = "animation: pulse 5s infinite;";
      } else if (this.logLevel === "warn") {
        this.logIconAnimationStyle = "animation: pulse 6s infinite;";
      } else if (this.logLevel === "warning") {
        this.logIconAnimationStyle = "animation: pulse 7s infinite;";
      } else if (this.logLevel === "error") {
        this.logIconAnimationStyle = "animation: pulse 8s infinite;";
      } else if (this.logLevel === "fatal") {
        this.logIconAnimationStyle = "animation: pulse 9s infinite;";
      } else if (this.logLevel === "critical") {
        this.logIconAnimationStyle = "animation: pulse 10s infinite;";
      }
    } else {
      this.logIconAnimationStyle = "";
    }
    var logError = "";
    if (connInfoAttr.logError) {
      logError = connInfoAttr.logError;
    }
    if (this.logLevel === "debug" && connectionInfo.state) {
      logError +=
        " Logowanie w trybie debug generuje duże ilości logów i obciąża system. Używaj go tylko na czas diagnozowania problemu. ";
    }

    return logError;
  }

  logDriveChanged(ev) {
    this.logDrive = ev.detail.value;
    if (this.logDrive !== "-") {
      this.logModeInfo =
        "Logowanie do pliku /dyski-wymienne/" + this.logDrive + "/ais.log";
    } else {
      this.logModeInfo = "Logowanie wyłączone ";
    }

    this.hass.callService("ais_files", "change_logger_settings", {
      log_drive: this.logDrive,
      log_level: this.logLevel,
    });
  }

  logLevelChanged(ev) {
    this.logLevel = ev.detail.value;
    this.logModeInfo = "Poziom logów: " + this.logLevel;
    this.hass.callService("ais_files", "change_logger_settings", {
      log_drive: this.logDrive,
      log_level: this.logLevel,
    });
  }

  // DB recorder
  _computeDbConnectionSettings(hass) {
    var connectionInfo = hass.states["sensor.ais_db_connection_info"];
    var connInfoAttr = connectionInfo.attributes;
    this.validationError = connInfoAttr.errorInfo;
    this.dbEngine = connInfoAttr.dbEngine;
    if (!this.dbEngine) {
      this.dbEngine = "-";
    }
    if (!this.dbDrive) {
      this.dbDrive = connInfoAttr.dbDrive;
    }
    this.dbUrl = connInfoAttr.dbUrl;
    this.dbPassword = connInfoAttr.dbPassword;
    this.dbUser = connInfoAttr.dbUser;
    this.dbServerIp = connInfoAttr.dbServerIp;
    this.dbServerName = connInfoAttr.dbServerName;

    var buttonName = "";
    if (connectionInfo.state === "no_db_url_saved") {
      buttonName = "Sprawdź połączenie";
      this.dbIconAnimationStyle = "";
    } else if (connectionInfo.state === "db_url_saved") {
      buttonName = "Usuń polączenie";
      this.dbIconAnimationStyle = "animation: pulse 6s infinite;";
    } else if (connectionInfo.state === "db_url_not_valid") {
      buttonName = "Sprawdź połączenie";
      this.dbIconAnimationStyle = "animation: pulseRed 3s infinite;";
    } else if (connectionInfo.state === "db_url_valid") {
      buttonName = "Zapisz połączenie";
      this.dbIconAnimationStyle = "animation: pulse 4s infinite;";
    }

    this.dbConnectionValidating = false;
    this._doComputeDbUrl(false);
    return buttonName;
  }

  _addAisDbConnectionData() {
    return {
      buttonClick: true,
    };
  }

  _computeDbDrives(hass) {
    const drives = hass.states["input_select.ais_usb_flash_drives"];
    return drives;
  }

  _doComputeDbUrl(getFromPage) {
    let dbUrl = "";
    if (this.dbEngine === "-") {
      this.dbConectionDisplayStyle = "display: none";
      this.dbFileDisplayStyle = "display: none";
      dbUrl = "";
    } else if (this.dbEngine === "SQLite (file)") {
      this.dbConectionDisplayStyle = "display: none";
      this.dbFileDisplayStyle = "";
      dbUrl =
        "sqlite://///data/data/pl.sviete.dom/files/home/dom/dyski-wymienne/" +
        this.dbDrive +
        "/ais.db";
    } else if (this.dbEngine === "SQLite (memory)") {
      this.dbConectionDisplayStyle = "display: none";
      this.dbFileDisplayStyle = "display: none";
      dbUrl = "sqlite:///:memory:";
    } else {
      this.dbFileDisplayStyle = "display: none";
      this.dbConectionDisplayStyle = "";
      if (getFromPage) {
        this.dbPassword = this.shadowRoot.getElementById("db_password").value;
        this.dbUser = this.shadowRoot.getElementById("db_user").value;
        this.dbServerIp = this.shadowRoot.getElementById("db_server_ip").value;
        this.dbServerName = this.shadowRoot.getElementById(
          "db_server_name"
        ).value;
      }
      var dbUserPass = "";
      if (this.dbUser || this.dbPassword) {
        dbUserPass = this.dbUser + ":" + this.dbPassword + "@";
      }
      if (this.dbEngine === "MariaDB") {
        dbUrl =
          "mysql+pymysql://" +
          dbUserPass +
          this.dbServerIp +
          "/" +
          this.dbServerName +
          "?charset=utf8mb4";
      } else if (this.dbEngine === "MySQL") {
        dbUrl =
          "mysql://" +
          dbUserPass +
          this.dbServerIp +
          "/" +
          this.dbServerName +
          "?charset=utf8mb4";
      } else if (this.dbEngine === "PostgreSQL") {
        dbUrl =
          "postgresql://" +
          dbUserPass +
          this.dbServerIp +
          "/" +
          this.dbServerName;
      }
    }

    this.dbUrl = dbUrl;
  }

  _computeDbUrl() {
    this._doComputeDbUrl(true);
    // set backend state
    this.hass.callService("ais_files", "check_db_connection", {
      buttonClick: false,
      dbEngine: this.dbEngine,
      dbDrive: this.dbDrive,
      dbUrl: this.dbUrl,
      dbPassword: this.dbPassword,
      dbUser: this.dbUser,
      dbServerIp: this.dbServerIp,
      dbServerName: this.dbServerName,
      errorInfo: "",
    });
  }

  dbDriveChanged(ev) {
    var newVal = ev.detail.value;
    this.dbDrive = newVal;
    this._computeDbUrl();
  }

  dbEngineChanged(ev) {
    var newVal = ev.detail.value;
    this.dbEngine = newVal;
    this._computeDbUrl();
  }
}

customElements.define(
  "ha-config-ais-dom-config-logs",
  HaConfigAisDomControlLogs
);
