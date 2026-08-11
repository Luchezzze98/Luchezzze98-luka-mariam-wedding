const invitation = document.getElementById("invitation");
const guestFormScreen = document.getElementById("guest-form");
const agenda = document.getElementById("agenda");
const startButton = document.getElementById("startButton");
const backButton = document.getElementById("backButton");
const guestForm = document.getElementById("guestForm");
const submitButton = document.getElementById("submitButton");
const formError = document.getElementById("formError");
const welcomeTitle = document.getElementById("welcomeTitle");

function showScreen(screen) {
  [invitation, guestFormScreen, agenda].forEach((s) => s.classList.add("hidden"));
  screen.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

startButton.addEventListener("click", () => showScreen(guestFormScreen));
backButton.addEventListener("click", () => showScreen(invitation));

function clean(value) {
  return value.trim().replace(/\s+/g, " ");
}

function readAndValidateForm() {
  const firstName = clean(document.getElementById("firstName").value);
  const lastName = clean(document.getElementById("lastName").value);
  const companionFirstName = clean(document.getElementById("companionFirstName").value);
  const companionLastName = clean(document.getElementById("companionLastName").value);
  const adultConsent = document.getElementById("adultConsent").checked;

  if (!firstName || !lastName) throw new Error("გთხოვთ, მიუთითოთ თქვენი სახელი და გვარი.");
  if ((companionFirstName && !companionLastName) || (!companionFirstName && companionLastName)) {
    throw new Error("თანმხლები პირის შემთხვევაში გთხოვთ, მიუთითოთ სახელიც და გვარიც.");
  }
  if (!adultConsent) throw new Error("გთხოვთ, დაადასტუროთ 18+ ფორმატის მოთხოვნა.");

  return { firstName, lastName, companionFirstName, companionLastName };
}

function supabaseConfigured() {
  return window.SUPABASE_URL && window.SUPABASE_ANON_KEY &&
    !window.SUPABASE_URL.includes("PASTE_YOUR") &&
    !window.SUPABASE_ANON_KEY.includes("PASTE_YOUR");
}

async function saveGuest(data) {
  if (!supabaseConfigured()) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const { error } = await client.from("guest_submissions").insert({
    first_name: data.firstName,
    last_name: data.lastName,
    companion_first_name: data.companionFirstName || null,
    companion_last_name: data.companionLastName || null
  });

  if (error) throw error;
}

guestForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.textContent = "";

  let data;
  try {
    data = readAndValidateForm();
  } catch (error) {
    formError.textContent = error.message;
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "ინახება…";

  try {
    await saveGuest(data);
    const companion = data.companionFirstName ? ` და ${data.companionFirstName} ${data.companionLastName}` : "";
    welcomeTitle.textContent = `მოგესალმებით, ${data.firstName} ${data.lastName}${companion}`;
    showScreen(agenda);
  } catch (error) {
    console.error(error);
    formError.textContent = error.message === "SUPABASE_NOT_CONFIGURED"
      ? "Supabase ჯერ არ არის კონფიგურირებული. შეავსეთ js/config.js."
      : "დაფიქსირდა ტექნიკური ხარვეზი. გთხოვთ, სცადოთ ხელახლა.";
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'ჩემი დღის ნახვა <span>→</span>';
  }
});
