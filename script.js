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

  /* ---------- Quote Form (one step) + FormSubmit.co ---------- */
  const quoteForm = document.getElementById('quote-form');
  const successBox = document.getElementById('form-success');
  const successName = document.getElementById('form-success-name');
  const errorBox = document.getElementById('form-error');
  const againBtn = document.getElementById('form-success-again');
  const isLiveSite = /(^|\.)bdelevate\.ca$/.test(window.location.hostname);

  if (quoteForm) {
    const dateInput = document.getElementById('field-date');
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    dateInput.min = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    quoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      for (const f of quoteForm.querySelectorAll('[required]')) {
        if (!f.checkValidity()) { f.reportValidity(); return; }
      }
      errorBox.hidden = true;
      const submitBtn = document.getElementById('form-submit-btn');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerText = 'Sending...';

      const fd = new FormData(quoteForm);
      // Work out square footage from e.g. "30ft x 30ft" to flag big jobs
      const nums = (fd.get('floor-size') || '').match(/\d+(\.\d+)?/g) || [];
      const sqft = nums.length >= 2 ? parseFloat(nums[0]) * parseFloat(nums[1]) : 0;
      const big = sqft >= 1000;
      const payload = {
        _subject: `${big ? 'PRIORITY ' : ''}Quote request: ${fd.get('event-date')} · ${fd.get('floor-size')} · ${fd.get('venue')}`,
        _template: 'table',
        _honey: fd.get('_honey') || '',
        name: fd.get('name'),
        phone: fd.get('phone'),
        email: fd.get('email'),
        eventDate: fd.get('event-date'),
        venue: fd.get('venue'),
        floorSize: fd.get('floor-size') + (sqft ? ` (about ${Math.round(sqft)} sq ft)` : ''),
        floorType: fd.get('floor-type'),
        design: fd.get('design')
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

    // Open a style straight from the homepage tiles (gallery.html#white etc.)
    const fromHash = (location.hash || '').slice(1);
    const hashBtn = document.querySelector(`.gallery__filter[data-filter="${fromHash}"]`);
    if (hashBtn) hashBtn.click();

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
    let embedsRequested = false;
    const loadEmbeds = () => {
      if (window.instgrm) { window.instgrm.Embeds.process(); return; }
      if (embedsRequested) return;
      embedsRequested = true;
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
    // Backup: load anyway shortly after the page finishes loading
    window.addEventListener('load', () => setTimeout(loadEmbeds, 3500));
  }

});
