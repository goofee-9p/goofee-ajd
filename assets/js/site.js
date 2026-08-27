/* ═══════════════════════════════════════════════════════════
   구병기 · 퍼포먼스 마케터 포트폴리오 — 인터랙션
   GSAP(ScrollTrigger·SplitText) + anime.js v4 + Lenis
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch   = window.matchMedia("(hover: none)").matches;
  var mobile  = window.matchMedia("(max-width: 768px)").matches;

  /* ?shot=<scrollY> — 스크린샷 검증용: 스무스 스크롤 없이 해당 위치로 점프
     ?edit      — 로컬 편집 모드: 모션을 아예 걸지 않는다.
                  GSAP 을 나중에 멈추는 것만으로는 부족하다 — gsap.from 은 시작값(opacity 0)을
                  스크롤 전에 이미 심어 두기 때문에, 아직 안 지나간 섹션의 글자가 통째로 사라진다 */
  var shotY = null, editMode = false;
  try {
    var sp = new URLSearchParams(location.search);
    /* ?shot=1200 (픽셀) 또는 ?shot=el:cr-image (요소 기준 — 폭에 따라 좌표가 달라져도 정확) */
    if (sp.has("shot")) {
      var sv = sp.get("shot") || "";
      shotY = sv.indexOf("el:") === 0 ? sv : (parseFloat(sv) || 0);
    }
    editMode = sp.has("edit");
  } catch (e) {}

  /* 콘솔 이스터에그 — 열어 본 사람에게만 보이는 인사 */
  try {
    console.log(
      "%c구병기 · 퍼포먼스 마케터 %c\n이 포트폴리오는 기획부터 코드까지 AI와 함께 직접 만들었습니다.\n뜯어봐 주셔서 감사합니다 — 010-6340-3531",
      "font-size:16px;font-weight:800;color:#145CE6","font-size:12px;color:#666"
    );
  } catch (e) {}

  /* ffnab 자사몰 이미지 — assets/img/ffnab_hero.jpg 파일이 생기면 자동으로 카드에 붙는다 */
  (function () {
    var card = document.getElementById("bcard-ffnab");
    if (!card) return;
    var probe = new Image();
    probe.onload = function () {
      var img = document.createElement("img");
      img.className = "bimg";
      img.alt = "ffnab 자사몰 메인 화면";
      img.src = probe.src;
      card.insertBefore(img, card.firstChild);
    };
    /* ?v= 는 이미지 캐시 버스터 — 파일을 갈아끼우면 숫자를 올린다 */
    probe.src = "assets/img/ffnab_hero.webp?v=2";
  })();

  /* ══════════ 연락처 모달 ══════════
     모션 분기보다 앞에 둔다 — 편집·스크린샷 모드에서도 동작해야 한다 */
  (function initContactModal() {
    var modal = document.getElementById("cmodal");
    var opener = document.getElementById("contact-open");
    if (!modal || !opener) return;
    var closeBtn = modal.querySelector(".cmodal-x");
    var lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.documentElement.style.overflow = "hidden";
      /* hidden 해제 직후 클래스를 주면 트랜지션이 생략된다.
         rAF 는 탭이 백그라운드면 멈춰 모달이 투명한 채 남으므로, 리플로우로 시작점을 확정한다 */
      void modal.offsetHeight;
      modal.classList.add("is-open");
      if (closeBtn) closeBtn.focus();
    }
    function close() {
      modal.classList.remove("is-open");
      document.documentElement.style.overflow = "";
      var done = function () { modal.hidden = true; };
      setTimeout(done, 320);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    opener.addEventListener("click", open);
    modal.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) { e.preventDefault(); close(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) close();
    });

    /* 복사 — 링크(tel:·mailto:)가 같이 열리지 않게 이벤트를 멈춘다 */
    modal.querySelectorAll("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var text = btn.getAttribute("data-copy");
        var mark = function () {
          var was = btn.textContent;
          btn.textContent = "복사됨"; btn.classList.add("done");
          setTimeout(function () { btn.textContent = was; btn.classList.remove("done"); }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(mark, fallback);
        } else { fallback(); }
        function fallback() {
          var ta = document.createElement("textarea");
          ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); mark(); } catch (err) {}
          document.body.removeChild(ta);
        }
      });
    });
  })();

  /* ── 모션 최소화 환경(스크린샷·편집 모드 포함): 전부 정적으로 두고 종료 ── */
  if (reduced || shotY !== null || editMode) {
    document.querySelectorAll(".rv").forEach(function (el) { el.classList.add("on"); });
    document.querySelectorAll(".part .big").forEach(function (el) { el.classList.add("filled"); });
    litAllPipeNodes();
    initCountersInstant();
    initVideoObserver();
    if (shotY !== null) {
      /* 고정 요소까지 함께 밀리도록 body 자체를 이동해 해당 구간을 보여준다 */
      document.documentElement.classList.add("shotmode");
      if (typeof shotY === "string") {
        var tgt = document.getElementById(shotY.slice(3));
        shotY = tgt ? Math.round(tgt.getBoundingClientRect().top + window.scrollY) : 0;
      }
      /* &modal=1 — 연락처 모달을 연 상태로 확인.
         body 에 transform 이 걸리면 position:fixed 의 기준이 뷰포트에서 body 로 바뀌어
         모달이 문서 한가운데(화면 밖)로 밀린다 — 이때는 이동을 건너뛴다 */
      var withModal = false;
      try { withModal = new URLSearchParams(location.search).get("modal") === "1"; } catch (e) {}
      if (withModal) {
        var cm = document.getElementById("cmodal");
        if (cm) { cm.hidden = false; cm.classList.add("is-open"); }
      } else {
        document.body.style.transform = "translateY(" + (-shotY) + "px)";
      }
      document.documentElement.style.overflow = "hidden";
      /* &scene=N — 콘솔의 특정 장면을 정지 상태로 확인 */
      try {
        var scN = parseInt(new URLSearchParams(location.search).get("scene"), 10);
        var scAll = document.querySelectorAll(".cs-scene");
        if (scN >= 1 && scN <= scAll.length) {
          scAll.forEach(function (s, i) {
            s.style.opacity = (i === scN - 1) ? "1" : "0";
            s.style.visibility = (i === scN - 1) ? "visible" : "hidden";
          });
        }
      } catch (e) {}
    }
    return;
  }

  var hasGsap = typeof gsap !== "undefined";
  var hasST   = hasGsap && typeof ScrollTrigger !== "undefined";
  var hasSplit= hasGsap && typeof SplitText !== "undefined";
  var hasAnime= typeof anime !== "undefined" && typeof anime.animate === "function";
  var lenis   = null;

  if (hasST) gsap.registerPlugin(ScrollTrigger);
  if (hasSplit) gsap.registerPlugin(SplitText);

  /* ══════════ 스무스 스크롤 (Lenis × ScrollTrigger) ══════════ */
  if (typeof Lenis !== "undefined" && hasST && !touch && shotY === null) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* 앵커 이동 — 고정 탑바만큼 오프셋 */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (ev) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      ev.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -84, duration: 1.4 });
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ══════════ 리빌 ══════════ */
  if (hasST) {
    ScrollTrigger.batch(".rv", {
      start: "top 88%",
      once: true,
      onEnter: function (batch) {
        batch.forEach(function (el, i) {
          el.style.transitionDelay = (i * 70) + "ms";
          el.classList.add("on");
          el.addEventListener("transitionend", function te() {
            el.style.transitionDelay = "";
            el.removeEventListener("transitionend", te);
          });
        });
      }
    });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("on"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    document.querySelectorAll(".rv").forEach(function (el) { io.observe(el); });
  }

  /* ══════════ 텍스트 스플릿 ══════════ */
  if (hasSplit && hasST) {
    document.fonts.ready.then(function () {
      try {

      /* 히어로 — 글자 단위, 로드 직후 재생 */
      var heroTitle = document.querySelector(".hero-title");
      if (heroTitle) {
        SplitText.create(heroTitle, {
          type: "words,chars",
          autoSplit: true,
          onSplit: function (self) {
            return gsap.from(self.chars, {
              yPercent: 120, opacity: 0, rotation: 4,
              duration: 1.1, ease: "power4.out",
              stagger: 0.018, delay: 0.15
            });
          }
        });
      }

      /* 엔딩 — 글자 단위, 스크롤 진입 시 */
      document.querySelectorAll(".end-hero").forEach(function (el) {
        SplitText.create(el, {
          type: "words,chars",
          autoSplit: true,
          onSplit: function (self) {
            return gsap.from(self.chars, {
              yPercent: 110, opacity: 0,
              duration: 0.9, ease: "power3.out", stagger: 0.012,
              scrollTrigger: { trigger: el, start: "top 82%", once: true }
            });
          }
        });
      });

      /* 섹션 제목 — 라인 마스크 */
      document.querySelectorAll("h2[data-split]").forEach(function (el) {
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: function (self) {
            return gsap.from(self.lines, {
              yPercent: 115, duration: 1, ease: "power4.out", stagger: 0.09,
              scrollTrigger: { trigger: el, start: "top 86%", once: true }
            });
          }
        });
      });

      } catch (e) { /* 스플릿 실패 시 원문 그대로 노출 */ }
    });
  }

  /* 파트 타이틀 — 아웃라인 → 채움 */
  if (hasST) {
    document.querySelectorAll(".part .big").forEach(function (el) {
      ScrollTrigger.create({
        trigger: el, start: "top 78%", once: true,
        onEnter: function () { el.classList.add("filled"); }
      });
    });
  }

  /* ══════════ 카운트업 (anime.js) ══════════ */
  function fmt(n) { return Math.round(n).toLocaleString("ko-KR"); }
  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    if (target === 0) { el.textContent = "0"; return; }
    var state = { v: 0 };
    var done = false;
    if (hasAnime) {
      try {
        anime.animate(state, {
          v: target, duration: 1600, ease: "outExpo",
          onUpdate: function () { el.textContent = fmt(state.v); },
          onComplete: function () { el.textContent = fmt(target); }
        });
        done = true;
      } catch (e) { done = false; }
    }
    if (!done && hasGsap) {
      gsap.to(state, {
        v: target, duration: 1.6, ease: "expo.out",
        onUpdate: function () { el.textContent = fmt(state.v); }
      });
      done = true;
    }
    if (!done) el.textContent = fmt(target);
  }
  function initCountersInstant() {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      el.textContent = fmt(parseFloat(el.getAttribute("data-count")) || 0);
    });
  }
  if (hasST) {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      ScrollTrigger.create({
        trigger: el, start: "top 90%", once: true,
        onEnter: function () { runCounter(el); }
      });
    });
  } else { initCountersInstant(); }

  /* ══════════ 탑바 ══════════ */
  var topbar = document.getElementById("topbar");
  var hint = document.querySelector(".scroll-hint");
  function onScrollUi() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (topbar) topbar.classList.toggle("scrolled", y > 30);
    if (hint) hint.style.opacity = y > 90 ? "0" : "";
  }
  window.addEventListener("scroll", onScrollUi, { passive: true });
  onScrollUi();

  /* 활성 섹션 표시 */
  if (hasST) {
    [["#automation", "#au-team"], ["#operations", "#op-discovery"], ["#creative", "#cr-loop"]]
      .forEach(function (pair) {
        var link = document.querySelector('.nav a[href="' + pair[0] + '"]');
        var endEl = document.querySelector(pair[1]);
        if (!link || !endEl) return;
        ScrollTrigger.create({
          trigger: pair[0], start: "top 45%",
          endTrigger: pair[1], end: "bottom 45%",
          onToggle: function (st) { link.classList.toggle("act", st.isActive); }
        });
      });
  }

  /* ══════════ 리본 마퀴 ══════════ */
  if (hasGsap) {
    var ribbonTrack = document.querySelector(".ribbon-track");
    if (ribbonTrack) {
      gsap.to(ribbonTrack, { xPercent: -33.3334, duration: 22, ease: "none", repeat: -1 });
    }
  }

  /* ══════════ 아카이브 마퀴 — 3열 무한, 호버 시 감속 ══════════ */
  if (hasGsap) {
    document.querySelectorAll(".am-row").forEach(function (row) {
      var track = row.querySelector(".am-track");
      if (!track) return;
      /* 이음새 없는 루프를 위해 콘텐츠를 2배로 */
      track.innerHTML += track.innerHTML;
      var dir = parseFloat(row.getAttribute("data-speed")) || 1;
      var tween = gsap.fromTo(track,
        { xPercent: dir > 0 ? 0 : -50 },
        { xPercent: dir > 0 ? -50 : 0, duration: 38, ease: "none", repeat: -1 });
      row.addEventListener("mouseenter", function () { gsap.to(tween, { timeScale: 0.22, duration: 0.5 }); });
      row.addEventListener("mouseleave", function () { gsap.to(tween, { timeScale: 1, duration: 0.5 }); });
    });
  }

  /* ══════════ 블롭 패럴랙스 ══════════ */
  if (hasGsap && !touch) {
    var blobSets = [];
    document.querySelectorAll(".hero-blobs").forEach(function (wrapEl) {
      var items = wrapEl.querySelectorAll("i");
      blobSets.push({ items: items });
      /* 느린 자체 드리프트 */
      items.forEach(function (b, i) {
        gsap.to(b, {
          x: (i % 2 ? -1 : 1) * (34 + i * 12),
          y: (i % 2 ? 1 : -1) * (26 + i * 10),
          duration: 9 + i * 2.4, ease: "sine.inOut", yoyo: true, repeat: -1
        });
      });
    });
    var bx = 0, by = 0, tx = 0, ty = 0;
    window.addEventListener("pointermove", function (e) {
      tx = (e.clientX / window.innerWidth - 0.5);
      ty = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });
    gsap.ticker.add(function () {
      bx += (tx - bx) * 0.045; by += (ty - by) * 0.045;
      blobSets.forEach(function (set) {
        set.items.forEach(function (b, i) {
          var depth = (i + 1) * 16;
          b.style.translate = (bx * depth) + "px " + (by * depth) + "px";
        });
      });
    });
  }

  /* ══════════ 커서 글라스 렌즈 ══════════ */
  var lens = document.getElementById("lens");
  if (lens && !touch && !mobile && hasGsap) {
    /* SVG 굴절 backdrop-filter 는 블링크 계열에서만 안정적 */
    var isBlink = !!window.chrome && !/Firefox|FxiOS/i.test(navigator.userAgent);
    if (isBlink) document.body.classList.add("liquid-ok");

    /* 렌즈는 히어로 구간에서만 보인다 */
    var heroZone = document.getElementById("top");
    var lx = -200, ly = -200, px = -200, py = -200, shown = false;
    window.addEventListener("pointermove", function (e) {
      px = e.clientX; py = e.clientY;
      var inHero = !!(heroZone && heroZone.contains(e.target));
      if (inHero && !shown) { shown = true; lx = px; ly = py; }
      document.body.classList.toggle("lens-on", inHero);
    }, { passive: true });
    document.addEventListener("mouseleave", function () {
      shown = false; document.body.classList.remove("lens-on");
    });
    gsap.ticker.add(function () {
      lx += (px - lx) * 0.16; ly += (py - ly) * 0.16;
      /* px 이동 뒤 -50%/-50% — 렌즈 크기가 변해도 중심 유지 */
      lens.style.transform = "translate3d(" + lx + "px," + ly + "px,0) translate(-50%,-50%)";
    });

    /* 인터랙티브 요소 위에서 커짐 */
    var hoverSel = "a, button, .btn, .tilt, .ti, .am-track img, .chip";
    document.addEventListener("pointerover", function (e) {
      if (e.target.closest(hoverSel)) document.body.classList.add("lens-hover");
    });
    document.addEventListener("pointerout", function (e) {
      if (e.target.closest(hoverSel)) document.body.classList.remove("lens-hover");
    });
  }

  /* ══════════ 마그네틱 버튼 ══════════ */
  if (!touch && hasGsap) {
    document.querySelectorAll(".mag").forEach(function (el) {
      var setX = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
      var setY = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        setX((e.clientX - (r.left + r.width / 2)) * 0.22);
        setY((e.clientY - (r.top + r.height / 2)) * 0.28);
      });
      el.addEventListener("pointerleave", function () { setX(0); setY(0); });
    });
  }

  /* ══════════ 3D 틸트 카드 ══════════ */
  if (!touch && !mobile) {
    document.querySelectorAll(".tilt").forEach(function (el) {
      var raf = null;
      el.addEventListener("pointermove", function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          var r = el.getBoundingClientRect();
          var rx = ((e.clientY - r.top) / r.height - 0.5) * -6;
          var ry = ((e.clientX - r.left) / r.width - 0.5) * 8;
          el.style.transform = "perspective(900px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
        });
      });
      el.addEventListener("pointerleave", function () {
        el.style.transform = "";
      });
    });
  }

  /* ══════════ 에이전트 파이프라인 — 진행선과 점등을 한 타임라인으로 ══════════ */
  function litAllPipeNodes() {
    document.querySelectorAll(".pn").forEach(function (n) { n.classList.add("lit"); });
    var f = document.querySelector(".pipe-fill");
    if (f) f.style.transform = "scaleX(1)";
  }
  (function initPipe() {
    var pipe = document.getElementById("pipe");
    if (!pipe) return;
    var nodes = pipe.querySelectorAll(".pn");
    var fill = pipe.querySelector(".pipe-fill");
    if (!nodes.length) return;
    if (!hasGsap) { litAllPipeNodes(); return; }

    var last = nodes.length - 1;
    var tl = gsap.timeline({ repeat: -1, repeatDelay: 1.1, paused: true });
    tl.call(function () {
      nodes.forEach(function (n) { n.classList.remove("lit"); });
    });
    if (fill) tl.set(fill, { scaleX: 0 });
    nodes.forEach(function (n, i) {
      /* 선이 이 노드에 닿는 순간 점등 — 선과 점등이 어긋나지 않는다 */
      tl.call(function () { n.classList.add("lit"); });
      if (fill && i < last) {
        tl.to(fill, { scaleX: (i + 1) / last, duration: 0.5, ease: "none" });
      }
    });

    if (hasST) {
      ScrollTrigger.create({
        trigger: pipe, start: "top 92%", end: "bottom 8%",
        onToggle: function (st) { st.isActive ? tl.play() : tl.pause(); }
      });
    } else { tl.play(); }
  })();

  /* ══════════ 칩 스태거 팝 (anime.js) ══════════ */
  if (hasAnime && hasST) {
    [".hero-meta", ".band-chips", ".sano-feats"].forEach(function (sel) {
      var box = document.querySelector(sel);
      if (!box) return;
      var chips = box.querySelectorAll(".chip");
      if (!chips.length) return;
      ScrollTrigger.create({
        trigger: box, start: "top 92%", once: true,
        onEnter: function () {
          try {
            anime.animate(chips, {
              scale: { from: 0.7, to: 1 },
              opacity: { from: 0, to: 1 },
              y: { from: 14, to: 0 },
              delay: anime.stagger(70),
              duration: 700, ease: "outBack"
            });
          } catch (e) { /* 실패해도 칩은 이미 보이는 상태 */ }
        }
      });
    });
  }

  /* ══════════ 히어로 콘솔 — 4장면 루프 모션 ══════════ */
  (function initConsole() {
    var box = document.getElementById("console");
    if (!box || !hasGsap) return;
    var scenes = box.querySelectorAll(".cs-scene");
    var navDots = box.querySelectorAll(".cs-nav i");
    if (scenes.length !== 4) return;

    var roasEl = document.getElementById("cs-roas");

    gsap.set(scenes, { autoAlpha: 0 });
    var tl = gsap.timeline({ repeat: -1, defaults: { ease: "power3.out" } });
    tl.timeScale(1.25);   /* 전체 템포 — 각 단계 약 80% 길이 */

    function sceneIn(i) {
      tl.call(function () {
        navDots.forEach(function (d, k) { d.classList.toggle("on", k === i); });
      });
      tl.fromTo(scenes[i], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5 });
    }
    function sceneOut(i, hold) {
      tl.to(scenes[i], { autoAlpha: 0, y: -12, duration: 0.4, ease: "power2.in" },
        "+=" + (hold == null ? 1.7 : hold));
    }

    /* 1 — 지누스 ROAS 카운트업 + 바 차트 */
    sceneIn(0);
    var roasState = { v: 875 };
    tl.call(function () { if (roasEl) roasEl.textContent = "875"; }, null, "<");
    tl.fromTo(scenes[0].querySelectorAll(".cs-bars i"),
      { scaleY: 0 }, { scaleY: 1, duration: 0.7, stagger: 0.09 }, "<+.1");
    tl.to(roasState, {
      v: 1120, duration: 1.4, ease: "power2.inOut",
      onUpdate: function () { if (roasEl) roasEl.textContent = Math.round(roasState.v).toLocaleString("ko-KR"); }
    }, "<");
    sceneOut(0, 1.0);

    /* 2 — 미디어 믹스: 매체 팝 → 선이 허브로 모임 → 브랜드로 흘러 나감 */
    sceneIn(1);
    var apTiles = scenes[1].querySelectorAll(".cs-apps .ap");
    var apRings = scenes[1].querySelectorAll(".cs-apps .ring");
    var brTiles = scenes[1].querySelectorAll(".cs-brands span");
    var mxIn = scenes[1].querySelectorAll(".mx-in");
    var mxOut = scenes[1].querySelectorAll(".mx-out");
    var mxHub = scenes[1].querySelector(".mix-hub");
    tl.fromTo(apTiles,
      { scale: 0.3, autoAlpha: 0, y: 16, rotation: -8 },
      { scale: 1, autoAlpha: 1, y: 0, rotation: 0, duration: 0.5,
        ease: "back.out(2.6)", stagger: { each: 0.07, from: "center" } }, "<+.1");
    tl.fromTo(apRings,
      { scale: 0.7, autoAlpha: 0.75 },
      { scale: 1.55, autoAlpha: 0, duration: 0.55, ease: "power2.out",
        stagger: { each: 0.07, from: "center" } }, "<+.12");
    /* 매체 → 허브 (pathLength=1 정규화 — dash 잔상 없이 한 획으로) */
    tl.fromTo(mxIn,
      { strokeDasharray: "1 1", strokeDashoffset: 1, autoAlpha: 0 },
      { strokeDashoffset: 0, autoAlpha: 1, duration: 0.5, ease: "power2.inOut",
        stagger: { each: 0.05, from: "center" } }, ">-.15");
    /* 허브 점등 */
    tl.fromTo(mxHub, { scale: 0, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 0.35, ease: "back.out(3)" }, ">-.12");
    /* 허브 → 브랜드 */
    tl.fromTo(mxOut,
      { strokeDasharray: "1 1", strokeDashoffset: 1, autoAlpha: 0 },
      { strokeDashoffset: 0, autoAlpha: 1, duration: 0.45, ease: "power2.inOut", stagger: 0.07 }, ">-.08");
    tl.fromTo(brTiles,
      { y: 12, autoAlpha: 0, scale: 0.88 },
      { y: 0, autoAlpha: 1, scale: 1, duration: 0.45, ease: "back.out(2.2)", stagger: 0.08 }, ">-.25");
    /* 허브 맥동 + 매체 잔여 플로트 */
    tl.to(mxHub, { scale: 1.28, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 2 }, "<");
    tl.to(apTiles,
      { y: -3, duration: 0.55, ease: "sine.inOut", yoyo: true, repeat: 1,
        stagger: { each: 0.06, from: "center" } }, "<");
    sceneOut(1, 0.4);

    /* 3 — 광고 운영 에이전트 오빗 (링 드로우 → 노드 팝 → 코멧 회전 + 순차 점등) */
    sceneIn(2);
    var orbEl = scenes[2];
    var orbDraw = orbEl.querySelector(".orbit-draw");
    var orbRot = orbEl.querySelector(".orbit-rot");
    var orbHub = orbEl.querySelector(".orbit-hub");
    var orbNodes = orbEl.querySelectorAll(".on-node");
    tl.fromTo(orbDraw, { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut" }, "<+.1");
    tl.fromTo(orbHub, { scale: 0.6, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 0.5, ease: "back.out(2)" }, "<+.25");
    tl.fromTo(orbNodes, { scale: 0.4, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 0.45, ease: "back.out(2.2)", stagger: 0.1 }, "<+.15");
    tl.add("spin", ">-.05");
    /* 코멧 2바퀴 — 한 바퀴 2.4초, 노드 간격 0.48초 */
    tl.fromTo(orbRot, { rotation: 0 },
      { rotation: 720, duration: 4.8, ease: "none", transformOrigin: "50% 50%" }, "spin");
    tl.to(orbHub, { scale: 1.05, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: 7 }, "spin");
    for (var rev = 0; rev < 2; rev++) {
      for (var k = 0; k < orbNodes.length; k++) {
        tl.to(orbNodes[k], { keyframes: [
          { backgroundColor: "#145CE6", borderColor: "#145CE6", scale: 1.14, duration: 0.15 },
          { backgroundColor: "#221F1B", borderColor: "rgba(255,255,255,.15)", scale: 1, duration: 0.42 }
        ] }, "spin+=" + (rev * 2.4 + k * 0.48).toFixed(2));
      }
    }
    sceneOut(2, 0.25);

    /* 4 — AX 발표 화면 (슬라이드 3장 전환 + 청중 점등) */
    sceneIn(3);
    var axEl = scenes[3];
    var axScr = axEl.querySelector(".ax-monitor");
    var axSlides = axEl.querySelectorAll(".ax-slide");
    var axAud = axEl.querySelectorAll(".ax-aud i");
    tl.fromTo(axScr, { y: 14, autoAlpha: 0, scale: 0.94 },
      { y: 0, autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, "<+.1");
    tl.set(axSlides, { autoAlpha: 0 }, "<");
    tl.add("axStart", ">-.1");
    /* 청중은 발표 내내 한 명씩 켜진다 */
    tl.fromTo(axAud,
      { "--pc": "rgba(244,242,238,.32)", autoAlpha: 0.45 },
      { "--pc": "#7AA5F8", autoAlpha: 1, duration: 0.35, ease: "power2.out", stagger: 0.16 }, "axStart");
    /* 슬라이드 1 — 문제 정의 */
    tl.fromTo(axSlides[0], { autoAlpha: 0, x: 14 }, { autoAlpha: 1, x: 0, duration: 0.35 }, "axStart");
    tl.fromTo(axSlides[0].querySelectorAll("i"),
      { scaleX: 0, transformOrigin: "left center" },
      { scaleX: 1, duration: 0.4, stagger: 0.08 }, "<+.1");
    /* 슬라이드 2 — 만드는 방법 4단계 */
    tl.to(axSlides[0], { autoAlpha: 0, x: -14, duration: 0.28, ease: "power2.in" }, "+=.45");
    tl.fromTo(axSlides[1], { autoAlpha: 0, x: 14 }, { autoAlpha: 1, x: 0, duration: 0.32 }, "<+.12");
    tl.fromTo(axSlides[1].querySelectorAll(".ax-chips span"),
      { y: 6, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.3, ease: "back.out(2)", stagger: 0.07 }, "<+.08");
    /* 슬라이드 3 — 팀 자산화 −40% */
    tl.to(axSlides[1], { autoAlpha: 0, x: -14, duration: 0.28, ease: "power2.in" }, "+=.45");
    tl.fromTo(axSlides[2], { autoAlpha: 0, x: 14 }, { autoAlpha: 1, x: 0, duration: 0.32 }, "<+.12");
    tl.fromTo(axSlides[2].querySelector("em"),
      { scale: 0.55, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 0.45, ease: "back.out(2.4)" }, "<+.08");
    tl.fromTo(axSlides[2].querySelector("i"),
      { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.35 }, "<+.05");
    sceneOut(3, 0.8);
  })();

  /* ══════════ 영상 — 보일 때만 재생 ══════════ */
  function initVideoObserver() {
    var vids = document.querySelectorAll("video");
    if (!("IntersectionObserver" in window)) return;
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) { v.play && v.play().catch(function () {}); }
        else { v.pause && v.pause(); }
      });
    }, { rootMargin: "60px 0px" });
    vids.forEach(function (v) { vio.observe(v); });
  }
  initVideoObserver();

})();
