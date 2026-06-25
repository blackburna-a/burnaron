/* Runs the short intro screen before the main portfolio is shown. */
const bootScreen = document.querySelector("#bootScreen");
const bootSkip = document.querySelector("#bootSkip");
const bootStatus = document.querySelector("#bootStatus");
const bootCycle = document.querySelector("#bootCycle");
const bootStepText = document.querySelector("#bootStepText");
const bootCompletedSteps = document.querySelector("#bootCompletedSteps");
const bootProgress = document.querySelector("#bootProgress");
const bootProgressBar = document.querySelector("#bootProgressBar");
const bgmAudio = document.querySelector("#bgmAudio");
const bgmToggle = document.querySelector("#bgmToggle");
const interfaceClickAudio = new Audio("assets/audio/click.mp3");
const interfaceCloseAudio = new Audio("assets/audio/click-close.mp3");
const interfaceWarningAudio = new Audio("assets/audio/beep_warning.mp3");

let activeBootStep = null;
let bootProgressTimer = null;
const siteEntryStorageKey = "burnaronSiteEntered";
let siteWasEnteredBeforeLoad = false;

try {
  siteWasEnteredBeforeLoad = sessionStorage.getItem(siteEntryStorageKey) === "true";
  sessionStorage.setItem(siteEntryStorageKey, "true");
} catch {
  siteWasEnteredBeforeLoad = false;
}

interfaceClickAudio.preload = "auto";
interfaceClickAudio.volume = 0.58;

interfaceCloseAudio.preload = "auto";
interfaceCloseAudio.volume = 0.54;

interfaceWarningAudio.preload = "auto";
interfaceWarningAudio.volume = 0.64;

let bgmNeedsUserStart = false;
let bgmMuted = false;

try {
  bgmMuted = localStorage.getItem("burnaronBgmMuted") === "true";
} catch {
  bgmMuted = false;
}

if (bgmAudio) {
  bgmAudio.preload = "auto";
  bgmAudio.loop = true;
  bgmAudio.volume = 0.08;
  bgmAudio.muted = bgmMuted;
}

// Sets the background audio button label and pressed state.
function updateBgmToggle() {
  if (!bgmToggle) return;

  const needsPlay = !bgmMuted && (!bgmAudio || bgmNeedsUserStart || bgmAudio.paused);

  bgmToggle.textContent = bgmMuted ? "Unmute BGM" : needsPlay ? "Play BGM" : "Mute BGM";
  bgmToggle.setAttribute("aria-pressed", String(bgmMuted));
}

// Stores and applies the background audio mute state.
function setBgmMuted(isMuted) {
  bgmMuted = isMuted;

  if (bgmAudio) {
    bgmAudio.muted = bgmMuted;
  }

  try {
    localStorage.setItem("burnaronBgmMuted", String(bgmMuted));
  } catch {}

  if (bgmMuted) {
    bgmNeedsUserStart = false;
  }

  updateBgmToggle();
}

// Starts the background audio loop when playback is permitted.
function startBgmAudio() {
  if (!bgmAudio || bgmMuted) {
    updateBgmToggle();
    return;
  }

  const playback = bgmAudio.play();

  if (playback && typeof playback.then === "function") {
    playback
      .then(() => {
        bgmNeedsUserStart = false;
        updateBgmToggle();
      })
      .catch(() => {
        bgmNeedsUserStart = true;
        updateBgmToggle();
      });

    return;
  }

  bgmNeedsUserStart = false;
  updateBgmToggle();
}

// Toggles background audio without resetting the loop position.
function toggleBgmAudio() {
  if (!bgmAudio) return;

  if (bgmMuted) {
    setBgmMuted(false);
    startBgmAudio();
    return;
  }

  if (bgmNeedsUserStart || bgmAudio.paused) {
    bgmNeedsUserStart = false;
    startBgmAudio();
    return;
  }

  setBgmMuted(true);
}

if (bgmAudio) {
  bgmAudio.addEventListener("play", () => {
    bgmNeedsUserStart = false;
    updateBgmToggle();
  });

  bgmAudio.addEventListener("pause", updateBgmToggle);
}

updateBgmToggle();

// Plays one of the supplied click sounds.
function playInterfaceClickSound(soundType = "default") {
  const sourceAudio = soundType === "close" ? interfaceCloseAudio : interfaceClickAudio;
  const audio = sourceAudio.cloneNode();

  audio.volume = sourceAudio.volume;

  const playback = audio.play();

  if (playback && typeof playback.catch === "function") {
    playback.catch(() => {});
  }
}

let lastWarningSoundAt = 0;

function playInterfaceWarningSound() {
  const now = Date.now();

  if (now - lastWarningSoundAt < 260) return;

  lastWarningSoundAt = now;

  try {
    interfaceWarningAudio.pause();
    interfaceWarningAudio.currentTime = 0;
  } catch {}

  const playback = interfaceWarningAudio.play();

  if (playback && typeof playback.catch === "function") {
    playback.catch(() => {});
  }
}

const bootScrollKeys = new Set([
  "ArrowDown",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
  " "
]);

// Checks whether the startup screen is still controlling the page.
function isBootActive() {
  return document.documentElement.classList.contains("booting") || document.body.classList.contains("booting");
}

// Prevents wheel, touch, and keyboard scrolling while the startup screen is active.
function preventBootScroll(event) {
  if (isBootActive()) {
    event.preventDefault();
  }
}

// Prevents keyboard scroll shortcuts while leaving normal keyboard navigation available.
function preventBootKeyScroll(event) {
  if (isBootActive() && bootScrollKeys.has(event.key)) {
    event.preventDefault();
  }
}

// Enables page scrolling after the startup screen has finished.
function unlockBootScroll() {
  document.documentElement.classList.remove("booting");
  document.body.classList.remove("booting");
  window.removeEventListener("wheel", preventBootScroll);
  window.removeEventListener("touchmove", preventBootScroll);
  window.removeEventListener("keydown", preventBootKeyScroll);
}

// Sets the progress bar width and the centered percentage label.
function setBootProgress(value) {
  const progressValue = Math.max(0, Math.min(100, Math.round(value)));

  if (bootProgress) {
    bootProgress.textContent = `${progressValue}%`;
  }

  if (bootProgressBar) {
    bootProgressBar.style.width = `${progressValue}%`;
  }
}

// Runs small timed progress updates during the startup screen.
function startBootProgress(duration) {
  const startedAt = window.performance.now();

  setBootProgress(0);

  bootProgressTimer = window.setInterval(() => {
    const elapsed = window.performance.now() - startedAt;
    const progressValue = Math.min(100, (elapsed / duration) * 100);

    setBootProgress(progressValue);

    if (progressValue >= 100) {
      window.clearInterval(bootProgressTimer);
      bootProgressTimer = null;
    }
  }, 120);
}

// Sets the step counter and shows one protocol step at a time.
function showBootStep(stepNumber, stepText, statusText = "") {
  activeBootStep = { stepNumber, stepText };

  if (bootCycle) {
    bootCycle.textContent = String(stepNumber).padStart(2, "0");
  }

  if (bootStatus && statusText) {
    bootStatus.textContent = statusText;
  }

  if (!bootStepText) return;

  bootStepText.classList.remove("is-visible", "is-exiting");
  bootStepText.textContent = stepText;

  window.requestAnimationFrame(() => {
    bootStepText.classList.add("is-visible");
  });
}

// Adds a completed protocol step to the compact rolling log.
function addCompletedBootStep(stepNumber, stepText) {
  if (!bootCompletedSteps) return;

  const item = document.createElement("li");
  item.className = "is-entering";
  item.innerHTML = `<span>[${String(stepNumber).padStart(2, "0")}]</span> ${stepText}`;

  bootCompletedSteps.appendChild(item);

  const items = Array.from(bootCompletedSteps.children);

  if (items.length > 3) {
    const oldestItem = items[0];

    oldestItem.classList.add("is-removing");

    window.setTimeout(() => {
      oldestItem.remove();
    }, 210);
  }

  window.setTimeout(() => {
    item.classList.remove("is-entering");
  }, 320);
}

// Hides the current protocol step and moves it into the completed-step log.
function hideBootStep() {
  if (!bootStepText || !activeBootStep) return;

  bootStepText.classList.remove("is-visible");
  bootStepText.classList.add("is-exiting");
  addCompletedBootStep(activeBootStep.stepNumber, activeBootStep.stepText);
  activeBootStep = null;
}

// Finishes the startup screen and reveals the main page.
function completeBootScreen({ immediate = false } = {}) {
  if (!bootScreen) return;

  if (bootProgressTimer) {
    window.clearInterval(bootProgressTimer);
    bootProgressTimer = null;
  }

  setBootProgress(100);

  if (bootCycle) {
    bootCycle.textContent = "05";
  }

  if (bootStatus) {
    bootStatus.textContent = "Profile ready.";
  }

  if (bootStepText) {
    bootStepText.classList.remove("is-visible", "is-exiting");
  }

  if (immediate) {
    bootScreen.classList.add("is-complete");
    unlockBootScroll();

    window.setTimeout(() => {
      bootScreen.remove();
    }, 620);

    return;
  }

  bootScreen.classList.add("is-fading-out");

  window.setTimeout(() => {
    bootScreen.classList.add("is-complete");
  }, 1040);

  window.setTimeout(() => {
    unlockBootScroll();
    bootScreen.remove();
  }, 1300);
}

if (bootScreen && siteWasEnteredBeforeLoad) {
  bootScreen.remove();
  unlockBootScroll();
  startBgmAudio();
} else if (bootScreen) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const bootDuration = prefersReducedMotion ? 650 : 8600;

  window.addEventListener("wheel", preventBootScroll, { passive: false });
  window.addEventListener("touchmove", preventBootScroll, { passive: false });
  window.addEventListener("keydown", preventBootKeyScroll);

  const bootSteps = [
    { delay: 1400, duration: 760, step: 1, text: "Identifying signal", status: "Identifying signal..." },
    { delay: 2480, duration: 760, step: 2, text: "Reviewing context", status: "Reviewing context..." },
    { delay: 3560, duration: 900, step: 3, text: "Separating noise from risk", status: "Separating noise from risk..." },
    { delay: 4920, duration: 780, step: 4, text: "Documenting findings", status: "Documenting findings..." },
    { delay: 6080, duration: 780, step: 5, text: "Opening portfolio", status: "Opening portfolio..." }
  ];

  if (bootStatus) {
    bootStatus.textContent = "Initialising...";
  }

  if (bootCycle) {
    bootCycle.textContent = "01";
  }

  startBgmAudio();
  startBootProgress(bootDuration);

  bootSteps.forEach(({ delay, duration, step, text, status }) => {
    window.setTimeout(() => {
      if (bootScreen && !bootScreen.classList.contains("is-complete")) {
        showBootStep(step, text, status);
      }
    }, prefersReducedMotion ? 0 : delay);

    window.setTimeout(() => {
      if (bootScreen && !bootScreen.classList.contains("is-complete")) {
        hideBootStep();
      }
    }, prefersReducedMotion ? 0 : delay + duration);
  });

  window.setTimeout(() => {
    if (bootScreen && !bootScreen.classList.contains("is-complete") && bootStatus) {
      bootStatus.textContent = "Profile ready.";
    }
  }, prefersReducedMotion ? 0 : 7350);

  // Waits for the startup screen to finish unless the visitor skips it.
  const bootTimer = window.setTimeout(completeBootScreen, bootDuration);

  if (bootSkip) {
    bootSkip.addEventListener("click", () => {
      window.clearTimeout(bootTimer);
      completeBootScreen({ immediate: true });
    });
  }
}



