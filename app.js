/* TRAVERA WORLD — app.js */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;

  /* mobile menu */
  const burger = $('#burger'), drawer = $('#drawer');
  const setMenu = o => {
    burger.classList.toggle('open', o);
    drawer.classList.toggle('open', o);
    burger.setAttribute('aria-expanded', o);
    document.body.style.overflow = o ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!drawer.classList.contains('open')));
  $$('a', drawer).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* scroll: header state, progress bar, parallax (single rAF loop) */
  const header = $('#header'), bar = $('#progress');
  const hero = $('#heroMedia'), whyImg = $('#whyImg'), bandImg = $('#bandImg');
  const offset = el => {
    const r = el.getBoundingClientRect(), vh = innerHeight;
    return r.bottom < 0 || r.top > vh ? null : (vh - r.top) / (vh + r.height) - 0.5;
  };
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      header.classList.toggle('scrolled', y > 40);
      bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      if (!reduce) {
        if (y < innerHeight * 1.2) hero.style.transform = `translateY(${y * 0.25}px)`;
        [whyImg, bandImg].forEach(img => {
          if (!img) return;
          const p = offset(img.parentElement);
          if (p !== null) img.style.transform = `translateY(${p * -50}px)`;
        });
      }
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* smooth anchors with header offset */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const t = $(id);
    if (!t) return;
    e.preventDefault();
    scrollTo({ top: t.getBoundingClientRect().top + scrollY - header.offsetHeight - 8, behavior: 'smooth' });
  }));

  /* reveal on scroll */
  const rv = $$('.rv');
  if (hasIO) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.14, rootMargin: '0px 0px -50px 0px' });
    rv.forEach(el => io.observe(el));
  } else rv.forEach(el => el.classList.add('in'));

  /* count-up (11 years) */
  const counter = $('.count');
  if (counter) {
    const target = +counter.dataset.target || 0;
    const run = () => {
      const s = performance.now();
      (function f(n) {
        const p = Math.min((n - s) / 1400, 1);
        counter.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(f);
      })(s);
    };
    if (reduce || !hasIO) counter.textContent = target;
    else new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { run(); o.disconnect(); } }), { threshold: 0.6 }).observe(counter);
  }

  /* journeys marquee: duplicate for a seamless loop */
  const track = $('#track');
  if (track && !reduce) track.innerHTML += track.innerHTML;

  /* experience videos: lazy load, play only in view */
  const vids = $$('.em video');
  if (hasIO && !reduce) {
    vids.forEach(v => {
      v.addEventListener('loadeddata', () => v.classList.add('ready'));
      v.addEventListener('error', () => { v.style.display = 'none'; }, true);
    });
    const vio = new IntersectionObserver(es => es.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) {
        if (!v.dataset.loaded) { v.load(); v.dataset.loaded = '1'; }
        v.play().catch(() => {});
      } else v.pause();
    }), { threshold: 0.35 });
    vids.forEach(v => vio.observe(v));
  }

  /* journal carousel */
  const slides = $$('.slide'), dots = $$('.dot'), card = $('#jrCard');
  let idx = 0, timer = null, paused = false;
  const go = n => {
    idx = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('on', i === idx));
    dots.forEach((d, i) => d.classList.toggle('on', i === idx));
  };
  const stop = () => { clearTimeout(timer); timer = null; };
  const play = () => {
    stop();
    if (reduce || paused || document.hidden) return;
    timer = setTimeout(() => { go(idx + 1); play(); }, 6500);
  };
  dots.forEach((d, i) => d.addEventListener('click', () => { go(i); play(); }));
  if (card) {
    card.addEventListener('pointerenter', () => { paused = true; stop(); });
    card.addEventListener('pointerleave', () => { paused = false; play(); });
    let sx = 0;
    card.addEventListener('pointerdown', e => { sx = e.clientX; });
    card.addEventListener('pointerup', e => {
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 45) { go(idx + (dx < 0 ? 1 : -1)); play(); }
    });
    if (hasIO) new IntersectionObserver(([e]) => { paused = !e.isIntersecting; paused ? stop() : play(); }, { threshold: 0.35 }).observe(card);
    else play();
  }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));

  /* contact form */
  const form = $('#form'), btn = $('#cf-submit'), note = $('.note', form);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const old = btn.textContent, prev = note.textContent;
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) throw new Error(json.error || 'Failed to send');
      form.reset();
      btn.textContent = 'Sent ✓';
      note.textContent = 'Thank you — we will be in touch within 24 hours.';
      note.style.color = 'var(--teal)';
    } catch (err) {
      btn.textContent = 'Try Again';
      note.textContent = err.message || 'Could not send enquiry. Please email hello@traveraworld.com';
      note.style.color = '#b3261e';
    } finally {
      btn.disabled = false;
      setTimeout(() => { btn.textContent = old; note.textContent = prev; note.style.color = ''; }, 4000);
    }
  });
})();