// TODO  https://www.chromestatus.com/feature/5687444770914304
let hass = document.querySelector("home-assistant").hass;
hass.connection.subscribeEvents((event) => {
  if (
    event.data.domain === "ais_ai_service" &&
    event.data.service === "say_it"
  ) {
    if ("speechSynthesis" in window) {
      var speech = new SpeechSynthesisUtterance(event.data.service_data.text);
      speech.lang = "pl-PL";
      window.speechSynthesis.speak(speech);
    }
  }
}, "call_service");