if (bgmToggle) {
  bgmToggle.addEventListener("click", toggleBgmAudio);
}

// Assigns the supplied click sounds to selected portfolio controls.
document.addEventListener("click", (event) => {
  const closeControl = event.target.closest(
    "[data-email-close], [data-cv-close], .email-modal__close, .cv-modal__close, #emailModal button[type='button']"
  );

  if (closeControl && !closeControl.matches(":disabled, [aria-disabled='true']")) {
    playInterfaceClickSound("close");
    return;
  }

  const standardControl = event.target.closest(
    "#bootSkip, [data-email-open], [data-copy-email], [data-cv-open], [data-interface-sound], .hero-actions a[href*='linkedin.com'], #emailModal button[type='submit']"
  );

  if (!standardControl || standardControl.matches(":disabled, [aria-disabled='true']")) return;

  if (
    standardControl.matches("#emailModal button[type='submit']") &&
    emailForm &&
    !emailForm.checkValidity()
  ) {
    return;
  }

  playInterfaceClickSound();
});

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const year = document.querySelector("#year");

if (year) {
  year.textContent = new Date().getFullYear();
}

if (navToggle && navLinks) {
  function closeNavMenu() {
    navLinks.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  function isNavMenuOpen() {
    return navLinks.classList.contains("is-open");
  }

  // Opens and closes the navigation menu without locking page scroll.
  navToggle.addEventListener("click", (event) => {
    event.stopPropagation();

    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Closes the menu after a navigation link is selected.
  navLinks.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      closeNavMenu();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!isNavMenuOpen()) return;

    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest(".nav-toggle") || target.closest("#site-menu")) return;

    closeNavMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isNavMenuOpen()) {
      closeNavMenu();
      navToggle.focus();
    }
  });
}

/* Reveals one new page section after a fresh downward scroll at the current boundary. */
const progressiveSections = Array.from(document.querySelectorAll("#main > .section"));
const progressiveFooter = document.querySelector(".site-footer");
const progressiveHeader = document.querySelector(".site-header");
const scrollRevealGuide = document.querySelector("#scrollRevealGuide");
const scrollRevealMarkers = document.querySelector("#scrollRevealMarkers");
const progressiveReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const progressiveScrollKeys = new Set([
  "ArrowDown",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
  " "
]);

let progressiveLastRevealedIndex = 0;
let progressiveRevealLocked = false;
let progressiveWheelLastAt = 0;
let progressiveTouchStartY = null;
let progressiveTouchStartedAtBoundary = false;
let progressiveRevealTimer = null;
let progressiveGuideHideTimer = null;

const progressiveSectionLabels = {
  top: "Profile",
  about: "About",
  experience: "Experience",
  skills: "Core strengths",
  projects: "Projects",
  learning: "Development",
  "personal-edge": "Personal edge",
  contact: "Contact"
};

function hasPendingProgressiveSection() {
  return progressiveLastRevealedIndex < progressiveSections.length - 1;
}

function updateProgressiveGuide() {
  if (!scrollRevealGuide || progressiveSections.length < 2) return;

  const nextSection = progressiveSections[progressiveLastRevealedIndex + 1];

  scrollRevealGuide.setAttribute("aria-label", nextSection
    ? `Scroll down or activate this control to reveal ${progressiveSectionLabels[nextSection.id] || nextSection.id}`
    : "All portfolio sections revealed");

  Array.from(scrollRevealMarkers?.children || []).forEach((marker, index) => {
    marker.classList.toggle("is-revealed", index <= progressiveLastRevealedIndex);
    marker.classList.toggle("is-next", index === progressiveLastRevealedIndex + 1);
  });

  scrollRevealGuide.classList.toggle("is-revealing", progressiveRevealLocked);

  if (!nextSection) {
    window.clearTimeout(progressiveGuideHideTimer);
    scrollRevealGuide.classList.add("is-complete");
    progressiveGuideHideTimer = window.setTimeout(() => {
      scrollRevealGuide.hidden = true;
    }, progressiveReducedMotion ? 20 : 320);
  }
}

function initializeProgressiveGuide() {
  if (!scrollRevealGuide || !scrollRevealMarkers) return;

  const markerFragment = document.createDocumentFragment();

  progressiveSections.forEach((section, index) => {
    const marker = document.createElement("span");
    const label = progressiveSectionLabels[section.id] || section.id;

    marker.className = "scroll-reveal-guide__marker";
    marker.title = `${index + 1}. ${label}`;
    markerFragment.appendChild(marker);
  });

  scrollRevealMarkers.replaceChildren(markerFragment);
  scrollRevealGuide.hidden = false;
  scrollRevealGuide.addEventListener("click", revealNextProgressiveSection);
  updateProgressiveGuide();
}

function isProgressiveInteractionBlocked() {
  return isBootActive() ||
    document.body.classList.contains("cv-modal-open") ||
    document.body.classList.contains("email-modal-open") ||
    document.body.classList.contains("email-thanks-modal-open");
}

function isAtProgressiveBoundary() {
  if (progressiveLastRevealedIndex === 0) return true;

  const lastSection = progressiveSections[progressiveLastRevealedIndex];
  const lastSectionBottom = lastSection.getBoundingClientRect().bottom;
  const pageBottom = window.scrollY + window.innerHeight;
  const documentBottom = document.documentElement.scrollHeight;

  return lastSectionBottom <= window.innerHeight + 4 || pageBottom >= documentBottom - 4;
}

function setProgressiveSectionAvailable(section, animate = true) {
  section.classList.remove("progressive-section--pending");
  section.removeAttribute("aria-hidden");
  section.inert = false;

  if (!animate || progressiveReducedMotion) return;

  section.classList.remove("progressive-section--revealing");
  void section.offsetWidth;
  section.classList.add("progressive-section--revealing");
}

function revealProgressiveFooter(animate = true) {
  if (!progressiveFooter) return;

  progressiveFooter.classList.remove("progressive-footer--pending");
  progressiveFooter.removeAttribute("aria-hidden");
  progressiveFooter.inert = false;

  if (animate && !progressiveReducedMotion) {
    progressiveFooter.classList.add("progressive-footer--revealing");
  }
}

function finishProgressiveReveal(section) {
  progressiveRevealLocked = false;
  document.documentElement.classList.remove("progressive-reveal-locked");
  document.body.classList.remove("progressive-reveal-locked");
  section?.classList.remove("progressive-section--revealing");
  progressiveFooter?.classList.remove("progressive-footer--revealing");
  updateProgressiveGuide();
}

function revealProgressiveThrough(targetIndex, { animateTarget = true, scrollToTarget = true } = {}) {
  if (targetIndex <= progressiveLastRevealedIndex || targetIndex >= progressiveSections.length) return;

  window.clearTimeout(progressiveRevealTimer);
  progressiveRevealLocked = true;
  document.documentElement.classList.add("progressive-reveal-locked");
  document.body.classList.add("progressive-reveal-locked");

  for (let index = progressiveLastRevealedIndex + 1; index <= targetIndex; index += 1) {
    const isTarget = index === targetIndex;
    setProgressiveSectionAvailable(progressiveSections[index], isTarget && animateTarget);
  }

  progressiveLastRevealedIndex = targetIndex;
  const targetSection = progressiveSections[targetIndex];
  updateProgressiveGuide();

  if (!hasPendingProgressiveSection()) {
    revealProgressiveFooter(animateTarget);
  }

  window.requestAnimationFrame(() => {
    if (!scrollToTarget) return;

    const headerHeight = progressiveHeader?.offsetHeight || 0;
    const targetTop = Math.max(0, targetSection.offsetTop - headerHeight);

    window.scrollTo({
      top: targetTop,
      behavior: progressiveReducedMotion ? "auto" : "smooth"
    });
  });

  progressiveRevealTimer = window.setTimeout(
    () => finishProgressiveReveal(targetSection),
    progressiveReducedMotion ? 40 : 520
  );
}

function revealNextProgressiveSection() {
  if (!hasPendingProgressiveSection() || progressiveRevealLocked) return;
  revealProgressiveThrough(progressiveLastRevealedIndex + 1);
}

function handleProgressiveWheel(event) {
  if (progressiveRevealLocked) {
    event.preventDefault();
    return;
  }

  if (isProgressiveInteractionBlocked() || event.deltaY <= 0 || !hasPendingProgressiveSection()) return;

  const now = window.performance.now();
  const isFreshGesture = now - progressiveWheelLastAt > 180;
  progressiveWheelLastAt = now;

  if (isFreshGesture && isAtProgressiveBoundary()) {
    event.preventDefault();
    revealNextProgressiveSection();
  }
}

function handleProgressiveTouchStart(event) {
  if (progressiveRevealLocked) {
    event.preventDefault();
    return;
  }

  if (isProgressiveInteractionBlocked() || event.touches.length !== 1) return;

  progressiveTouchStartY = event.touches[0].clientY;
  progressiveTouchStartedAtBoundary = isAtProgressiveBoundary();
}

function handleProgressiveTouchMove(event) {
  if (progressiveRevealLocked) {
    event.preventDefault();
    return;
  }

  if (
    isProgressiveInteractionBlocked() ||
    progressiveTouchStartY === null ||
    !progressiveTouchStartedAtBoundary ||
    !hasPendingProgressiveSection()
  ) {
    return;
  }

  const distance = progressiveTouchStartY - event.touches[0].clientY;

  if (distance > 24) {
    event.preventDefault();
    progressiveTouchStartY = null;
    revealNextProgressiveSection();
  }
}

function handleProgressiveTouchEnd() {
  progressiveTouchStartY = null;
  progressiveTouchStartedAtBoundary = false;
}

