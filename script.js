document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const svgNS = "http://www.w3.org/2000/svg";

  /* Preserved starfield */
  const canvas = document.getElementById("stars");
  const context = canvas.getContext("2d");
  const constellationSvg = document.getElementById("constellations");
  const tacticalGridSvg = document.getElementById("tac-grid");
  let stars = [];
  let starSizeScale = 1;
  let resizeTimer;

  function createStars() {
    const count = Math.round((canvas.width * canvas.height) / 5500);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.3 + 0.3,
      alpha: Math.random() * 0.5 + 0.35,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.008 + 0.003
    }));
  }

  function sizeCanvas() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * pixelRatio);
    canvas.height = Math.round(window.innerHeight * pixelRatio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    createStars();
  }

  function drawStars(time) {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    const targetStarSize = document.body.classList.contains("newspaper-is-open") ? 1.8 : 1;
    starSizeScale += (targetStarSize - starSizeScale) * (reduceMotion ? 1 : 0.045);

    stars.forEach((star) => {
      const twinkle = reduceMotion ? 0 : Math.sin(time * star.speed + star.phase) * 0.35;
      const alpha = Math.min(1, Math.max(0.08, star.alpha + twinkle));
      context.beginPath();
      context.arc(
        star.x / Math.min(window.devicePixelRatio || 1, 2),
        star.y / Math.min(window.devicePixelRatio || 1, 2),
        star.radius * starSizeScale,
        0,
        Math.PI * 2
      );
      context.fillStyle = `rgba(244, 241, 232, ${alpha.toFixed(3)})`;
      context.fill();
    });

    requestAnimationFrame(drawStars);
  }

  function svgElement(name, attributes, className) {
    const element = document.createElementNS(svgNS, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    if (className) element.setAttribute("class", className);
    return element;
  }

  function drawConstellations() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    constellationSvg.replaceChildren();
    constellationSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const clusters = [
      { x: width * 0.62, y: height * 0.22, count: 5, spread: 140 },
      { x: width * 0.8, y: height * 0.55, count: 4, spread: 120 },
      { x: width * 0.5, y: height * 0.7, count: 4, spread: 130 }
    ];

    clusters.forEach((cluster) => {
      const points = Array.from({ length: cluster.count }, () => ({
        x: cluster.x + (Math.random() - 0.5) * cluster.spread * 2,
        y: cluster.y + (Math.random() - 0.5) * cluster.spread * 2
      }));

      points.slice(0, -1).forEach((point, index) => {
        constellationSvg.appendChild(svgElement("line", {
          x1: point.x,
          y1: point.y,
          x2: points[index + 1].x,
          y2: points[index + 1].y
        }));
      });

      points.forEach((point) => {
        constellationSvg.appendChild(svgElement("circle", {
          cx: point.x,
          cy: point.y,
          r: 1.4
        }, "node"));
      });
    });
  }

  function drawTacticalGrid() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const spacing = Math.max(90, Math.round(width / 14));
    const centerX = width * 0.68;
    const centerY = height * 0.5;
    const outerRadius = width * 0.46;

    tacticalGridSvg.replaceChildren();
    tacticalGridSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    for (let x = 0; x <= width; x += spacing) {
      tacticalGridSvg.appendChild(svgElement("line", { x1: x, y1: 0, x2: x, y2: height }, "grid-line"));
    }

    for (let y = 0; y <= height; y += spacing) {
      tacticalGridSvg.appendChild(svgElement("line", { x1: 0, y1: y, x2: width, y2: y }, "grid-line"));
    }

    [0.16, 0.3, 0.46].forEach((radiusFactor, index) => {
      tacticalGridSvg.appendChild(svgElement("circle", {
        cx: centerX,
        cy: centerY,
        r: width * radiusFactor
      }, `ring${index % 2 ? " dashed" : ""}`));
    });

    tacticalGridSvg.appendChild(svgElement("line", {
      x1: centerX - outerRadius,
      y1: centerY,
      x2: centerX + outerRadius,
      y2: centerY
    }, "crosshair"));

    tacticalGridSvg.appendChild(svgElement("line", {
      x1: centerX,
      y1: centerY - outerRadius,
      x2: centerX,
      y2: centerY + outerRadius
    }, "crosshair"));

    [0, 90, 180, 270].forEach((degrees) => {
      const radians = degrees * Math.PI / 180;
      tacticalGridSvg.appendChild(svgElement("line", {
        x1: centerX + Math.cos(radians) * (outerRadius - 14),
        y1: centerY + Math.sin(radians) * (outerRadius - 14),
        x2: centerX + Math.cos(radians) * (outerRadius + 14),
        y2: centerY + Math.sin(radians) * (outerRadius + 14)
      }, "tick"));
    });
  }

  function redrawBackground() {
    sizeCanvas();
    drawConstellations();
    drawTacticalGrid();
  }

  redrawBackground();
  requestAnimationFrame(drawStars);

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(redrawBackground, 120);
  });

  /* A dedicated image wrapper keeps the sage outline separate from shadows. */
  document.querySelectorAll(".artifact-image").forEach((image) => {
    const visual = document.createElement("span");
    visual.className = "artifact-visual";
    image.before(visual);
    visual.appendChild(image);
  });

  /* Independent GSAP levitation and responsive shadows */
  const artifactConfigs = [
    { id: "item-map", distance: 6, duration: 3.6, phase: 0.06 },
    { id: "item-abacus", distance: 7, duration: 2.9, phase: 0.58 },
    { id: "item-book", distance: 6, duration: 3.2, phase: 0.31 },
    { id: "item-newspaper", distance: 7, duration: 3.9, phase: 0.82 }
  ];

  const motion = new Map();
  const shadowHigh = "drop-shadow(4px 24px 34px rgba(0, 0, 0, 0.72)) drop-shadow(-3px -2px 8px rgba(199, 186, 151, 0.07))";
  const shadowLow = "drop-shadow(-2px 16px 26px rgba(0, 0, 0, 0.68)) drop-shadow(-2px -1px 7px rgba(199, 186, 151, 0.045))";

  artifactConfigs.forEach((config) => {
    const element = document.getElementById(config.id);
    const image = element.querySelector(".artifact-image");
    if (reduceMotion) {
      motion.set(config.id, { float: null, swing: null });
      return;
    }

    gsap.set(element, { y: `-=${config.distance / 2}` });
    const float = gsap.timeline({
      repeat: -1,
      yoyo: true,
      defaults: { duration: config.duration, ease: "sine.inOut" }
    });

    float.to(element, { y: `+=${config.distance}` }, 0);
    float.fromTo(image, { filter: shadowHigh }, { filter: shadowLow }, 0);
    float.totalTime(config.phase * config.duration * 2, false);

    let swing = null;
    if (config.id === "item-map") {
      swing = gsap.fromTo(element,
        { rotation: -0.8 },
        {
          rotation: 0.8,
          duration: 4.4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          transformOrigin: "50% 14%"
        }
      );
    }

    motion.set(config.id, { float, swing });
  });

  function setMotionSpeed(entry, speed) {
    if (!entry) return;
    [entry.float, entry.swing].filter(Boolean).forEach((animation) => {
      gsap.to(animation, { timeScale: speed, duration: 0.28, overwrite: true });
    });
  }

  document.querySelectorAll(".artifact").forEach((element) => {
    const entry = motion.get(element.id);

    element.addEventListener("mouseenter", () => {
      if (
        document.body.classList.contains("map-is-open") ||
        document.body.classList.contains("newspaper-is-open") ||
        document.body.classList.contains("shop-is-open")
      ) return;
      setMotionSpeed(entry, 0);
      const hoverState = {
        scale: 1.04,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto"
      };
      gsap.to(element, hoverState);
    });

    element.addEventListener("mouseleave", () => {
      if (
        document.body.classList.contains("map-is-open") ||
        document.body.classList.contains("newspaper-is-open") ||
        document.body.classList.contains("shop-is-open")
      ) return;
      const restState = {
        scale: 1,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
        onComplete: () => setMotionSpeed(entry, 1)
      };
      gsap.to(element, restState);
    });
  });

  /* Nav items provide a quiet visual cue without changing the fixed layout */
  document.querySelectorAll("[data-focus-object]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.focusObject);
      if (!target) return;
      if (target.id === "item-map" || target.id === "item-abacus" || target.id === "item-newspaper") {
        target.click();
        return;
      }
      gsap.fromTo(target, { scale: 1 }, { scale: 1.04, duration: 0.35, yoyo: true, repeat: 1, ease: "power2.inOut" });
    });
  });

  /* Subtle play-button breathing */
  const playButton = document.getElementById("play-btn");
  const playPulse = reduceMotion ? null : gsap.to(playButton, {
    scale: 1.012,
    duration: 1.9,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
    transformOrigin: "50% 50%"
  });

  /* RP-posts: zoom the newspaper right and reveal a translucent feed panel */
  const newspaperItem = document.getElementById("item-newspaper");
  const newspaperExperience = document.getElementById("newspaper-experience");
  const newspaperPanel = newspaperExperience.querySelector(".rp-panel");
  const newspaperBack = document.getElementById("newspaper-back");
  const newspaperVisual = newspaperItem.querySelector(".artifact-visual");
  const newspaperMotion = motion.get("item-newspaper");
  const newspaperRestRotation = Number(gsap.getProperty(newspaperItem, "rotation")) || -3;
  const newspaperFadeElements = [
    document.getElementById("left-console"),
    document.getElementById("social"),
    document.getElementById("item-map"),
    document.getElementById("item-abacus"),
    document.getElementById("item-book")
  ];
  let newspaperTimeline = null;
  let newspaperOpenFloat = null;
  let newspaperIsTransitioning = false;
  let newspaperRouteTimer = null;

  const usesFileProtocol = window.location.protocol === "file:";

  function isNewspaperRoute() {
    if (usesFileProtocol) return /^#\/newspaper(?:\/[^/?#]+)?\/?$/.test(window.location.hash);
    return /\/newspaper(?:\/[^/?#]+)?\/?$/.test(window.location.pathname);
  }

  function getRpPostSlugFromRoute() {
    const route = usesFileProtocol ? window.location.hash : window.location.pathname;
    const match = route.match(/\/newspaper\/([^/?#]+)\/?$/);

    if (!match) return null;

    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }

  function pushNewspaperRoute() {
    const route = usesFileProtocol ? "#/newspaper" : "/newspaper";
    window.history.pushState(
      { ...window.history.state, civitumView: "newspaper", fromCivitumHome: true },
      "",
      route
    );
  }

  function pushRpPostRoute(slug) {
    const encodedSlug = encodeURIComponent(slug);
    const route = usesFileProtocol
      ? `#/newspaper/${encodedSlug}`
      : `/newspaper/${encodedSlug}`;
    const isSwitchingPost = Boolean(getRpPostSlugFromRoute());
    const fromNewspaperList = isSwitchingPost
      ? Boolean(window.history.state?.fromNewspaperList)
      : isNewspaperRoute();
    const historyMethod = isSwitchingPost ? "replaceState" : "pushState";

    window.history[historyMethod](
      {
        ...window.history.state,
        civitumView: "newspaper-post",
        rpSlug: slug,
        fromCivitumHome: false,
        fromNewspaperList
      },
      "",
      route
    );
  }

  function replaceWithNewspaperListRoute() {
    const route = usesFileProtocol ? "#/newspaper" : "/newspaper";

    window.history.replaceState(
      { ...window.history.state, civitumView: "newspaper", rpSlug: null, fromCivitumHome: false },
      "",
      route
    );
  }

  function replaceWithHomeRoute() {
    const route = usesFileProtocol
      ? `${window.location.pathname}${window.location.search}`
      : "/";

    window.history.replaceState(
      { ...window.history.state, civitumView: "home", fromCivitumHome: false },
      "",
      route
    );
  }

  /* Keep the RP interface visually identical at Full HD, 2K and 4K. */
  function syncNewspaperPanelScale() {
    const sceneScale = Math.max(
      0.72,
      Math.min(2.25, window.innerWidth / 1920)
    );

    newspaperPanel.style.width = `${100 / sceneScale}%`;
    newspaperPanel.style.height = `${100 / sceneScale}%`;
    newspaperPanel.style.fontSize = `${16 / sceneScale}px`;
    [11, 12, 13, 14, 15, 16, 20, 24, 36, 52].forEach((size) => {
      newspaperPanel.style.setProperty(`--rp-font-${size}`, `${size / sceneScale}px`);
      newspaperExperience.style.setProperty(`--rp-font-${size}`, `${size / sceneScale}px`);
    });
    newspaperPanel.style.transform = `scale(${sceneScale})`;
  }

  syncNewspaperPanelScale();
  window.addEventListener("resize", syncNewspaperPanelScale);

  function pauseArtifactMotion(entry) {
    [entry?.float, entry?.swing].filter(Boolean).forEach((animation) => animation.pause());
  }

  function resumeArtifactMotion(entry) {
    [entry?.float, entry?.swing].filter(Boolean).forEach((animation) => {
      animation.timeScale(1).resume();
    });
  }

  function openNewspaper(options = {}) {
    const updateHistory = options?.updateHistory !== false;

    if (
      newspaperIsTransitioning ||
      document.body.classList.contains("newspaper-is-open") ||
      document.body.classList.contains("map-is-open") ||
      document.body.classList.contains("shop-is-open")
    ) return;

    if (updateHistory && !isNewspaperRoute()) pushNewspaperRoute();

    newspaperIsTransitioning = true;
    document.body.classList.add("newspaper-is-open");
    gsap.killTweensOf(newspaperItem, "scale");
    pauseArtifactMotion(newspaperMotion);
    playPulse?.pause();

    const rect = newspaperItem.getBoundingClientRect();
    const currentX = Number(gsap.getProperty(newspaperItem, "x")) || 0;
    const currentY = Number(gsap.getProperty(newspaperItem, "y")) || 0;
    const targetScale = Math.min(2.05, Math.max(1.65, (window.innerHeight * 0.9) / newspaperItem.offsetHeight));
    const panelRight = newspaperExperience.getBoundingClientRect().right;
    const visibleNewspaperInset = newspaperItem.offsetWidth * targetScale * 0.37;
    const targetCenterX = Math.min(
      window.innerWidth * 0.82,
      panelRight - Math.min(28, window.innerWidth * 0.02) + visibleNewspaperInset
    );
    const targetCenterY = window.innerHeight * 0.54;

    newspaperExperience.classList.add("is-active");
    newspaperExperience.setAttribute("aria-hidden", "false");
    gsap.set(newspaperExperience, { opacity: 0, x: -54 });
    gsap.set(newspaperFadeElements, { pointerEvents: "none" });

    newspaperTimeline = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        newspaperIsTransitioning = false;
        if (!reduceMotion) {
          newspaperOpenFloat = gsap.to(newspaperVisual, {
            y: -5,
            duration: 3.25,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true
          });
        }
        syncRpPostRoute(false);
        if (!getRpPostSlugFromRoute()) newspaperBack.focus({ preventScroll: true });
      }
    });

    newspaperTimeline
      .to(newspaperFadeElements, { opacity: 0, duration: 0.46, stagger: 0.018 }, 0)
      .to(newspaperItem.querySelector(".artifact-label"), { opacity: 0, duration: 0.2 }, 0)
      .to(newspaperItem.querySelector(".object-glow"), { opacity: 0, duration: 0.3 }, 0)
      .to(newspaperVisual, {
        "--artifact-brightness": 0.58,
        duration: reduceMotion ? 0.01 : 0.42,
        ease: "power2.out"
      }, 0.04)
      .to(newspaperItem, {
        x: currentX + targetCenterX - (rect.left + rect.width / 2),
        y: currentY + targetCenterY - (rect.top + rect.height / 2),
        rotation: -5,
        scale: targetScale,
        zIndex: 8,
        duration: reduceMotion ? 0.01 : 1.05,
        ease: "expo.inOut"
      }, 0)
      .to(newspaperExperience, {
        opacity: 1,
        x: 0,
        duration: reduceMotion ? 0.01 : 0.7,
        ease: "power3.out"
      }, reduceMotion ? 0.01 : 0.34);
  }

  function closeNewspaper() {
    if (newspaperIsTransitioning || !document.body.classList.contains("newspaper-is-open")) return;
    newspaperIsTransitioning = true;
    newspaperTimeline?.kill();
    newspaperOpenFloat?.kill();
    newspaperOpenFloat = null;
    gsap.set(newspaperVisual, { y: 0 });

    const timeline = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        newspaperExperience.classList.remove("is-active");
        newspaperExperience.setAttribute("aria-hidden", "true");
        document.body.classList.remove("newspaper-is-open");
        gsap.set(newspaperExperience, { clearProps: "opacity,x" });
        gsap.set(newspaperItem, { clearProps: "x,y,rotation,scale,zIndex" });
        newspaperVisual.style.removeProperty("--artifact-brightness");
        gsap.set(newspaperVisual, { clearProps: "y,opacity" });
        gsap.set(newspaperItem.querySelector(".object-glow"), { clearProps: "opacity" });
        gsap.set(newspaperFadeElements, { clearProps: "opacity,pointerEvents" });
        resumeArtifactMotion(newspaperMotion);
        playPulse?.resume();
        hideRpPost(false);
        newspaperIsTransitioning = false;
        newspaperItem.focus({ preventScroll: true });
      }
    });

    timeline
      .to(newspaperExperience, { opacity: 0, x: -44, duration: reduceMotion ? 0.01 : 0.34 }, 0)
      .to(newspaperVisual, { "--artifact-brightness": 1, duration: reduceMotion ? 0.01 : 0.3 }, 0)
      .to(newspaperItem, {
        x: 0,
        y: 0,
        rotation: newspaperRestRotation,
        scale: 1,
        duration: reduceMotion ? 0.01 : 0.88,
        ease: "expo.inOut"
      }, 0.08)
      .to(newspaperFadeElements, { opacity: 1, duration: 0.46, stagger: 0.018 }, 0.38);
  }

  function requestCloseNewspaper() {
    if (newspaperIsTransitioning) return;

    if (
      isNewspaperRoute() &&
      window.history.state?.civitumView === "newspaper" &&
      window.history.state?.fromCivitumHome
    ) {
      window.history.back();
      return;
    }

    if (isNewspaperRoute()) replaceWithHomeRoute();
    closeNewspaper();
  }

  function syncNewspaperRoute() {
    window.clearTimeout(newspaperRouteTimer);

    if (newspaperIsTransitioning) {
      newspaperRouteTimer = window.setTimeout(syncNewspaperRoute, 60);
      return;
    }

    const shouldBeOpen = isNewspaperRoute();
    const isOpen = document.body.classList.contains("newspaper-is-open");

    if (shouldBeOpen && !isOpen) {
      openNewspaper({ updateHistory: false });
    } else if (!shouldBeOpen && isOpen) {
      closeNewspaper();
    } else if (shouldBeOpen && isOpen) {
      syncRpPostRoute();
    }
  }

  newspaperItem.addEventListener("click", openNewspaper);
  newspaperBack.addEventListener("click", requestCloseNewspaper);

  const startedOnNewspaperRoute = isNewspaperRoute();
  window.history.replaceState(
    {
      ...window.history.state,
      civitumView: startedOnNewspaperRoute ? "newspaper-direct" : "home",
      fromCivitumHome: false
    },
    "",
    window.location.href
  );

  window.addEventListener("popstate", syncNewspaperRoute);
  if (usesFileProtocol) window.addEventListener("hashchange", syncNewspaperRoute);

  if (startedOnNewspaperRoute) {
    window.requestAnimationFrame(() => openNewspaper({ updateHistory: false }));
  }

  /* Working search and category filters inside the RP feed */
  const rpSearchInput = document.getElementById("rp-search-input");
  const rpFilterButtons = [...document.querySelectorAll("[data-rp-filter]")];
  const rpCards = [...document.querySelectorAll(".rp-card")];
  const rpResultCount = document.getElementById("rp-result-count");
  const rpSplitter = document.getElementById("rp-splitter");
  const rpPostView = document.getElementById("rp-post-view");
  const rpPostBack = document.getElementById("rp-post-back");
  const rpPostVisual = document.getElementById("rp-post-visual");
  const rpPostVisualLabel = document.getElementById("rp-post-visual-label");
  const rpPostCategory = document.getElementById("rp-post-category");
  const rpPostDate = document.getElementById("rp-post-date");
  const rpPostTitle = document.getElementById("rp-post-title");
  const rpPostLead = document.getElementById("rp-post-lead");
  const rpPostBody = document.getElementById("rp-post-body");
  let activeRpFilter = "all";
  let rpSplitPercent = 70;
  let activeSplitPointer = null;

  function setRpSplitPercent(value) {
    rpSplitPercent = Math.min(75, Math.max(30, value));
    newspaperExperience.style.setProperty("--rp-left-width", `${rpSplitPercent.toFixed(2)}vw`);
    rpSplitter.setAttribute("aria-valuenow", String(Math.round(rpSplitPercent)));
    rpSplitter.setAttribute(
      "aria-valuetext",
      `Левое окно ${Math.round(rpSplitPercent)} процентов, правое ${Math.round(100 - rpSplitPercent)} процентов`
    );
  }

  function setRpSplitFromPointer(event) {
    const panelInset = newspaperExperience.getBoundingClientRect().left;
    setRpSplitPercent(((event.clientX - panelInset) / window.innerWidth) * 100);
  }

  function finishRpSplit(event) {
    if (event.pointerId !== activeSplitPointer) return;
    if (rpSplitter.hasPointerCapture(event.pointerId)) {
      rpSplitter.releasePointerCapture(event.pointerId);
    }
    activeSplitPointer = null;
    document.body.classList.remove("rp-split-resizing");
  }

  rpSplitter.addEventListener("pointerdown", (event) => {
    if (!newspaperExperience.classList.contains("is-reading") || window.innerWidth <= 1180) return;
    activeSplitPointer = event.pointerId;
    rpSplitter.setPointerCapture(event.pointerId);
    document.body.classList.add("rp-split-resizing");
    setRpSplitFromPointer(event);
    event.preventDefault();
  });

  rpSplitter.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activeSplitPointer) return;
    setRpSplitFromPointer(event);
  });

  rpSplitter.addEventListener("pointerup", finishRpSplit);
  rpSplitter.addEventListener("pointercancel", finishRpSplit);
  rpSplitter.addEventListener("dblclick", () => setRpSplitPercent(70));
  rpSplitter.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      setRpSplitPercent(rpSplitPercent - 2);
    } else if (event.key === "ArrowRight") {
      setRpSplitPercent(rpSplitPercent + 2);
    } else if (event.key === "Home") {
      setRpSplitPercent(30);
    } else if (event.key === "End") {
      setRpSplitPercent(75);
    } else {
      return;
    }
    event.preventDefault();
  });

  setRpSplitPercent(rpSplitPercent);

  const rpPostRecords = [
    {
      slug: "beregovoy-platsdarm",
      paragraphs: [
        "После восстановления линий связи штаб подтвердил устойчивое положение передовых подразделений. Наблюдательные пункты продолжают передавать сведения о движении сил в прибрежном секторе.",
        "Командирам предписано сохранять радиодисциплину и немедленно заносить изменения обстановки в полевой журнал."
      ]
    },
    {
      slug: "nochnoy-marsh-snabzheniya",
      paragraphs: [
        "Маршрут колонны проложен вдоль западного сектора. Движение начнётся после наступления темноты с соблюдением полного светомаскировочного режима.",
        "Ответственные за сопровождение проверяют интервалы между машинами, запас топлива и готовность временных пунктов разгрузки."
      ]
    },
    {
      slug: "obnovlenie-polevogo-ustava",
      paragraphs: [
        "Новая редакция уточняет порядок взаимодействия гражданских служб, гарнизона и полевых администраций в районах совместного размещения.",
        "Все подразделения должны ознакомиться с изменениями и передать подтверждение через установленный канал связи."
      ]
    },
    {
      slug: "severnaya-radioliniya",
      paragraphs: [
        "Северная радиолиния вновь принимает зарегистрированные позывные. Проведена проверка ретрансляторов и резервных источников питания.",
        "При возникновении помех операторам следует перейти на запасную частоту и зафиксировать время переключения в журнале связи."
      ]
    },
    {
      slug: "gorodskoy-sovet",
      paragraphs: [
        "Представители поселений обсудят распределение продовольствия, топлива и строительных материалов между гражданскими районами.",
        "Итоговый протокол заседания будет опубликован в общественной хронике после согласования делегациями."
      ]
    },
    {
      slug: "priem-polevyh-korrespondentov",
      paragraphs: [
        "Редакция открывает приём свидетельств участников событий, полевых заметок, фотографий и архивных документов.",
        "Каждый материал проходит проверку перед публикацией. Автору необходимо указать место, дату и обстоятельства создания записи."
      ]
    }
  ];

  function showRpPost(card, animate = true) {
    if (!card) return;

    const slug = card.dataset.rpSlug;
    const record = rpPostRecords.find((item) => item.slug === slug);
    const visual = card.querySelector(".rp-card-visual");
    const visualStyle = [...visual.classList].find((name) => name.startsWith("rp-card-visual--"));
    const category = card.querySelector(".rp-card-copy > div span");
    const date = card.querySelector("time");
    const title = card.querySelector("h3");
    const lead = card.querySelector("p");

    rpPostVisual.className = `rp-post-visual${visualStyle ? ` ${visualStyle}` : ""}`;
    rpPostVisualLabel.textContent = visual.textContent.trim();
    rpPostCategory.textContent = category.textContent;
    rpPostDate.textContent = date.textContent;
    rpPostDate.dateTime = date.dateTime;
    rpPostTitle.textContent = title.textContent;
    rpPostLead.textContent = lead.textContent;
    rpPostBody.replaceChildren();

    (record?.paragraphs || [lead.textContent]).forEach((text) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      rpPostBody.appendChild(paragraph);
    });

    newspaperPanel.classList.add("is-reading");
    newspaperExperience.classList.add("is-reading");
    rpCards.forEach((item) => {
      const isActive = item === card;
      item.classList.toggle("is-active", isActive);
      if (isActive) {
        item.setAttribute("aria-current", "page");
      } else {
        item.removeAttribute("aria-current");
      }
    });
    rpPostView.hidden = false;
    rpPostView.scrollTop = 0;

    gsap.killTweensOf(rpPostView);
    if (animate && !reduceMotion) {
      gsap.fromTo(rpPostView, { opacity: 0, x: 96 }, { opacity: 1, x: 0, duration: 0.46, ease: "power3.out" });
    } else {
      gsap.set(rpPostView, { opacity: 1, x: 0 });
    }

    rpPostBack.focus({ preventScroll: true });
  }

  function hideRpPost(animate = true) {
    if (rpPostView.hidden) {
      newspaperPanel.classList.remove("is-reading");
      newspaperExperience.classList.remove("is-reading");
      rpCards.forEach((item) => {
        item.classList.remove("is-active");
        item.removeAttribute("aria-current");
      });
      return;
    }

    const finish = () => {
      rpPostView.hidden = true;
      newspaperPanel.classList.remove("is-reading");
      newspaperExperience.classList.remove("is-reading");
      rpCards.forEach((item) => {
        item.classList.remove("is-active");
        item.removeAttribute("aria-current");
      });
      gsap.set(rpPostView, { clearProps: "opacity,x" });
    };

    gsap.killTweensOf(rpPostView);
    if (animate && !reduceMotion) {
      gsap.to(rpPostView, { opacity: 0, x: 72, duration: 0.28, ease: "power2.in", onComplete: finish });
    } else {
      finish();
    }
  }

  function syncRpPostRoute(animate = true) {
    const slug = getRpPostSlugFromRoute();

    if (!slug) {
      hideRpPost(animate);
      return;
    }

    const card = rpCards.find((item) => item.dataset.rpSlug === slug);
    if (!card) {
      replaceWithNewspaperListRoute();
      hideRpPost(false);
      return;
    }

    showRpPost(card, animate);
  }

  function openRpPost(card) {
    if (!card || newspaperIsTransitioning) return;
    pushRpPostRoute(card.dataset.rpSlug);
    syncRpPostRoute();
  }

  function requestRpPostBack() {
    if (
      window.history.state?.civitumView === "newspaper-post" &&
      window.history.state?.fromNewspaperList
    ) {
      window.history.back();
      return;
    }

    replaceWithNewspaperListRoute();
    syncRpPostRoute();
  }

  rpCards.forEach((card, index) => {
    const record = rpPostRecords[index];
    card.dataset.rpSlug = record.slug;
    card.tabIndex = 0;
    card.setAttribute("role", "link");
    card.setAttribute("aria-label", `Открыть публикацию: ${card.querySelector("h3").textContent}`);

    card.addEventListener("click", () => openRpPost(card));
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openRpPost(card);
    });
  });

  rpPostBack.addEventListener("click", requestRpPostBack);

  function updateRpFeed() {
    const query = rpSearchInput.value.trim().toLocaleLowerCase("ru");
    let visibleCount = 0;

    rpCards.forEach((card) => {
      const matchesFilter = activeRpFilter === "all" || card.dataset.rpCategory === activeRpFilter;
      const matchesQuery = !query || card.textContent.toLocaleLowerCase("ru").includes(query);
      const isVisible = matchesFilter && matchesQuery;
      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    rpResultCount.textContent = `${visibleCount} записей`;
  }

  rpFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeRpFilter = button.dataset.rpFilter;
      rpFilterButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      updateRpFeed();
    });
  });

  rpSearchInput.addEventListener("input", updateRpFeed);

  /* Immersive quartermaster shop opened by the abacus */
  const shopItem = document.getElementById("item-abacus");
  const shopExperience = document.getElementById("shop-experience");
  const shopPanel = shopExperience.querySelector(".shop-panel");
  const shopBack = document.getElementById("shop-back");
  const shopVisual = shopItem.querySelector(".artifact-visual");
  const shopMotion = motion.get("item-abacus");
  const shopSearchInput = document.getElementById("shop-search-input");
  const shopFilterButtons = [...document.querySelectorAll("[data-shop-filter]")];
  const shopCards = [...document.querySelectorAll(".shop-card")];
  const shopResultCount = document.getElementById("shop-result-count");
  const shopProductOverlay = document.getElementById("shop-product-overlay");
  const shopProductDialog = document.getElementById("shop-product-dialog");
  const shopProductClose = document.getElementById("shop-product-close");
  const shopProductSymbol = document.getElementById("shop-product-symbol");
  const shopProductCategory = document.getElementById("shop-product-category");
  const shopProductTitle = document.getElementById("shop-product-title");
  const shopProductDescription = document.getElementById("shop-product-description");
  const shopProductBenefitPrimary = document.getElementById("shop-product-benefit-primary");
  const shopProductVariantButtons = [...document.querySelectorAll("[data-shop-multiplier]")];
  const shopProductConfirm = document.getElementById("shop-product-confirm");
  const shopProductTotal = document.getElementById("shop-product-total");
  const shopProductSubmit = document.getElementById("shop-product-submit");
  const shopProductDialogTitle = shopProductDialog.querySelector(".shop-product-dialog__header h3");
  const shopProductStepPanels = [...document.querySelectorAll("[data-shop-product-step]")];
  const shopProductStepMarkers = [
    document.getElementById("shop-product-step-marker-1"),
    document.getElementById("shop-product-step-marker-2")
  ];
  const shopPaymentForm = document.getElementById("shop-payment-form");
  const shopPaymentSymbol = document.getElementById("shop-payment-symbol");
  const shopPaymentProduct = document.getElementById("shop-payment-product");
  const shopPaymentVariant = document.getElementById("shop-payment-variant");
  const shopPaymentPrice = document.getElementById("shop-payment-price");
  const shopPaymentNickname = document.getElementById("shop-payment-nickname");
  const shopPaymentBack = document.getElementById("shop-payment-back");
  const shopPaymentSubmit = document.getElementById("shop-payment-submit");
  const shopFadeElements = [
    document.getElementById("left-console"),
    document.getElementById("social"),
    document.getElementById("item-map"),
    document.getElementById("item-book"),
    document.getElementById("item-newspaper")
  ];
  const shopRestRotation = Number(gsap.getProperty(shopItem, "rotation")) || 6;
  let shopTimeline = null;
  let shopOpenFloat = null;
  let shopIsTransitioning = false;
  let shopRouteTimer = null;
  let activeShopFilter = "all";
  let activeShopProduct = null;
  let activeShopBasePrice = 0;
  let activeShopMultiplier = 1;
  let activeShopProductStep = 1;

  function isShopRoute() {
    if (usesFileProtocol) return /^#\/shop(?:\/[^/?#]+)?\/?$/.test(window.location.hash);
    return /\/shop(?:\/[^/?#]+)?\/?$/.test(window.location.pathname);
  }

  function getShopProductSlugFromRoute() {
    const route = usesFileProtocol ? window.location.hash : window.location.pathname;
    const match = route.match(/\/shop\/([^/?#]+)\/?$/);

    if (!match) return null;

    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }

  function pushShopRoute() {
    const route = usesFileProtocol ? "#/shop" : "/shop";
    window.history.pushState(
      { ...window.history.state, civitumView: "shop", fromCivitumHome: true },
      "",
      route
    );
  }

  function pushShopProductRoute(slug) {
    const encodedSlug = encodeURIComponent(slug);
    const route = usesFileProtocol ? `#/shop/${encodedSlug}` : `/shop/${encodedSlug}`;
    const isSwitchingProduct = Boolean(getShopProductSlugFromRoute());
    const fromShopList = isSwitchingProduct
      ? Boolean(window.history.state?.fromShopList)
      : isShopRoute();
    const historyMethod = isSwitchingProduct ? "replaceState" : "pushState";

    window.history[historyMethod](
      {
        ...window.history.state,
        civitumView: "shop-product",
        shopSlug: slug,
        fromCivitumHome: false,
        fromShopList
      },
      "",
      route
    );
  }

  function replaceWithShopListRoute() {
    const route = usesFileProtocol ? "#/shop" : "/shop";
    window.history.replaceState(
      { ...window.history.state, civitumView: "shop", shopSlug: null, fromShopList: false },
      "",
      route
    );
  }

  function syncShopPanelScale() {
    const sceneScale = Math.max(0.72, Math.min(2.25, window.innerWidth / 1920));

    shopPanel.style.width = `${100 / sceneScale}%`;
    shopPanel.style.height = `${100 / sceneScale}%`;
    shopPanel.style.fontSize = `${16 / sceneScale}px`;
    [11, 12, 13, 14, 16, 20, 24, 42].forEach((size) => {
      shopPanel.style.setProperty(`--shop-font-${size}`, `${size / sceneScale}px`);
    });
    shopPanel.style.transform = `scale(${sceneScale})`;
  }

  function formatShopPrice(value) {
    return `${Math.round(value).toLocaleString("ru-RU")} ₽`;
  }

  function getShopCardPrice(card) {
    const priceText = card.querySelector(".shop-card-copy strong")?.textContent || "0";
    const match = priceText.replace(/\s/g, "").match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  function getActiveShopPrice() {
    return activeShopBasePrice * activeShopMultiplier;
  }

  function getActiveShopVariantButton() {
    return shopProductVariantButtons.find((button) => button.getAttribute("aria-pressed") === "true")
      || shopProductVariantButtons[0];
  }

  function syncShopPaymentSummary() {
    const selectedVariant = getActiveShopVariantButton();
    const price = formatShopPrice(getActiveShopPrice());

    shopPaymentSymbol.className = shopProductSymbol.className.replace("shop-product-symbol", "shop-payment-symbol");
    shopPaymentSymbol.textContent = shopProductSymbol.textContent;
    shopPaymentProduct.textContent = shopProductTitle.textContent;
    shopPaymentVariant.textContent = selectedVariant?.querySelector("span")?.textContent || "Стандарт";
    shopPaymentPrice.textContent = price;
    shopPaymentSubmit.textContent = `Оплатить ${price}`;
    shopPaymentSubmit.classList.remove("is-complete");
    shopPaymentSubmit.disabled = false;
  }

  function setShopProductStep(step, animate = true) {
    const nextStep = step === 2 ? 2 : 1;
    activeShopProductStep = nextStep;

    if (nextStep === 2) syncShopPaymentSummary();

    shopProductStepMarkers.forEach((marker, index) => {
      marker.classList.toggle("is-current", index + 1 === nextStep);
    });
    shopProductDialogTitle.textContent = nextStep === 2 ? "Оплата покупки" : "Детали поставки";
    shopProductDialog.dataset.step = String(nextStep);

    shopProductStepPanels.forEach((panel) => {
      const isCurrent = Number(panel.dataset.shopProductStep) === nextStep;
      panel.hidden = !isCurrent;
      if (!isCurrent) gsap.set(panel, { clearProps: "opacity,x,y" });
    });

    const activePanel = shopProductStepPanels.find((panel) => !panel.hidden);
    if (animate && !reduceMotion && activePanel) {
      gsap.fromTo(
        activePanel,
        { opacity: 0, x: nextStep === 2 ? 24 : -24 },
        { opacity: 1, x: 0, duration: 0.32, ease: "power3.out", clearProps: "opacity,x" }
      );
    }

    if (nextStep === 2) {
      shopPaymentNickname.focus({ preventScroll: true });
    } else if (animate) {
      shopProductSubmit.focus({ preventScroll: true });
    }
  }

  function updateShopProductVariant(button) {
    if (!button) return;
    activeShopMultiplier = Number(button.dataset.shopMultiplier) || 1;
    shopProductVariantButtons.forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });
    shopProductTotal.textContent = formatShopPrice(getActiveShopPrice());
    if (activeShopProductStep === 2) syncShopPaymentSummary();
  }

  function showShopProduct(card, animate = true) {
    if (!card) return;

    activeShopProduct = card;
    activeShopBasePrice = getShopCardPrice(card);
    activeShopMultiplier = 1;

    const visual = card.querySelector(".shop-card-visual");
    const visualStyle = [...visual.classList].find((name) => name.startsWith("shop-card-visual--"));
    const category = card.querySelector(".shop-card-category")?.textContent.trim() || "Снабжение";
    const title = card.querySelector("h3")?.textContent.trim() || "Товар";
    const description = card.querySelector("p")?.textContent.trim() || "Позиция интендантского склада.";
    const categoryKey = card.dataset.shopCategory || "other";
    const labelsByCategory = {
      currency: ["50 шт.", "150 шт.", "500 шт."],
      privileges: ["7 дней", "30 дней", "Навсегда"],
      cases: ["1 кейс", "3 кейса", "10 кейсов"],
      kits: ["Стандарт", "Усиленный", "Арсенал"],
      other: ["Разовая", "Расширенная", "Постоянная"]
    };
    const variantLabels = labelsByCategory[categoryKey] || labelsByCategory.other;

    shopProductSymbol.className = `shop-product-symbol${visualStyle ? ` ${visualStyle}` : ""}`;
    shopProductSymbol.textContent = visual.textContent.trim();
    shopProductCategory.textContent = category;
    shopProductTitle.textContent = title;
    shopProductDescription.textContent = description;
    shopProductBenefitPrimary.textContent = description;

    shopProductVariantButtons.forEach((button, index) => {
      const multiplier = Number(button.dataset.shopMultiplier) || 1;
      button.querySelector("span").textContent = variantLabels[index];
      button.querySelector("strong").textContent = formatShopPrice(activeShopBasePrice * multiplier);
      button.setAttribute("aria-pressed", String(index === 0));
    });

    shopProductConfirm.checked = false;
    shopProductSubmit.disabled = true;
    shopProductSubmit.classList.remove("is-added");
    shopProductSubmit.textContent = "Оплатить";
    shopProductTotal.textContent = formatShopPrice(activeShopBasePrice);
    shopPaymentForm.reset();
    setShopProductStep(1, false);

    shopCards.forEach((item) => item.classList.toggle("is-selected", item === card));

    const wasHidden = shopProductOverlay.hidden;
    shopProductOverlay.hidden = false;
    gsap.killTweensOf([shopProductOverlay, shopProductDialog]);

    if (animate && !reduceMotion) {
      if (wasHidden) {
        gsap.fromTo(shopProductOverlay, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: "power2.out" });
        gsap.fromTo(
          shopProductDialog,
          { opacity: 0, y: 28, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power3.out" }
        );
      } else {
        gsap.fromTo(shopProductDialog, { opacity: 0.45, y: 10 }, { opacity: 1, y: 0, duration: 0.24, ease: "power2.out" });
      }
    } else {
      gsap.set([shopProductOverlay, shopProductDialog], { opacity: 1 });
      gsap.set(shopProductDialog, { y: 0, scale: 1 });
    }

    shopProductClose.focus({ preventScroll: true });
  }

  function hideShopProduct(animate = true) {
    if (shopProductOverlay.hidden) {
      activeShopProduct = null;
      shopCards.forEach((item) => item.classList.remove("is-selected"));
      return;
    }

    const finish = () => {
      shopProductOverlay.hidden = true;
      activeShopProduct = null;
      activeShopProductStep = 1;
      shopCards.forEach((item) => item.classList.remove("is-selected"));
      gsap.set([shopProductOverlay, shopProductDialog], { clearProps: "opacity,y,scale" });
    };

    gsap.killTweensOf([shopProductOverlay, shopProductDialog]);
    if (animate && !reduceMotion) {
      gsap.to(shopProductDialog, { opacity: 0, y: 20, scale: 0.98, duration: 0.22, ease: "power2.in" });
      gsap.to(shopProductOverlay, { opacity: 0, duration: 0.24, ease: "power2.in", onComplete: finish });
    } else {
      finish();
    }
  }

  function syncShopProductRoute(animate = true) {
    const slug = getShopProductSlugFromRoute();

    if (!slug) {
      hideShopProduct(animate);
      return;
    }

    const card = shopCards.find((item) => item.dataset.shopSlug === slug);
    if (!card) {
      replaceWithShopListRoute();
      hideShopProduct(false);
      return;
    }

    showShopProduct(card, animate);
  }

  function openShopProduct(card) {
    if (!card || shopIsTransitioning) return;
    pushShopProductRoute(card.dataset.shopSlug);
    syncShopProductRoute();
  }

  function requestCloseShopProduct() {
    if (
      window.history.state?.civitumView === "shop-product" &&
      window.history.state?.fromShopList
    ) {
      window.history.back();
      return;
    }

    replaceWithShopListRoute();
    syncShopProductRoute();
  }

  function openShop(options = {}) {
    const updateHistory = options?.updateHistory !== false;

    if (
      shopIsTransitioning ||
      document.body.classList.contains("shop-is-open") ||
      document.body.classList.contains("map-is-open") ||
      document.body.classList.contains("newspaper-is-open")
    ) return;

    if (updateHistory && !isShopRoute()) pushShopRoute();

    shopIsTransitioning = true;
    document.body.classList.add("shop-is-open");
    gsap.killTweensOf(shopItem, "scale");
    pauseArtifactMotion(shopMotion);
    playPulse?.pause();

    const rect = shopItem.getBoundingClientRect();
    const currentX = Number(gsap.getProperty(shopItem, "x")) || 0;
    const currentY = Number(gsap.getProperty(shopItem, "y")) || 0;
    const targetScale = Math.min(2.25, Math.max(1.65, (window.innerHeight * 0.7) / shopItem.offsetHeight));
    const targetCenterX = window.innerWidth * 0.86;
    const targetCenterY = window.innerHeight * 0.53;

    shopExperience.classList.add("is-active");
    shopExperience.setAttribute("aria-hidden", "false");
    gsap.set(shopExperience, { opacity: 0, x: -54 });
    gsap.set(shopFadeElements, { pointerEvents: "none" });

    shopTimeline = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        shopIsTransitioning = false;
        if (!reduceMotion) {
          shopOpenFloat = gsap.to(shopVisual, {
            y: -5,
            duration: 3.1,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true
          });
        }
        syncShopProductRoute(false);
        if (!getShopProductSlugFromRoute()) shopBack.focus({ preventScroll: true });
      }
    });

    shopTimeline
      .to(shopFadeElements, { opacity: 0, duration: 0.46, stagger: 0.018 }, 0)
      .to(shopItem.querySelector(".artifact-label"), { opacity: 0, duration: 0.2 }, 0)
      .to(shopItem.querySelector(".object-glow"), { opacity: 0, duration: 0.3 }, 0)
      .to(shopVisual, {
        "--artifact-brightness": 0.62,
        duration: reduceMotion ? 0.01 : 0.42,
        ease: "power2.out"
      }, 0.04)
      .to(shopItem, {
        x: currentX + targetCenterX - (rect.left + rect.width / 2),
        y: currentY + targetCenterY - (rect.top + rect.height / 2),
        rotation: 4,
        scale: targetScale,
        zIndex: 13,
        duration: reduceMotion ? 0.01 : 1.02,
        ease: "expo.inOut"
      }, 0)
      .to(shopExperience, {
        opacity: 1,
        x: 0,
        duration: reduceMotion ? 0.01 : 0.7,
        ease: "power3.out"
      }, reduceMotion ? 0.01 : 0.32);
  }

  function closeShop() {
    if (shopIsTransitioning || !document.body.classList.contains("shop-is-open")) return;
    shopIsTransitioning = true;
    shopTimeline?.kill();
    shopOpenFloat?.kill();
    shopOpenFloat = null;
    gsap.set(shopVisual, { y: 0 });

    const timeline = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        shopExperience.classList.remove("is-active");
        shopExperience.setAttribute("aria-hidden", "true");
        document.body.classList.remove("shop-is-open");
        gsap.set(shopExperience, { clearProps: "opacity,x" });
        gsap.set(shopItem, { clearProps: "x,y,rotation,scale,zIndex" });
        shopVisual.style.removeProperty("--artifact-brightness");
        gsap.set(shopVisual, { clearProps: "y,opacity" });
        gsap.set(shopItem.querySelector(".object-glow"), { clearProps: "opacity" });
        gsap.set(shopFadeElements, { clearProps: "opacity,pointerEvents" });
        hideShopProduct(false);
        resumeArtifactMotion(shopMotion);
        playPulse?.resume();
        shopIsTransitioning = false;
        shopItem.focus({ preventScroll: true });
      }
    });

    timeline
      .to(shopExperience, { opacity: 0, x: -44, duration: reduceMotion ? 0.01 : 0.34 }, 0)
      .to(shopVisual, { "--artifact-brightness": 1, duration: reduceMotion ? 0.01 : 0.3 }, 0)
      .to(shopItem, {
        x: 0,
        y: 0,
        rotation: shopRestRotation,
        scale: 1,
        duration: reduceMotion ? 0.01 : 0.9,
        ease: "expo.inOut"
      }, 0.08)
      .to(shopFadeElements, { opacity: 1, duration: 0.46, stagger: 0.018 }, 0.38);
  }

  function requestCloseShop() {
    if (shopIsTransitioning) return;

    if (
      isShopRoute() &&
      window.history.state?.civitumView === "shop" &&
      window.history.state?.fromCivitumHome
    ) {
      window.history.back();
      return;
    }

    if (isShopRoute()) replaceWithHomeRoute();
    closeShop();
  }

  function syncShopRoute() {
    window.clearTimeout(shopRouteTimer);

    if (shopIsTransitioning) {
      shopRouteTimer = window.setTimeout(syncShopRoute, 60);
      return;
    }

    const shouldBeOpen = isShopRoute();
    const isOpen = document.body.classList.contains("shop-is-open");

    if (shouldBeOpen && !isOpen) {
      openShop({ updateHistory: false });
    } else if (!shouldBeOpen && isOpen) {
      closeShop();
    } else if (shouldBeOpen && isOpen) {
      syncShopProductRoute();
    }
  }

  function updateShopGrid() {
    const query = shopSearchInput.value.trim().toLocaleLowerCase("ru");
    let visibleCount = 0;

    shopCards.forEach((card) => {
      const matchesFilter = activeShopFilter === "all" || card.dataset.shopCategory === activeShopFilter;
      const matchesQuery = !query || card.textContent.toLocaleLowerCase("ru").includes(query);
      const isVisible = matchesFilter && matchesQuery;
      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    const countWord = visibleCount % 10 === 1 && visibleCount % 100 !== 11
      ? "товар"
      : [2, 3, 4].includes(visibleCount % 10) && ![12, 13, 14].includes(visibleCount % 100)
        ? "товара"
        : "товаров";
    shopResultCount.textContent = `${visibleCount} ${countWord}`;
  }

  shopFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeShopFilter = button.dataset.shopFilter;
      shopFilterButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      updateShopGrid();
    });
  });

  shopSearchInput.addEventListener("input", updateShopGrid);

  function setShopCartState(card, isAdded) {
    const button = card?.querySelector(".shop-buy");
    if (!button) return;
    button.classList.toggle("is-added", isAdded);
    button.textContent = isAdded ? "Добавлено" : "В корзину";
    button.setAttribute("aria-pressed", String(isAdded));
  }

  shopCards.forEach((card) => {
    card.tabIndex = 0;
    card.setAttribute("role", "link");
    card.setAttribute("aria-label", `Открыть детали товара: ${card.querySelector("h3").textContent}`);
    card.addEventListener("click", () => openShopProduct(card));
    card.addEventListener("keydown", (event) => {
      if (event.target !== card || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      openShopProduct(card);
    });
  });

  document.querySelectorAll(".shop-buy").forEach((button) => {
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const card = button.closest(".shop-card");
      setShopCartState(card, !button.classList.contains("is-added"));
    });
  });

  shopProductVariantButtons.forEach((button) => {
    button.addEventListener("click", () => updateShopProductVariant(button));
  });

  shopProductConfirm.addEventListener("change", () => {
    shopProductSubmit.disabled = !shopProductConfirm.checked;
  });

  shopProductSubmit.addEventListener("click", () => {
    if (!activeShopProduct || shopProductSubmit.disabled) return;
    setShopProductStep(2);
  });

  shopPaymentBack.addEventListener("click", () => setShopProductStep(1));

  shopPaymentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!activeShopProduct || !shopPaymentForm.reportValidity()) return;

    shopPaymentSubmit.disabled = true;
    shopPaymentSubmit.classList.add("is-complete");
    shopPaymentSubmit.textContent = "Платёж подготовлен";
  });

  shopProductClose.addEventListener("click", requestCloseShopProduct);
  shopProductOverlay.addEventListener("click", (event) => {
    if (event.target === shopProductOverlay) requestCloseShopProduct();
  });

  shopItem.addEventListener("click", openShop);
  shopBack.addEventListener("click", requestCloseShop);
  window.addEventListener("popstate", syncShopRoute);
  if (usesFileProtocol) window.addEventListener("hashchange", syncShopRoute);
  syncShopPanelScale();
  window.addEventListener("resize", syncShopPanelScale);

  const startedOnShopRoute = isShopRoute();
  if (startedOnShopRoute) {
    window.history.replaceState(
      { ...window.history.state, civitumView: "shop-direct", fromCivitumHome: false },
      "",
      window.location.href
    );
    window.requestAnimationFrame(() => openShop({ updateHistory: false }));
  }

  /* Immersive map zoom */
  const mapItem = document.getElementById("item-map");
  const mapExperience = document.getElementById("map-experience");
  const mapFrame = document.getElementById("map-frame");
  const mapBack = document.getElementById("map-back");
  const mapMotion = motion.get("item-map");
  const interfaceElements = [
    document.getElementById("topbar"),
    document.getElementById("left-console"),
    document.getElementById("social"),
    document.getElementById("item-abacus"),
    document.getElementById("item-book"),
    document.getElementById("item-newspaper")
  ];
  let mapTimeline = null;
  let mapIsTransitioning = false;

  function stopMapMotion() {
    [mapMotion?.float, mapMotion?.swing].filter(Boolean).forEach((animation) => {
      animation.pause();
    });
  }

  function resumeMapMotion() {
    [mapMotion?.float, mapMotion?.swing].filter(Boolean).forEach((animation) => {
      animation.timeScale(1).resume();
    });
  }

  function openMap() {
    if (
      mapIsTransitioning ||
      document.body.classList.contains("map-is-open") ||
      document.body.classList.contains("newspaper-is-open") ||
      document.body.classList.contains("shop-is-open")
    ) return;
    mapIsTransitioning = true;
    document.body.classList.add("map-is-open");
    stopMapMotion();
    playPulse?.pause();

    const rect = mapItem.getBoundingClientRect();
    const currentX = Number(gsap.getProperty(mapItem, "x")) || 0;
    const currentY = Number(gsap.getProperty(mapItem, "y")) || 0;
    const centerOffsetX = window.innerWidth / 2 - (rect.left + rect.width / 2);
    const centerOffsetY = window.innerHeight / 2 - (rect.top + rect.height / 2);

    // The actual paper occupies about 82% x 72.4% of the transparent PNG.
    // Scaling against that inner rectangle sends the frame beyond every edge.
    const paperWidth = mapItem.offsetWidth * 0.82;
    const paperHeight = mapItem.offsetHeight * 0.724;
    const coverScale = Math.max(
      window.innerWidth / paperWidth,
      window.innerHeight / paperHeight
    ) * 1.04;

    mapExperience.classList.add("is-active");
    mapExperience.setAttribute("aria-hidden", "false");
    gsap.set(mapExperience, { opacity: 0 });
    gsap.set(mapFrame, { opacity: 0 });

    mapTimeline = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        mapIsTransitioning = false;
      }
    });

    mapTimeline
      .to(interfaceElements, { opacity: 0, duration: 0.5, stagger: 0.015 }, 0)
      .to(mapItem.querySelector(".artifact-label"), { opacity: 0, duration: 0.2 }, 0)
      .to(mapItem.querySelector(".object-glow"), { opacity: 0.16, duration: 0.7 }, 0)
      .to(mapItem, {
        x: currentX + centerOffsetX,
        y: currentY + centerOffsetY,
        rotation: 0,
        scale: coverScale,
        duration: reduceMotion ? 0.01 : 1.2,
        ease: "expo.inOut"
      }, 0)
      .to("#sky", { opacity: 0.14, duration: 0.9 }, 0.12)
      .to(mapExperience, { opacity: 1, duration: 0.22 }, reduceMotion ? 0.01 : 1.16)
      .to(mapFrame, { opacity: 1, duration: 0.42, ease: "power2.out" }, reduceMotion ? 0.02 : 1.2)
      .set(mapItem, { visibility: "hidden" });
  }

  function closeMap() {
    if (mapIsTransitioning || !document.body.classList.contains("map-is-open")) return;
    mapIsTransitioning = true;
    mapTimeline?.kill();
    gsap.set(mapItem, { visibility: "visible" });

    const timeline = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        mapExperience.classList.remove("is-active");
        mapExperience.setAttribute("aria-hidden", "true");
        document.body.classList.remove("map-is-open");
        gsap.set(mapExperience, { opacity: 0 });
        gsap.set(mapFrame, { opacity: 0 });
        gsap.set(mapItem, { clearProps: "x,y,rotation,scale" });
        gsap.set(mapItem.querySelector(".object-glow"), { clearProps: "opacity" });
        resumeMapMotion();
        playPulse?.resume();
        mapIsTransitioning = false;
      }
    });

    timeline
      .to(mapFrame, { opacity: 0, duration: 0.22 }, 0)
      .to(mapExperience, { opacity: 0, duration: 0.32 }, 0.08)
      .to(mapItem, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        duration: reduceMotion ? 0.01 : 0.95,
        ease: "expo.inOut"
      }, 0.12)
      .to("#sky", { opacity: 1, duration: 0.55 }, 0.38)
      .to(interfaceElements, { opacity: 1, duration: 0.5, stagger: 0.015 }, 0.48);
  }

  mapItem.addEventListener("click", openMap);
  mapBack.addEventListener("click", closeMap);
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (document.body.classList.contains("newspaper-is-open")) {
      if (getRpPostSlugFromRoute()) {
        requestRpPostBack();
      } else {
        requestCloseNewspaper();
      }
    } else if (document.body.classList.contains("shop-is-open")) {
      if (getShopProductSlugFromRoute()) {
        if (activeShopProductStep === 2) {
          setShopProductStep(1);
        } else {
          requestCloseShopProduct();
        }
      } else {
        requestCloseShop();
      }
    } else {
      closeMap();
    }
  });
});
