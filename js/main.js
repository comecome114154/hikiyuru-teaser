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
      img.dataset.broken = "true";
      if (placeholder) placeholder.hidden = false;
    });
  }

  /* ---------------------------------------------------------
     SCENEカード: タップで動画に切り替え(reduced motion時は無効)
     --------------------------------------------------------- */
  function setupSceneVideoToggle(media, img, placeholder, videoSrc) {
    if (reduceMotion) return;

    var button = document.createElement("button");
    button.type = "button";
    button.className = "scene-card__play";
    button.setAttribute("aria-label", "動画を再生");

    var icon = document.createElement("span");
    icon.className = "scene-card__play-icon";
    icon.setAttribute("aria-hidden", "true");
    button.appendChild(icon);
    media.appendChild(button);

    var video = null;
    var playing = false;

    function showStill() {
      if (video) {
        video.pause();
        video.hidden = true;
      }
      if (img.dataset.broken !== "true") {
        img.hidden = false;
      } else if (placeholder) {
        placeholder.hidden = false;
      }
      playing = false;
      button.classList.remove("is-playing");
      button.setAttribute("aria-label", "動画を再生");
    }

    function showVideo() {
      if (!video) {
        video = document.createElement("video");
        video.className = "scene-card__video";
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute("playsinline", "");
        video.setAttribute("aria-hidden", "true");
        video.src = videoSrc;
        video.addEventListener("error", showStill);
        media.insertBefore(video, button);
      }
      img.hidden = true;
      if (placeholder) placeholder.hidden = true;
      video.hidden = false;
      var playPromise = video.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(function () {});
      }
      playing = true;
      button.classList.add("is-playing");
      button.setAttribute("aria-label", "画像に戻す");
    }

    button.addEventListener("click", function () {
      if (playing) {
        showStill();
      } else {
        showVideo();
      }
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

      if (scene.video) {
        setupSceneVideoToggle(media, img, placeholder, scene.video);
      }

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
     HERO背景動画: 読み込み失敗でCSS背景にフォールバック、
     reduced motion時は静止画(poster)のまま止める
     --------------------------------------------------------- */
  function setupHeroVideo() {
    var video = document.getElementById("heroVideo");
    if (!video) return;

    function fallbackToBackground() {
      video.hidden = true;
    }

    video.addEventListener("error", fallbackToBackground);
    var source = video.querySelector("source");
    if (source) {
      source.addEventListener("error", fallbackToBackground);
    }
    video.addEventListener("stalled", function () {
      if (video.networkState === video.NETWORK_NO_SOURCE) {
        fallbackToBackground();
      }
    });
    window.setTimeout(function () {
      if (video.networkState === video.NETWORK_NO_SOURCE) {
        fallbackToBackground();
      }
    }, 2000);

    if (reduceMotion) {
      video.removeAttribute("autoplay");
      video.pause();
      return;
    }

    video.muted = true;
    var playPromise = video.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(function () {});
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
    var lights = [];
    var width, height;
    var time = 0;

    var LIGHT_COLORS = ["232,162,74", "159,195,217"];

    function count() {
      return window.innerWidth < 768 ? 60 : 120;
    }

    function lightCount() {
      return window.innerWidth < 768 ? 10 : 18;
    }

    function resize() {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    }

    function makeFlake() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2.8 + 1,
        speed: Math.random() * 0.6 + 0.25,
        drift: Math.random() * 0.4 - 0.2,
        opacity: Math.random() * 0.5 + 0.3
      };
    }

    function makeLight() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.35 + 0.15,
        drift: Math.random() * 0.3 - 0.15,
        color: LIGHT_COLORS[Math.floor(Math.random() * LIGHT_COLORS.length)],
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.02 + 0.015
      };
    }

    function init() {
      resize();
      var n = count();
      flakes = [];
      for (var i = 0; i < n; i++) {
        flakes.push(makeFlake());
      }
      var m = lightCount();
      lights = [];
      for (var j = 0; j < m; j++) {
        lights.push(makeLight());
      }
    }

    function step() {
      time++;
      ctx.clearRect(0, 0, width, height);

      ctx.shadowBlur = 0;
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

      for (var k = 0; k < lights.length; k++) {
        var l = lights[k];
        l.y += l.speed;
        l.x += l.drift;
        if (l.y > height) {
          l.y = -4;
          l.x = Math.random() * width;
        }
        if (l.x > width) l.x = 0;
        if (l.x < 0) l.x = width;

        var twinkle = 0.4 + 0.6 * Math.abs(Math.sin(time * l.twinkleSpeed + l.phase));
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = "rgba(" + l.color + ",1)";
        ctx.shadowColor = "rgba(" + l.color + ",0.9)";
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
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
    setupHeroVideo();
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