function handleProgressiveKeydown(event) {
  if (!progressiveScrollKeys.has(event.key)) return;

  if (progressiveRevealLocked) {
    event.preventDefault();
    return;
  }

  if (isProgressiveInteractionBlocked() || event.repeat || !hasPendingProgressiveSection()) return;

  const isDownwardKey = event.key === "ArrowDown" ||
    event.key === "PageDown" ||
    event.key === "End" ||
    (event.key === " " && !event.shiftKey);

  if (isDownwardKey && isAtProgressiveBoundary()) {
    event.preventDefault();
    revealNextProgressiveSection();
  }
}

function initializeProgressiveSections() {
  if (progressiveSections.length < 2) return;

  document.documentElement.classList.add("progressive-sections");

  progressiveSections.slice(1).forEach((section) => {
    section.classList.add("progressive-section--pending");
    section.setAttribute("aria-hidden", "true");
    section.inert = true;
  });

  if (progressiveFooter) {
    progressiveFooter.classList.add("progressive-footer--pending");
    progressiveFooter.setAttribute("aria-hidden", "true");
    progressiveFooter.inert = true;
  }

  initializeProgressiveGuide();

  window.addEventListener("wheel", handleProgressiveWheel, { passive: false });
  window.addEventListener("touchstart", handleProgressiveTouchStart, { passive: false });
  window.addEventListener("touchmove", handleProgressiveTouchMove, { passive: false });
  window.addEventListener("touchend", handleProgressiveTouchEnd);
  window.addEventListener("touchcancel", handleProgressiveTouchEnd);
  window.addEventListener("keydown", handleProgressiveKeydown);

  document.querySelectorAll("a[href^='#']").forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      const targetIndex = progressiveSections.findIndex((section) => `#${section.id}` === targetId);

      if (targetIndex <= progressiveLastRevealedIndex) return;

      event.preventDefault();
      revealProgressiveThrough(targetIndex);
    });
  });

  const initialTargetIndex = progressiveSections.findIndex(
    (section) => `#${section.id}` === window.location.hash
  );

  if (initialTargetIndex > 0) {
    revealProgressiveThrough(initialTargetIndex, {
      animateTarget: false,
      scrollToTarget: false
    });
  }
}

initializeProgressiveSections();



function runCardRevealSequence(cards) {
  cards.forEach((card, index) => {
    window.setTimeout(() => {
      card.classList.add("is-logo-hinting");

      window.setTimeout(() => {
        card.classList.remove("is-logo-hinting");
      }, 1200);
    }, index * 900);
  });
}

function setupCardReveal(sectionSelector, cardSelector) {
  const section = document.querySelector(sectionSelector);
  const cards = Array.from(document.querySelectorAll(cardSelector));
  let hasRun = false;

  if (!section || cards.length === 0) return;

  const runOnce = () => {
    if (hasRun) return;

    hasRun = true;
    runCardRevealSequence(cards);
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, activeObserver) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;

      runOnce();
      activeObserver.disconnect();
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.18 });

    observer.observe(section);
  } else {
    window.setTimeout(runOnce, 1200);
  }
}

setupCardReveal("#experience", "#experience .experience-brand");
setupCardReveal("#skills", "#skills .reveal-card");
setupCardReveal("#projects", "#projects .reveal-card");

function initializeProjectPreviewAnimations() {
  const projectPreviews = Array.from(document.querySelectorAll("[data-project-preview]"));

  if (projectPreviews.length === 0) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    projectPreviews.forEach((preview) => {
      preview.classList.add("is-visible");
    });
    return;
  }

  const previewObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("is-visible");
      previewObserver.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -16% 0px", threshold: 0.18 });

  projectPreviews.forEach((preview) => {
    previewObserver.observe(preview);
  });
}

initializeProjectPreviewAnimations();

/* Runs the fictional Fraud/AML Case page when its root element is present. */
const fraudCaseRoot = document.querySelector("[data-fraud-case]");

