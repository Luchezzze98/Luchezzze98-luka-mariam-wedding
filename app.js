"use strict";

const WEDDING = Object.freeze({
  startsAt: "2026-10-24T16:00:00+04:00",
  endsAt: "2026-10-24T23:59:00+04:00",
  title: "ლუკა და მარიამის ქორწილი",
  location: "ბაგინეთი, მცხეთა",
  description: "ჯვრისწერა — 16:00, სვეტიცხოველი. მიღება და ქორწილი — 17:00, ბაგინეთი."
});

const UI = {
  header: document.getElementById("siteHeader"),
  countdown: document.getElementById("countdown"),
  countdownDays: document.getElementById("countdownDays"),
  countdownHours: document.getElementById("countdownHours"),
  countdownMinutes: document.getElementById("countdownMinutes"),
  countdownSeconds: document.getElementById("countdownSeconds"),
  downloadCalendar: document.getElementById("downloadCalendar"),
  googleCalendar: document.getElementById("googleCalendar"),
  guestForm: document.getElementById("guestForm"),
  attendanceOptions: [...document.querySelectorAll('input[name="attendance"]')],
  attendingDetails: document.getElementById("attendingDetails"),
  firstName: document.getElementById("firstName"),
  lastName: document.getElementById("lastName"),
  hasCompanion: document.getElementById("hasCompanion"),
  companionFields: document.getElementById("companionFields"),
  companionFirstName: document.getElementById("companionFirstName"),
  companionLastName: document.getElementById("companionLastName"),
  dietaryNotes: document.getElementById("dietaryNotes"),
  adultConsent: document.getElementById("adultConsent"),
  adultConsentRow: document.getElementById("adultConsentRow"),
  website: document.getElementById("website"),
  formStatus: document.getElementById("formStatus"),
  submitButton: document.getElementById("submitButton"),
  successPanel: document.getElementById("successPanel"),
  successTitle: document.getElementById("successTitle"),
  successMessage: document.getElementById("successMessage"),
  editResponse: document.getElementById("editResponse")
};

let supabaseClient = null;
let countdownInterval = null;

function clean(value) {
  return value.trim().replace(/\s+/g, " ");
}

function getAttendance() {
  return UI.attendanceOptions.find((option) => option.checked)?.value || "attending";
}

function updateHeader() {
  UI.header.classList.toggle("is-scrolled", window.scrollY > 24);
}

function initializeRevealAnimations() {
  const elements = document.querySelectorAll(".reveal:not(.is-visible)");

  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -40px" });

  elements.forEach((element) => observer.observe(element));
}

function updateCountdown() {
  const difference = new Date(WEDDING.startsAt).getTime() - Date.now();

  if (difference <= 0) {
    clearInterval(countdownInterval);
    UI.countdown.innerHTML = "<p>ჩვენი განსაკუთრებული დღე დადგა ♡</p>";
    return;
  }

  const totalSeconds = Math.floor(difference / 1000);
  const values = {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60
  };

  UI.countdownDays.textContent = String(values.days);
  UI.countdownHours.textContent = String(values.hours).padStart(2, "0");
  UI.countdownMinutes.textContent = String(values.minutes).padStart(2, "0");
  UI.countdownSeconds.textContent = String(values.seconds).padStart(2, "0");
}

