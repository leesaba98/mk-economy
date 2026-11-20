/* ============================================================
 * 매경 시황·세계경제 — 화면 렌더링 (app.js)
 * 데이터는 app-data.js 의 window.MK_DATA 하나만 고치면 반영됩니다.
 * ============================================================ */
(function () {
  "use strict";

  var D = window.MK_DATA || {};
  var $ = function (id) { return document.getElementById(id); };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* ---------- header / footer ---------- */
  var meta = D.meta || {};
  $("stamp").textContent = meta.updatedAt || "—";
  $("footBasis").textContent = "데이터 기준: " + (meta.basis || "—");
  $("footNote").textContent = meta.note || "";

  /* ---------- 오늘 한눈에 ---------- */
  var sum = $("summary");
  if (Array.isArray(D.summary) && D.summary.length) {
    sum.innerHTML = D.summary.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
  } else {
    sum.innerHTML = "<li>요약 데이터가 없습니다.</li>";
  }

  var mk = $("markets");
  if (Array.isArray(D.markets)) {
    mk.innerHTML = D.markets.map(function (m) {
      var dir = m.dir === "up" ? "up" : "down";
      var arrow = dir === "up" ? "▲ " : "▼ ";
      return '<div class="mcard ' + dir + '">' +
        '<div class="n">' + esc(m.name) + "<span>" + esc(m.date || "") + "</span></div>" +
        '<div class="v">' + esc(m.val) + "</div>" +
        '<div class="c">' + arrow + esc(m.chg) + "</div>" +
        '<div class="m">' + esc(m.note || "") + "</div>" +
        "</div>";
    }).join("");
  }

  /* ---------- 기사 목록 ---------- */
  function renderArticles(listEl, arr) {
    if (!listEl) return;
    if (!Array.isArray(arr) || !arr.length) {
      listEl.innerHTML = '<div class="card empty">오늘 올라온 기사가 없습니다.</div>';
      return;
    }
    listEl.innerHTML = arr.map(function (a) {
      var points = (a.points || []).map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("");
      return '<article class="card art">' +
        '<div class="meta"><span class="tag">' + esc(a.tag || "기사") + "</span><span>" + esc(a.time || "") + " 매경</span></div>" +
        '<h3><a href="' + esc(a.url) + '" target="_blank" rel="noopener">' + esc(a.title) + "</a></h3>" +
        "<ul>" + points + "</ul>" +
        '<a class="go" href="' + esc(a.url) + '" target="_blank" rel="noopener">' +
          "원문 보기" +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>' +
        "</a>" +
        "</article>";
    }).join("");
  }

  renderArticles($("stocks"), D.stocks);
  renderArticles($("world"), D.world);

  /* ---------- 탭 ---------- */
  var tabs = {
    today: { btn: $("tab-today"), pane: $("pane-today") },
    stock: { btn: $("tab-stock"), pane: $("pane-stock") },
    world: { btn: $("tab-world"), pane: $("pane-world") }
  };

  function select(key, scroll) {
    Object.keys(tabs).forEach(function (k) {
      var on = k === key;
      tabs[k].btn.setAttribute("aria-selected", on ? "true" : "false");
      tabs[k].pane.hidden = !on;
    });
    if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
    try { localStorage.setItem("mk.lastTab", key); } catch (e) {}
  }

  Object.keys(tabs).forEach(function (k) {
    tabs[k].btn.addEventListener("click", function () { select(k, true); });
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-jump]"), function (b) {
    b.addEventListener("click", function () { select(b.getAttribute("data-jump"), true); });
  });

  var saved = null;
  try { saved = localStorage.getItem("mk.lastTab"); } catch (e) {}
  // 앱을 열면 항상 '오늘 한눈에'부터 보여 줍니다.
  select("today", false);

  /* ---------- 새로고침 (Network-First SW라 최신 파일을 받아옵니다) ---------- */
  var rb = $("refresh");
  rb.addEventListener("click", function () {
    rb.classList.add("spin");
    rb.disabled = true;
    location.reload();
  });
  window.addEventListener("pageshow", function () {
    rb.classList.remove("spin");
    rb.disabled = false;
  });

  /* ---------- Service Worker ---------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").catch(function () {});
    });
  }
})();
