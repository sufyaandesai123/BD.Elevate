/* ===================================================
   BD ELEVATE — Main JavaScript
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Sticky Navbar ---------- */
  const navbar = document.getElementById('navbar');
  const SCROLL_THRESHOLD = 60;

  const handleNavScroll = () => {
    if (window.scrollY > SCROLL_THRESHOLD) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll(); // initial check

  /* ---------- Mobile Menu Toggle ---------- */
  const toggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close menu when a link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      toggle.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  /* ---------- Smooth Scroll for Anchor Links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const navHeight = navbar.offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  /* ---------- Scroll Reveal (IntersectionObserver) ---------- */
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  /* ---------- Counter Animation ---------- */
  const counters = document.querySelectorAll('.stat__number');
  let counterAnimated = false;

  const animateCounters = () => {
    if (counterAnimated) return;
    counterAnimated = true;

    counters.forEach(counter => {
      const targetAttr = counter.getAttribute('data-target');
      if (!targetAttr) return; // skip animation for static text values
      const target = parseInt(targetAttr, 10);
      if (isNaN(target)) return;

      const suffix = counter.getAttribute('data-suffix') || '';
      const duration = 2000;
      const start = performance.now();

      const updateCounter = (currentTime) => {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);

        counter.textContent = current + suffix;

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target + suffix;
        }
      };

      requestAnimationFrame(updateCounter);
    });
  };

  const statsSection = document.querySelector('.about__stats');
  if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounters();
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statsObserver.observe(statsSection);
  }

  /* ---------- Quote Form: two steps + FormSubmit.co ---------- */
  const quoteForm = document.getElementById('quote-form');
  const successBox = document.getElementById('form-success');
  const successName = document.getElementById('form-success-name');
  const errorBox = document.getElementById('form-error');
  const againBtn = document.getElementById('form-success-again');
  const isLiveSite = /(^|\.)bdelevate\.ca$/.test(window.location.hostname);

  if (quoteForm) {
    const steps = quoteForm.querySelectorAll('.form-step');
    const dots = quoteForm.querySelectorAll('.form-steps__dot');
    const stepLabel = document.getElementById('form-steps-label');
    const nextBtn = document.getElementById('form-next-btn');
    const backBtn = document.getElementById('form-back-btn');
    const dateInput = document.getElementById('field-date');
    const dateHint = document.getElementById('date-hint');
    const formTop = quoteForm.closest('.quote__form-wrapper');

    // No past dates
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    dateInput.min = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    // Wedding-season nudge (May to October)
    dateInput.addEventListener('change', () => {
      const month = Number((dateInput.value || '').slice(5, 7));
      dateHint.hidden = !(month >= 5 && month <= 10);
    });

    const showStep = (n) => {
      steps.forEach(s => { s.hidden = Number(s.dataset.step) !== n; });
      dots.forEach(d => d.classList.toggle('is-active', Number(d.dataset.dot) <= n));
      stepLabel.textContent = n === 1 ? 'Step 1 of 2: Your event' : 'Step 2 of 2: Your floor';
      const first = quoteForm.querySelector(`.form-step[data-step="${n}"] input, .form-step[data-step="${n}"] select`);
      if (first) first.focus({ preventScroll: true });
      const top = formTop.getBoundingClientRect().top + window.scrollY - navbar.offsetHeight - 16;
      if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
    };

    const stepValid = (n) => {
      const fields = quoteForm.querySelectorAll(`.form-step[data-step="${n}"] [required]`);
      for (const f of fields) {
        if (f.type === 'radio') {
          if (!quoteForm.querySelector(`input[name="${f.name}"]:checked`)) {
            f.closest('.chips').classList.add('chips--invalid');
            f.focus();
            return false;
          }
        } else if (!f.checkValidity()) {
          f.reportValidity();
          return false;
        }
      }
      return true;
    };

    quoteForm.querySelectorAll('input[name="style"]').forEach(r =>
      r.addEventListener('change', () => r.closest('.chips').classList.remove('chips--invalid')));

    nextBtn.addEventListener('click', () => { if (stepValid(1)) showStep(2); });
    backBtn.addEventListener('click', () => showStep(1));

    // Enter key on step 1 moves to step 2 instead of submitting
    quoteForm.querySelector('.form-step[data-step="1"]').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        nextBtn.click();
      }
    });

    quoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!stepValid(1)) { showStep(1); return; }
      if (!stepValid(2)) return;

      errorBox.hidden = true;
      const submitBtn = document.getElementById('form-submit-btn');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerText = 'Sending Request...';

      const fd = new FormData(quoteForm);
      const size = fd.get('floor-size') || '';
      const big = /^1,000|^2,000/.test(size);
      const payload = {
        _subject: `${big ? 'PRIORITY ' : ''}Quote request: ${fd.get('event-date')} · ${size} · ${fd.get('style')}`,
        _template: 'table',
        _honey: fd.get('_honey') || '',
        eventDate: fd.get('event-date'),
        name: fd.get('name'),
        phone: fd.get('phone'),
        email: fd.get('email'),
        venue: fd.get('venue'),
        floorSize: size,
        style: fd.get('style'),
        floorType: fd.get('floor-type') || 'Not given',
        designIdea: fd.get('design-idea') || 'Not given',
        heardFrom: fd.get('heard-from') || 'Not given'
      };

      const send = isLiveSite
        ? fetch('https://formsubmit.co/ajax/bdelevate6@gmail.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
          }).then(r => { if (!r.ok) throw new Error('Network response was not ok'); return r.json(); })
        : new Promise(resolve => setTimeout(() => resolve({ success: 'true', preview: true }), 700));

      send.then(data => {
        if (data && (data.success === false || data.success === 'false')) {
          throw new Error(data.message || 'Submission failed');
        }
        const firstName = (payload.name || '').trim().split(/\s+/)[0];
        successName.textContent = firstName ? ', ' + firstName : '';
        quoteForm.reset();
        dateHint.hidden = true;
        showStep(1);
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        quoteForm.hidden = true;
        successBox.hidden = false;
        successBox.focus({ preventScroll: true });
        successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }).catch(error => {
        console.error('Submission Error:', error);
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        errorBox.hidden = false;
      });
    });

    if (againBtn) {
      againBtn.addEventListener('click', () => {
        successBox.hidden = true;
        quoteForm.hidden = false;
        showStep(1);
      });
    }
  }

  /* ---------- Preview notice (not on the live site) ---------- */
  if (!isLiveSite) {
    const note = document.createElement('div');
    note.className = 'preview-note';
    note.textContent = 'Preview only: quote requests here are not sent.';
    document.body.appendChild(note);
  }


  /* ---------- Active Nav Link Highlight ---------- */
  const sections = document.querySelectorAll('section[id]');

  const highlightNav = () => {
    const scrollY = window.scrollY;

    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      const navLink = navLinks.querySelector(`a[href="#${sectionId}"]`);

      if (navLink) {
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
          navLink.style.color = 'var(--clr-white)';
        } else {
          navLink.style.color = '';
        }
      }
    });
  };

  window.addEventListener('scroll', highlightNav, { passive: true });

  /* ---------- Parallax on Hero (subtle) ---------- */
  const heroBg = document.querySelector('.hero__bg img');

  if (heroBg && window.innerWidth > 768) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        heroBg.style.transform = `scale(${1.05 + scrolled * 0.0001}) translateY(${scrolled * 0.15}px)`;
      }
    }, { passive: true });
  }


  /* ---------- Gallery: filters + full-screen viewer ---------- */
  const galleryGrid = document.querySelector('.gallery__grid');
  if (galleryGrid) {
    const items = [...galleryGrid.querySelectorAll('.gallery__item')];
    const filterBtns = document.querySelectorAll('.gallery__filter');
    filterBtns.forEach(btn => btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      filterBtns.forEach(b => { const on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); });
      items.forEach(it => {
        const show = f === 'all' || (it.dataset.cat || '').split(' ').includes(f);
        it.hidden = !show;
        if (show) it.classList.add('revealed');
      });
    }));

    const box = document.getElementById('lightbox');
    const boxImg = document.getElementById('lightbox-img');
    const boxCap = document.getElementById('lightbox-caption');
    let current = 0;
    const visible = () => items.filter(it => !it.hidden);
    const open = (it) => {
      const list = visible();
      current = list.indexOf(it);
      const img = it.querySelector('img');
      boxImg.src = img.currentSrc && img.currentSrc.includes('-1200') ? img.currentSrc : img.src.replace('-800.jpg', '-1200.jpg');
      boxImg.alt = img.alt;
      boxCap.textContent = img.alt;
      if (!box.open) { box.showModal(); document.body.style.overflow = 'hidden'; }
    };
    const step = (d) => { const list = visible(); if (!list.length) return; open(list[(current + d + list.length) % list.length]); };
    const close = () => { box.close(); };
    box.addEventListener('close', () => { document.body.style.overflow = ''; });
    items.forEach(it => {
      it.tabIndex = 0;
      it.setAttribute('role', 'button');
      it.addEventListener('click', () => open(it));
      it.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(it); } });
    });
    document.getElementById('lightbox-close').addEventListener('click', close);
    document.getElementById('lightbox-prev').addEventListener('click', () => step(-1));
    document.getElementById('lightbox-next').addEventListener('click', () => step(1));
    box.addEventListener('click', e => { if (e.target === box) close(); });
    box.addEventListener('keydown', e => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
    let x0 = null;
    box.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); x0 = null; });
  }


  /* ---------- Instagram reels: load Instagram's player only when scrolled near ---------- */
  const reels = document.getElementById('reels');
  if (reels) {
    const loadEmbeds = () => {
      if (window.instgrm) { window.instgrm.Embeds.process(); return; }
      const sc = document.createElement('script');
      sc.async = true;
      sc.src = 'https://www.instagram.com/embed.js';
      sc.onload = () => { if (window.instgrm) window.instgrm.Embeds.process(); };
      document.body.appendChild(sc);
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) { loadEmbeds(); io.disconnect(); }
      }, { rootMargin: '600px 0px' });
      io.observe(reels);
    } else {
      loadEmbeds();
    }
  }

});
