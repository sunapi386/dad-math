/* Shared: theme toggle + KaTeX rendering */
(function () {
  // ---- theme ----
  var KEY = "dadmath-theme";
  var root = document.documentElement;
  try {
    var saved = localStorage.getItem(KEY);
    if (saved) root.setAttribute("data-theme", saved);
  } catch (e) {}

  window.toggleTheme = function () {
    var cur = root.getAttribute("data-theme");
    if (!cur) {
      cur = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    var next = cur === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
    var b = document.getElementById("themeBtn");
    if (b) b.textContent = next === "dark" ? "☀︎ Light" : "☾ Dark";
  };

  // ---- KaTeX auto-render once loaded ----
  window.renderMath = function () {
    if (window.renderMathInElement) {
      renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false
      });
    }
  };
  if (document.readyState !== "loading") window.renderMath();
  else document.addEventListener("DOMContentLoaded", window.renderMath);
})();
