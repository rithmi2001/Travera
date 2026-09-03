/* ============================================================
   TRAVERA — app.js  (professional responsive)
   Nav scroll, mobile drawer (a11y), marquee, smooth scroll
   ============================================================ */
(() => {
  'use strict';

  const header = document.getElementById('site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileOverlay = document.getElementById('mobile-nav-overlay');

  function isMobileNavOpen() {
    return mobileNav?.classList.contains('open');
  }

  function openMobileNav() {
    mobileNav?.classList.add('open');
    mobileOverlay?.classList.add('open');
    menuToggle?.classList.add('open');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
    if (mobileNav) {
      mobileNav.setAttribute('aria-hidden', 'false');
      mobileNav.removeAttribute('inert');
    }
    if (mobileOverlay) mobileOverlay.setAttribute('aria-hidden', 'false');
    // lock scroll, keep layout shift from scrollbar
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (sbw > 0) document.body.style.paddingRight = sbw + 'px';
    if (header && sbw > 0) header.style.paddingRight = sbw + 'px';
    // focus first link for a11y
    mobileNav?.querySelector('a')?.focus({ preventScroll: true });
  }

  function closeMobileNav() {
    mobileNav?.classList.remove('open');
    mobileOverlay?.classList.remove('open');
    menuToggle?.classList.remove('open');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    if (mobileNav) {
      mobileNav.setAttribute('aria-hidden', 'true');
      // re-add inert after transition
      setTimeout(() => { if (!isMobileNavOpen()) mobileNav.setAttribute('inert', ''); }, 360);
    }
    if (mobileOverlay) mobileOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    if (header) header.style.paddingRight = '';
    menuToggle?.focus({ preventScroll: true });
  }

  // Toggle click
  menuToggle?.addEventListener('click', () => {
    isMobileNavOpen() ? closeMobileNav() : openMobileNav();
  });

  mobileOverlay?.addEventListener('click', closeMobileNav);

  // Close on link click
  mobileNav?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMobileNav);
  });

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMobileNavOpen()) {
      e.preventDefault();
      closeMobileNav();
    }
  });

  // Close on resize to desktop
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth >= 992 && isMobileNavOpen()) closeMobileNav();
    }, 120);
  });

  // ─── Header scroll state (throttled via rAF) ──
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 24) header?.classList.add('scrolled');
        else header?.classList.remove('scrolled');
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ─── Smooth scroll with header offset ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const headerH = header?.offsetHeight || 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH - 12;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      // update URL without jump
      history.pushState(null, '', href);
    });
  });

  // ─── Marquee: duplicate content for seamless loop & pause ──
  const track = document.querySelector('.testimonials-track');
  if (track) {
    // duplicate children once for seamless infinite without gap
    if (track.children.length > 0 && track.children.length < 10) {
      const clone = track.innerHTML;
      track.innerHTML += clone;
      // ensure aria hidden for duplicates? keep simple
    }
    const pause = () => { track.style.animationPlayState = 'paused'; };
    const play = () => { track.style.animationPlayState = 'running'; };
    track.addEventListener('mouseenter', pause);
    track.addEventListener('mouseleave', play);
    track.addEventListener('focusin', pause);
    track.addEventListener('focusout', play);
    // touch pause
    track.addEventListener('touchstart', pause, { passive: true });
    track.addEventListener('touchend', () => setTimeout(play, 1200), { passive: true });
  }

  // ─── Contact form: progressive enhancement ──
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('cf-submit');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const data = Object.fromEntries(new FormData(form).entries());
      // honeypot check (if field added)
      if (data.company && String(data.company).trim()) return;

      const origText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'SENDING…';
        submitBtn.style.opacity = '0.7';
      }
      try {
        const res = await fetch('/api/inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.ok === false) throw new Error(json.error || 'Failed to send');
        form.reset();
        if (submitBtn) submitBtn.innerHTML = 'SENT ✓';
        // subtle success feedback
        const note = form.querySelector('.form-note');
        if (note) {
          const prev = note.textContent;
          note.textContent = 'Thank you — we will be in touch within 24 hours.';
          note.style.color = 'var(--teal-accent)';
          setTimeout(() => { note.textContent = prev; note.style.color = ''; }, 4000);
        }
        setTimeout(() => { if (submitBtn) submitBtn.innerHTML = origText; }, 2200);
      } catch (err) {
        if (submitBtn) submitBtn.innerHTML = 'TRY AGAIN';
        alert(err.message || 'Could not send inquiry. Please email ranuka.kariyawasam@gmail.com');
        setTimeout(() => { if (submitBtn) submitBtn.innerHTML = origText; }, 2000);
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = ''; }
      }
    });
  }

   // ─── Lazy video: pause when not visible ──
  const heroVideo = document.querySelector('.hero-video');

  if (heroVideo && 'IntersectionObserver' in window) {

    const io = new IntersectionObserver((entries) => {

      entries.forEach(entry => {

        if (entry.isIntersecting) {
          heroVideo.play().catch(() => {});
        } else {
          heroVideo.pause();
        }

      });

    }, { threshold: 0.15 });

    io.observe(heroVideo);
  }
// EXPERIENCE IMAGE — TOP TO BOTTOM ON SCROLL
(() => {
  'use strict';

  const experienceImageBox = document.querySelector('.experience-image-reveal');
  const experienceImage = document.querySelector('.experience-image-reveal img');
  if (!experienceImageBox || !experienceImage) return;

  function updateExperienceImage() {
    const box = experienceImageBox.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const start = viewportHeight;        // animation starts as image enters screen
    const end = viewportHeight * 0.25;   // finishes near 25% from top

    let progress = (start - box.top) / (start - end);
    progress = Math.max(0, Math.min(1, progress));

    const move = progress * 45; // image is 145% tall → 45% of extra height to pan
    experienceImage.style.transform = `translateY(-${move}%)`;
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateExperienceImage();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', updateExperienceImage);
  experienceImage.addEventListener('load', updateExperienceImage);
  updateExperienceImage();
})();

// ============================================================
// JOURNEYS — auto-scrolling marquee (pause on hover/touch/focus)
// ============================================================
(() => {
  'use strict';
  const track = document.getElementById('journeysTrack');
  if (!track) return;

  // duplicate cards once so the loop has no visible seam
  if (track.children.length > 0) {
    track.innerHTML += track.innerHTML;
  }

  const pause = () => track.classList.add('paused');
  const play  = () => track.classList.remove('paused');

  track.addEventListener('mouseenter', pause);
  track.addEventListener('mouseleave', play);
  track.addEventListener('focusin', pause);
  track.addEventListener('focusout', play);
  track.addEventListener('touchstart', pause, { passive: true });
  track.addEventListener('touchend', () => setTimeout(play, 1200), { passive: true });
})();

})();

