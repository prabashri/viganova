function initContactForm() {
  const LOCAL_STORAGE_KEY = "contact_form_last_submitted";
  const COOLDOWN_MINUTES = 3;

  const form = document.getElementById("contact-form");
  const statusBox = document.getElementById("form-status");
  const successBox = document.getElementById("success-box");
  const subjectSelect = document.getElementById("subject");
  const reviewFields = document.getElementById("review-fields");
  const commentFields = document.getElementById("comment-fields");

  if (!form) return;

  /** -------------------------
   * Utility: Sanitize user input
   * ------------------------- */
  const sanitize = (str) => (str ? String(str).replace(/<[^>]*>?/gm, "").trim() : "");

  /** -------------------------
   * Utility: Show user message safely
   * ------------------------- */
  const showMessage = (box, message, isError = false) => {
    box.textContent = message;
    box.classList.toggle("error", isError);
    box.classList.remove("display-none");
  };

  /** -------------------------
   * Handle subject change (toggle conditional fields)
   * ------------------------- */
  const subjectAliases = {
    support: "Support",
    feedback: "Feedback",
    suggestions: "Suggestions",
    suggestion: "Suggestions",
    business: "Business Enquiries",
    reviews: "Reviews",
    review: "Reviews",
    comment: "Comment",
    comments: "Comment",
    security: "Security"
  };

  subjectSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    reviewFields.classList.toggle("hidden", val !== "Reviews");
    commentFields.classList.toggle("hidden", val !== "Comment");
  });

  /** -------------------------
   * Prefill from query params
   * ------------------------- */
  const params = new URLSearchParams(window.location.search);
  const querySubject = params.get("subject");
  const queryPost = params.get("post");
  const queryTitle = params.get("title");

  if (querySubject) {
    const normalized = querySubject.trim().toLowerCase().replace(/[^a-z]/g, "");
    const matched = subjectAliases[normalized];
    if (matched) {
      subjectSelect.value = matched;
      subjectSelect.dispatchEvent(new Event("change"));
    }
  }

  if (queryPost) form.querySelector("[name='postUrl']").value = decodeURIComponent(queryPost);
  if (queryTitle) form.querySelector("[name='postTitle']").value = decodeURIComponent(queryTitle);

  /** -------------------------
   * Cooldown check
   * ------------------------- */
  const runCooldownCheck = () => {
    const last = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!last) return false;

    const now = Date.now();
    const diff = now - parseInt(last, 10);
    const remaining = COOLDOWN_MINUTES * 60 * 1000 - diff;

    if (remaining > 0) {
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      showMessage(successBox, `✅ Message sent! Please wait ${mins}:${secs.toString().padStart(2, "0")} before sending another.`);
      form.classList.add("display-none");
      setTimeout(runCooldownCheck, 1000);
      return true;
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return false;
    }
  };

  if (runCooldownCheck()) return;

  /** -------------------------
   * Submit handler
   * ------------------------- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showMessage(statusBox, "Sending...", false);

    const formData = new FormData(form);

    // Honeypot spam block
    if (formData.get("website")) {
      showMessage(statusBox, "Submission blocked. Please try again later.", true);
      return;
    }

    // Token validation
    const token = formData.get("token") || formData.get("cf-turnstile-response");
    if (!token) {
      showMessage(statusBox, "❌ Please complete the CAPTCHA.", true);
      return;
    }

    // Sanitize fields
    const name = sanitize(formData.get("name"));
    const email = sanitize(formData.get("email"));
    const subject = sanitize(formData.get("subject"));
    const messageInput = sanitize(formData.get("message"));
    const adminEmail = sanitize(formData.get("adminEmail")) || "";

    // Validation
    if (!name || !email || !subject || !messageInput) {
      showMessage(statusBox, "❌ All required fields must be filled.", true);
      return;
    }

    if (!/^[\w\s.@+-]+$/.test(email)) {
      showMessage(statusBox, "❌ Invalid email format.", true);
      return;
    }

    // Additional fields
    const postUrl = formData.get("postUrl");
    const postTitle = formData.get("postTitle");
    const isPublic = formData.get("isPublicReview") === "on" || formData.get("isPublicComment") === "on";

    const reviewScore =
      subject === "Reviews" && /^[1-5]$/.test(formData.get("reviewScore"))
        ? Number(formData.get("reviewScore"))
        : null;

    const affiliation = sanitize(formData.get("affiliation")) || "";
    let message = messageInput;

    // Append extra details
    if (subject === "Reviews") {
      message += `\n\nReview Score: ${reviewScore}/5`;
    } else if (subject === "Comment") {
      message += `\n\nComment on: ${postTitle} (${postUrl || "Unknown"})\nVisibility: ${isPublic ? "Public" : "Private"}`;
    }

    const payload = {
      name,
      email,
      subject,
      message,
      token,
      adminEmail,
      brand: document.querySelector("[name='brand']")?.value || "AstroWEB",
      reviewScore,
      isPublic,
      affiliation,
      postTitle,
      postUrl
    };

    try {
      const handler = formData.get("handler");
      if (!handler) {
        showMessage(statusBox, "❌ Service unavailable. Please contact admin directly.", true);
        return;
      }

      const res = await fetch(handler, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        localStorage.setItem(LOCAL_STORAGE_KEY, Date.now().toString());
        form.reset();
        showMessage(successBox, `✅ Message sent successfully!`);
        form.classList.add("display-none");
      } else {
        showMessage(statusBox, "❌ Unable to process request at this time.", true);
      }
    } catch (err) {
      console.warn("Form submission error:", err); // No sensitive info exposed
      showMessage(statusBox, "❌ Unable to process request at this time.", true);
    }
  });
}

// Initialize form when DOM is ready
document.addEventListener("DOMContentLoaded", initContactForm);
