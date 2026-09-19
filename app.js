/* ============================================================
   TRAVERA WORLD — app.js
   Nav, scroll progress, reveal-on-scroll, marquee, count-up, form
   ============================================================ */
(() => {
  'use strict';

  const header = document.getElementById('site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileOverlay = document.getElementById('mobile-nav-overlay');

  const isMobileNavOpen = () => mobileNav?.classList.contains('open');

  function openMobileNav() {
    mobileNav?.classList.add('open');
    mobileOverlay?.classList.add('open');
    menuToggle?.classList.add('open');
    menuToggle?.setAttribute('aria-expanded', 'true');
    if (mobileNav) { mobileNav.setAttribute('aria-hidden', 'false'); mobileNav.removeAttribute('inert'); }
    mobileOverlay?.setAttribute('aria-hidden', 'false');
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (sbw > 0) { document.body.style.paddingRight = sbw + 'px'; if (header) header.style.paddingRight = sbw + 'px'; }
    mobileNav?.querySelector('a')?.focus({ preventScroll: true });
  }

  function closeMobileNav() {
    mobileNav?.classList.remove('open');
    mobileOverlay?.classList.remove('open');
    menuToggle?.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    if (mobileNav) {
      mobileNav.setAttribute('aria-hidden', 'true');
      setTimeout(() => { if (!isMobileNavOpen()) mobileNav.setAttribute('inert', ''); }, 360);
    }
    mobileOverlay?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    if (header) header.style.paddingRight = '';
    menuToggle?.focus({ preventScroll: true });
  }

  menuToggle?.addEventListener('click', () => (isMobileNavOpen() ? closeMobileNav() : openMobileNav()));
  mobileOverlay?.addEventListener('click', closeMobileNav);
  mobileNav?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileNav));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isMobileNavOpen()) { e.preventDefault(); closeMobileNav(); } });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (window.innerWidth >= 992 && isMobileNavOpen()) closeMobileNav(); }, 120);
  });

  // ─── Header state + scroll progress bar (single rAF loop) ──
  const progressBar = document.getElementById('scrollProgress');
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 24) header?.classList.add('scrolled');
        else header?.classList.remove('scrolled');

        if (progressBar) {
          const doc = document.documentElement;
          const max = doc.scrollHeight - doc.clientHeight;
          const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
          progressBar.style.width = pct + '%';
        }
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
      history.pushState(null, '', href);
    });
  });

  // ─── Reveal-on-scroll entrance animation ──
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // ─── Why Travera: count-up stat (single orchestrated moment) ──
  const statEl = document.querySelector('.why-stat');
  if (statEl && 'IntersectionObserver' in window) {
    const target = parseInt(statEl.dataset.count, 10) || 0;
    const statIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const duration = 1200;
          const startTime = performance.now();
          function tick(now) {
            const p = Math.min(1, (now - startTime) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            statEl.textContent = Math.round(eased * target);
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
          statIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    statIo.observe(statEl);
  } else if (statEl) {
    statEl.textContent = statEl.dataset.count;
  }

  // ─── Journeys marquee: duplicate for seamless loop, pause on interact ──
  const track = document.getElementById('journeysTrack');
  if (track && track.children.length) {
    track.innerHTML += track.innerHTML;
    const pause = () => track.classList.add('paused');
    const play = () => track.classList.remove('paused');
    track.addEventListener('mouseenter', pause);
    track.addEventListener('mouseleave', play);
    track.addEventListener('focusin', pause);
    track.addEventListener('focusout', play);
    track.addEventListener('touchstart', pause, { passive: true });
    track.addEventListener('touchend', () => setTimeout(play, 1200), { passive: true });
  }

  // ─── Curated stories: ambient card videos (lazy, play-in-view, graceful fallback) ──
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const expVideos = document.querySelectorAll('.exp-video');
if (expVideos.length && !reduceMotion) {
  expVideos.forEach(video => {
    video.addEventListener('loadeddata', () => video.classList.add('is-ready'));
    video.addEventListener('error', () => { video.style.display = 'none'; }, true);
  });

  if ('IntersectionObserver' in window) {
    const videoIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) {
          if (!video.getAttribute('src') && !video.querySelector('source[data-loaded]')) {
            video.load();
            video.querySelectorAll('source').forEach(s => s.setAttribute('data-loaded', 'true'));
          }
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.35 });
    expVideos.forEach(video => videoIo.observe(video));
  }
}

/* ============================================================
   TRAVERA WORLD — journal.js
   Journal section: entrance reveals, featured carousel,
   pointer effects (tilt, spotlight, magnetic), scroll parallax.
   Load AFTER app.js (or paste inside its IIFE).
   ============================================================ */
