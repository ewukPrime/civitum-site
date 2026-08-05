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
        document.body.classList.contains("newspaper-is-open")
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
        document.body.classList.contains("newspaper-is-open")
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
      if (target.id === "item-map" || target.id === "item-newspaper") {
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

  function openNewspaper() {
    if (
      newspaperIsTransitioning ||
      document.body.classList.contains("newspaper-is-open") ||
      document.body.classList.contains("map-is-open")
    ) return;

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
          gsap.set(newspaperVisual, { y: -4 });
          newspaperOpenFloat = gsap.to(newspaperVisual, {
            y: 5,
            duration: 3.25,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true
          });
        }
        newspaperBack.focus({ preventScroll: true });
      }
    });

    newspaperTimeline
      .to(newspaperFadeElements, { opacity: 0, duration: 0.46, stagger: 0.018 }, 0)
      .to(newspaperItem.querySelector(".artifact-label"), { opacity: 0, duration: 0.2 }, 0)
      .to(newspaperItem.querySelector(".object-glow"), { opacity: 0, duration: 0.3 }, 0)
      .to(newspaperVisual, {
        "--artifact-brightness": 0.68,
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

  newspaperItem.addEventListener("click", openNewspaper);
  newspaperBack.addEventListener("click", closeNewspaper);

  /* Working search and category filters inside the RP feed */
  const rpSearchInput = document.getElementById("rp-search-input");
  const rpFilterButtons = [...document.querySelectorAll("[data-rp-filter]")];
  const rpCards = [...document.querySelectorAll(".rp-card")];
  const rpResultCount = document.getElementById("rp-result-count");
  let activeRpFilter = "all";

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
      document.body.classList.contains("newspaper-is-open")
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
      closeNewspaper();
    } else {
      closeMap();
    }
  });
});
