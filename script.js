/* Runs the short intro screen before the main portfolio is shown. */
const bootScreen = document.querySelector("#bootScreen");
const bootSkip = document.querySelector("#bootSkip");
const bootStatus = document.querySelector("#bootStatus");

// Finishes the boot screen. Skip uses the quick exit; normal loading uses the soft fade.
function completeBootScreen({ immediate = false } = {}) {
  if (!bootScreen) return;

  if (bootStatus) {
    bootStatus.textContent = "Profile ready.";
  }

  if (immediate) {
    bootScreen.classList.add("is-complete");
    document.body.classList.remove("booting");

    window.setTimeout(() => {
      bootScreen.remove();
    }, 620);

    return;
  }

  bootScreen.classList.add("is-fading-out");

  window.setTimeout(() => {
    bootScreen.classList.add("is-complete");
    document.body.classList.remove("booting");
  }, 250);

  window.setTimeout(() => {
    bootScreen.remove();
  }, 2100);
}

if (bootScreen) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const bootDuration = prefersReducedMotion ? 650 : 8600;

  if (bootStatus) {
    const bootMessages = [
      [500, "Identifying signal..."],
      [1550, "Signal located. Reviewing context..."],
      [2750, "Context reviewed. Separating noise from risk..."],
      [4050, "Findings structured. Documenting decision path..."],
      [5350, "Decision path documented. Opening portfolio..."],
      [6300, "Profile ready."]
    ];

    bootMessages.forEach(([delay, message]) => {
      window.setTimeout(() => {
        if (bootScreen && !bootScreen.classList.contains("is-complete")) {
          bootStatus.textContent = message;
        }
      }, prefersReducedMotion ? 0 : delay);
    });
  }

  // Waits for the boot screen to finish unless the visitor skips it.
  const bootTimer = window.setTimeout(completeBootScreen, bootDuration);

  if (bootSkip) {
    bootSkip.addEventListener("click", () => {
      window.clearTimeout(bootTimer);
      completeBootScreen({ immediate: true });
    });
  }
}

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const year = document.querySelector("#year");

if (year) {
  year.textContent = new Date().getFullYear();
}

if (navToggle && navLinks) {
  // Opens the mobile menu and locks the page behind it.
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("menu-open", isOpen);
  });

  // Closes the mobile menu after a navigation link is selected.
  navLinks.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    }
  });
}

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
const cvFallbackLink = document.querySelector("#cvFallbackLink");
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

  if (cvFallbackLink) {
    cvFallbackLink.href = cvUrl;
  }
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

if (emailForm) {
  emailForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!emailForm.reportValidity()) {
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
      document.body.classList.remove("menu-open");
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
