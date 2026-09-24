(function () {
  "use strict";
  var cache = new Map();
  var statusCache = null;
  var statusAt = 0;
  var activeAudio = null;
  var activeObjectUrl = null;
  var activeTimer = null;
  var STATUS_TTL = 30000;
  var TTS_MODEL = "gpt-4o-mini-tts-2025-12-15";
  var TTS_PROFILE = "teacher-v1";
  var STATIC_AUDIO_BASE = "./audio/tts/";

  function endpoint() { return window.LANGUAGE_STUDIO_TTS_ENDPOINT || "/api/tts"; }
  function statusEndpoint() { return window.LANGUAGE_STUDIO_TTS_STATUS_ENDPOINT || (endpoint() + "/status"); }
  function detectLanguage(text) { return /[\u3040-\u30ff\u3400-\u9fff]/.test(String(text || "")) ? "ja-JP" : "en-US"; }
  function voiceFor(language) { return /^ja/i.test(language || "") ? "cedar" : "marin"; }

  async function sha256(text) {
    if (!window.crypto || !window.crypto.subtle) return null;
    var bytes = new TextEncoder().encode(String(text));
    var digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.prototype.map.call(new Uint8Array(digest), function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  async function staticAudioUrl(text, language, voice, pace) {
    var raw = [TTS_MODEL, TTS_PROFILE, voice, language, pace, String(text)].join("|");
    var hash = await sha256(raw);
    if (!hash) return null;
    return new URL(STATIC_AUDIO_BASE + hash + ".mp3", document.baseURI).toString();
  }

  async function tryStaticAudio(text, language, voice, pace) {
    var url = await staticAudioUrl(text, language, voice, pace);
    if (!url) return null;
    try {
      var response = await fetch(url, { method:"GET", cache:"force-cache" });
      if (!response.ok) return null;
      var blob = await response.blob();
      if (!blob.size) return null;
      return blob;
    } catch (e) {
      return null;
    }
  }
  function paceName(rate) { var r = Number(rate) || 0.88; return r <= 0.72 ? "slow" : (r >= 0.98 ? "natural" : "medium"); }

  function clearHighlight(el) {
    if (!el) return;
    Array.prototype.forEach.call(el.querySelectorAll(".word-token"), function (node) { node.classList.remove("speaking"); });
  }

  function updateHighlight(el, text, currentTime, duration) {
    if (!el || !duration || !isFinite(duration)) return;
    var tokens = Array.prototype.slice.call(el.querySelectorAll(".word-token"));
    if (!tokens.length) return;
    var ratio = Math.max(0, Math.min(0.999, currentTime / duration));
    var charIndex = Math.floor(ratio * Math.max(1, String(text).length));
    var active = null;
    for (var i = 0; i < tokens.length; i++) {
      var start = Number(tokens[i].dataset.start || 0);
      var end = Number(tokens[i].dataset.end || (start + tokens[i].textContent.length));
      if (charIndex >= start && charIndex < end) { active = tokens[i]; break; }
    }
    if (!active) active = tokens[Math.min(tokens.length - 1, Math.floor(ratio * tokens.length))];
    tokens.forEach(function (token) { token.classList.toggle("speaking", token === active); });
  }

  function cleanupAudio() {
    if (activeTimer) { clearInterval(activeTimer); activeTimer = null; }
    if (activeAudio) { try { activeAudio.pause(); activeAudio.src = ""; } catch (e) {} activeAudio = null; }
    if (activeObjectUrl) { URL.revokeObjectURL(activeObjectUrl); activeObjectUrl = null; }
  }

  async function status(force) {
    var now = Date.now();
    if (!force && statusCache && (now - statusAt) < STATUS_TTL) return statusCache;
    try {
      var response = await fetch(statusEndpoint(), { method:"GET", headers:{"Accept":"application/json"}, cache:"no-store" });
      if (!response.ok) throw new Error("AI TTS status unavailable");
      statusCache = await response.json();
    } catch (e) {
      statusCache = { enabled:false, provider:"browser", reason:"endpoint-unavailable" };
    }
    statusAt = now;
    return statusCache;
  }

  async function getAudioBlob(text, options) {
    options = options || {};
    var language = options.language || detectLanguage(text);
    var voice = options.voice || voiceFor(language);
    var pace = paceName(options.rate);
    var key = JSON.stringify([TTS_MODEL, TTS_PROFILE, text, language, voice, pace]);

    if (cache.has(key)) return cache.get(key);

    // 1) Shared static cache: works on PC, phone and any HTTPS static host.
    var staticBlob = await tryStaticAudio(text, language, voice, pace);
    if (staticBlob) {
      if (cache.size > 120) cache.clear();
      cache.set(key, staticBlob);
      return staticBlob;
    }

    // 2) Dynamic backend: only used when the shared cache does not exist.
    var response = await fetch(endpoint(), {
      method:"POST",
      headers:{"Content-Type":"application/json","Accept":"audio/mpeg"},
      body:JSON.stringify({
        input:String(text),
        language:language,
        voice:voice,
        pace:pace,
        model:TTS_MODEL,
        profile:TTS_PROFILE
      })
    });

    if (!response.ok) {
      var message = "AI voice request failed";
      try { var data = await response.json(); if (data && data.error) message = data.error; } catch (e) {}
      throw new Error(message);
    }

    var blob = await response.blob();
    if (!blob.size) throw new Error("AI voice returned empty audio");
    if (cache.size > 120) cache.clear();
    cache.set(key, blob);
    return blob;
  }

  async function speak(text, options) {
    options = options || {};
    cleanupAudio();
    var blob = await getAudioBlob(text, options);
    var url = URL.createObjectURL(blob);
    activeObjectUrl = url;
    var audio = new Audio(url);
    activeAudio = audio;
    var highlightEl = options.highlightEl || null;
    return new Promise(function (resolve, reject) {
      function finish() {
        clearHighlight(highlightEl);
        if (activeTimer) { clearInterval(activeTimer); activeTimer = null; }
        if (activeAudio === audio) activeAudio = null;
        if (activeObjectUrl === url) { URL.revokeObjectURL(url); activeObjectUrl = null; }
        resolve();
      }
      audio.addEventListener("loadedmetadata", function () {
        if (highlightEl && isFinite(audio.duration) && audio.duration > 0) {
          activeTimer = setInterval(function () {
            if (activeAudio === audio) updateHighlight(highlightEl, text, audio.currentTime, audio.duration);
          }, 70);
        }
      }, { once:true });
      audio.addEventListener("ended", finish, { once:true });
      audio.addEventListener("error", function () { clearHighlight(highlightEl); reject(new Error("Could not play AI audio")); }, { once:true });
      audio.play().catch(reject);
    });
  }

  function stop() {
    cleanupAudio();
    Array.prototype.forEach.call(document.querySelectorAll(".word-token.speaking"), function (el) { el.classList.remove("speaking"); });
  }

  window.AITTS = {
    status:status,
    speak:speak,
    stop:stop,
    detectLanguage:detectLanguage,
    voiceFor:voiceFor,
    model:TTS_MODEL,
    profile:TTS_PROFILE,
    staticAudioUrl:staticAudioUrl,
    clearStatusCache:function () { statusCache = null; statusAt = 0; }
  };
}());
