const modal = document.querySelector("#lead-modal");
const openButtons = document.querySelectorAll("[data-open-modal]");
const closeButtons = document.querySelectorAll("[data-close-modal]");
const leadForms = document.querySelectorAll("[data-lead-form]");
const revealItems = document.querySelectorAll(".reveal");
const modalForms = modal ? modal.querySelectorAll("[data-lead-form]") : [];

const STORAGE_KEY = "dentdesk-language";
const DEFAULT_LANGUAGE = "ru";
const TRANSLATION_PATH = "./translations.json";
let translations = {};
let currentLanguage = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;

const getText = (key, lang = currentLanguage) => {
  const entry = translations[key];
  if (!entry) {
    return "";
  }
  return entry[lang] || entry.ru || "";
};

const translateElement = (element, key, lang) => {
  const text = getText(key, lang);
  if (!text) {
    return;
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    if (element.placeholder) {
      element.placeholder = text;
      return;
    }

    element.value = text;
    return;
  }

  if (element.hasAttribute("placeholder")) {
    element.setAttribute("placeholder", text);
    return;
  }

  if (element.hasAttribute("aria-label")) {
    element.setAttribute("aria-label", text);
  }

  element.textContent = text;
};

const updateLanguageUI = () => {
  document.querySelectorAll(".lang-switcher-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === currentLanguage);
  });
};

const loadTranslations = async () => {
  if (Object.keys(translations).length) {
    return;
  }

  try {
    const response = await fetch(TRANSLATION_PATH);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    translations = await response.json();
  } catch (error) {
    console.warn("Unable to load translations:", error);
  }
};

const translatePage = async (lang = currentLanguage) => {
  currentLanguage = lang;
  document.documentElement.lang = lang;
  await loadTranslations();

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    translateElement(element, element.dataset.i18n, lang);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    if (!key) {
      return;
    }
    element.setAttribute("placeholder", getText(key, lang));
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    const key = element.dataset.i18nAriaLabel;
    if (!key) {
      return;
    }
    element.setAttribute("aria-label", getText(key, lang));
  });

  document.querySelectorAll("[data-i18n-meta]").forEach((element) => {
    const key = element.dataset.i18nMeta;
    if (!key) {
      return;
    }
    element.setAttribute("content", getText(key, lang));
  });

  const titleElement = document.querySelector("title[data-i18n]");
  if (titleElement) {
    document.title = getText(titleElement.dataset.i18n, lang);
  }

  updateLanguageUI();
};

const setLanguage = (lang) => {
  if (!lang || lang === currentLanguage) {
    return;
  }

  localStorage.setItem(STORAGE_KEY, lang);
  translatePage(lang);
};

const resetFormState = (form) => {
  const feedback = form.querySelector(".form-feedback");

  form.reset();

  if (feedback) {
    feedback.textContent = "";
    feedback.className = "form-feedback";
  }
};

const setModalState = (isOpen) => {
  if (!modal) {
    return;
  }

  modal.classList.toggle("is-open", isOpen);
  modal.setAttribute("aria-hidden", String(!isOpen));
  document.body.style.overflow = isOpen ? "hidden" : "";

  if (isOpen) {
    modalForms.forEach(resetFormState);

    const firstInput = modal.querySelector("input");
    if (firstInput instanceof HTMLElement) {
      window.setTimeout(() => firstInput.focus(), 30);
    }
  }
};

openButtons.forEach((button) => {
  button.addEventListener("click", () => setModalState(true));
});

const languageButtons = document.querySelectorAll(".lang-switcher-item");
languageButtons.forEach((button) => {
  const lang = button.dataset.lang;
  if (!lang) {
    return;
  }

  button.addEventListener("click", () => setLanguage(lang));
});

closeButtons.forEach((button) => {
  button.addEventListener("click", () => setModalState(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setModalState(false);
  }
});

const phoneLooksValid = (phone) => {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10;
};

const saveLead = (payload) => {
  const storageKey = "dentdesk-demo-leads";
  const existingRaw = localStorage.getItem(storageKey);
  let existing = [];

  if (existingRaw) {
    try {
      existing = JSON.parse(existingRaw);
    } catch {
      existing = [];
    }
  }

  existing.push({
    ...payload,
    submittedAt: new Date().toISOString(),
  });

  try {
    localStorage.setItem(storageKey, JSON.stringify(existing));
  } catch {
    return;
  }
};

leadForms.forEach((form) => {
  const feedback = form.querySelector(".form-feedback");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const phone = String(formData.get("phone") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const clinic = String(formData.get("clinic") || "").trim();

    feedback.textContent = "";
    feedback.className = "form-feedback";

    if (!phone || !name || !clinic) {
      feedback.textContent = getText("formErrorMissingFields");
      feedback.classList.add("is-error");
      return;
    }

    if (!phoneLooksValid(phone)) {
      feedback.textContent = getText("formErrorInvalidPhone");
      feedback.classList.add("is-error");
      return;
    }

    saveLead({ phone, name, clinic });

    feedback.textContent = getText("formSuccess");
    feedback.classList.add("is-success");
    form.reset();

    if (modal && modal.classList.contains("is-open")) {
      window.setTimeout(() => setModalState(false), 1300);
    }
  });
});

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -40px 0px",
    }
  );

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 45, 280)}ms`;
    observer.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

translatePage(currentLanguage);
