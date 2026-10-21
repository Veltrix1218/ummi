/* ==========================================================================
   Ummi Qur'an Shoes & Bags Store
   Runs on index.html and policies.html. Every feature checks that its
   elements exist first, so one file serves both pages.
   ========================================================================== */
(function () {
  "use strict";

  var WHATSAPP_NUMBER = "2347030082498";
  var CART_KEY = "ummi-cart-v1";
  var HERO_INTERVAL = 5500;

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function formatNaira(amount) {
    return "\u20A6" + Number(amount).toLocaleString("en-NG");
  }

  function clampQty(value) {
    var n = parseInt(value, 10);
    if (isNaN(n) || n < 1) return 1;
    return n > 99 ? 99 : n;
  }

  function whatsappUrl(message) {
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
  }

  // Accepts 0703 008 2498, +234 703 008 2498, 2347030082498 ...
  function isValidPhone(value) {
    var digits = String(value).replace(/[\s\-().]/g, "");
    return /^\+?\d{10,15}$/.test(digits);
  }

  var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==========================================================================
     Modal manager: open/close, focus trap, ESC, scroll lock
     ========================================================================== */
  var openModals = [];
  var lastTrigger = null;

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function getModal(id) { return document.getElementById(id); }

  function openModal(id, trigger) {
    var modal = getModal(id);
    if (!modal) return;
    // Only one modal at a time; the success popup replaces the form.
    openModals.slice().forEach(function (m) { if (m !== modal) closeModal(m.id, true); });
    lastTrigger = trigger || document.activeElement;
    hideToast();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    if (openModals.indexOf(modal) === -1) openModals.push(modal);
    var dialog = $(".modal-dialog", modal);
    window.setTimeout(function () {
      var first = $("form input:not([type=hidden]), form select, form textarea", dialog);
      (first || dialog).focus({ preventScroll: true });
      dialog.scrollTop = 0;
    }, 60);
  }

  function closeModal(id, silent) {
    var modal = getModal(id);
    if (!modal || !modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    openModals = openModals.filter(function (m) { return m !== modal; });
    if (!openModals.length) document.body.classList.remove("is-locked");
    if (!silent && lastTrigger && typeof lastTrigger.focus === "function" && document.contains(lastTrigger)) {
      lastTrigger.focus({ preventScroll: true });
    }
    // Remove "#quote" from the URL so refresh does not reopen the popup.
    if (window.location.hash === "#" + id && window.history && history.replaceState) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  function initModals() {
    // Open: any link/button with data-modal="quote" or href="#quote"
    document.addEventListener("click", function (e) {
      var trigger = e.target.closest('[data-modal], a[href="#quote"]');
      if (trigger) {
        var id = trigger.getAttribute("data-modal") || "quote";
        if (getModal(id)) {
          e.preventDefault();
          closeMobileNav();
          openModal(id, trigger);
        }
        return;
      }
      // Close: elements marked data-close inside a modal
      var closer = e.target.closest("[data-close]");
      if (closer) {
        var modal = closer.closest(".modal");
        if (modal) {
          // a "Browse products" link should still scroll after closing
          closeModal(modal.id);
        }
      }
    });

    document.addEventListener("keydown", function (e) {
      if (!openModals.length) return;
      var modal = openModals[openModals.length - 1];
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal(modal.id);
        return;
      }
      if (e.key === "Tab") {
        var items = $$(FOCUSABLE, modal).filter(function (el) { return el.offsetParent !== null; });
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === $(".modal-dialog", modal))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Deep link: index.html#quote (used by the policies page)
    if (window.location.hash === "#quote" && getModal("quote")) {
      window.setTimeout(function () { openModal("quote"); }, 150);
    }
    window.addEventListener("hashchange", function () {
      if (window.location.hash === "#quote" && getModal("quote")) openModal("quote");
    });
  }

  /* ==========================================================================
     Header, mobile nav, dropdowns
     ========================================================================== */
  var navToggle, mobileNav, navBackdrop;

  function openMobileNav() {
    if (!mobileNav) return;
    mobileNav.classList.add("is-open");
    navBackdrop.hidden = false;
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close menu");
    document.body.classList.add("is-locked");
    var closeBtn = $("#mobile-nav-close");
    if (closeBtn) window.setTimeout(function () { closeBtn.focus({ preventScroll: true }); }, 60);
  }

  function closeMobileNav(returnFocus) {
    if (!mobileNav || !mobileNav.classList.contains("is-open")) return;
    mobileNav.classList.remove("is-open");
    navBackdrop.hidden = true;
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
    if (!openModals.length) document.body.classList.remove("is-locked");
    if (returnFocus) navToggle.focus({ preventScroll: true });
  }

  function initHeader() {
    var header = $("#header");
    navToggle = $("#energy-menu");
    mobileNav = $("#mobile-nav");
    navBackdrop = $("#nav-backdrop");

    if (header) {
      var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    if (navToggle && mobileNav) {
      navToggle.addEventListener("click", function () {
        mobileNav.classList.contains("is-open") ? closeMobileNav(true) : openMobileNav();
      });
      $("#mobile-nav-close").addEventListener("click", function () { closeMobileNav(true); });
      navBackdrop.addEventListener("click", function () { closeMobileNav(true); });

      // Close the panel when a link inside it is chosen
      mobileNav.addEventListener("click", function (e) {
        if (e.target.closest("a")) closeMobileNav();
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && mobileNav.classList.contains("is-open") && !openModals.length) closeMobileNav(true);
      });

      // Reset if the window grows past the mobile breakpoint
      window.matchMedia("(min-width: 992px)").addEventListener("change", function (e) {
        if (e.matches) closeMobileNav();
      });
    }

    // Category dropdowns (desktop hover is CSS; click/keyboard handled here)
    $$(".dropdown").forEach(function (dd) {
      var btn = $(".dropdown-toggle", dd);
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = dd.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
    document.addEventListener("click", function (e) {
      $$(".dropdown.is-open").forEach(function (dd) {
        if (!dd.contains(e.target)) {
          dd.classList.remove("is-open");
          $(".dropdown-toggle", dd).setAttribute("aria-expanded", "false");
        }
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      $$(".dropdown.is-open").forEach(function (dd) {
        dd.classList.remove("is-open");
        var b = $(".dropdown-toggle", dd);
        b.setAttribute("aria-expanded", "false");
        b.focus();
      });
    });
  }

  /* ==========================================================================
     Announcement marquee: duplicate the group so the loop is seamless
     ========================================================================== */
  function initAnnouncement() {
    var track = $(".announcement-track");
    var group = $(".announcement-group");
    if (!track || !group || prefersReducedMotion) return;
    // Repeat until the track is at least twice the viewport, then double once more
    // so translateX(-50%) always lands on an identical copy.
    var copies = Math.max(1, Math.ceil(window.innerWidth / Math.max(group.offsetWidth, 1)));
    var total = copies * 2;
    for (var i = 0; i < total - 1; i++) {
      var clone = group.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      $$("a", clone).forEach(function (a) { a.setAttribute("tabindex", "-1"); });
      track.appendChild(clone);
    }
    // keep scroll speed constant regardless of copy count
    track.style.animationDuration = Math.max(30, group.offsetWidth * copies / 60) + "s";
  }

  /* ==========================================================================
     Hero: auto-advancing cross-fade slider
     ========================================================================== */
  function initHero() {
    var hero = $("#hero");
    if (!hero) return;
    var slides = $$(".hero-slide", hero);
    var dots = $$(".hero-dot", hero);
    if (slides.length < 2) return;

    var index = 0;
    var timer = null;
    var paused = false;

    function show(next) {
      next = (next + slides.length) % slides.length;
      if (next === index) return;
      slides[index].classList.remove("is-active");
      dots[index].classList.remove("is-active");
      dots[index].removeAttribute("aria-current");
      index = next;
      slides[index].classList.add("is-active");
      dots[index].classList.add("is-active");
      dots[index].setAttribute("aria-current", "true");
    }

    function start() {
      stop();
      if (prefersReducedMotion || paused) return;
      timer = window.setInterval(function () { show(index + 1); }, HERO_INTERVAL);
    }
    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }

    $("#hero-next").addEventListener("click", function () { show(index + 1); start(); });
    $("#hero-prev").addEventListener("click", function () { show(index - 1); start(); });
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () { show(parseInt(dot.getAttribute("data-index"), 10)); start(); });
    });

    // Pause on hover/focus, and when the tab is hidden or hero scrolled away
    hero.addEventListener("mouseenter", function () { paused = true; stop(); });
    hero.addEventListener("mouseleave", function () { paused = false; start(); });
    hero.addEventListener("focusin", function () { paused = true; stop(); });
    hero.addEventListener("focusout", function () { paused = false; start(); });
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0.2 }).observe(hero);
    }

    // Swipe on touch screens
    var startX = null;
    hero.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) { show(index + (dx < 0 ? 1 : -1)); start(); }
      startX = null;
    }, { passive: true });

    // Preload upcoming slides after first paint
    slides.forEach(function (img) { img.loading = "eager"; });
    start();
  }

  /* ==========================================================================
     Product filter (All / Shoes / Bags)
     ========================================================================== */
  function applyFilter(filter) {
    var cards = $$(".product-card");
    if (!cards.length) return;
    cards.forEach(function (card) {
      card.hidden = !(filter === "all" || card.getAttribute("data-category") === filter);
    });
    $$(".filter-chip").forEach(function (chip) {
      var active = chip.getAttribute("data-filter") === filter;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function initFilters() {
    if (!$("#products-grid")) return;
    document.addEventListener("click", function (e) {
      var el = e.target.closest("[data-filter]");
      if (!el) return;
      applyFilter(el.getAttribute("data-filter"));
      // Category links jump to the grid (chips stay where they are)
      if (!el.classList.contains("filter-chip")) {
        var target = $("#products");
        if (target) {
          e.preventDefault();
          closeMobileNav();
          target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
        }
      }
    });
  }

  /* ==========================================================================
     Cart
     State stores only {id, qty}. Name, price and image are always read from
     the product card, so edited localStorage can never change a price.
     ========================================================================== */
  var cart = [];
  var catalog = {};
  var toastTimer = null;

  function buildCatalog() {
    $$(".product-card[data-id]").forEach(function (card) {
      var img = $("img", card);
      catalog[card.getAttribute("data-id")] = {
        id: card.getAttribute("data-id"),
        name: card.getAttribute("data-name"),
        price: Number(card.getAttribute("data-price")),
        image: img ? img.getAttribute("src") : "",
        imageAlt: img ? img.getAttribute("alt") : ""
      };
    });
  }

  function loadCart() {
    try {
      var raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      cart = (Array.isArray(raw) ? raw : []).filter(function (item) {
        return item && catalog[item.id];
      }).map(function (item) {
        return { id: item.id, qty: clampQty(item.qty) };
      });
    } catch (err) {
      cart = [];
    }
  }

  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (err) { /* private mode */ }
  }

  function cartCount() {
    return cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  function cartTotal() {
    return cart.reduce(function (sum, item) { return sum + catalog[item.id].price * item.qty; }, 0);
  }

  function findItem(id) {
    for (var i = 0; i < cart.length; i++) if (cart[i].id === id) return cart[i];
    return null;
  }

  function addToCart(id, qty) {
    var item = findItem(id);
    if (item) { item.qty = clampQty(item.qty + qty); }
    else { cart.push({ id: id, qty: clampQty(qty) }); }
    saveCart();
    renderCart();
  }

  function setQty(id, qty) {
    var item = findItem(id);
    if (!item) return;
    if (qty < 1) { removeFromCart(id); return; }
    item.qty = clampQty(qty);
    saveCart();
    renderCart();
  }

  function removeFromCart(id) {
    cart = cart.filter(function (item) { return item.id !== id; });
    saveCart();
    renderCart();
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderCart() {
    var list = $("#cart-items");
    if (!list) return;

    var count = cartCount();
    var badge = $("#cart-count");
    badge.textContent = count > 99 ? "99+" : String(count);
    badge.classList.toggle("is-empty", count === 0);
    $("#cart-toggle").setAttribute("aria-label", count ? "Open shopping bag, " + count + (count === 1 ? " item" : " items") : "Open shopping bag");

    list.textContent = "";
    cart.forEach(function (item) {
      var p = catalog[item.id];
      var li = el("li", "cart-item");

      var img = el("img");
      img.src = p.image;
      img.alt = p.imageAlt;
      img.width = 72;
      img.height = 72;
      img.loading = "lazy";

      var info = el("div", "cart-item-info");
      var top = el("div", "cart-item-top");
      top.appendChild(el("p", "cart-item-name", p.name));
      var rm = el("button", "cart-remove");
      rm.type = "button";
      rm.setAttribute("data-cart-remove", p.id);
      rm.setAttribute("aria-label", "Remove " + p.name + " from bag");
      rm.innerHTML = '<i class="fa-regular fa-trash-can" aria-hidden="true"></i>';
      top.appendChild(rm);

      var unit = el("span", "cart-item-unit", formatNaira(p.price) + " each");

      var bottom = el("div", "cart-item-bottom");
      var qb = el("div", "quantity-box");
      qb.setAttribute("role", "group");
      qb.setAttribute("aria-label", "Quantity for " + p.name);
      var minus = el("button", "qty-btn");
      minus.type = "button";
      minus.setAttribute("data-cart-step", "-1");
      minus.setAttribute("data-id", p.id);
      minus.setAttribute("aria-label", "Decrease quantity of " + p.name);
      minus.innerHTML = '<i class="fa-solid fa-minus" aria-hidden="true"></i>';
      var input = el("input", "qty-input");
      input.type = "number";
      input.min = "1";
      input.max = "99";
      input.value = String(item.qty);
      input.setAttribute("inputmode", "numeric");
      input.setAttribute("data-cart-input", p.id);
      input.setAttribute("aria-label", "Quantity of " + p.name);
      var plus = el("button", "qty-btn");
      plus.type = "button";
      plus.setAttribute("data-cart-step", "1");
      plus.setAttribute("data-id", p.id);
      plus.setAttribute("aria-label", "Increase quantity of " + p.name);
      plus.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i>';
      qb.appendChild(minus);
      qb.appendChild(input);
      qb.appendChild(plus);
      bottom.appendChild(qb);
      bottom.appendChild(el("strong", "cart-line-total", formatNaira(p.price * item.qty)));

      info.appendChild(top);
      info.appendChild(unit);
      info.appendChild(bottom);
      li.appendChild(img);
      li.appendChild(info);
      list.appendChild(li);
    });

    $("#cart-empty").hidden = count > 0;
    $("#cart-footer").hidden = count === 0;
    $("#cart-subtotal").textContent = formatNaira(cartTotal());
    $("#cart-sub").textContent = count
      ? count + (count === 1 ? " item" : " items") + " in your bag. Review before ordering."
      : "Review your selected items before ordering.";

    // "In bag" chip on each product card
    $$(".product-card[data-id]").forEach(function (card) {
      var chip = $(".in-bag-chip", card);
      var item = findItem(card.getAttribute("data-id"));
      if (item) { chip.textContent = item.qty + " in bag"; chip.hidden = false; }
      else { chip.hidden = true; }
    });
  }

  function showToast(message, withAction) {
    var toast = $("#toast");
    if (!toast) return;
    toast.textContent = "";
    var icon = el("i", "fa-solid fa-circle-check");
    icon.setAttribute("aria-hidden", "true");
    toast.appendChild(icon);
    toast.appendChild(el("span", "toast-text", message));
    if (withAction) {
      var btn = el("button", "", "View bag");
      btn.type = "button";
      btn.addEventListener("click", function () {
        hideToast();
        openModal("cart-popup", $("#cart-toggle"));
      });
      toast.appendChild(btn);
    }
    toast.hidden = false;
    window.requestAnimationFrame(function () { toast.classList.add("is-visible"); });
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(hideToast, 3800);
  }

  function hideToast() {
    var toast = $("#toast");
    if (!toast) return;
    toast.classList.remove("is-visible");
    window.setTimeout(function () { if (!toast.classList.contains("is-visible")) toast.hidden = true; }, 260);
  }

  function checkout() {
    if (!cart.length) return;
    var lines = cart.map(function (item, i) {
      var p = catalog[item.id];
      return (i + 1) + ". " + p.name + " x" + item.qty + " (" + formatNaira(p.price * item.qty) + ")";
    });
    var message = "Hello Ummi Qur'an, I'd like to order:\n\n" +
      lines.join("\n") +
      "\n\nSubtotal: " + formatNaira(cartTotal()) +
      "\n\nPlease confirm availability, delivery fee and payment details. My location is: ";
    window.open(whatsappUrl(message), "_blank", "noopener");
  }

  function initCart() {
    if (!$("#cart-items")) return;
    buildCatalog();
    loadCart();
    renderCart();

    // Quantity steppers + add buttons on product cards
    var grid = $("#products-grid");
    grid.addEventListener("click", function (e) {
      var card = e.target.closest(".product-card");
      if (!card) return;
      var input = $(".qty-input", card);

      var step = e.target.closest("[data-qty-step]");
      if (step) {
        input.value = clampQty(clampQty(input.value) + parseInt(step.getAttribute("data-qty-step"), 10));
        return;
      }

      if (e.target.closest(".cart-btn")) {
        var btn = e.target.closest(".cart-btn");
        var qty = clampQty(input.value);
        var id = card.getAttribute("data-id");
        addToCart(id, qty);
        input.value = 1;
        showToast(qty + " \u00D7 " + catalog[id].name + " added to your bag", true);

        var toggle = $("#cart-toggle");
        toggle.classList.remove("is-bump");
        void toggle.offsetWidth; // restart animation
        toggle.classList.add("is-bump");

        if (!btn.getAttribute("data-label")) btn.setAttribute("data-label", btn.innerHTML);
        btn.classList.add("is-added");
        btn.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Added';
        window.clearTimeout(btn._resetTimer);
        btn._resetTimer = window.setTimeout(function () {
          btn.classList.remove("is-added");
          btn.innerHTML = btn.getAttribute("data-label");
        }, 1400);
      }
    });

    grid.addEventListener("change", function (e) {
      if (e.target.classList.contains("qty-input")) e.target.value = clampQty(e.target.value);
    });

    // Controls inside the cart popup
    var cartList = $("#cart-items");
    cartList.addEventListener("click", function (e) {
      var rm = e.target.closest("[data-cart-remove]");
      if (rm) {
        var removedName = catalog[rm.getAttribute("data-cart-remove")].name;
        removeFromCart(rm.getAttribute("data-cart-remove"));
        showToast(removedName + " removed", false);
        return;
      }
      var stepBtn = e.target.closest("[data-cart-step]");
      if (stepBtn) {
        var id = stepBtn.getAttribute("data-id");
        var item = findItem(id);
        if (item) setQty(id, item.qty + parseInt(stepBtn.getAttribute("data-cart-step"), 10));
      }
    });
    cartList.addEventListener("change", function (e) {
      var id = e.target.getAttribute("data-cart-input");
      if (id) setQty(id, clampQty(e.target.value));
    });

    $("#cart-toggle").addEventListener("click", function () { openModal("cart-popup", this); });
    $("#checkout-button").addEventListener("click", checkout);
    $("#clear-cart").addEventListener("click", function () {
      cart = [];
      saveCart();
      renderCart();
    });

    // Keep tabs in sync
    window.addEventListener("storage", function (e) {
      if (e.key === CART_KEY) { loadCart(); renderCart(); }
    });
  }

  /* ==========================================================================
     Quote form
     ========================================================================== */
  function setError(field, message) {
    var group = field.closest(".form-group");
    var err = group.querySelector(".field-error");
    if (message) {
      if (!err) {
        err = el("p", "field-error");
        err.id = field.id + "-error";
        group.appendChild(err);
      }
      err.textContent = message;
      group.classList.add("has-error");
      field.setAttribute("aria-invalid", "true");
      field.setAttribute("aria-describedby", err.id);
    } else {
      if (err) err.remove();
      group.classList.remove("has-error");
      field.removeAttribute("aria-invalid");
      field.removeAttribute("aria-describedby");
    }
  }

  function initQuoteForm() {
    var form = $("#quote-form");
    if (!form) return;

    var delivery = $("#quote-delivery");
    var addressGroup = $("#address-group");
    var address = $("#quote-address");

    // The address is only needed when we are delivering
    function syncAddress() {
      var needs = delivery.value === "Delivery within Osogbo" || delivery.value === "Nationwide delivery";
      addressGroup.hidden = !needs;
      address.required = needs;
      if (!needs) setError(address, "");
    }
    delivery.addEventListener("change", syncAddress);

    $("#quote-location").addEventListener("change", function () {
      // Nudge the delivery choice when the location makes it obvious
      if (this.value === "Another location in Nigeria" && !delivery.value) {
        delivery.value = "Nationwide delivery";
        syncAddress();
      }
    });

    // Clear an error as soon as the person fixes the field
    form.addEventListener("input", function (e) { if (e.target.closest(".has-error")) setError(e.target, ""); });
    form.addEventListener("change", function (e) { if (e.target.closest(".has-error")) setError(e.target, ""); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstInvalid = null;

      function fail(field, msg) {
        setError(field, msg);
        if (!firstInvalid) firstInvalid = field;
      }

      var name = $("#quote-name");
      var phone = $("#quote-phone");
      var location = $("#quote-location");
      var category = $("#quote-category");
      var product = $("#quote-product");
      var quantity = $("#quote-quantity");

      if (!name.value.trim()) fail(name, "Enter your full name."); else setError(name, "");
      if (!phone.value.trim()) fail(phone, "Enter your phone or WhatsApp number.");
      else if (!isValidPhone(phone.value)) fail(phone, "Enter a valid number, for example 0703 008 2498.");
      else setError(phone, "");
      if (!location.value) fail(location, "Select your location."); else setError(location, "");
      if (!delivery.value) fail(delivery, "Choose a delivery method."); else setError(delivery, "");
      if (!addressGroup.hidden && !address.value.trim()) fail(address, "Enter the address we should deliver to."); else setError(address, "");
      if (!category.value) fail(category, "Select a category."); else setError(category, "");
      if (!product.value.trim()) fail(product, "Tell us which product or style you want."); else setError(product, "");
      var qty = parseInt(quantity.value, 10);
      if (isNaN(qty) || qty < 1) fail(quantity, "Quantity must be at least 1."); else setError(quantity, "");

      if (firstInvalid) { firstInvalid.focus(); return; }

      var budgetRaw = $("#quote-budget").value.replace(/[^\d]/g, "");
      var budget = budgetRaw ? formatNaira(budgetRaw) : "Not specified";
      var data = {
        name: name.value.trim(),
        phone: phone.value.trim(),
        location: location.value,
        delivery: delivery.value,
        address: address.value.trim(),
        category: category.value,
        product: product.value.trim(),
        quantity: String(qty),
        budget: budget,
        requirements: $("#quote-requirements").value.trim()
      };

      $("#success-name").textContent = data.name;
      $("#success-phone").textContent = data.phone;
      $("#success-location").textContent = data.location;
      $("#success-delivery").textContent = data.delivery;
      $("#success-category").textContent = data.category;
      $("#success-product").textContent = data.product;
      $("#success-quantity").textContent = data.quantity;
      $("#success-budget").textContent = data.budget;

      var lines = [
        "Hello Ummi Qur'an, I'd like a quote.",
        "",
        "Name: " + data.name,
        "Phone: " + data.phone,
        "Location: " + data.location,
        "Delivery: " + data.delivery
      ];
      if (data.address) lines.push("Address: " + data.address);
      lines.push("Category: " + data.category, "Product/style: " + data.product, "Quantity: " + data.quantity, "Budget: " + data.budget);
      if (data.requirements) lines.push("Notes: " + data.requirements);
      $("#send-quote-whatsapp").href = whatsappUrl(lines.join("\n"));

      openModal("quote-success-popup", lastTrigger);
      form.reset();
      syncAddress();
    });
  }

  /* ==========================================================================
     Newsletter -> WhatsApp (no backend, so we hand off to the store's chat)
     ========================================================================== */
  function initNewsletter() {
    var form = $("#newsletter-form");
    if (!form) return;
    var input = $("#newsletter-phone");
    var error = $("#newsletter-error");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!isValidPhone(input.value)) {
        error.textContent = "Enter a valid WhatsApp number, for example 0703 008 2498.";
        error.hidden = false;
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }
      error.hidden = true;
      input.removeAttribute("aria-invalid");
      var msg = "Hello Ummi Qur'an, please add me to your new collection updates. My WhatsApp number is " + input.value.trim() + ".";
      window.open(whatsappUrl(msg), "_blank", "noopener");
      form.reset();
    });
    input.addEventListener("input", function () { error.hidden = true; });
  }

  /* ==========================================================================
     Small extras: year, Marvo badge, policy table-of-contents highlight
     ========================================================================== */
  function initExtras() {
    var year = $("#current-year");
    if (year) year.textContent = new Date().getFullYear();

    var badge = $("#marvoBadge");
    var close = $("#marvoBadgeClose");
    if (badge && close) {
      var collapse = function (state) {
        badge.classList.toggle("is-collapsed", state);
        close.setAttribute("aria-expanded", state ? "false" : "true");
      };
      var saved = null;
      try { saved = sessionStorage.getItem("ummi-badge"); } catch (err) { /* ignore */ }
      collapse(saved ? saved === "collapsed" : window.innerWidth < 600);
      close.addEventListener("click", function () {
        collapse(true);
        try { sessionStorage.setItem("ummi-badge", "collapsed"); } catch (err) { /* ignore */ }
      });
      badge.addEventListener("click", function (e) {
        if (badge.classList.contains("is-collapsed") && e.target.closest("a")) {
          e.preventDefault();
          collapse(false);
          try { sessionStorage.setItem("ummi-badge", "expanded"); } catch (err) { /* ignore */ }
        }
      });
    }

    if (badge && "IntersectionObserver" in window) {
      var footer = $("#footer");
      if (footer) {
        new IntersectionObserver(function (entries) {
          badge.classList.toggle("in-view", entries[0].isIntersecting);
        }, { threshold: 0.15 }).observe(footer);
      }
    }

    // Highlight the policy section being read
    var tocLinks = $$(".policy-toc a");
    if (tocLinks.length && "IntersectionObserver" in window) {
      var map = {};
      tocLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            tocLinks.forEach(function (a) { a.classList.remove("is-active"); });
            var link = map[entry.target.id];
            if (link) {
              link.classList.add("is-active");
              // keep the active chip visible in the horizontal mobile list
              var list = link.closest("ul");
              if (list && list.scrollWidth > list.clientWidth) {
                list.scrollTo({ left: link.offsetLeft - 16, behavior: prefersReducedMotion ? "auto" : "smooth" });
              }
            }
          }
        });
      }, { rootMargin: "-20% 0px -70% 0px" });
      $$(".policy-card").forEach(function (card) { observer.observe(card); });
    }
  }

  /* ---------- boot ---------- */
  function init() {
    // Each feature runs on its own, so one failure can never disable the rest.
    [initHeader, initAnnouncement, initModals, initHero, initFilters,
     initCart, initQuoteForm, initNewsletter, initExtras].forEach(function (fn) {
      try { fn(); } catch (err) { if (window.console) console.error("[ummi] " + fn.name + " failed:", err); }
    });
    document.documentElement.setAttribute("data-js", "ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