(() => {
  'use strict';

  const section = document.getElementById('journal');
  if (!section) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasIO = 'IntersectionObserver' in window;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ─── 1 · Title: split into words so each can rise out of a mask ─── */
  const title = section.querySelector('.jr-title');
  if (title) {
    const text = title.textContent.trim();
    title.setAttribute('aria-label', text);
    title.innerHTML = text.split(/\s+/)
      .map((w, i) => `<span class="jr-w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`)
      .join(' ');
  }

  /* ─── 2 · Entrance animation (each element reveals as it scrolls in) ─── */
  const revealEls = section.querySelectorAll('.jr-x, .jr-pop, .jr-script');
  if (reduce || !hasIO) {
    revealEls.forEach(el => el.classList.add('is-in'));
    section.classList.add('jr-ready');
  } else {
    section.classList.add('jr-ready');
    const revealIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealIo.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(el => revealIo.observe(el));
  }

  /* ─── 3 · Scroll-linked motion: sets --jr-p (−1 … 1) on the section ─── */
  if (!reduce) {
    let inView = false;
    let ticking = false;
    const update = () => {
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp(((r.top + r.height / 2) - vh / 2) / ((vh + r.height) / 2), -1, 1);
      section.style.setProperty('--jr-p', p.toFixed(4));
      ticking = false;
    };
    const onScroll = () => { if (inView && !ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    if (hasIO) {
      new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) update(); }, { rootMargin: '120px 0px' }).observe(section);
    } else { inView = true; update(); }
  }

  /* ─── 4 · Featured carousel ─── */
  const card = section.querySelector('.jr-card');
  const slides = [...section.querySelectorAll('.jr-slide')];
  const dots = [...section.querySelectorAll('.jr-dot')];
  const DELAY = 6500;
  let idx = 0, timer = null, hovering = false, inView2 = !hasIO;

  function go(n) {
    idx = (n + slides.length) % slides.length;
    slides.forEach((s, i) => {
      const on = i === idx;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-hidden', String(!on));
      if (on) s.removeAttribute('inert'); else s.setAttribute('inert', '');
      if (on) s.querySelector('img')?.setAttribute('loading', 'eager');
    });
    dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === idx);
      d.setAttribute('aria-current', String(i === idx));
    });
  }
  function stop() { clearTimeout(timer); timer = null; }
  function play() {
    stop();
    if (reduce || hovering || !inView2 || document.hidden) return;
    timer = setTimeout(() => { go(idx + 1); play(); }, DELAY);
  }
  const goUser = (n) => { go(n); play(); };

  dots.forEach((d, i) => d.addEventListener('click', () => goUser(i)));

  if (card) {
    card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hovering = true; stop(); } });
    card.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { hovering = false; play(); } });
    card.addEventListener('focusin', () => { hovering = true; stop(); });
    card.addEventListener('focusout', () => { hovering = false; play(); });

    // swipe (touch / pen)
    let sx = 0, sy = 0, tracking = false;
    card.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') return; tracking = true; sx = e.clientX; sy = e.clientY; });
    card.addEventListener('pointerup', (e) => {
      if (!tracking) return; tracking = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) goUser(idx + (dx < 0 ? 1 : -1));
    });
    card.addEventListener('pointercancel', () => { tracking = false; });

    // keyboard: ← → when focus is inside the carousel
    section.querySelector('.jr-feature')?.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') goUser(idx + 1);
      if (e.key === 'ArrowLeft') goUser(idx - 1);
    });
  }
  if (hasIO && card) {
    new IntersectionObserver(([e]) => { inView2 = e.isIntersecting; inView2 ? play() : stop(); }, { threshold: 0.35 }).observe(card);
  } else { play(); }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));

  /* ─── 5 · Pointer effects (mouse / trackpad only) ─── */
  if (finePointer && !reduce) {
    // card: gentle 3D tilt + image shifts against the pointer
    if (card) {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--mx', x.toFixed(3));
        card.style.setProperty('--my', y.toFixed(3));
        card.style.setProperty('--rx', (x * 4).toFixed(2) + 'deg');
        card.style.setProperty('--ry', (-y * 3).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', () => {
        ['--mx', '--my', '--rx', '--ry'].forEach(p => card.style.removeProperty(p));
      });
    }

    // articles: golden spotlight follows the cursor
    section.querySelectorAll('.jr-article').forEach(a => {
      a.addEventListener('pointermove', (e) => {
        const r = a.getBoundingClientRect();
        a.style.setProperty('--px', (e.clientX - r.left) + 'px');
        a.style.setProperty('--py', (e.clientY - r.top) + 'px');
      });
    });

    // buttons: magnetic pull toward the cursor
    section.querySelectorAll('.jr-mag').forEach(el => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--tx', ((e.clientX - (r.left + r.width / 2)) * 0.22).toFixed(1) + 'px');
        el.style.setProperty('--ty', ((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1) + 'px');
      });
      el.addEventListener('pointerleave', () => { el.style.removeProperty('--tx'); el.style.removeProperty('--ty'); });
    });
  }

  /* ─── 6 · Touch devices: the article nearest the screen centre "lights up" ─── */
  if (!finePointer && hasIO && !reduce) {
    const focusIo = new IntersectionObserver((entries) => {
      entries.forEach(e => e.target.classList.toggle('is-focus', e.isIntersecting));
    }, { rootMargin: '-38% 0px -38% 0px' });
    section.querySelectorAll('.jr-article').forEach(a => focusIo.observe(a));
  }
})();
  // ─── Contact form: progressive enhancement ──
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('cf-submit');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const data = Object.fromEntries(new FormData(form).entries());
      if (data.company && String(data.company).trim()) return; // honeypot

      const origHTML = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Sending…'; submitBtn.style.opacity = '0.7'; }
      try {
        const res = await fetch('/api/inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.ok === false) throw new Error(json.error || 'Failed to send');
        form.reset();
        if (submitBtn) submitBtn.innerHTML = 'Sent ✓';
        const note = form.querySelector('.form-note');
        if (note) {
          const prev = note.textContent;
          note.textContent = 'Thank you — we will be in touch within 24 hours.';
          note.style.color = 'var(--teal-accent)';
          setTimeout(() => { note.textContent = prev; note.style.color = ''; }, 4000);
        }
        setTimeout(() => { if (submitBtn) submitBtn.innerHTML = origHTML; }, 2200);
      } catch (err) {
        if (submitBtn) submitBtn.innerHTML = 'Try Again';
        alert(err.message || 'Could not send enquiry. Please email hello@traveraworld.com');
        setTimeout(() => { if (submitBtn) submitBtn.innerHTML = origHTML; }, 2000);
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = ''; }
      }
    });
  }

})();