if (fraudCaseRoot) {
  const fraudCaseSteps = Array.from(fraudCaseRoot.querySelectorAll("[data-fraud-step]"));
  const fraudCasePanel = fraudCaseRoot.querySelector(".case-page__panel");
  const fraudCasePosition = fraudCaseRoot.querySelector("#fraudCasePosition");
  const fraudCaseTitle = fraudCaseRoot.querySelector("[data-fraud-title]");
  const fraudCaseState = fraudCaseRoot.querySelector("[data-fraud-state]");
  const fraudCaseShort = fraudCaseRoot.querySelector("[data-fraud-short]");
  const fraudCaseSignal = fraudCaseRoot.querySelector("[data-fraud-signal]");
  const fraudCaseChecks = fraudCaseRoot.querySelector("[data-fraud-checks]");
  const fraudCaseReasoning = fraudCaseRoot.querySelector("[data-fraud-reasoning]");
  const fraudCaseAuthority = fraudCaseRoot.querySelector("[data-fraud-authority]");
  const fraudCaseOutput = fraudCaseRoot.querySelector("[data-fraud-output]");
  const fraudCaseDesktop = fraudCaseRoot.querySelector("[data-fraud-desktop]");
  const fraudCasePrevious = fraudCaseRoot.querySelector("[data-fraud-previous]");
  const fraudCaseNext = fraudCaseRoot.querySelector("[data-fraud-next]");
  const fraudCaseReplay = fraudCaseRoot.querySelector("[data-fraud-replay]");
  const fraudCaseControlPosition = fraudCaseRoot.querySelector("[data-fraud-control-position]");
  const fraudCaseControlLabel = fraudCaseRoot.querySelector("[data-fraud-control-label]");
  const fraudCaseQuery = fraudCaseRoot.querySelector("[data-fraud-scene-query]");
  const fraudCaseQueryResult = fraudCaseRoot.querySelector("[data-fraud-scene-query-result]");
  const fraudCaseNote = fraudCaseRoot.querySelector("[data-fraud-scene-note]");
  const fraudCaseOutcome = fraudCaseRoot.querySelector("[data-fraud-scene-outcome]");
  const fraudCaseReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const fraudCaseData = [
    {
      label: "Alert enters queue",
      state: "Alert triage",
      controlLabel: "Alert validation",
      short: "A backend rule flags a newly created account after early funding and unusual movement behaviour.",
      signal: "New account with limited history triggers a risk alert after rapid activity.",
      checks: [
        "alert type",
        "rule trigger",
        "account age",
        "current restriction status",
        "activity timestamp",
        "first-look risk score"
      ],
      reasoning: "The alert starts the review, but it is not proof by itself. My first task is to understand what triggered the alert and whether the account needs to remain restricted while I validate the evidence.",
      authority: "Maintain temporary restriction while the review begins.",
      output: "Case opened from alert queue and initial risk context recorded.",
      scene: {
        primary: ["queue"],
        supporting: ["account"],
        cursor: ["18%", "30%"],
        age: "18 minutes",
        status: "Restricted",
        risk: "72 / 100",
        history: "Limited",
        device: "Unresolved",
        network: "Review",
        links: "Searching",
        query: "SELECT event_time, event_type\nFROM account_events\nWHERE case_id = '042';",
        queryResult: "Awaiting analyst query",
        paymentState: "Pending",
        paymentDetail: "Ownership and timing checks not yet completed.",
        note: "Case opened. Temporary restriction maintained pending evidence review.",
        outcome: "Review in progress",
        tone: "review"
      }
    },
    {
      label: "Account review",
      state: "Profile validation",
      controlLabel: "Identity and device",
      short: "The account profile is reviewed for consistency between registration details, contact data, device signals and early behaviour.",
      signal: "Account age is low and activity started shortly after registration.",
      checks: [
        "registration details",
        "email/phone consistency",
        "device and IP signals",
        "VPN/proxy indicators",
        "linked accounts",
        "account history",
        "previous failed verification or payment attempts"
      ],
      reasoning: "I look for consistency. A new account is not automatically fraudulent, but mismatched device, IP, identity or linked-account signals can turn a weak alert into a stronger fraud concern.",
      authority: "Continue restriction if indicators remain unresolved, or downgrade concern if signals are consistent.",
      output: "Account profile reviewed and key identity/device indicators documented.",
      scene: {
        primary: ["account", "identity"],
        supporting: ["queue"],
        cursor: ["78%", "27%"],
        age: "18 minutes",
        status: "Restricted",
        risk: "78 / 100",
        history: "No prior history",
        device: "Low trust",
        network: "Proxy signal",
        links: "1 weak link",
        query: "MATCH device, network, contact\nAGAINST account_id = 'AC-0042';",
        queryResult: "3 profile inconsistencies returned",
        paymentState: "Pending",
        paymentDetail: "Payment review follows identity and device validation.",
        note: "Profile review: low account age, low-trust device and network inconsistency require validation.",
        outcome: "Restriction maintained",
        tone: "risk"
      }
    },
    {
      label: "Funding review",
      state: "Payment analysis",
      controlLabel: "Funding ownership",
      short: "The funding method, deposit timing and ownership indicators are reviewed against the account profile.",
      signal: "Funds were added soon after account creation.",
      checks: [
        "payment method type",
        "name/payment consistency",
        "deposit timing",
        "repeated failed attempts",
        "card or wallet risk indicators",
        "closed-loop expectations",
        "chargeback or stolen-payment risk indicators"
      ],
      reasoning: "I check whether the funding pattern matches a genuine customer journey or whether the account appears to be used to move funds quickly through the platform.",
      authority: "Maintain payment/withdrawal restriction while ownership and activity pattern are reviewed.",
      output: "Payment behaviour assessed and funding risk noted.",
      scene: {
        primary: ["payment", "query"],
        supporting: ["account"],
        cursor: ["36%", "73%"],
        age: "18 minutes",
        status: "Payment hold",
        risk: "82 / 100",
        history: "1 deposit / 2 fails",
        device: "Low trust",
        network: "Proxy signal",
        links: "1 weak link",
        query: "SELECT method_owner, amount, created_at\nFROM funding_events\nWHERE account_id = 'AC-0042';",
        queryResult: "Deposit +00:09 after registration / ownership unresolved",
        paymentState: "Ownership check",
        paymentDetail: "Funds arrived nine minutes after registration following two failed attempts.",
        note: "Funding timing and ownership indicators do not yet support release.",
        outcome: "Payment hold active",
        tone: "risk"
      }
    },
    {
      label: "Movement attempt",
      state: "Behaviour timeline",
      controlLabel: "Rapid movement",
      short: "The account attempts to move value shortly after funding, creating a stronger risk pattern.",
      signal: "Rapid movement attempt after deposit with limited genuine activity.",
      checks: [
        "time from deposit to movement",
        "destination or route of attempted movement",
        "whether platform usage appears genuine",
        "withdrawal/transfer attempt behaviour",
        "account links or repeated patterns",
        "signs of mule activity, account misuse, promotion abuse or laundering risk"
      ],
      reasoning: "The question is whether the account is behaving like a real customer or whether it is being used as a pass-through route for value movement.",
      authority: "Block or hold movement where policy allows, maintain account restriction, and continue investigation.",
      output: "Potential fund-movement pattern identified and escalatability assessed.",
      scene: {
        primary: ["query", "payment"],
        supporting: ["identity"],
        cursor: ["54%", "58%"],
        age: "23 minutes",
        status: "Movement blocked",
        risk: "89 / 100",
        history: "Minimal genuine use",
        device: "Low trust",
        network: "Proxy signal",
        links: "Pattern overlap",
        query: "SELECT deposit_at, movement_at,\nTIMESTAMP_DIFF(movement_at, deposit_at)\nFROM value_timeline WHERE case_id = '042';",
        queryResult: "Movement attempt +00:04 after deposit / secondary route",
        paymentState: "Movement blocked",
        paymentDetail: "Rapid value movement followed funding with no meaningful platform activity.",
        note: "Timing and route strengthen pass-through or account-misuse concern.",
        outcome: "Movement blocked",
        tone: "risk"
      }
    },
    {
      label: "Evidence decision",
      state: "Risk decision",
      controlLabel: "Evidence weighting",
      short: "The Fraud Analyst compares all signals and decides whether the case supports fraud concern, AML escalation, further verification, or false-positive release.",
      signal: "Multiple indicators now need to be weighed together rather than viewed in isolation.",
      checks: [
        "strength of each signal",
        "confirmed facts versus assumptions",
        "whether evidence supports fraud suspicion",
        "whether AML concern exists",
        "whether further KYC/SOF/SOW verification is appropriate",
        "whether the alert appears false positive",
        "whether customer access can be restored safely"
      ],
      reasoning: "I separate confirmed evidence from suspicion. The goal is a proportionate decision: restrict where risk is supported, release where the alert is unsupported, or escalate where the concern exceeds my authority.",
      authority: "Choose the appropriate account outcome based on evidence: maintain restriction, release account, request verification, close account where policy permits, or escalate to Fraud/AML/Compliance.",
      output: "Risk decision made with clear rationale.",
      scene: {
        primary: ["identity", "payment", "notes"],
        supporting: ["account", "query"],
        cursor: ["74%", "72%"],
        age: "23 minutes",
        status: "Decision pending",
        risk: "89 / 100",
        history: "Evidence compared",
        device: "Risk supported",
        network: "Risk supported",
        links: "Not conclusive",
        query: "COMPARE confirmed_signals\nWITH assumptions\nFOR proportional_outcome;",
        queryResult: "Supported: timing, device, route / Unresolved: ownership, intent",
        paymentState: "Evidence weighted",
        paymentDetail: "Several corroborating signals support continued restriction and escalation.",
        note: "Confirmed facts separated from unresolved intent. Proportionate restriction remains justified.",
        outcome: "Escalation threshold met",
        tone: "risk"
      }
    },
    {
      label: "Action and handoff",
      state: "Decision recorded",
      controlLabel: "Audit-ready handoff",
      short: "The final action is applied and the case is documented so the next team or reviewer can understand the decision.",
      signal: "The review has reached a decision point.",
      checks: [
        "final restriction state",
        "account action taken",
        "verification request status",
        "escalation route",
        "customer-impact risk",
        "business-risk exposure",
        "note quality and auditability"
      ],
      reasoning: "The action is only useful if the rationale is clear. A good fraud note should explain what happened, what was checked, what was confirmed, what remains uncertain and why the chosen action was proportionate.",
      authority: "Apply or recommend the correct case outcome within policy: keep restricted, release, request verification, close, block movement, or escalate.",
      output: "Case notes completed, decision recorded, account status updated and escalation/handoff prepared where needed.",
      scene: {
        primary: ["notes"],
        supporting: ["account", "payment"],
        cursor: ["83%", "81%"],
        age: "31 minutes",
        status: "Restricted / escalated",
        risk: "Decision recorded",
        history: "Audit note complete",
        device: "Evidence logged",
        network: "Evidence logged",
        links: "Context logged",
        query: "UPDATE case_042\nSET outcome = 'RESTRICT_AND_ESCALATE',\nnotes_status = 'COMPLETE';",
        queryResult: "Case record updated / handoff package ready",
        paymentState: "Hold maintained",
        paymentDetail: "Movement remains blocked pending the receiving team's review.",
        note: "Maintained restriction. Rapid movement, device/network risk and unresolved ownership documented. Escalated with timeline, confirmed evidence and open questions.",
        outcome: "Restricted / Fraud-AML handoff",
        tone: "complete"
      }
    }
  ];

  let activeFraudCaseStep = 0;
  let fraudCaseReplayTimers = [];
  let fraudCaseTypingTimers = [];
  let fraudCaseAudioContext = null;

  function clearFraudCaseTimers() {
    fraudCaseReplayTimers.forEach((timer) => window.clearTimeout(timer));
    fraudCaseTypingTimers.forEach((timer) => window.clearTimeout(timer));
    fraudCaseReplayTimers = [];
    fraudCaseTypingTimers = [];
    fraudCaseRoot.classList.remove("is-playing");
    fraudCaseReplay?.setAttribute("aria-pressed", "false");
  }

  function typeFraudCaseText(element, text, shouldAnimate, interval = 8) {
    if (!element) return;

    if (!shouldAnimate || fraudCaseReducedMotion) {
      element.textContent = text;
      return;
    }

    element.textContent = "";

    Array.from(text).forEach((character, index) => {
      const timer = window.setTimeout(() => {
        element.textContent += character;
      }, index * interval);

      fraudCaseTypingTimers.push(timer);
    });
  }

  function playFraudCaseTypingSound() {
    if (fraudCaseReducedMotion) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      fraudCaseAudioContext = fraudCaseAudioContext || new AudioContextClass();
      const startAt = fraudCaseAudioContext.currentTime;

      [0, 0.07, 0.14, 0.23].forEach((offset, index) => {
        const oscillator = fraudCaseAudioContext.createOscillator();
        const gain = fraudCaseAudioContext.createGain();

        oscillator.type = "square";
        oscillator.frequency.value = 680 + (index % 2) * 90;
        gain.gain.setValueAtTime(0.0001, startAt + offset);
        gain.gain.exponentialRampToValueAtTime(0.018, startAt + offset + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + offset + 0.035);
        oscillator.connect(gain);
        gain.connect(fraudCaseAudioContext.destination);
        oscillator.start(startAt + offset);
        oscillator.stop(startAt + offset + 0.04);
      });
    } catch {}
  }

  function playFraudCaseStepSound(stepIndex) {
    if (fraudCaseReducedMotion) return;

    if (stepIndex === 0) {
      playInterfaceWarningSound();
      return;
    }

    if (stepIndex === 2 || stepIndex === 3 || stepIndex === 5) {
      playFraudCaseTypingSound();
    }

    playInterfaceClickSound(stepIndex === 5 ? "close" : "default");
  }

  function updateFraudCaseScene(step, shouldAnimate) {
    if (!fraudCaseDesktop) return;

    const scene = step.scene;
    const panels = Array.from(fraudCaseDesktop.querySelectorAll("[data-fraud-scene-panel]"));

    panels.forEach((panel) => {
      const panelName = panel.dataset.fraudScenePanel;
      panel.classList.toggle("is-active", scene.primary.includes(panelName));
      panel.classList.toggle("is-supporting", scene.supporting.includes(panelName));
    });

    fraudCaseDesktop.querySelector("[data-fraud-scene-age]").textContent = scene.age;
    fraudCaseDesktop.querySelector("[data-fraud-scene-account-status]").textContent = scene.status;
    fraudCaseDesktop.querySelector("[data-fraud-scene-risk]").textContent = scene.risk;
    fraudCaseDesktop.querySelector("[data-fraud-scene-history]").textContent = scene.history;
    fraudCaseDesktop.querySelector('[data-fraud-scene-signal="device"] strong').textContent = scene.device;
    fraudCaseDesktop.querySelector('[data-fraud-scene-signal="network"] strong').textContent = scene.network;
    fraudCaseDesktop.querySelector('[data-fraud-scene-signal="links"] strong').textContent = scene.links;
    fraudCaseDesktop.querySelector("[data-fraud-scene-payment-state]").textContent = scene.paymentState;
    fraudCaseDesktop.querySelector("[data-fraud-scene-payment-detail]").textContent = scene.paymentDetail;
    fraudCaseQueryResult.textContent = scene.queryResult;
    fraudCaseOutcome.textContent = scene.outcome;
    fraudCaseOutcome.dataset.tone = scene.tone;

    fraudCaseDesktop.querySelectorAll("[data-fraud-scene-signal]").forEach((signal) => {
      const value = signal.querySelector("strong")?.textContent || "";
      signal.classList.toggle("is-highlighted", !/unresolved|review|searching/i.test(value));
      signal.classList.toggle("is-confirmed", /low trust|proxy|risk supported/i.test(value));
    });

    fraudCaseDesktop.style.setProperty("--cursor-x", scene.cursor[0]);
    fraudCaseDesktop.style.setProperty("--cursor-y", scene.cursor[1]);

    fraudCaseDesktop.classList.remove("is-playing");
    void fraudCaseDesktop.offsetWidth;
    fraudCaseDesktop.classList.toggle("is-playing", shouldAnimate && !fraudCaseReducedMotion);

    typeFraudCaseText(fraudCaseQuery, scene.query, shouldAnimate && activeFraudCaseStep >= 2, 7);
    typeFraudCaseText(fraudCaseNote, scene.note, shouldAnimate && activeFraudCaseStep === 5, 6);
  }

  function renderFraudCaseStep(index, { sound = false, animate = true, keepReplay = false } = {}) {
    const boundedIndex = Math.max(0, Math.min(fraudCaseData.length - 1, index));
    const step = fraudCaseData[boundedIndex];

    if (!keepReplay) {
      clearFraudCaseTimers();
    } else {
      fraudCaseTypingTimers.forEach((timer) => window.clearTimeout(timer));
      fraudCaseTypingTimers = [];
    }

    activeFraudCaseStep = boundedIndex;

    fraudCasePosition.textContent =
      `Step ${String(boundedIndex + 1).padStart(2, "0")} / ${String(fraudCaseData.length).padStart(2, "0")}`;
    fraudCaseTitle.textContent = step.label;
    fraudCaseState.textContent = step.state;
    fraudCaseShort.textContent = step.short;
    fraudCaseSignal.textContent = step.signal;
    fraudCaseReasoning.textContent = step.reasoning;
    fraudCaseAuthority.textContent = step.authority;
    fraudCaseOutput.textContent = step.output;
    fraudCaseControlPosition.textContent = `Step ${boundedIndex + 1} of ${fraudCaseData.length}`;
    fraudCaseControlLabel.textContent = step.controlLabel;

    const checkFragment = document.createDocumentFragment();
    step.checks.forEach((check) => {
      const item = document.createElement("li");
      item.textContent = check;
      checkFragment.appendChild(item);
    });
    fraudCaseChecks.replaceChildren(checkFragment);

    fraudCaseSteps.forEach((button, stepIndex) => {
      const isActive = stepIndex === boundedIndex;
      button.classList.toggle("is-active", isActive);
      button.classList.toggle("is-complete", stepIndex < boundedIndex);
      if (isActive) {
        button.setAttribute("aria-current", "step");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    fraudCasePrevious.disabled = boundedIndex === 0;
    fraudCaseNext.disabled = boundedIndex === fraudCaseData.length - 1;
    fraudCaseNext.textContent = boundedIndex === fraudCaseData.length - 1 ? "Review complete" : "Next step";

    fraudCasePanel.classList.remove("is-updating");
    void fraudCasePanel.offsetWidth;
    fraudCasePanel.classList.toggle("is-updating", animate && !fraudCaseReducedMotion);

    updateFraudCaseScene(step, animate);

    if (sound) {
      playFraudCaseStepSound(boundedIndex);
    }
  }

  function startFraudCaseReplay() {
    clearFraudCaseTimers();
    fraudCaseRoot.classList.add("is-playing");
    fraudCaseReplay.setAttribute("aria-pressed", "true");
    renderFraudCaseStep(0, { sound: !fraudCaseReducedMotion, animate: true, keepReplay: true });

    if (fraudCaseReducedMotion) {
      fraudCaseRoot.classList.remove("is-playing");
      fraudCaseReplay.setAttribute("aria-pressed", "false");
      return;
    }

    for (let index = 1; index < fraudCaseData.length; index += 1) {
      const timer = window.setTimeout(() => {
        renderFraudCaseStep(index, { sound: true, animate: true, keepReplay: true });

        if (index === fraudCaseData.length - 1) {
          fraudCaseRoot.classList.remove("is-playing");
          fraudCaseReplay.setAttribute("aria-pressed", "false");
        }
      }, index * 1750);

      fraudCaseReplayTimers.push(timer);
    }
  }

  fraudCaseSteps.forEach((button, index) => {
    button.addEventListener("click", () => {
      renderFraudCaseStep(index, { sound: true });
    });

    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

      event.preventDefault();
      let targetIndex = index;

      if (event.key === "ArrowLeft") targetIndex = Math.max(0, index - 1);
      if (event.key === "ArrowRight") targetIndex = Math.min(fraudCaseSteps.length - 1, index + 1);
      if (event.key === "Home") targetIndex = 0;
      if (event.key === "End") targetIndex = fraudCaseSteps.length - 1;

      fraudCaseSteps[targetIndex].focus();
      renderFraudCaseStep(targetIndex, { sound: true });
    });
  });

  fraudCasePrevious?.addEventListener("click", () => {
    renderFraudCaseStep(activeFraudCaseStep - 1, { sound: true });
  });

  fraudCaseNext?.addEventListener("click", () => {
    renderFraudCaseStep(activeFraudCaseStep + 1, { sound: true });
  });

  fraudCaseReplay?.addEventListener("click", startFraudCaseReplay);

  renderFraudCaseStep(0, { animate: false });

  if (!bootScreen) {
    startBgmAudio();
  }
}

