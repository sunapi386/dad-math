/* Dad-Math feedback tab: a little 💬 tab on the left edge of every page that
   opens a slide-in drawer. Kids can type OR press the big mic and just talk
   (Web Speech API voice-to-text). Submissions POST to /feedback/submit and land
   in a SQLite DB on the server. Self-contained: injects its own styles so no
   page needs a css version bump. Fails quietly where there's no backend
   (e.g. the GitHub Pages mirror) or no mic (e.g. Firefox). */
(function () {
  if (window.__dadFeedback) return;
  window.__dadFeedback = true;

  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  // ---- styles (reuse the site's theme tokens so light/dark just works) ----
  var css = document.createElement("style");
  css.textContent =
    "#fbk-tab{position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:9000;" +
    "writing-mode:vertical-rl;transform-origin:left center;transform:translateY(-50%) rotate(180deg);" +
    "background:var(--primary,#5b4bd6);color:#fff;border:0;cursor:pointer;font:600 14px/1 var(--sans,sans-serif);" +
    "letter-spacing:.02em;padding:14px 8px;border-radius:0 0 12px 12px;box-shadow:var(--shadow,0 6px 24px rgba(0,0,0,.2));" +
    "display:flex;align-items:center;gap:8px}" +
    "#fbk-tab:hover{filter:brightness(1.08)}" +
    "#fbk-scrim{position:fixed;inset:0;background:rgba(10,8,20,.45);z-index:9001;opacity:0;pointer-events:none;transition:opacity .2s}" +
    "#fbk-scrim.open{opacity:1;pointer-events:auto}" +
    "#fbk-drawer{position:fixed;left:0;top:0;height:100%;width:min(380px,92vw);z-index:9002;" +
    "background:var(--panel,#fff);color:var(--ink,#222);box-shadow:var(--shadow,0 10px 34px rgba(0,0,0,.3));" +
    "transform:translateX(-100%);transition:transform .24s ease;display:flex;flex-direction:column;" +
    "padding:22px 20px;overflow-y:auto;font-family:var(--sans,sans-serif)}" +
    "#fbk-drawer.open{transform:translateX(0)}" +
    "#fbk-drawer h2{margin:0 0 4px;font-size:1.4rem}" +
    "#fbk-drawer .lede{color:var(--ink-soft,#666);margin:0 0 16px;font-size:.95rem}" +
    "#fbk-close{position:absolute;top:14px;right:14px;background:none;border:0;font-size:1.5rem;line-height:1;" +
    "cursor:pointer;color:var(--ink-faint,#999)}" +
    "#fbk-text{width:100%;min-height:130px;resize:vertical;border:2px solid var(--line,#ddd);border-radius:12px;" +
    "background:var(--bg,#faf9f5);color:var(--ink,#222);font:1.05rem/1.45 var(--sans,sans-serif);padding:12px}" +
    "#fbk-text:focus{outline:none;border-color:var(--primary,#5b4bd6)}" +
    "#fbk-mic{margin-top:12px;width:100%;display:flex;align-items:center;justify-content:center;gap:10px;" +
    "background:var(--primary-soft,#ece9fb);color:var(--primary,#5b4bd6);border:2px solid transparent;" +
    "border-radius:12px;padding:14px;font:600 1.05rem var(--sans,sans-serif);cursor:pointer}" +
    "#fbk-mic .dot{font-size:1.4rem}" +
    "#fbk-mic.live{background:#e0483f;color:#fff;animation:fbk-pulse 1.1s infinite}" +
    "@keyframes fbk-pulse{0%,100%{box-shadow:0 0 0 0 rgba(224,72,63,.5)}50%{box-shadow:0 0 0 10px rgba(224,72,63,0)}}" +
    "#fbk-send{margin-top:14px;width:100%;background:var(--good,#2f9e6f);color:#fff;border:0;border-radius:12px;" +
    "padding:15px;font:700 1.1rem var(--sans,sans-serif);cursor:pointer}" +
    "#fbk-send:disabled{opacity:.5;cursor:default}" +
    "#fbk-status{margin-top:12px;min-height:1.4em;font-size:.95rem;color:var(--ink-soft,#666)}" +
    "#fbk-status.ok{color:var(--good,#2f9e6f);font-weight:600}" +
    "#fbk-status.err{color:#e0483f}";
  document.head.appendChild(css);

  // ---- markup ----
  var tab = document.createElement("button");
  tab.id = "fbk-tab";
  tab.setAttribute("aria-label", "Give feedback");
  tab.innerHTML = "💬 Feedback";

  var scrim = document.createElement("div");
  scrim.id = "fbk-scrim";

  var drawer = document.createElement("div");
  drawer.id = "fbk-drawer";
  drawer.setAttribute("role", "dialog");
  drawer.setAttribute("aria-label", "Feedback");
  drawer.innerHTML =
    '<button id="fbk-close" aria-label="Close">×</button>' +
    "<h2>💬 Tell us what you think!</h2>" +
    '<p class="lede">Was something confusing? Something fun? Type it below — ' +
    "or press the mic and just talk.</p>" +
    '<textarea id="fbk-text" placeholder="I liked… / I was confused by… / It would be cool if…"></textarea>' +
    '<button id="fbk-mic" type="button"><span class="dot">🎤</span><span class="lbl">Press to talk</span></button>' +
    '<button id="fbk-send">Send it 🚀</button>' +
    '<div id="fbk-status"></div>';

  function mount() {
    document.body.appendChild(tab);
    document.body.appendChild(scrim);
    document.body.appendChild(drawer);
    wire();
  }

  function wire() {
    var text = drawer.querySelector("#fbk-text");
    var mic = drawer.querySelector("#fbk-mic");
    var micLbl = mic.querySelector(".lbl");
    var send = drawer.querySelector("#fbk-send");
    var status = drawer.querySelector("#fbk-status");

    function open() {
      scrim.classList.add("open");
      drawer.classList.add("open");
      setTimeout(function () { text.focus(); }, 250);
    }
    function close() {
      scrim.classList.remove("open");
      drawer.classList.remove("open");
      stopRec();
    }
    tab.addEventListener("click", open);
    scrim.addEventListener("click", close);
    drawer.querySelector("#fbk-close").addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("open")) close();
    });

    // ---- voice to text ----
    var rec = null, listening = false;
    if (!SR) {
      mic.style.display = "none"; // Firefox & friends: no Web Speech
    } else {
      mic.addEventListener("click", function () {
        if (listening) { stopRec(); return; }
        rec = new SR();
        rec.lang = "en-US";
        rec.interimResults = true;
        rec.continuous = true;
        var base = text.value ? text.value.replace(/\s*$/, "") + " " : "";
        rec.onresult = function (ev) {
          var out = "";
          for (var i = ev.resultIndex; i < ev.results.length; i++) {
            out += ev.results[i][0].transcript;
          }
          text.value = base + out;
        };
        rec.onend = function () { stopRec(); };
        rec.onerror = function (ev) {
          stopRec();
          if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
            status.className = "err";
            status.textContent = "🎤 Mic blocked — allow microphone access to talk, or just type.";
          }
        };
        try {
          rec.start();
          listening = true;
          mic.classList.add("live");
          micLbl.textContent = "Listening… tap to stop";
          status.className = ""; status.textContent = "";
        } catch (e) { stopRec(); }
      });
    }
    function stopRec() {
      listening = false;
      if (rec) { try { rec.stop(); } catch (e) {} rec = null; }
      mic.classList.remove("live");
      micLbl.textContent = "Press to talk";
    }
    window.__fbkStopRec = stopRec;

    // ---- send ----
    send.addEventListener("click", function () {
      var body = text.value.trim();
      if (!body) {
        status.className = "err";
        status.textContent = "Type or say something first 🙂";
        text.focus();
        return;
      }
      stopRec();
      send.disabled = true;
      status.className = "";
      status.textContent = "Sending…";
      fetch("/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: body, page: location.pathname })
      })
        .then(function (r) {
          if (r.ok) {
            status.className = "ok";
            status.textContent = "Thank you! 🌟 We read every one.";
            text.value = "";
            setTimeout(close, 1400);
          } else if (r.status === 429) {
            status.className = "err";
            status.textContent = "One sec — you just sent one. Try again in a moment.";
          } else {
            throw new Error("bad status " + r.status);
          }
        })
        .catch(function () {
          status.className = "err";
          status.textContent = "Hmm, couldn't send that. Check your connection and try again.";
        })
        .finally(function () { send.disabled = false; });
    });
  }

  // close/stop the mic globally if drawer wired but stopRec called elsewhere
  function stopRec() { if (window.__fbkStopRec) window.__fbkStopRec(); }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
