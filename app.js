(function () {
  "use strict";

  /* ========================================
     Utilities
     ======================================== */

  async function fetchGigs() {
    const res = await fetch("data/gigs.json");
    if (!res.ok) throw new Error("Failed to load gig data");
    const data = await res.json();
    return data.gigs;
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function extractYouTubeId(url) {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function getCoverUrl(gig) {
    if (gig.coverPhoto) {
      return `assets/gigs/${gig.id}/thumbs/${gig.coverPhoto}.webp`;
    }
    // Fallback: use YouTube thumbnail if available
    if (gig.youtubeUrls && gig.youtubeUrls.length > 0) {
      const id = extractYouTubeId(gig.youtubeUrls[0]);
      if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }
    return "";
  }

  /* ========================================
     Index Page — Concert Grid
     ======================================== */

  function renderGrid(gigs, container) {
    if (gigs.length === 0) {
      container.innerHTML =
        '<p class="gig-grid__empty">No gigs found matching your search.</p>';
      return;
    }

    container.innerHTML = gigs
      .map(
        (gig) => `
      <article class="gig-card${gig.upcoming ? ' gig-card--upcoming' : ''}">
        <a href="gig.html?id=${encodeURIComponent(gig.id)}" class="gig-card__link">
          ${getCoverUrl(gig) ? `<img
            class="gig-card__image"
            src="${getCoverUrl(gig)}"
            alt="${escapeHtml(gig.title || gig.venue)}"
            loading="lazy"
            width="400"
            height="300"
          />` : '<div class="gig-card__image gig-card__image--placeholder"></div>'}
          <div class="gig-card__body">
            ${gig.upcoming ? '<span class="gig-card__badge">Upcoming</span>' : ''}
            <h2 class="gig-card__title">${escapeHtml(gig.title || gig.venue)}</h2>
            <p class="gig-card__venue">${escapeHtml(gig.venue)}, ${escapeHtml(gig.city)}</p>
            <time class="gig-card__date" datetime="${gig.date}">${formatDate(gig.date)}</time>
          </div>
        </a>
      </article>
    `
      )
      .join("");
  }

  function filterGigs(gigs, query, year) {
    return gigs.filter((gig) => {
      const matchesYear = !year || gig.date.startsWith(year);
      if (!matchesYear) return false;

      if (!query) return true;
      const q = query.toLowerCase();
      return (
        (gig.title || "").toLowerCase().includes(q) ||
        gig.venue.toLowerCase().includes(q) ||
        gig.city.toLowerCase().includes(q) ||
        gig.country.toLowerCase().includes(q)
      );
    });
  }

  function populateYearDropdown(gigs, select) {
    const years = [...new Set(gigs.map((g) => g.date.slice(0, 4)))].sort(
      (a, b) => b - a
    );
    years.forEach((year) => {
      const opt = document.createElement("option");
      opt.value = year;
      opt.textContent = year;
      select.appendChild(opt);
    });
  }

  async function initIndex() {
    const gridContainer = document.getElementById("gig-grid");
    const searchInput = document.getElementById("filter-search");
    const yearSelect = document.getElementById("filter-year");

    if (!gridContainer) return;

    gridContainer.innerHTML = '<p class="loading">Loading gigs...</p>';

    let gigs;
    try {
      gigs = await fetchGigs();
    } catch (err) {
      gridContainer.innerHTML =
        '<p class="gig-grid__empty">Could not load gig data. Make sure you\'re running a local server.</p>';
      return;
    }

    // Sort by date descending
    gigs.sort((a, b) => b.date.localeCompare(a.date));

    populateYearDropdown(gigs, yearSelect);

    function applyFilters() {
      const query = searchInput.value.trim();
      const year = yearSelect.value;
      const filtered = filterGigs(gigs, query, year);
      renderGrid(filtered, gridContainer);
    }

    searchInput.addEventListener("input", applyFilters);
    yearSelect.addEventListener("change", applyFilters);

    applyFilters();
  }

  /* ========================================
     Gig Detail Page
     ======================================== */

  function renderGigDetail(gig, container) {
    let html = "";

    // Header
    html += `
      <header class="gig-detail__header">
        ${gig.upcoming ? '<span class="gig-detail__badge">Upcoming</span>' : ''}
        <h1 class="gig-detail__title">${escapeHtml(gig.title || gig.venue)}</h1>
        <div class="gig-detail__meta">
          <span><time datetime="${gig.date}">${formatDate(gig.date)}</time></span>
          <span>${gig.venueUrl ? `<a href="${escapeHtml(gig.venueUrl)}" target="_blank" rel="noopener">${escapeHtml(gig.venue)}</a>` : escapeHtml(gig.venue)}, ${escapeHtml(gig.city)}, ${escapeHtml(gig.country)}</span>
          ${gig.supportFor ? `<span>Support for <a href="${escapeHtml(gig.supportFor.url)}" target="_blank" rel="noopener">${escapeHtml(gig.supportFor.name)}</a></span>` : ""}
        </div>
      </header>
    `;

    // Description
    if (gig.description) {
      html += `<p class="gig-detail__description">${escapeHtml(gig.description)}</p>`;
    }

    // Credits
    if (gig.credits && Object.keys(gig.credits).length > 0) {
      html += `
        <section class="gig-detail__credits">
          <h2>Credits</h2>
          <ul class="credits-list">
            ${Object.entries(gig.credits)
              .map(
                ([role, name]) =>
                  `<li><span class="credits-list__role">${escapeHtml(role)}:</span> ${escapeHtml(name)}</li>`
              )
              .join("")}
          </ul>
        </section>
      `;
    }

    // YouTube Videos
    if (gig.youtubeUrls && gig.youtubeUrls.length > 0) {
      const embeds = gig.youtubeUrls
        .map((url) => {
          const id = extractYouTubeId(url);
          if (!id) return "";
          return `
            <div class="video-wrapper">
              <iframe
                src="https://www.youtube-nocookie.com/embed/${id}"
                title="YouTube video"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                loading="lazy"
              ></iframe>
            </div>
          `;
        })
        .join("");

      if (embeds) {
        html += `
          <section class="gig-detail__videos">
            <h2>Videos</h2>
            <div class="video-grid">${embeds}</div>
          </section>
        `;
      }
    }

    // Photo Gallery
    if (gig.photos && gig.photos.length > 0) {
      html += `
        <section class="gig-detail__gallery">
          <h2>Photos</h2>
          <div class="gallery-grid">
            ${gig.photos
              .map(
                (photo, i) => `
              <button
                class="gallery-grid__item"
                data-index="${i}"
                type="button"
                aria-label="View photo ${i + 1}"
              >
                <img
                  src="assets/gigs/${gig.id}/thumbs/${photo}.webp"
                  alt="Concert photo ${i + 1}"
                  loading="lazy"
                  width="400"
                  height="300"
                />
              </button>
            `
              )
              .join("")}
          </div>
        </section>
      `;
    }

    container.innerHTML = html;

    // Attach gallery click handlers
    if (gig.photos && gig.photos.length > 0) {
      const photoData = gig.photos.map((photo) => ({
        thumb: `assets/gigs/${gig.id}/thumbs/${photo}.webp`,
        medium: `assets/gigs/${gig.id}/1200/${photo}.webp`,
        large: `assets/gigs/${gig.id}/2000/${photo}.webp`,
      }));

      container.querySelectorAll(".gallery-grid__item").forEach((btn) => {
        btn.addEventListener("click", () => {
          const index = parseInt(btn.dataset.index, 10);
          openLightbox(photoData, index, btn);
        });
      });
    }
  }

  async function initGigPage() {
    const detailContainer = document.getElementById("gig-detail");
    const errorContainer = document.getElementById("gig-error");

    if (!detailContainer) return;

    const gigId = getQueryParam("id");
    if (!gigId) {
      showGigError(detailContainer, errorContainer);
      return;
    }

    detailContainer.innerHTML = '<p class="loading">Loading...</p>';

    let gigs;
    try {
      gigs = await fetchGigs();
    } catch (err) {
      detailContainer.innerHTML =
        '<p class="loading">Could not load gig data.</p>';
      return;
    }

    const gig = gigs.find((g) => g.id === gigId);
    if (!gig) {
      showGigError(detailContainer, errorContainer);
      return;
    }

    document.title = `${gig.title || gig.venue} — Drying Cactus`;
    renderGigDetail(gig, detailContainer);
  }

  function showGigError(detailContainer, errorContainer) {
    detailContainer.style.display = "none";
    if (errorContainer) {
      errorContainer.style.display = "block";
    }
  }

  /* ========================================
     Lightbox
     ======================================== */

  let lightboxState = {
    photos: [],
    index: 0,
    triggerElement: null,
    overlay: null,
  };

  function createLightboxDOM() {
    const overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "Photo lightbox");
    overlay.innerHTML = `
      <button class="lightbox__close" aria-label="Close lightbox" type="button">&times;</button>
      <button class="lightbox__nav lightbox__nav--prev" aria-label="Previous photo" type="button">&#8249;</button>
      <div class="lightbox__content">
        <img class="lightbox__img" src="" alt="Concert photo" />
      </div>
      <button class="lightbox__nav lightbox__nav--next" aria-label="Next photo" type="button">&#8250;</button>
      <div class="lightbox__counter"></div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector(".lightbox__close").addEventListener("click", closeLightbox);
    overlay.querySelector(".lightbox__nav--prev").addEventListener("click", () => navigateLightbox(-1));
    overlay.querySelector(".lightbox__nav--next").addEventListener("click", () => navigateLightbox(1));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeLightbox();
    });

    return overlay;
  }

  function openLightbox(photos, index, triggerElement) {
    lightboxState.photos = photos;
    lightboxState.index = index;
    lightboxState.triggerElement = triggerElement;

    if (!lightboxState.overlay) {
      lightboxState.overlay = createLightboxDOM();
    }

    updateLightboxImage();
    lightboxState.overlay.classList.add("lightbox--open");
    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", handleLightboxKeydown);

    // Focus close button
    lightboxState.overlay.querySelector(".lightbox__close").focus();
  }

  function closeLightbox() {
    if (!lightboxState.overlay) return;

    lightboxState.overlay.classList.remove("lightbox--open");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", handleLightboxKeydown);

    // Restore focus to trigger
    if (lightboxState.triggerElement) {
      lightboxState.triggerElement.focus();
    }
  }

  function navigateLightbox(direction) {
    const len = lightboxState.photos.length;
    lightboxState.index = (lightboxState.index + direction + len) % len;
    updateLightboxImage();
  }

  function updateLightboxImage() {
    const overlay = lightboxState.overlay;
    const photo = lightboxState.photos[lightboxState.index];
    const img = overlay.querySelector(".lightbox__img");
    const counter = overlay.querySelector(".lightbox__counter");

    img.src = photo.large;
    img.alt = `Concert photo ${lightboxState.index + 1}`;
    counter.textContent = `${lightboxState.index + 1} / ${lightboxState.photos.length}`;

    // Update nav visibility
    const prevBtn = overlay.querySelector(".lightbox__nav--prev");
    const nextBtn = overlay.querySelector(".lightbox__nav--next");
    prevBtn.style.display = lightboxState.photos.length > 1 ? "" : "none";
    nextBtn.style.display = lightboxState.photos.length > 1 ? "" : "none";

    // Preload adjacent images
    preloadAdjacentImages();
  }

  function preloadAdjacentImages() {
    const len = lightboxState.photos.length;
    if (len <= 1) return;

    const prevIndex = (lightboxState.index - 1 + len) % len;
    const nextIndex = (lightboxState.index + 1) % len;

    [prevIndex, nextIndex].forEach((i) => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = lightboxState.photos[i].large;
      link.as = "image";
      document.head.appendChild(link);
    });
  }

  function handleLightboxKeydown(e) {
    switch (e.key) {
      case "Escape":
        closeLightbox();
        break;
      case "ArrowLeft":
        navigateLightbox(-1);
        break;
      case "ArrowRight":
        navigateLightbox(1);
        break;
    }

    // Focus trap: keep focus inside lightbox
    if (e.key === "Tab") {
      const overlay = lightboxState.overlay;
      const focusable = overlay.querySelectorAll("button");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  /* ========================================
     Page Detection & Init
     ======================================== */

  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("gig-grid")) {
      initIndex();
    } else if (document.getElementById("gig-detail")) {
      initGigPage();
    }
  });
})();