function toUtcCalendarStamp(dateString) {
  return new Date(dateString).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcsText(value) {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function buildCalendarFile() {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Luka and Mariam//Wedding Invitation//KA",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:luka-mariam-wedding-20261024@github.io`,
    `DTSTAMP:${toUtcCalendarStamp(new Date().toISOString())}`,
    `DTSTART:${toUtcCalendarStamp(WEDDING.startsAt)}`,
    `DTEND:${toUtcCalendarStamp(WEDDING.endsAt)}`,
    `SUMMARY:${escapeIcsText(WEDDING.title)}`,
    `DESCRIPTION:${escapeIcsText(WEDDING.description)}`,
    `LOCATION:${escapeIcsText(WEDDING.location)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ];

  return `${lines.join("\r\n")}\r\n`;
}

function downloadCalendarFile() {
  const blob = new Blob([buildCalendarFile()], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "luka-mariam-wedding.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function configureGoogleCalendarLink() {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: WEDDING.title,
    dates: `${toUtcCalendarStamp(WEDDING.startsAt)}/${toUtcCalendarStamp(WEDDING.endsAt)}`,
    details: WEDDING.description,
    location: WEDDING.location
  });
  UI.googleCalendar.href = `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function setCompanionVisibility(visible) {
  UI.companionFields.hidden = !visible;
  UI.hasCompanion.setAttribute("aria-expanded", String(visible));
  UI.companionFirstName.required = visible;
  UI.companionLastName.required = visible;

  if (!visible) {
    UI.companionFirstName.value = "";
    UI.companionLastName.value = "";
    clearInvalidState(UI.companionFirstName);
    clearInvalidState(UI.companionLastName);
  }
}

function setAttendanceVisibility() {
  const attending = getAttendance() === "attending";
  UI.attendingDetails.hidden = !attending;
  UI.adultConsentRow.hidden = !attending;
  UI.adultConsent.required = attending;

  if (!attending) {
    UI.hasCompanion.checked = false;
    setCompanionVisibility(false);
    UI.dietaryNotes.value = "";
    UI.adultConsent.checked = false;
    clearInvalidState(UI.adultConsent);
  }
}

function clearInvalidState(field) {
  field.removeAttribute("aria-invalid");
  field.setCustomValidity("");
}

function markInvalid(field, message) {
  field.setAttribute("aria-invalid", "true");
  field.setCustomValidity(message);
}

function validateForm() {
  const fields = [UI.firstName, UI.lastName, UI.companionFirstName, UI.companionLastName, UI.adultConsent];
  fields.forEach(clearInvalidState);

  if (!clean(UI.firstName.value)) markInvalid(UI.firstName, "გთხოვთ, მიუთითოთ თქვენი სახელი.");
  if (!clean(UI.lastName.value)) markInvalid(UI.lastName, "გთხოვთ, მიუთითოთ თქვენი გვარი.");

  if (getAttendance() === "attending" && UI.hasCompanion.checked) {
    if (!clean(UI.companionFirstName.value)) {
      markInvalid(UI.companionFirstName, "გთხოვთ, მიუთითოთ თანმხლების სახელი.");
    }
    if (!clean(UI.companionLastName.value)) {
      markInvalid(UI.companionLastName, "გთხოვთ, მიუთითოთ თანმხლების გვარი.");
    }
  }

  if (getAttendance() === "attending" && !UI.adultConsent.checked) {
    markInvalid(UI.adultConsent, "გთხოვთ, დაადასტუროთ 18+ ფორმატის მოთხოვნა.");
  }

  const invalidField = UI.guestForm.querySelector(":invalid");
  if (invalidField) {
    invalidField.setAttribute("aria-invalid", "true");
    UI.formStatus.textContent = invalidField.validationMessage || "გთხოვთ, შეავსოთ აუცილებელი ველები.";
    invalidField.focus();
    return false;
  }

  UI.formStatus.textContent = "";
  return true;
}

function readFormData() {
  const attendanceStatus = getAttendance();
  const includesCompanion = attendanceStatus === "attending" && UI.hasCompanion.checked;

  return {
    attendanceStatus,
    firstName: clean(UI.firstName.value),
    lastName: clean(UI.lastName.value),
    companionFirstName: includesCompanion ? clean(UI.companionFirstName.value) : "",
    companionLastName: includesCompanion ? clean(UI.companionLastName.value) : "",
    dietaryNotes: attendanceStatus === "attending" ? clean(UI.dietaryNotes.value) : ""
  };
}

function isSupabaseConfigured() {
  return Boolean(
    window.supabase &&
    window.SUPABASE_URL &&
    window.SUPABASE_ANON_KEY &&
    !window.SUPABASE_URL.includes("PASTE_YOUR") &&
    !window.SUPABASE_ANON_KEY.includes("PASTE_YOUR")
  );
}

function getSupabaseClient() {
  if (!isSupabaseConfigured()) throw new Error("SUPABASE_NOT_CONFIGURED");
  if (!supabaseClient) {
    supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

async function saveGuest(data) {
  const client = getSupabaseClient();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);

  try {
    const { error } = await client
      .from("guest_submissions")
      .insert({
        attendance_status: data.attendanceStatus,
        first_name: data.firstName,
        last_name: data.lastName,
        companion_first_name: data.companionFirstName || null,
        companion_last_name: data.companionLastName || null,
        dietary_notes: data.dietaryNotes || null
      })
      .abortSignal(controller.signal);

    if (error) throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function setSubmitting(submitting) {
  UI.submitButton.disabled = submitting;
  UI.submitButton.querySelector(".button-label").textContent = submitting ? "იგზავნება…" : "პასუხის გაგზავნა";
}

function showSuccess(data) {
  UI.guestForm.hidden = true;
  UI.successPanel.hidden = false;
  UI.successTitle.textContent = `დიდი მადლობა, ${data.firstName}`;
  UI.successMessage.textContent = data.attendanceStatus === "attending"
    ? "თქვენი პასუხი მიღებულია. მოუთმენლად ველით თქვენთან შეხვედრას."
    : "თქვენი პასუხი მიღებულია. მადლობა, რომ შეგვატყობინეთ — ძალიან დაგვაკლდებით.";
  UI.successPanel.focus({ preventScroll: true });
  localStorage.setItem("luka-mariam-rsvp-submitted", "true");
}

function getSubmissionErrorMessage(error) {
  if (error.name === "AbortError") {
    return "მოთხოვნას მოსალოდნელზე მეტი დრო დასჭირდა. შეამოწმეთ ინტერნეტი და სცადეთ ხელახლა.";
  }
  if (error.message === "SUPABASE_NOT_CONFIGURED") {
    return "დადასტურების სერვისი ჯერ არ არის კონფიგურირებული.";
  }
  return "დაფიქსირდა ტექნიკური ხარვეზი. თქვენი პასუხი არ შენახულა — გთხოვთ, სცადოთ ხელახლა.";
}

async function handleSubmit(event) {
  event.preventDefault();
  UI.formStatus.textContent = "";

  if (UI.website.value) {
    UI.guestForm.reset();
    return;
  }

  if (!validateForm()) return;

  const data = readFormData();
  setSubmitting(true);

  try {
    await saveGuest(data);
    showSuccess(data);
  } catch (error) {
    console.error("RSVP submission failed", error);
    UI.formStatus.textContent = getSubmissionErrorMessage(error);
  } finally {
    setSubmitting(false);
  }
}

function editResponse() {
  UI.successPanel.hidden = true;
  UI.guestForm.hidden = false;
  UI.formStatus.textContent = "";
  UI.firstName.focus({ preventScroll: true });
}

function initializeForm() {
  UI.attendanceOptions.forEach((option) => option.addEventListener("change", setAttendanceVisibility));
  UI.hasCompanion.addEventListener("change", () => setCompanionVisibility(UI.hasCompanion.checked));
  UI.guestForm.addEventListener("submit", handleSubmit);
  UI.editResponse.addEventListener("click", editResponse);

  UI.guestForm.querySelectorAll("input, textarea").forEach((field) => {
    field.addEventListener("input", () => clearInvalidState(field));
    field.addEventListener("change", () => clearInvalidState(field));
  });
}

function initialize() {
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  updateCountdown();
  countdownInterval = window.setInterval(updateCountdown, 1000);

  configureGoogleCalendarLink();
  UI.downloadCalendar.addEventListener("click", downloadCalendarFile);

  initializeForm();
  initializeRevealAnimations();
}

initialize();