/* Runs the fictional Responsible Gambling case page when its root element is present. */
const rgCaseRoot = document.querySelector("[data-rg-case]");

if (rgCaseRoot) {
  const rgCaseSteps = Array.from(rgCaseRoot.querySelectorAll("[data-rg-step]"));
  const rgCasePanel = rgCaseRoot.querySelector(".rg-case__panel");
  const rgCasePosition = rgCaseRoot.querySelector("#rgCasePosition");
  const rgCaseTitle = rgCaseRoot.querySelector("[data-rg-title]");
  const rgCaseState = rgCaseRoot.querySelector("[data-rg-state]");
  const rgCaseShort = rgCaseRoot.querySelector("[data-rg-short]");
  const rgCaseSignal = rgCaseRoot.querySelector("[data-rg-signal]");
  const rgCaseChecks = rgCaseRoot.querySelector("[data-rg-checks]");
  const rgCaseReasoning = rgCaseRoot.querySelector("[data-rg-reasoning]");
  const rgCaseAuthority = rgCaseRoot.querySelector("[data-rg-authority]");
  const rgCaseOutput = rgCaseRoot.querySelector("[data-rg-output]");
  const rgCaseInteraction = rgCaseRoot.querySelector("[data-rg-interaction]");
  const rgCasePrevious = rgCaseRoot.querySelector("[data-rg-previous]");
  const rgCaseNext = rgCaseRoot.querySelector("[data-rg-next]");
  const rgCaseReplay = rgCaseRoot.querySelector("[data-rg-replay]");
  const rgCaseControlPosition = rgCaseRoot.querySelector("[data-rg-control-position]");
  const rgCaseControlLabel = rgCaseRoot.querySelector("[data-rg-control-label]");
  const rgCaseMessages = rgCaseRoot.querySelector("[data-rg-messages]");
  const rgCaseEmailBody = rgCaseRoot.querySelector("[data-rg-email-body]");
  const rgCaseNote = rgCaseRoot.querySelector("[data-rg-note]");
  const rgCaseSubtitle = rgCaseRoot.querySelector("[data-rg-subtitle]");
  const rgCaseSubtitleSecondary = rgCaseRoot.querySelector("[data-rg-subtitle-secondary]");
  const rgCaseReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const rgCaseData = [
    {
      label: "Deposit escalation detected",
      state: "Behavioural review",
      controlLabel: "Behavioural signal review",
      short: "A customer who normally deposits at a modest level suddenly makes multiple high-value deposits in a short period.",
      signal: "A clear change from normal deposit behaviour: higher value, higher frequency, and compressed timing.",
      checks: [
        "previous deposit pattern",
        "recent deposit size and frequency",
        "failed deposit attempts",
        "session length",
        "recent losses or rapid stake increases",
        "withdrawal/cancellation behaviour",
        "previous RG markers or limits",
        "account notes and previous interactions"
      ],
      reasoning: "The concern is not simply that the customer deposited. The concern is the change in behaviour and whether it suggests loss chasing, reduced control, financial pressure or emotional gambling.",
      authority: "Apply or maintain a temporary account restriction pending customer interaction where policy supports it.",
      output: "RG signal identified and account queued for customer interaction.",
      scene: {
        primary: ["profile", "concerns"],
        supporting: ["action"],
        riskLevel: "Elevated",
        baseline: "Modest / occasional",
        recent: "Multiple high-value",
        accountStatus: "Active / review queued",
        interactionStatus: "Required",
        emailStatus: "Draft pending",
        emailSubject: "Account interaction required",
        emailBody: "We need to speak with you about recent account activity before access can continue.",
        sentMark: "Not sent",
        sent: false,
        messages: [
          { speaker: "System", text: "Deposit pattern change identified. Customer interaction required.", type: "system" }
        ],
        callStatus: "Not connected",
        callTimer: "00:00",
        tone: "Awaiting contact",
        toneLevel: "neutral",
        subtitleSpeaker: "System",
        subtitle: "Customer interaction has not started.",
        subtitleSecondary: "",
        concerns: {
          change: ["Detected", "active"],
          chasing: ["Unconfirmed", "none"],
          emotion: ["Unconfirmed", "none"],
          control: ["Unconfirmed", "none"],
          affordability: ["Review", "active"]
        },
        note: "Behavioural change identified. Review and customer interaction required.",
        action: "Review queued",
        actionTone: "review",
        support: "Protective options will be discussed if concerns are supported."
      }
    },
    {
      label: "Account suspended pending interaction",
      state: "Protective restriction",
      controlLabel: "Customer protection hold",
      short: "The account is restricted while the customer protection concern is reviewed and an interaction is required.",
      signal: "The deposit escalation is significant enough that continued play may increase customer risk.",
      checks: [
        "account restriction status",
        "risk level",
        "current balance/exposure",
        "any active limits",
        "previous safer-gambling tool use",
        "contact history",
        "appropriate interaction route"
      ],
      reasoning: "The restriction is a protective step, not a punishment. It creates space to understand the customer's situation before allowing continued gambling activity.",
      authority: "Maintain restriction pending interaction and prepare a clear customer contact request.",
      output: "Account suspended pending RG interaction and internal notes updated.",
      scene: {
        primary: ["profile", "action"],
        supporting: ["concerns"],
        riskLevel: "Interaction required",
        baseline: "Modest / occasional",
        recent: "High value / compressed",
        accountStatus: "Temporarily restricted",
        interactionStatus: "Pending contact",
        emailStatus: "Preparing contact",
        emailSubject: "Account interaction required",
        emailBody: "A neutral contact request is being prepared while the protective restriction remains active.",
        sentMark: "Preparing",
        sent: false,
        messages: [
          { speaker: "System", text: "Account restricted pending responsible gambling interaction.", type: "system" }
        ],
        callStatus: "Not connected",
        callTimer: "00:00",
        tone: "Awaiting contact",
        toneLevel: "neutral",
        subtitleSpeaker: "System",
        subtitle: "Protective restriction active. Customer contact is the next step.",
        subtitleSecondary: "",
        concerns: {
          change: ["Confirmed", "active"],
          chasing: ["Unconfirmed", "none"],
          emotion: ["Unconfirmed", "none"],
          control: ["Review", "active"],
          affordability: ["Review", "active"]
        },
        note: "Temporary restriction applied to create space for a customer-protection interaction.",
        action: "Restricted pending interaction",
        actionTone: "restricted",
        support: "Restriction is protective and remains proportionate while the concern is assessed."
      }
    },
    {
      label: "Email sent to customer",
      state: "Written contact",
      controlLabel: "Neutral customer contact",
      short: "A clear and neutral email is sent asking the customer to contact the team before account access can continue.",
      signal: "The customer needs to engage with the team before further gambling can continue.",
      checks: [
        "tone of email",
        "clarity of next step",
        "no accusatory language",
        "policy-aligned wording",
        "contact route",
        "account note consistency"
      ],
      reasoning: "The email should be calm, direct and non-judgemental. The goal is to open a constructive conversation, not to blame the customer.",
      authority: "Send interaction request and keep restriction active until the required conversation is completed.",
      output: "Customer contacted and interaction requirement documented.",
      scene: {
        primary: ["email", "chat"],
        supporting: ["profile", "action"],
        riskLevel: "Interaction required",
        baseline: "Modest / occasional",
        recent: "High value / compressed",
        accountStatus: "Restricted",
        interactionStatus: "Email sent",
        emailStatus: "Sent",
        emailSubject: "Please contact us about your account",
        emailBody: "We would like to speak with you about a recent change in account activity. Please contact the team before account access can continue.",
        sentMark: "Message sent",
        sent: true,
        messages: [
          { speaker: "Agent", text: "A clear, neutral interaction request has been sent to the customer.", type: "agent" },
          { speaker: "System", text: "Delivery recorded. Restriction remains active.", type: "system" }
        ],
        callStatus: "Awaiting customer call",
        callTimer: "00:00",
        tone: "Contact requested",
        toneLevel: "neutral",
        subtitleSpeaker: "System",
        subtitle: "Email delivered. Waiting for the customer to make contact.",
        subtitleSecondary: "",
        concerns: {
          change: ["Confirmed", "active"],
          chasing: ["Unconfirmed", "none"],
          emotion: ["Unconfirmed", "none"],
          control: ["Review", "active"],
          affordability: ["Review", "active"]
        },
        note: "Neutral interaction request sent. No accusatory language used. Restriction remains active.",
        action: "Contact requested",
        actionTone: "restricted",
        support: "Customer has a clear route to discuss the restriction with the player-protection team."
      }
    },
    {
      label: "Customer calls and pushes back",
      state: "Live interaction",
      controlLabel: "Calm under pushback",
      short: "The customer calls, frustrated by the restriction, and argues that the account should be reopened immediately.",
      signal: "The customer reacts strongly to the restriction and minimizes the concern around the deposit change.",
      checks: [
        "tone and emotional state",
        "explanation for recent deposits",
        "whether customer acknowledges the behaviour change",
        "signs of urgency to continue gambling",
        "financial or emotional stress indicators",
        "customer perception of control"
      ],
      reasoning: "Pushback does not remove the concern. I need to stay calm, acknowledge frustration, ask open questions and listen for signs that continued gambling may be harmful.",
      authority: "Continue the interaction and keep the account restricted while concerns are assessed.",
      output: "Customer contact established and behavioural concerns explored.",
      scene: {
        primary: ["phone", "chat"],
        supporting: ["profile", "action"],
        riskLevel: "Live assessment",
        baseline: "Modest / occasional",
        recent: "High value / compressed",
        accountStatus: "Restricted",
        interactionStatus: "Call connected",
        emailStatus: "Delivered",
        emailSubject: "Please contact us about your account",
        emailBody: "The customer has responded by phone. The written request and live interaction are linked in the case record.",
        sentMark: "Delivered",
        sent: true,
        messages: [
          { speaker: "Customer", text: "I do not see why my account is blocked. I deposited my own money.", type: "customer" },
          { speaker: "Agent", text: "I understand this is frustrating. We need to discuss the significant change in your recent deposit pattern and whether continuing right now is safe for you.", type: "agent" }
        ],
        callStatus: "Connected",
        callTimer: "02:14",
        tone: "Frustrated",
        toneLevel: "high",
        subtitleSpeaker: "Customer",
        subtitle: "I do not see why my account is blocked. I deposited my own money.",
        subtitleSecondary: "Agent: I understand this is frustrating. We have a responsibility to check whether continuing right now is safe for you.",
        concerns: {
          change: ["Confirmed", "active"],
          chasing: ["Exploring", "active"],
          emotion: ["Elevated tone", "active"],
          control: ["Minimised", "active"],
          affordability: ["Questioning", "active"]
        },
        note: "Customer frustrated by restriction. Acknowledged frustration and moved into open, non-judgemental questions.",
        action: "Restriction maintained",
        actionTone: "restricted",
        support: "The interaction remains calm and focused on customer safety rather than blame."
      }
    },
    {
      label: "Concerns identified in conversation",
      state: "Risk language identified",
      controlLabel: "Listen and reflect concern",
      short: "During the call, the customer describes behaviour that raises further concerns around control, loss chasing and emotional gambling.",
      signal: "The customer indicates they increased deposits after losses, feels they can win it back, and is reluctant to stop.",
      checks: [
        "loss chasing language",
        "\"win it back\" statements",
        "gambling to manage stress or emotion",
        "inability or reluctance to pause",
        "impact on finances, sleep, work or relationships",
        "whether deposits are affordable",
        "whether customer has considered limits or exclusion"
      ],
      reasoning: "When a customer describes chasing losses, emotional gambling or difficulty stopping, the safest response is to slow the interaction down, reflect the concern clearly and discuss protective options.",
      authority: "Recommend stronger RG intervention such as cooling-off, time-out or self-exclusion where the concern supports it.",
      output: "Multiple RG concerns identified and intervention options discussed.",
      scene: {
        primary: ["phone", "concerns", "action"],
        supporting: ["chat"],
        riskLevel: "High concern",
        baseline: "Modest / occasional",
        recent: "Escalating after losses",
        accountStatus: "Restricted",
        interactionStatus: "Protective options",
        emailStatus: "Delivered",
        emailSubject: "Please contact us about your account",
        emailBody: "The live interaction has identified stronger customer-protection concerns.",
        sentMark: "Interaction linked",
        sent: true,
        messages: [
          { speaker: "Customer", text: "I was only trying to recover what I lost. If I can play a bit more, I can sort it out.", type: "customer" },
          { speaker: "Agent", text: "When gambling starts to feel like a way to recover losses, it can become harder to stay in control. Taking a break is the safer option here.", type: "agent" }
        ],
        callStatus: "Connected",
        callTimer: "05:46",
        tone: "Urgent / resistant",
        toneLevel: "high",
        subtitleSpeaker: "Customer",
        subtitle: "I was only trying to recover what I lost. If I can just play a bit more, I can sort it out.",
        subtitleSecondary: "Agent: That is exactly why I am concerned. Taking a break is the safer option here.",
        concerns: {
          change: ["Confirmed", "high"],
          chasing: ["Confirmed", "high"],
          emotion: ["Supported", "active"],
          control: ["Reduced", "high"],
          affordability: ["Unresolved", "active"]
        },
        note: "Customer described chasing losses and reluctance to pause. Reflected concern clearly and discussed stronger protective options.",
        action: "Cooling-off recommended",
        actionTone: "restricted",
        support: "Conversation slowed down so the customer can understand why continued play is not the safer option."
      }
    },
    {
      label: "Self-exclusion / protective action agreed",
      state: "Protection applied",
      controlLabel: "Protective action and notes",
      short: "The customer initially resists, but the agent remains composed, empathetic and clear, helping the customer agree to take a break.",
      signal: "The customer continues to resist stopping, but the identified concerns support stronger protective action.",
      checks: [
        "customer understanding",
        "final customer position",
        "appropriate exclusion/cooling-off option",
        "required account action",
        "documentation quality",
        "follow-up or support information",
        "internal escalation requirements"
      ],
      reasoning: "The goal is not to win an argument. The goal is to protect the customer, explain the concern clearly, keep the tone respectful and help them accept a safer step.",
      authority: "Apply the agreed RG tool or maintain restriction according to policy, document the rationale and provide support information.",
      output: "Protective action applied, customer informed, support information provided and interaction notes completed.",
      scene: {
        primary: ["phone", "action"],
        supporting: ["concerns", "email"],
        riskLevel: "Action complete",
        baseline: "Modest / occasional",
        recent: "Escalation reviewed",
        accountStatus: "Cooling-off applied",
        interactionStatus: "Completed",
        emailStatus: "Support follow-up",
        emailSubject: "Confirmation of your account break",
        emailBody: "Your account break has been applied. Support information and safer-gambling resources are included in the follow-up.",
        sentMark: "Follow-up ready",
        sent: true,
        messages: [
          { speaker: "Customer", text: "I do not want to be excluded. I just need the account reopened.", type: "customer" },
          { speaker: "Agent", text: "Based on what you have told me today, reopening the account would not be the responsible step. A break gives you space from the pressure to chase losses.", type: "agent" },
          { speaker: "Customer", text: "Fine. I think a break is probably best.", type: "customer" },
          { speaker: "Agent", text: "Thank you for working through that with me. I will apply the break now and provide support information.", type: "agent" }
        ],
        callStatus: "Interaction complete",
        callTimer: "08:42",
        tone: "Calmer / accepting",
        toneLevel: "calmer",
        subtitleSpeaker: "Customer",
        subtitle: "Fine. I think a break is probably best.",
        subtitleSecondary: "Agent: Thank you for working through that with me. I will apply the break now and provide support information.",
        concerns: {
          change: ["Documented", "active"],
          chasing: ["Documented", "high"],
          emotion: ["Documented", "active"],
          control: ["Documented", "high"],
          affordability: ["Support provided", "active"]
        },
        note: "Customer agreed to a protective break after loss-chasing and reduced-control concerns were explained. Action, rationale and support information documented.",
        action: "Cooling-off / self-exclusion applied",
        actionTone: "complete",
        support: "Customer informed clearly, support resources provided and the interaction closed with an audit-ready note."
      }
    }
  ];

  let activeRgCaseStep = 0;
  let rgReplayTimers = [];
  let rgTypingTimers = [];
  let rgAudioContext = null;

  function clearRgCaseTimers() {
    rgReplayTimers.forEach((timer) => window.clearTimeout(timer));
    rgTypingTimers.forEach((timer) => window.clearTimeout(timer));
    rgReplayTimers = [];
    rgTypingTimers = [];
    rgCaseRoot.classList.remove("is-playing");
    rgCaseReplay?.setAttribute("aria-pressed", "false");
  }

  function typeRgCaseText(element, text, shouldAnimate, interval = 7) {
    if (!element) return;

    if (!shouldAnimate || rgCaseReducedMotion) {
      element.textContent = text;
      return;
    }

    element.textContent = "";

    Array.from(text).forEach((character, index) => {
      const timer = window.setTimeout(() => {
        element.textContent += character;
      }, index * interval);
      rgTypingTimers.push(timer);
    });
  }

  function playRgCaseTone(kind = "click") {
    if (rgCaseReducedMotion) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const toneMap = {
      click: [520, 0.03],
      send: [780, 0.08],
      call: [440, 0.13],
      confirm: [660, 0.15]
    };
    const [frequency, duration] = toneMap[kind] || toneMap.click;

    try {
      rgAudioContext = rgAudioContext || new AudioContextClass();
      const oscillator = rgAudioContext.createOscillator();
      const gain = rgAudioContext.createGain();
      const startAt = rgAudioContext.currentTime;

      oscillator.type = kind === "call" ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, startAt);
      if (kind === "confirm") {
        oscillator.frequency.linearRampToValueAtTime(frequency * 1.3, startAt + duration);
      }
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.025, startAt + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
      oscillator.connect(gain);
      gain.connect(rgAudioContext.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + duration + 0.01);
    } catch {}
  }

  function playRgTypingSound() {
    if (rgCaseReducedMotion) return;
    [0, 80, 165, 255].forEach((delay) => {
      const timer = window.setTimeout(() => playRgCaseTone("click"), delay);
      rgTypingTimers.push(timer);
    });
  }

  function playRgStepSound(stepIndex) {
    if (rgCaseReducedMotion) return;

    if (stepIndex === 2) {
      playRgTypingSound();
      window.setTimeout(() => playRgCaseTone("send"), 340);
      return;
    }

    if (stepIndex === 3) {
      playRgCaseTone("call");
      return;
    }

    if (stepIndex === 5) {
      playRgCaseTone("confirm");
      return;
    }

    playRgCaseTone("click");
  }

  function renderRgMessages(messages) {
    const fragment = document.createDocumentFragment();

    messages.forEach((message, index) => {
      const bubble = document.createElement("p");
      const speaker = document.createElement("strong");

      bubble.className = `rg-case__message rg-case__message--${message.type}`;
      bubble.style.animationDelay = `${index * 130}ms`;
      speaker.textContent = message.speaker;
      bubble.append(speaker, document.createTextNode(message.text));
      fragment.appendChild(bubble);
    });

    rgCaseMessages.replaceChildren(fragment);
  }

  function updateRgCaseScene(step, shouldAnimate) {
    const scene = step.scene;
    const panels = Array.from(rgCaseInteraction.querySelectorAll("[data-rg-panel]"));

    panels.forEach((panel) => {
      const name = panel.dataset.rgPanel;
      panel.classList.toggle("is-active", scene.primary.includes(name));
      panel.classList.toggle("is-supporting", scene.supporting.includes(name));
    });

    rgCaseInteraction.querySelector("[data-rg-risk-level]").textContent = scene.riskLevel;
    rgCaseInteraction.querySelector("[data-rg-baseline]").textContent = scene.baseline;
    rgCaseInteraction.querySelector("[data-rg-recent]").textContent = scene.recent;
    rgCaseInteraction.querySelector("[data-rg-account-status]").textContent = scene.accountStatus;
    rgCaseInteraction.querySelector("[data-rg-interaction-status]").textContent = scene.interactionStatus;
    rgCaseInteraction.querySelector("[data-rg-email-status]").textContent = scene.emailStatus;
    rgCaseInteraction.querySelector("[data-rg-email-subject]").textContent = scene.emailSubject;
    rgCaseInteraction.querySelector("[data-rg-sent-mark]").textContent = scene.sentMark;
    rgCaseInteraction.querySelector("[data-rg-sent-mark]").classList.toggle("is-sent", scene.sent);
    rgCaseInteraction.querySelector("[data-rg-call-status]").textContent = scene.callStatus;
    rgCaseInteraction.querySelector("[data-rg-call-timer]").textContent = scene.callTimer;
    rgCaseInteraction.querySelector("[data-rg-tone]").textContent = scene.tone;
    rgCaseInteraction.querySelector("[data-rg-tone]").dataset.tone = scene.toneLevel;
    rgCaseInteraction.querySelector("[data-rg-subtitle-speaker]").textContent = scene.subtitleSpeaker;
    rgCaseInteraction.querySelector("[data-rg-action-status]").textContent = scene.action;
    rgCaseInteraction.querySelector("[data-rg-action-status]").dataset.tone = scene.actionTone;
    rgCaseInteraction.querySelector("[data-rg-support-note]").textContent = scene.support;

    Object.entries(scene.concerns).forEach(([name, [value, level]]) => {
      const concern = rgCaseInteraction.querySelector(`[data-rg-concern="${name}"]`);
      concern.querySelector("strong").textContent = value;
      concern.classList.toggle("is-active", level === "active" || level === "high");
      concern.classList.toggle("is-high", level === "high");
    });

    renderRgMessages(scene.messages);

    const animateEmail = shouldAnimate && activeRgCaseStep === 2;
    const animateNote = shouldAnimate && activeRgCaseStep >= 4;
    const animateSubtitle = shouldAnimate && activeRgCaseStep >= 3;
    typeRgCaseText(rgCaseEmailBody, scene.emailBody, animateEmail, 6);
    typeRgCaseText(rgCaseNote, scene.note, animateNote, 5);
    typeRgCaseText(rgCaseSubtitle, scene.subtitle, animateSubtitle, 6);

    rgCaseSubtitleSecondary.hidden = !scene.subtitleSecondary;
    rgCaseSubtitleSecondary.textContent = scene.subtitleSecondary;

    rgCaseInteraction.classList.remove("is-playing");
    void rgCaseInteraction.offsetWidth;
    rgCaseInteraction.classList.toggle("is-playing", shouldAnimate && !rgCaseReducedMotion);
  }

  function renderRgCaseStep(index, { sound = false, animate = true, keepReplay = false } = {}) {
    const boundedIndex = Math.max(0, Math.min(rgCaseData.length - 1, index));
    const step = rgCaseData[boundedIndex];

    if (!keepReplay) {
      clearRgCaseTimers();
    } else {
      rgTypingTimers.forEach((timer) => window.clearTimeout(timer));
      rgTypingTimers = [];
    }

    activeRgCaseStep = boundedIndex;
    rgCasePosition.textContent =
      `Step ${String(boundedIndex + 1).padStart(2, "0")} / ${String(rgCaseData.length).padStart(2, "0")}`;
    rgCaseTitle.textContent = step.label;
    rgCaseState.textContent = step.state;
    rgCaseShort.textContent = step.short;
    rgCaseSignal.textContent = step.signal;
    rgCaseReasoning.textContent = step.reasoning;
    rgCaseAuthority.textContent = step.authority;
    rgCaseOutput.textContent = step.output;
    rgCaseControlPosition.textContent = `Step ${boundedIndex + 1} of ${rgCaseData.length}`;
    rgCaseControlLabel.textContent = step.controlLabel;

    const checks = document.createDocumentFragment();
    step.checks.forEach((check) => {
      const item = document.createElement("li");
      item.textContent = check;
      checks.appendChild(item);
    });
    rgCaseChecks.replaceChildren(checks);

    rgCaseSteps.forEach((button, stepIndex) => {
      const isActive = stepIndex === boundedIndex;
      button.classList.toggle("is-active", isActive);
      button.classList.toggle("is-complete", stepIndex < boundedIndex);
      if (isActive) {
        button.setAttribute("aria-current", "step");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    rgCasePrevious.disabled = boundedIndex === 0;
    rgCaseNext.disabled = boundedIndex === rgCaseData.length - 1;
    rgCaseNext.textContent = boundedIndex === rgCaseData.length - 1 ? "Interaction complete" : "Next step";

    rgCasePanel.classList.remove("is-updating");
    void rgCasePanel.offsetWidth;
    rgCasePanel.classList.toggle("is-updating", animate && !rgCaseReducedMotion);
    updateRgCaseScene(step, animate);

    if (sound) {
      playRgStepSound(boundedIndex);
    }
  }

  function startRgCaseReplay() {
    clearRgCaseTimers();
    rgCaseRoot.classList.add("is-playing");
    rgCaseReplay.setAttribute("aria-pressed", "true");
    renderRgCaseStep(0, { sound: !rgCaseReducedMotion, animate: true, keepReplay: true });

    if (rgCaseReducedMotion) {
      rgCaseRoot.classList.remove("is-playing");
      rgCaseReplay.setAttribute("aria-pressed", "false");
      return;
    }

    for (let index = 1; index < rgCaseData.length; index += 1) {
      const timer = window.setTimeout(() => {
        renderRgCaseStep(index, { sound: true, animate: true, keepReplay: true });

        if (index === rgCaseData.length - 1) {
          rgCaseRoot.classList.remove("is-playing");
          rgCaseReplay.setAttribute("aria-pressed", "false");
        }
      }, index * 1950);
      rgReplayTimers.push(timer);
    }
  }

  rgCaseSteps.forEach((button, index) => {
    button.addEventListener("click", () => {
      renderRgCaseStep(index, { sound: true });
    });

    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

      event.preventDefault();
      let targetIndex = index;
      if (event.key === "ArrowLeft") targetIndex = Math.max(0, index - 1);
      if (event.key === "ArrowRight") targetIndex = Math.min(rgCaseSteps.length - 1, index + 1);
      if (event.key === "Home") targetIndex = 0;
      if (event.key === "End") targetIndex = rgCaseSteps.length - 1;

      rgCaseSteps[targetIndex].focus();
      renderRgCaseStep(targetIndex, { sound: true });
    });
  });

  rgCasePrevious?.addEventListener("click", () => {
    renderRgCaseStep(activeRgCaseStep - 1, { sound: true });
  });

  rgCaseNext?.addEventListener("click", () => {
    renderRgCaseStep(activeRgCaseStep + 1, { sound: true });
  });

  rgCaseReplay?.addEventListener("click", startRgCaseReplay);

  renderRgCaseStep(0, { animate: false });

  if (!bootScreen) {
    startBgmAudio();
  }
}

