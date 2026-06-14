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

if (bootScreen) {
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
    "#bootSkip, [data-email-open], [data-copy-email], [data-cv-open], .hero-actions a[href*='linkedin.com'], #emailModal button[type='submit']"
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
