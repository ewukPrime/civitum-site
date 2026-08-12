document.addEventListener("DOMContentLoaded", () => {
  const apiBase = document.querySelector('meta[name="civitum-api-base"]').content.replace(/\/$/, "");
  const keys = {
    access: "civitum_access_token",
    refresh: "civitum_refresh_token",
    user: "civitum_user"
  };
  const authButton = document.querySelector(".account-button--ghost");
  const profileButton = document.querySelector(".account-actions .account-button:not(.account-button--ghost)");
  let currentUser = readUser();
  let catalogBySlug = new Map();

  function readUser() {
    try {
      return JSON.parse(sessionStorage.getItem(keys.user) || "null");
    } catch {
      return null;
    }
  }

  function saveSession(data) {
    sessionStorage.setItem(keys.access, data.access_token);
    sessionStorage.setItem(keys.refresh, data.refresh_token);
    sessionStorage.setItem(keys.user, JSON.stringify(data.user));
    currentUser = data.user;
    updateAccountButtons();
  }

  function clearSession() {
    Object.values(keys).forEach((key) => sessionStorage.removeItem(key));
    currentUser = null;
    updateAccountButtons();
  }

  async function refreshSession() {
    const refreshToken = sessionStorage.getItem(keys.refresh);
    if (!refreshToken) return false;
    const response = await fetch(`${apiBase}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    if (!response.ok) {
      clearSession();
      return false;
    }
    saveSession(await response.json());
    return true;
  }

  async function apiRequest(path, options = {}, retry = true) {
    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const accessToken = sessionStorage.getItem(keys.access);
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    const response = await fetch(`${apiBase}${path}`, { ...options, headers });
    if (response.status === 401 && retry && await refreshSession()) {
      return apiRequest(path, options, false);
    }
    if (response.status === 204) return null;
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || "Сервер отклонил запрос");
    return data;
  }

  const modal = document.createElement("div");
  modal.className = "account-overlay";
  modal.hidden = true;
  modal.innerHTML = `
    <section class="account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-title">
      <header class="account-dialog__header">
        <h2 id="account-title">Аккаунт Civitum</h2>
        <button class="account-dialog__close" type="button" aria-label="Закрыть">×</button>
      </header>
      <div class="account-dialog__body">
        <div class="account-tabs" role="tablist">
          <button type="button" data-account-tab="login" aria-selected="true">Вход</button>
          <button type="button" data-account-tab="register" aria-selected="false">Регистрация</button>
        </div>
        <form class="account-form" data-account-form="login">
          <label>Никнейм или email<input name="login" required minlength="3" maxlength="254" autocomplete="username"></label>
          <label>Пароль<input name="password" type="password" required maxlength="128" autocomplete="current-password"></label>
          <button class="account-submit" type="submit">Войти</button>
        </form>
        <form class="account-form" data-account-form="register" hidden>
          <label>Minecraft-ник<input name="username" required minlength="3" maxlength="16" pattern="[A-Za-z0-9_]+" autocomplete="username"></label>
          <label>Email<input name="email" type="email" required maxlength="254" autocomplete="email"></label>
          <label>Пароль<input name="password" type="password" required minlength="10" maxlength="128" autocomplete="new-password"></label>
          <button class="account-submit" type="submit">Создать аккаунт</button>
        </form>
        <section class="account-profile" hidden>
          <dl>
            <dt>Никнейм</dt><dd data-profile="username"></dd>
            <dt>Email</dt><dd data-profile="email"></dd>
            <dt>Роль</dt><dd data-profile="role"></dd>
          </dl>
          <button class="account-logout" type="button">Выйти из аккаунта</button>
        </section>
        <p class="account-message" aria-live="polite"></p>
      </div>
    </section>`;
  document.body.appendChild(modal);

  const tabs = [...modal.querySelectorAll("[data-account-tab]")];
  const forms = [...modal.querySelectorAll("[data-account-form]")];
  const profile = modal.querySelector(".account-profile");
  const message = modal.querySelector(".account-message");
  const roleNames = {
    player: "Игрок",
    admin: "Администратор",
    head_admin: "Главный администратор",
    creator: "Создатель"
  };

  function updateAccountButtons() {
    authButton.textContent = currentUser ? currentUser.username : "Авторизация";
    profileButton.textContent = currentUser ? "Профиль" : "Регистрация";
  }

  function selectView(view) {
    const showProfile = view === "profile" && currentUser;
    modal.querySelector(".account-tabs").hidden = showProfile;
    profile.hidden = !showProfile;
    forms.forEach((form) => {
      form.hidden = showProfile || form.dataset.accountForm !== view;
    });
    tabs.forEach((tab) => {
      tab.setAttribute("aria-selected", String(tab.dataset.accountTab === view));
    });
    message.textContent = "";
    if (showProfile) {
      profile.querySelector('[data-profile="username"]').textContent = currentUser.username;
      profile.querySelector('[data-profile="email"]').textContent = currentUser.email;
      profile.querySelector('[data-profile="role"]').textContent = roleNames[currentUser.role] || currentUser.role;
    }
  }

  function openModal(view = "login") {
    selectView(view);
    modal.hidden = false;
    document.body.classList.add("account-modal-is-open");
    modal.querySelector("input:not([hidden]), button:not([hidden])")?.focus({ preventScroll: true });
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("account-modal-is-open");
  }

  tabs.forEach((tab) => tab.addEventListener("click", () => selectView(tab.dataset.accountTab)));
  modal.querySelector(".account-dialog__close").addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
  window.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modal.hidden) closeModal(); });
  authButton.addEventListener("click", () => openModal(currentUser ? "profile" : "login"));
  profileButton.addEventListener("click", () => openModal(currentUser ? "profile" : "register"));

  forms.forEach((form) => form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    message.textContent = "Связываемся со штабом…";
    const values = Object.fromEntries(new FormData(form));
    values.client_type = "web";
    try {
      const endpoint = form.dataset.accountForm === "login"
        ? "/api/v1/auth/login"
        : "/api/v1/auth/register";
      saveSession(await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(values)
      }, false));
      form.reset();
      selectView("profile");
      message.textContent = "Аккаунт подключён.";
    } catch (error) {
      message.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  }));

  modal.querySelector(".account-logout").addEventListener("click", async () => {
    const refreshToken = sessionStorage.getItem(keys.refresh);
    try {
      if (refreshToken) {
        await apiRequest("/api/v1/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken })
        });
      }
    } catch {
      // Local logout must still work when the API is unavailable.
    }
    clearSession();
    selectView("login");
    message.textContent = "Вы вышли из аккаунта.";
  });

  async function restoreAccount() {
    if (!sessionStorage.getItem(keys.access)) return;
    try {
      currentUser = await apiRequest("/api/v1/auth/me");
      sessionStorage.setItem(keys.user, JSON.stringify(currentUser));
    } catch {
      clearSession();
    }
    updateAccountButtons();
  }

  async function loadPosts() {
    try {
      const data = await apiRequest("/api/v1/posts?limit=6");
      const cards = [...document.querySelectorAll(".rp-card")];
      const categoryNames = { reports: "Сводки", events: "События", admin: "Администрация" };
      cards.forEach((card, index) => {
        const post = data.items[index];
        card.hidden = !post;
        if (!post) return;
        card.dataset.rpSlug = post.slug;
        card.dataset.rpCategory = post.category;
        card.dataset.apiBody = JSON.stringify(
          post.body.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
        );
        card.querySelector(".rp-card-copy > div span").textContent = categoryNames[post.category] || post.category;
        const time = card.querySelector("time");
        const date = new Date(post.published_at || post.created_at);
        time.dateTime = date.toISOString();
        time.textContent = date.toLocaleDateString("ru-RU");
        card.querySelector("h3").textContent = post.title;
        card.querySelector("p").textContent = post.lead;
        card.querySelector(".rp-card-visual span").textContent = post.visual_label || "CIVITUM";
        card.setAttribute("aria-label", `Открыть публикацию: ${post.title}`);
      });
      document.getElementById("rp-result-count").textContent = `${data.items.length} записей`;
    } catch (error) {
      console.warn("Civitum posts API is unavailable:", error.message);
    }
  }

  const formatRub = (cents) => `${Math.round(cents / 100).toLocaleString("ru-RU")} ₽`;

  async function loadCatalog() {
    try {
      const data = await apiRequest("/api/v1/shop/products");
      catalogBySlug = new Map(data.items.map((product) => [product.slug, product]));
      document.querySelectorAll(".shop-card").forEach((card) => {
        const product = catalogBySlug.get(card.dataset.shopSlug);
        card.hidden = !product;
        if (!product) return;
        card.dataset.shopCategory = product.category;
        card.querySelector("h3").textContent = product.name;
        card.querySelector("p").textContent = product.description;
        card.querySelector(".shop-card-visual span").textContent = product.symbol;
        card.querySelector(".shop-card-copy strong").textContent = formatRub(product.variants[0].price_cents);
      });
      document.getElementById("shop-result-count").textContent = `${data.items.length} товаров`;
    } catch (error) {
      console.warn("Civitum shop API is unavailable:", error.message);
    }
  }

  function syncSelectedVariantPrice() {
    const selected = document.querySelector('[data-shop-multiplier][aria-pressed="true"]');
    if (!selected?.dataset.apiPriceCents) return;
    const price = formatRub(Number(selected.dataset.apiPriceCents));
    document.getElementById("shop-product-total").textContent = price;
    document.getElementById("shop-payment-price").textContent = price;
    const submit = document.getElementById("shop-payment-submit");
    if (!submit.classList.contains("is-complete")) submit.textContent = `Оплатить ${price}`;
  }

  function syncShopVariants() {
    const card = document.querySelector(".shop-card.is-selected");
    const product = card && catalogBySlug.get(card.dataset.shopSlug);
    if (!product) return;
    document.querySelectorAll("[data-shop-multiplier]").forEach((button, index) => {
      const variant = product.variants[index];
      button.hidden = !variant;
      if (!variant) return;
      button.dataset.apiVariantId = variant.id;
      button.dataset.apiPriceCents = variant.price_cents;
      button.querySelector("span").textContent = variant.name;
      button.querySelector("strong").textContent = formatRub(variant.price_cents);
    });
    syncSelectedVariantPrice();
  }

  const productOverlay = document.getElementById("shop-product-overlay");
  new MutationObserver(() => {
    if (!productOverlay.hidden) queueMicrotask(syncShopVariants);
  }).observe(productOverlay, { attributes: true, attributeFilter: ["hidden"] });

  document.querySelectorAll("[data-shop-multiplier]").forEach((button) => {
    button.addEventListener("click", () => queueMicrotask(syncSelectedVariantPrice));
  });
  document.getElementById("shop-product-submit").addEventListener("click", () => {
    queueMicrotask(syncSelectedVariantPrice);
  });

  document.getElementById("shop-payment-form").addEventListener("submit", async (event) => {
    if (!event.currentTarget.reportValidity()) return;
    const button = document.getElementById("shop-payment-submit");
    if (!currentUser) {
      button.disabled = false;
      button.classList.remove("is-complete");
      button.textContent = "Сначала войдите в аккаунт";
      openModal("login");
      return;
    }
    const selected = document.querySelector('[data-shop-multiplier][aria-pressed="true"]');
    if (!selected?.dataset.apiVariantId) {
      button.textContent = "Товар временно недоступен";
      return;
    }
    button.textContent = "Создаём заказ…";
    try {
      const idempotencyKey = crypto.randomUUID();
      const order = await apiRequest("/api/v1/shop/orders", {
        method: "POST",
        body: JSON.stringify({
          idempotency_key: idempotencyKey,
          items: [{ variant_id: selected.dataset.apiVariantId, quantity: 1 }]
        })
      });
      button.classList.add("is-complete");
      button.textContent = `Заказ ${order.id.slice(0, 8)} создан`;
    } catch (error) {
      button.disabled = false;
      button.classList.remove("is-complete");
      button.textContent = error.message;
    }
  });

  updateAccountButtons();
  restoreAccount();
  loadPosts();
  loadCatalog();
});
