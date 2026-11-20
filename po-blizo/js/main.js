/* ПО-БЛИЗО — основен скрипт (зарежда се с defer) */
(function () {
  "use strict";

  var cfg = window.PB_CONFIG || {};
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------
     1. Линкове към чекаута + пренасяне на UTM параметрите
     ---------------------------------------------------------- */
  function isUrl(s) { return /^https?:\/\//i.test(s || ""); }

  function checkoutUrl(kind) {
    var base = (cfg.checkout || {})[kind];
    if (!isUrl(base)) return null;
    var url = new URL(base);
    var here = new URLSearchParams(window.location.search);
    (cfg.forwardParams || []).forEach(function (k) {
      if (here.has(k) && !url.searchParams.has(k)) url.searchParams.set(k, here.get(k));
    });
    return url.toString();
  }

  document.querySelectorAll("[data-checkout]").forEach(function (a) {
    var href = checkoutUrl(a.getAttribute("data-checkout"));
    if (href) a.href = href;
    else a.setAttribute("data-checkout-missing", "");
  });

  /* ----------------------------------------------------------
     2. Meta Pixel — само след съгласие.
        PageView + ViewContent при зареждане, InitiateCheckout при клик.
        Purchase се отчита в ConvertBuilder.
     ---------------------------------------------------------- */
  var CONSENT_KEY = "pb_consent";
  function hasConsent() {
    try { return localStorage.getItem(CONSENT_KEY) === "granted"; } catch (e) { return false; }
  }
  function pixelReady() { return typeof window.fbq === "function" && /^\d+$/.test(cfg.pixelId || ""); }

  function loadPixel() {
    if (!/^\d+$/.test(cfg.pixelId || "") || window.fbq) return;
    /* стандартният код на Meta */
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    var p = cfg.products.basic;
    window.fbq("init", cfg.pixelId);
    window.fbq("track", "PageView");
    window.fbq("track", "ViewContent", { content_ids: [p.id], content_name: "ПО-БЛИЗО", content_type: "product", value: p.value, currency: cfg.currency });
  }
  // Банерът за бисквитки (следваща стъпка) ще извиква window.pbConsent("granted" | "denied").
  window.pbConsent = function (state) {
    try { localStorage.setItem(CONSENT_KEY, state); } catch (e) {}
    if (state === "granted") loadPixel();
  };
  if (hasConsent()) loadPixel();

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-checkout]");
    if (!a) return;
    var kind = a.getAttribute("data-checkout");
    var p = (cfg.products || {})[kind];
    if (pixelReady() && p) {
      window.fbq("track", "InitiateCheckout", { content_ids: [p.id], content_name: p.name, content_type: "product", num_items: 1, value: p.value, currency: cfg.currency });
      // кратка пауза, за да тръгне събитието преди да напуснем страницата
      if (!a.hasAttribute("data-checkout-missing") && !e.metaKey && !e.ctrlKey && !e.shiftKey && a.target !== "_blank") {
        e.preventDefault();
        var href = a.href;
        setTimeout(function () { window.location.href = href; }, 250);
      }
    }
  });

  /* ----------------------------------------------------------
     3. Лепкава лента „Поръчай“ — винаги, когато главният бутон в hero не се вижда;
        скрива се над офертата
     ---------------------------------------------------------- */
  var bar = document.querySelector(".sticky-cta");
  var heroCtas = document.querySelector(".hero-ctas");
  if (bar && heroCtas && "IntersectionObserver" in window) {
    var pastHero = false, hiders = new Set();
    var sync = function () {
      var on = pastHero && hiders.size === 0;
      bar.classList.toggle("is-on", on);
      bar.setAttribute("aria-hidden", on ? "false" : "true");
      bar.querySelectorAll("a").forEach(function (l) { l.tabIndex = on ? 0 : -1; });
    };
    new IntersectionObserver(function (en) {
      en.forEach(function (x) { pastHero = !x.isIntersecting; }); // главният бутон не се вижда (над или под екрана)
      sync();
    }).observe(heroCtas);
    var ho = new IntersectionObserver(function (en) {
      en.forEach(function (x) { x.isIntersecting ? hiders.add(x.target) : hiders.delete(x.target); });
      sync();
    }, { rootMargin: "0px 0px -20% 0px" });
    document.querySelectorAll("[data-hide-sticky]").forEach(function (el) { ho.observe(el); });
    sync();
  }

  /* ----------------------------------------------------------
     4. Движение (GSAP + ScrollTrigger)
     ---------------------------------------------------------- */
  function endIntro() { root.classList.remove("intro"); }

  if (reduce || !window.gsap) { endIntro(); return; }

  var gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  /* 4а. Анимирано начало — общо ≤ 2,5 сек., не блокира текста и бутоните.
         Нощта рисува съзвездията и нишката, после те „кацат“ върху кутията на снимката. */
  var sky = document.querySelector(".hero-sky");
  var night = document.querySelector(".hero-night");
  var photo = document.querySelector(".hero-photo");

  // Къде е централната звезда и колко широки са профилите върху кутията на снимката
  // (в пиксели от оригинала 1122×1402).
  var PHOTO = { w: 1122, h: 1402, star: [578, 489], span: 540 };
  var SKY = { vbX: 0, vbY: 14, vbW: 360, vbH: 196, star: [180, 140], span: 278 };

  function landing() {
    var v = photo.getBoundingClientRect();
    var pos = getComputedStyle(photo).objectPosition.split(" ").map(function (x) { return parseFloat(x) / 100; });
    var sc = Math.max(v.width / PHOTO.w, v.height / PHOTO.h);
    var ox = (v.width - PHOTO.w * sc) * (isNaN(pos[0]) ? .5 : pos[0]);
    var oy = (v.height - PHOTO.h * sc) * (isNaN(pos[1]) ? .5 : pos[1]);
    var tx = v.left + ox + PHOTO.star[0] * sc, ty = v.top + oy + PHOTO.star[1] * sc;
    var r = sky.getBoundingClientRect();
    var k = r.width / SKY.vbW;
    var sx = r.left + (SKY.star[0] - SKY.vbX) * k, sy = r.top + (SKY.star[1] - SKY.vbY) * k;
    var scale = (PHOTO.span * sc) / (SKY.span * k);
    return { x: tx - sx, y: ty - sy, scale: scale, origin: ((SKY.star[0] - SKY.vbX) / SKY.vbW * 100) + "% " + ((SKY.star[1] - SKY.vbY) / SKY.vbH * 100) + "%" };
  }

  var landed = null;
  function land() { return landed || (landed = landing()); }

  var intro = gsap.timeline({ defaults: { ease: "power2.out" }, onComplete: endIntro });
  intro
    // звездите изгряват
    .fromTo(sky.querySelectorAll(".fs, .sp"), { opacity: 0, scale: .2 }, { opacity: function (i, el) { return el.classList.contains("sp") ? .8 : .55; }, scale: 1, duration: .4, stagger: { each: .007, from: "random" } }, 0)
    .fromTo(sky.querySelectorAll(".st"), { opacity: 0, scale: .2 }, { opacity: 1, scale: 1, duration: .3, stagger: { each: .008, from: "random" } }, .1)
    // линиите оформят двата профила
    .fromTo(sky.querySelectorAll(".ln"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .45, ease: "power1.inOut", stagger: .06 }, .6)
    // нишката се изтегля
    .fromTo(sky.querySelector(".thread"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .45, ease: "power2.inOut" }, 1.2)
    // звездата в средата пламва
    .fromTo(sky.querySelector(".core"), { opacity: 0, scale: .3 }, { opacity: 1, scale: 1, duration: .4, ease: "back.out(2)" }, 1.5)
    // съзвездията „кацат“ върху кутията, нощта се разтваря в снимката
    .to(sky, { transformOrigin: "50% 64.29%", x: function () { return land().x; }, y: function () { return land().y; }, scale: function () { return land().scale; }, duration: .65, ease: "power2.inOut" }, 1.8)
    .to(night, { backgroundColor: "rgba(20,32,57,0)", duration: .7, ease: "power1.inOut" }, 1.8)
    .to(night, { opacity: 0, duration: .35, ease: "power1.in" }, 2.15)
    .set(night, { visibility: "hidden" }, 2.5);
  window.__pbIntro = intro; // за тестове

  /* 4б. Скрол: снимката леко се приближава, докато hero излиза (scrub) */
  var mm = gsap.matchMedia();
  if (window.ScrollTrigger) {
    window.ScrollTrigger.config({ ignoreMobileResize: true });
    var scrub = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: .6 }
    });
    scrub.fromTo(photo, { scale: 1, yPercent: 0 }, { scale: 1.08, yPercent: 6 }, 0);
    window.__pbScrub = scrub;
  }

  /* 4г. „Познато ли ти е?“ — всяка снимка се отваря със скрола (едно движение на екран) */
  if (window.ScrollTrigger) {
    gsap.utils.toArray(".pain-fig").forEach(function (fig) {
      var media = fig.querySelector(".pain-media"), img = fig.querySelector(".pain-img"), cap = fig.querySelector(".pain-cap");
      var tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: fig, start: "top 92%", end: "top 30%", scrub: .5 } });
      tl.fromTo(media, { clipPath: "inset(10% 7% 10% 7% round 18px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1 }, 0)
        .fromTo(img, { scale: 1.1 }, { scale: 1, duration: 1 }, 0)
        .fromTo(cap, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .35 }, .55);
    });

    /* нишката под „Трябва ви повод.“ и във финала се изтегля със скрола */
    gsap.utils.toArray(".close-thread, .final-thread").forEach(function (svg) {
      gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: svg, start: "top 96%", end: "top 66%", scrub: .5 } })
        .fromTo(svg.querySelectorAll(".ct-dot"), { opacity: 0 }, { opacity: 1, duration: .15 }, 0)
        .fromTo(svg.querySelector(".ct-line"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1 }, 0)
        .fromTo(svg.querySelector(".ct-star"), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: .3 }, .7);
    });
  }

  /* 4в. Паралакс: само снимката, макс. 7px, само с мишка */
  mm.add("(hover: hover) and (pointer: fine)", function () {
    var hero = document.querySelector(".hero");
    var xTo = gsap.quickTo(photo, "x", { duration: .9, ease: "power3.out" });
    var yTo = gsap.quickTo(photo, "y", { duration: .9, ease: "power3.out" });
    function move(e) {
      var r = hero.getBoundingClientRect();
      xTo(((e.clientX - r.left) / r.width - .5) * 14);
      yTo(((e.clientY - r.top) / r.height - .5) * 10);
    }
    hero.addEventListener("pointermove", move);
    return function () { hero.removeEventListener("pointermove", move); };
  });
})();