/* Copies the contact address and confirms the result in a temporary toast. */
const copyEmailButtons = document.querySelectorAll("[data-copy-email]");
const copyEmailToast = document.querySelector("#copyEmailToast");
const copyEmailValue = "black@burnaron.com";
let copyEmailToastTimer = null;

function copyTextFallback(text) {
  const temporaryField = document.createElement("textarea");

  temporaryField.value = text;
  temporaryField.setAttribute("readonly", "");
  temporaryField.style.position = "fixed";
  temporaryField.style.left = "-9999px";
  temporaryField.style.top = "-9999px";
  document.body.appendChild(temporaryField);
  temporaryField.select();

  let copied = false;

  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  temporaryField.remove();
  return copied;
}

function showCopyEmailToast(message, isError = false) {
  if (!copyEmailToast) return;

  window.clearTimeout(copyEmailToastTimer);
  copyEmailToast.classList.remove("is-visible");

  requestAnimationFrame(() => {
    copyEmailToast.textContent = message;
    copyEmailToast.classList.toggle("is-error", isError);
    copyEmailToast.classList.add("is-visible");
  });

  copyEmailToastTimer = window.setTimeout(() => {
    copyEmailToast.classList.remove("is-visible");
  }, 2200);
}

async function copyEmail() {
  let copied = false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        const currentClipboardText = await navigator.clipboard.readText();

        if (currentClipboardText.trim() === copyEmailValue) {
          showCopyEmailToast("E-mail already copied to clipboard");
          return;
        }
      } catch {
        // Clipboard reads can be blocked even when writes are allowed.
      }

      await navigator.clipboard.writeText(copyEmailValue);
      copied = true;
    } else {
      copied = copyTextFallback(copyEmailValue);
    }
  } catch {
    copied = copyTextFallback(copyEmailValue);
  }

  showCopyEmailToast(copied ? "Email copied to clipboard" : "Could not copy email", !copied);
}

