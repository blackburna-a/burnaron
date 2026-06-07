const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const year = document.querySelector("#year");

if (year) {
  year.textContent = new Date().getFullYear();
}

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("menu-open", isOpen);
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    }
  });
}

/* Focus trapping shared by CV, email and thank-you modals. */
const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

let activeModal = null;

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

function activateFocusTrap(modal, preferredFocusTarget = null) {
  activeModal = modal;

  const focusTarget = preferredFocusTarget || getFocusableElements(modal)[0];
  if (focusTarget && typeof focusTarget.focus === "function") {
    focusTarget.focus();
  }
}

function deactivateFocusTrap(modal) {
  if (activeModal === modal) {
    activeModal = null;
  }
}

/* CV modal viewer */
const cvModal = document.querySelector("#cvModal");
const cvImage = document.querySelector("#cvImage");
const cvFrame = document.querySelector("#cvFrame");
const cvFallbackLink = document.querySelector("#cvFallbackLink");
const cvOpenLink = document.querySelector("#cvOpenLink");
const cvOpenButtons = document.querySelectorAll("[data-cv-open]");
const cvCloseButtons = document.querySelectorAll("[data-cv-close]");

let cvLastFocusedElement = null;

function isImageFile(url) {
  return /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(url);
}

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

  cvModal.hidden = false;
  document.body.classList.add("cv-modal-open");

  activateFocusTrap(cvModal, cvOpenLink || cvModal.querySelector("[data-cv-close]"));
}

function closeCvModal() {
  if (!cvModal || !cvImage || !cvFrame) return;

  cvModal.hidden = true;
  cvImage.src = "";
  cvFrame.src = "";
  cvImage.hidden = true;
  cvFrame.hidden = true;
  document.body.classList.remove("cv-modal-open");
  deactivateFocusTrap(cvModal);

  if (cvLastFocusedElement && typeof cvLastFocusedElement.focus === "function") {
    cvLastFocusedElement.focus();
  }
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

/* Email compose modal with separate-window mailto handoff */
const emailModal = document.querySelector("#emailModal");
const emailThanksModal = document.querySelector("#emailThanksModal");
const emailForm = document.querySelector("#emailForm");
const emailStatus = document.querySelector("#emailStatus");
const emailOpenButtons = document.querySelectorAll("[data-email-open]");
const emailCloseButtons = document.querySelectorAll("[data-email-close]");
const continueToWebsiteButton = document.querySelector("#continueToWebsite");
const senderNameInput = document.querySelector("#senderName");

let emailLastFocusedElement = null;

function openEmailModal() {
  if (!emailModal) return;

  emailLastFocusedElement = document.activeElement;
  emailModal.hidden = false;
  document.body.classList.add("email-modal-open");

  if (emailStatus) {
    emailStatus.textContent = "";
  }

  activateFocusTrap(emailModal, senderNameInput || getFocusableElements(emailModal)[0]);
}

function closeEmailModal({ restoreFocus = true } = {}) {
  if (!emailModal) return;

  emailModal.hidden = true;
  document.body.classList.remove("email-modal-open");
  deactivateFocusTrap(emailModal);

  if (emailStatus) {
    emailStatus.textContent = "";
  }

  if (restoreFocus && emailLastFocusedElement && typeof emailLastFocusedElement.focus === "function") {
    emailLastFocusedElement.focus();
  }
}

function openEmailThanksModal() {
  if (!emailThanksModal) return;

  emailThanksModal.hidden = false;
  document.body.classList.add("email-thanks-modal-open");

  activateFocusTrap(emailThanksModal, continueToWebsiteButton || getFocusableElements(emailThanksModal)[0]);
}

function closeEmailThanksModal() {
  if (!emailThanksModal) return;

  emailThanksModal.hidden = true;
  document.body.classList.remove("email-thanks-modal-open");
  deactivateFocusTrap(emailThanksModal);

  if (emailLastFocusedElement && typeof emailLastFocusedElement.focus === "function") {
    emailLastFocusedElement.focus();
  }
}

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

    /* Review and send closes the compose form, then opens a separate thank-you modal. */
    closeEmailModal({ restoreFocus: false });
    openEmailThanksModal();
    openMailtoHandoffWindow(mailtoUrl);
  });
}

/* Global keyboard handling for menu and active modals. */
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
