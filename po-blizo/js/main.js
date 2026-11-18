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
     3. Лепкава лента „Поръчай“ — след hero, скрива се над офертата/формата
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
      en.forEach(function (x) { pastHero = !x.isIntersecting && x.boundingClientRect.top < 0; });
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

  /* 4а. Анимирано начало — общо ≤ 2,5 сек., не блокира текста и бутоните */
  var sky = document.querySelector(".hero-sky");
  var intro = gsap.timeline({ defaults: { ease: "power2.out" }, onComplete: endIntro });
  intro
    // звездите изгряват
    .fromTo(sky.querySelectorAll(".fs, .sp"), { opacity: 0, scale: .2 }, { opacity: function (i, el) { return el.classList.contains("sp") ? .8 : .55; }, scale: 1, duration: .45, stagger: { each: .008, from: "random" } }, 0)
    .fromTo(sky.querySelectorAll(".st"), { opacity: 0, scale: .2 }, { opacity: 1, scale: 1, duration: .35, stagger: { each: .009, from: "random" } }, .1)
    // линиите оформят двата профила
    .fromTo(sky.querySelectorAll(".ln"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .5, ease: "power1.inOut", stagger: .045 }, .8)
    // нишката се изтегля
    .fromTo(sky.querySelector(".thread"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .5, ease: "power2.inOut" }, 1.6)
    // звездата в средата пламва
    .fromTo(sky.querySelector(".core"), { opacity: 0, scale: .3 }, { opacity: 1, scale: 1, duration: .45, ease: "back.out(2)" }, 1.95)
    // кутията и картите изплуват
    .to(".box-stage", { opacity: 1, "--ey": "0px", duration: .6 }, 1.9)
    .to(".hero-cards", { opacity: 1, "--ey": "0px", duration: .6 }, 1.95);
  window.__pbIntro = intro; // за тестове

  /* 4б. Скрол: кутията се завърта и капакът се повдига (scrub) */
  var mm = gsap.matchMedia();
  if (window.ScrollTrigger) {
    window.ScrollTrigger.config({ ignoreMobileResize: true });
    var box = document.querySelector(".box3d");
    var scrub = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: ".hero", start: "top top", end: "+=75%", pin: true, scrub: .6, anticipatePin: 1 }
    });
    scrub
      .fromTo(box, { "--rz": "-8deg" }, { "--rz": "7deg" }, 0)
      .fromTo(box, { "--lift": "0px", "--tilt": "0deg" }, { "--lift": "18px", "--tilt": "9deg" }, .25)
      .to(sky, { opacity: .45 }, .2);
    window.__pbScrub = scrub;
  }

  /* 4в. Паралакс: само слоят със звездите, макс. 7px, само с мишка */
  mm.add("(hover: hover) and (pointer: fine)", function () {
    var field = sky.querySelector(".field");
    var hero = document.querySelector(".hero");
    var xTo = gsap.quickTo(field, "x", { duration: .9, ease: "power3.out" });
    var yTo = gsap.quickTo(field, "y", { duration: .9, ease: "power3.out" });
    function move(e) {
      var r = hero.getBoundingClientRect();
      xTo(((e.clientX - r.left) / r.width - .5) * 14);
      yTo(((e.clientY - r.top) / r.height - .5) * 10);
    }
    hero.addEventListener("pointermove", move);
    return function () { hero.removeEventListener("pointermove", move); };
  });
})();
