import {
  Auth,
  createConnection,
  getAuth,
  subscribeConfig,
  genClientId,
} from "home-assistant-js-websocket";
import {
  customElement,
  html,
  property,
  internalProperty,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { HASSDomEvent } from "../common/dom/fire_event";
import { subscribeOne } from "../common/util/subscribe-one";
import { hassUrl, AuthUrlSearchParams } from "../data/auth";
import {
  fetchOnboardingOverview,
  OnboardingResponses,
  OnboardingStep,
  onboardIntegrationStep,
} from "../data/onboarding";
import { subscribeUser } from "../data/ws-user";
import { litLocalizeLiteMixin } from "../mixins/lit-localize-lite-mixin";
import { HassElement } from "../state/hass-element";
import { HomeAssistant } from "../types";
import { registerServiceWorker } from "../util/register-service-worker";
import "./onboarding-create-user";
import "./onboarding-ais_wifi";
import "./onboarding-loading";
import { extractSearchParamsObject } from "../common/url/search-params";

type OnboardingEvent =
  | {
      type: "user";
      result: OnboardingResponses["user"];
    }
  | {
      type: "core_config";
      result: OnboardingResponses["core_config"];
    }
  | {
      type: "integration";
    }
  | {
      type: "mob_integration";
      result: OnboardingResponses["mob_integration"];
    }
  | {
      type: "ais_restore_backup";
      result: OnboardingResponses["ais_restore_backup"];
    };

declare global {
  interface HASSDomEvents {
    "onboarding-step": OnboardingEvent;
  }

  interface GlobalEventHandlersEventMap {
    "onboarding-step": HASSDomEvent<OnboardingEvent>;
  }
}

@customElement("ha-onboarding")
class HaOnboarding extends litLocalizeLiteMixin(HassElement) {
  @property({ attribute: false }) public hass?: HomeAssistant;

  public translationFragment = "page-onboarding";

  @internalProperty() private _loading = false;

  @internalProperty() private _steps?: OnboardingStep[];

  protected render(): TemplateResult {
    const step = this._curStep()!;

    if (this._loading || !step) {
      return html` <onboarding-loading></onboarding-loading> `;
    }
    if (step.step === "user") {
      return html`
        <onboarding-create-user
          .localize=${this.localize}
          .language=${this.language}
        ></onboarding-create-user>
      `;
    }
    if (step.step === "ais_restore_backup") {
      return html`
        <onboarding-restore-backup
          .hass=${this.hass}
          .localize=${this.localize}
          .language=${this.language}
        ></onboarding-restore-backup>
      `;
    }
    if (step.step === "core_config") {
      return html`
        <onboarding-core-config
          .hass=${this.hass}
          .onboardingLocalize=${this.localize}
        ></onboarding-core-config>
      `;
    }
    if (step.step === "integration") {
      return html`
        <onboarding-integrations
          .hass=${this.hass}
          .onboardingLocalize=${this.localize}
        ></onboarding-integrations>
      `;
    }
    if (step.step === "mob_integration") {
      return html`
        <onboarding-mob-integrations
          .hass=${this.hass}
          .onboardingLocalize=${this.localize}
        ></onboarding-mob-integrations>
      `;
    }
    return html``;
  }

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    this._fetchOnboardingSteps();
    import(
      /* webpackChunkName: "onboarding-integrations" */ "./onboarding-integrations"
    );
    import(
      /* webpackChunkName: "onboarding-core-config" */ "./onboarding-core-config"
    );
    import(
      /* webpackChunkName: "onboarding-mob-integrations" */ "./onboarding-mob-integrations"
    );
    import(
      /* webpackChunkName: "onboarding-restore-backup" */ "./onboarding-restore-backup"
    );
    registerServiceWorker(this, false);
    this.addEventListener("onboarding-step", (ev) => this._handleStepDone(ev));
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    if (changedProps.has("language")) {
      document.querySelector("html")!.setAttribute("lang", this.language!);
    }
    if (changedProps.has("hass")) {
      this.hassChanged(
        this.hass!,
        changedProps.get("hass") as HomeAssistant | undefined
      );
    }
  }

  private _curStep() {
    return this._steps ? this._steps.find((stp) => !stp.done) : undefined;
  }

  private async _fetchOnboardingSteps() {
    try {
      const response = await (window.stepsPromise || fetchOnboardingOverview());

      if (response.status === 404) {
        // We don't load the component when onboarding is done
        document.location.assign("/");
        return;
      }

      const steps: OnboardingStep[] = await response.json();

      if (steps.every((step) => step.done)) {
        // Onboarding is done!
        document.location.assign("/");
        return;
      }

      if (steps[0].done) {
        // First step is already done, so we need to get auth somewhere else.
        const auth = await getAuth({
          hassUrl,
        });
        history.replaceState(null, "", location.pathname);
        await this._connectHass(auth);
      }

      this._steps = steps;
    } catch (err) {
      alert("Something went wrong loading onboarding, try refreshing");
    }
  }

  private async _handleStepDone(ev: HASSDomEvent<OnboardingEvent>) {
    const stepResult = ev.detail;
    this._steps = this._steps!.map((step) =>
      step.step === stepResult.type ? { ...step, done: true } : step
    );

    if (stepResult.type === "user") {
      const result = stepResult.result as OnboardingResponses["user"];
      this._loading = true;
      try {
        const auth = await getAuth({
          hassUrl,
          authCode: result.auth_code,
        });
        await this._connectHass(auth);
      } catch (err) {
        alert("Ah snap, something went wrong!");
        location.reload();
      } finally {
        this._loading = false;
      }
    } else if (stepResult.type === "ais_restore_backup") {
      // We do nothing
    } else if (stepResult.type === "core_config") {
      // We do nothing
    } else if (stepResult.type === "integration") {
      // We do nothing
      this._loading = false;
    } else if (stepResult.type === "mob_integration") {
      this._loading = true;

      // Determine if oauth redirect has been provided
      const externalAuthParams = extractSearchParamsObject() as AuthUrlSearchParams;
      const authParams =
        externalAuthParams.client_id && externalAuthParams.redirect_uri
          ? externalAuthParams
          : {
              client_id: genClientId(),
              redirect_uri: `${location.protocol}//${location.host}/?auth_callback=1`,
              state: btoa(
                JSON.stringify({
                  hassUrl: `${location.protocol}//${location.host}`,
                  clientId: genClientId(),
                })
              ),
            };

      let result: OnboardingResponses["integration"];

      try {
        result = await onboardIntegrationStep(this.hass!, {
          client_id: authParams.client_id!,
          redirect_uri: authParams.redirect_uri!,
        });
      } catch (err) {
        this.hass!.connection.close();
        await this.hass!.auth.revoke();

        alert(`Unable to finish onboarding: ${err.message}`);

        document.location.assign("/?");
        return;
      }

      // If we don't close the connection manually, the connection will be
      // closed when we navigate away from the page. Firefox allows JS to
      // continue to execute, and so HAWS will automatically reconnect once
      // the connection is closed. However, since we revoke our token below,
      // HAWS will reload the page, since that will trigger the auth flow.
      // In Firefox, triggering a reload will overrule the navigation that
      // was in progress.
      this.hass!.connection.close();

      // Revoke current auth token.
      await this.hass!.auth.revoke();

      // Build up the url to redirect to
      let redirectUrl = authParams.redirect_uri!;
      redirectUrl +=
        (redirectUrl.includes("?") ? "&" : "?") +
        `code=${encodeURIComponent(result.auth_code)}`;

      if (authParams.state) {
        redirectUrl += `&state=${encodeURIComponent(authParams.state)}`;
      }

      document.location.assign(redirectUrl);
    }
  }

  private async _connectHass(auth: Auth) {
    const conn = await createConnection({ auth });
    // Make sure config and user info is loaded before we initialize.
    // It is needed for the core config step.
    await Promise.all([
      subscribeOne(conn, subscribeConfig),
      subscribeOne(conn, subscribeUser),
    ]);
    this.initializeHass(auth, conn);
    // Load config strings for integrations
    (this as any)._loadFragmentTranslations(this.hass!.language, "config");
    // Make sure hass is initialized + the config/user callbacks have called.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-onboarding": HaOnboarding;
  }
}