copyEmailButtons.forEach((button) => {
  button.addEventListener("click", copyEmail);
});

/* Keeps keyboard focus inside whichever modal is currently open. */
const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

let activeModal = null;

// Finds the links, buttons, and fields a keyboard user can tab to inside a modal.
function getFocusableElements(container) {
  if (!container) return [];

  return Array.from(container.querySelectorAll(focusableSelector)).filter((element) => {
    const style = window.getComputedStyle(element);
    return !element.hasAttribute("hidden") &&
      element.tabIndex !== -1 &&
      style.display !== "none" &&
      style.visibility !== "hidden";
  });
}

// Starts the focus trap and puts focus on the first useful control.
function activateFocusTrap(modal, preferredFocusTarget = null) {
  activeModal = modal;

  const focusTarget = preferredFocusTarget || getFocusableElements(modal)[0];
  if (focusTarget && typeof focusTarget.focus === "function") {
    focusTarget.focus();
  }
}

// Clears the focus trap when a modal is closed.
function deactivateFocusTrap(modal) {
  if (activeModal === modal) {
    activeModal = null;
  }
}

// Shows a modal and starts its slide-up animation.
function openAnimatedModal(modal, bodyClassName) {
  if (!modal) return;

  modal.classList.remove("is-closing");
  modal.hidden = false;
  document.body.classList.add(bodyClassName);

  requestAnimationFrame(() => {
    modal.classList.add("is-open");
  });
}

