const modal = document.querySelector("#lead-modal");
const openButtons = document.querySelectorAll("[data-open-modal]");
const closeButtons = document.querySelectorAll("[data-close-modal]");
const leadForms = document.querySelectorAll("[data-lead-form]");
const revealItems = document.querySelectorAll(".reveal");
const modalForms = modal ? modal.querySelectorAll("[data-lead-form]") : [];
const nav = document.querySelector("#site-nav");
const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = nav ? nav.querySelectorAll("a, button") : [];

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

const setNavState = (isOpen) => {
  if (!nav || !navToggle) {
    return;
  }

  nav.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
};

if (navToggle) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    setNavState(!isOpen);
  });
}

navLinks.forEach((element) => {
  element.addEventListener("click", () => setNavState(false));
});

openButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setNavState(false);
    setModalState(true);
  });
});

closeButtons.forEach((button) => {
  button.addEventListener("click", () => setModalState(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setNavState(false);
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
      feedback.textContent = "Заполните все поля, чтобы мы могли связаться с вами.";
      feedback.classList.add("is-error");
      return;
    }

    if (!phoneLooksValid(phone)) {
      feedback.textContent = "Укажите корректный номер WhatsApp.";
      feedback.classList.add("is-error");
      return;
    }

    saveLead({ phone, name, clinic });

    feedback.textContent =
      "Заявка принята. Мы свяжемся с вами и покажем сценарий под вашу клинику.";
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
