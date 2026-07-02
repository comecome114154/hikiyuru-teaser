(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var SCENES_FALLBACK = [
    { no: "01", title: "大階段のある商業区", place: "山形道・上層商業区", text: "雪は降る。灯りは消えない。今日も人は、道を上る。", src: "assets/img/scene01.webp" },
    { no: "02", title: "雪の下層市場", place: "山形道・下層市場", text: "階段を下りるほど、湯気と灯りは近くなる。雪の下にも、市は立つ。", src: "assets/img/scene02.webp" },
    { no: "03", title: "深層物流区画", place: "山形道・深層物流区画", text: "上に街があり、下に流れがある。見えない場所で、今日も道は動いている。", src: "assets/img/scene03.webp" },
    { no: "04", title: "整備通路", place: "山形道・整備通路", text: "街の裏側には、灯りも声も届きにくい道がある。そこを通らなければ、この国は動かない。", src: "assets/img/scene04.webp" }
  ];

  var HIYURU_FALLBACK = [
    { text: "あつあつ。", src: "assets/img/hiyuru01.webp" },
    { text: "まだ早いです", src: "assets/img/hiyuru02.webp" },
    { text: "あそこ、行きたくねえーーー", src: "assets/img/hiyuru03.webp" },
    { text: "ここでいいんじゃないですかね……", src: "assets/img/hiyuru04.webp" }
  ];

  function fetchJson(url, fallback) {
    if (typeof fetch !== "function") {
      return Promise.resolve(fallback);
    }
    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("bad response");
        return res.json();
      })
      .catch(function () {
        return fallback;
      });
  }

  function attachImageFallback(img, placeholder) {
    img.addEventListener("error", function () {
      img.hidden = true;
      if (placeholder) placeholder.hidden = false;
    });
  }

  /* ---------------------------------------------------------
     SCENE一覧の描画
     --------------------------------------------------------- */
  function renderScenes(scenes) {
    var list = document.getElementById("sceneList");
    if (!list) return;

    var sorted = scenes.slice().sort(function (a, b) {
      return String(a.no).localeCompare(String(b.no));
    });

    sorted.forEach(function (scene) {
      var li = document.createElement("li");
      li.className = "scene-card";

      var media = document.createElement("div");
      media.className = "scene-card__media";

      var img = document.createElement("img");
      img.src = scene.src;
      img.alt = scene.title + "(" + scene.place + ")";
      img.loading = "lazy";

      var placeholder = document.createElement("div");
      placeholder.className = "scene-card__placeholder";
      placeholder.hidden = true;
      placeholder.setAttribute("aria-hidden", "true");
      placeholder.textContent = "SCENE " + scene.no + "(準備中)";

      attachImageFallback(img, placeholder);

      media.appendChild(img);
      media.appendChild(placeholder);

      var body = document.createElement("div");
      body.className = "scene-card__body";
      body.innerHTML =
        '<p class="scene-card__no">SCENE ' + scene.no + "</p>" +
        '<h3 class="scene-card__title">' + scene.title + "</h3>" +
        '<p class="scene-card__place">' + scene.place + "</p>" +
        '<p class="scene-card__text">' + scene.text + "</p>";

      li.appendChild(media);
      li.appendChild(body);
      list.appendChild(li);
    });

    observeCards();
  }

  function observeCards() {
    var cards = document.querySelectorAll(".scene-card");
    if (!cards.length) return;

    if (reduceMotion || typeof IntersectionObserver !== "function") {
      cards.forEach(function (card) {
        card.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    cards.forEach(function (card) {
      observer.observe(card);
    });
  }

  /* ---------------------------------------------------------
     日ゆる一覧の描画
     --------------------------------------------------------- */
  function renderHiyuru(items) {
    var grid = document.getElementById("hiyuruGrid");
    if (!grid) return;

    items.forEach(function (item, index) {
      var card = document.createElement("div");
      card.className = "hiyuru-card";

      var media = document.createElement("div");
      media.className = "hiyuru-card__media";

      var img = document.createElement("img");
      img.src = item.src;
      img.alt = item.text;
      img.loading = "lazy";

      var placeholder = document.createElement("div");
      placeholder.className = "hiyuru-card__placeholder";
      placeholder.hidden = true;
      placeholder.setAttribute("aria-hidden", "true");
      placeholder.textContent = "日ゆる " + String(index + 1).padStart(2, "0") + "(準備中)";

      attachImageFallback(img, placeholder);

      media.appendChild(img);
      media.appendChild(placeholder);

      var p = document.createElement("p");
      p.className = "hiyuru-card__text";
      p.textContent = item.text;

      card.appendChild(media);
      card.appendChild(p);
      grid.appendChild(card);
    });
  }

  /* ---------------------------------------------------------
     旅の二人セクション: 画像なければプレースホルダー
     --------------------------------------------------------- */
  function setupFutari() {
    var img = document.getElementById("futariImg");
    var placeholder = document.getElementById("futariPlaceholder");
    if (img && placeholder) {
      attachImageFallback(img, placeholder);
    }
  }

  /* ---------------------------------------------------------
     降雪キャンバス
     --------------------------------------------------------- */
  function setupSnow() {
    var canvas = document.getElementById("snowCanvas");
    if (!canvas || reduceMotion) return;

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var flakes = [];
    var width, height;

    function count() {
      return window.innerWidth < 768 ? 60 : 120;
    }

    function resize() {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    }

    function makeFlake() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2 + 0.6,
        speed: Math.random() * 0.6 + 0.25,
        drift: Math.random() * 0.4 - 0.2,
        opacity: Math.random() * 0.5 + 0.3
      };
    }

    function init() {
      resize();
      var n = count();
      flakes = [];
      for (var i = 0; i < n; i++) {
        flakes.push(makeFlake());
      }
    }

    function step() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(233,237,242,0.85)";
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.y += f.speed;
        f.x += f.drift;
        if (f.y > height) {
          f.y = -4;
          f.x = Math.random() * width;
        }
        if (f.x > width) f.x = 0;
        if (f.x < 0) f.x = width;

        ctx.globalAlpha = f.opacity;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      window.requestAnimationFrame(step);
    }

    init();
    window.requestAnimationFrame(step);

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(init, 200);
    });
  }

  /* ---------------------------------------------------------
     初期化
     --------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    setupSnow();
    setupFutari();

    if (document.getElementById("sceneList")) {
      fetchJson("data/scenes.json", SCENES_FALLBACK).then(renderScenes);
    }

    if (document.getElementById("hiyuruGrid")) {
      fetchJson("data/hiyuru.json", HIYURU_FALLBACK).then(renderHiyuru);
    }
  });
})();