// Plays the slide-down animation before hiding the modal.
function closeAnimatedModal(modal, bodyClassName, onAfterClose = null) {
  if (!modal || modal.hidden) {
    if (typeof onAfterClose === "function") {
      onAfterClose();
    }
    return;
  }

  modal.classList.remove("is-open");
  modal.classList.add("is-closing");
  document.body.classList.remove(bodyClassName);

  window.setTimeout(() => {
    modal.hidden = true;
    modal.classList.remove("is-closing");

    if (typeof onAfterClose === "function") {
      onAfterClose();
    }
  }, 360);
}

/* Opens the CV inside the page and lets the user open it in a separate tab. */
const cvModal = document.querySelector("#cvModal");
const cvImage = document.querySelector("#cvImage");
const cvFrame = document.querySelector("#cvFrame");
const cvOpenLink = document.querySelector("#cvOpenLink");
const cvOpenButtons = document.querySelectorAll("[data-cv-open]");
const cvCloseButtons = document.querySelectorAll("[data-cv-close]");

let cvLastFocusedElement = null;

// Checks whether the CV should be shown as an image or inside an iframe.
function isImageFile(url) {
  return /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(url);
}

// Loads the selected CV file and opens the CV preview window.
function openCvModal(cvUrl) {
  if (!cvModal || !cvImage || !cvFrame) return;

  cvLastFocusedElement = document.activeElement;

  if (cvOpenLink) {
    cvOpenLink.href = cvUrl;
  }

  if (isImageFile(cvUrl)) {
    cvImage.src = cvUrl;
    cvImage.hidden = false;
    cvFrame.src = "";
    cvFrame.hidden = true;
  } else {
    cvFrame.src = cvUrl;
    cvFrame.hidden = false;
    cvImage.src = "";
    cvImage.hidden = true;
  }

  openAnimatedModal(cvModal, "cv-modal-open");

  activateFocusTrap(cvModal, cvOpenLink || cvModal.querySelector("[data-cv-close]"));
}

// Closes the CV window, clears the preview, and returns focus to the button that opened it.
function closeCvModal() {
  if (!cvModal || !cvImage || !cvFrame) return;

  deactivateFocusTrap(cvModal);

  closeAnimatedModal(cvModal, "cv-modal-open", () => {
    cvImage.src = "";
    cvFrame.src = "";
    cvImage.hidden = true;
    cvFrame.hidden = true;

    if (cvLastFocusedElement && typeof cvLastFocusedElement.focus === "function") {
      cvLastFocusedElement.focus();
    }
  });
}

cvOpenButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    const cvUrl = button.getAttribute("href") || "assets/aron-blackburn-cv.png";
    openCvModal(cvUrl);
  });
});

cvCloseButtons.forEach((button) => {
  button.addEventListener("click", closeCvModal);
});

/* Opens the contact form and prepares a pre-filled email for the visitor's email app. */
const emailModal = document.querySelector("#emailModal");
const emailThanksModal = document.querySelector("#emailThanksModal");
const emailForm = document.querySelector("#emailForm");
const emailStatus = document.querySelector("#emailStatus");
const emailOpenButtons = document.querySelectorAll("[data-email-open]");
const emailCloseButtons = document.querySelectorAll("[data-email-close]");
const continueToWebsiteButton = document.querySelector("#continueToWebsite");
const senderNameInput = document.querySelector("#senderName");

let emailLastFocusedElement = null;

// Opens the contact form and places the cursor in the first field.
function openEmailModal() {
  if (!emailModal) return;

  emailLastFocusedElement = document.activeElement;
  openAnimatedModal(emailModal, "email-modal-open");

  if (emailStatus) {
    emailStatus.textContent = "";
  }

  activateFocusTrap(emailModal, senderNameInput || getFocusableElements(emailModal)[0]);
}

// Closes the contact form and optionally returns focus to the original contact button.
function closeEmailModal({ restoreFocus = true, afterClose = null } = {}) {
  if (!emailModal) return;

  deactivateFocusTrap(emailModal);

  closeAnimatedModal(emailModal, "email-modal-open", () => {
    if (emailStatus) {
      emailStatus.textContent = "";
    }

    if (restoreFocus && emailLastFocusedElement && typeof emailLastFocusedElement.focus === "function") {
      emailLastFocusedElement.focus();
    }

    if (typeof afterClose === "function") {
      afterClose();
    }
  });
}

// Shows the short thank-you message after the email is prepared.
function openEmailThanksModal() {
  if (!emailThanksModal) return;

  emailThanksModal.hidden = false;
  document.body.classList.add("email-thanks-modal-open");

  activateFocusTrap(emailThanksModal, continueToWebsiteButton || getFocusableElements(emailThanksModal)[0]);
}

// Closes the thank-you message and returns the visitor to the website.
function closeEmailThanksModal() {
  if (!emailThanksModal) return;

  emailThanksModal.hidden = true;
  document.body.classList.remove("email-thanks-modal-open");
  deactivateFocusTrap(emailThanksModal);

  if (emailLastFocusedElement && typeof emailLastFocusedElement.focus === "function") {
    emailLastFocusedElement.focus();
  }
}

// Turns the contact form fields into a mailto link with the subject and body filled in.
function buildMailtoUrl(formData) {
  const senderName = String(formData.get("senderName") || "").trim();
  const senderEmail = String(formData.get("senderEmail") || "").trim();
  const subject = String(formData.get("emailSubject") || "Website enquiry").trim();
  const message = String(formData.get("emailMessage") || "").trim();

  const emailBody = [
    "Hi Aron,",
    "",
    message,
    "",
    "---",
    `From: ${senderName}`,
    `Email: ${senderEmail}`,
    "Sent from burnaron.com"
  ].join("\n");

  return `mailto:black@burnaron.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
}

// Opens a small helper page that hands the prepared message to the visitor's email app.
function openMailtoHandoffWindow(mailtoUrl) {
  const handoffUrl = `email-handoff.html?mailto=${encodeURIComponent(mailtoUrl)}`;
  const handoffWindow = window.open(handoffUrl, "_blank", "width=720,height=720");

  if (!handoffWindow && emailStatus) {
    emailStatus.textContent = "Your browser blocked the email window. Allow pop-ups for this site and try again.";
  }
}

emailOpenButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    openEmailModal();
  });
});

emailCloseButtons.forEach((button) => {
  button.addEventListener("click", () => closeEmailModal());
});

if (continueToWebsiteButton) {
  continueToWebsiteButton.addEventListener("click", closeEmailThanksModal);
}

function handleInvalidEmailSubmit() {
  playInterfaceWarningSound();

  if (emailStatus) {
    emailStatus.textContent = "Please complete the required fields before preparing the email.";
  }

  window.setTimeout(() => {
    const invalidField = emailForm?.querySelector(":invalid");

    if (invalidField && typeof invalidField.focus === "function") {
      invalidField.focus();
    }

    emailForm?.reportValidity();
  }, 120);
}

if (emailForm) {
  const emailSubmitButton = emailForm.querySelector("button[type='submit']");

  if (emailSubmitButton) {
    emailSubmitButton.addEventListener("pointerdown", () => {
      if (!emailForm.checkValidity()) {
        playInterfaceWarningSound();
      }
    });

    emailSubmitButton.addEventListener("click", (event) => {
      if (emailForm.checkValidity()) return;

      event.preventDefault();
      handleInvalidEmailSubmit();
    });
  }

  emailForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!emailForm.checkValidity()) {
      handleInvalidEmailSubmit();
      return;
    }

    const mailtoUrl = buildMailtoUrl(new FormData(emailForm));

    /* Close the form first, then show the thank-you message and open the email handoff. */
    closeEmailModal({
      restoreFocus: false,
      afterClose: openEmailThanksModal
    });
    openMailtoHandoffWindow(mailtoUrl);
  });
}

/* Handles Escape and Tab so menus and modals behave properly from the keyboard. */
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (navLinks && navLinks.classList.contains("is-open")) {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.focus();
      return;
    }

    if (cvModal && !cvModal.hidden) {
      closeCvModal();
      return;
    }

    if (emailModal && !emailModal.hidden) {
      closeEmailModal();
      return;
    }

    if (emailThanksModal && !emailThanksModal.hidden) {
      closeEmailThanksModal();
      return;
    }
  }

  if (event.key !== "Tab" || !activeModal || activeModal.hidden) {
    return;
  }

  const focusableElements = getFocusableElements(activeModal);

  if (focusableElements.length === 0) {
    event.preventDefault();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
});
