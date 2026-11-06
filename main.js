(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s) { return document.querySelector(s); };
  var nav = $('#nav'), callbar = $('#callbar'), heroMedia = $('#heroMedia'), heroInner = $('#heroInner');
  var work = $('#work'), track = $('#workTrack'), workBar = $('#workBar');
  var bands = document.querySelectorAll('[data-parallax]');
  var navLinks = document.querySelectorAll('.links a[href^="#"]');
  var sections = Array.prototype.map.call(navLinks, function (a) { return document.querySelector(a.getAttribute('href')); });

  document.getElementById('yr').textContent = new Date().getFullYear();

  /* mobile menu */
  var burger = $('#burger');
  burger.addEventListener('click', function () {
    var open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  document.querySelectorAll('.links a').forEach(function (a) {
    a.addEventListener('click', function () {
      document.body.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  /* horizontal gallery sizing */
  var trackDist = 0;
  function sizeWork() {
    if (reduce) { work.style.height = ''; return; }
    trackDist = Math.max(0, track.scrollWidth - window.innerWidth);
    work.style.height = (window.innerHeight + trackDist) + 'px';
  }

  /* scroll-linked frame */
  var ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;

    nav.classList.toggle('solid', y > 40);
    callbar.classList.toggle('show', y > vh * 0.8);

    // active nav link
    var current = -1;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < vh * 0.4) current = i; });
    navLinks.forEach(function (a, i) { a.classList.toggle('on', i === current); });

    if (reduce) return;

    // hero: image drifts down slower than the page, content lifts and fades
    if (y < vh * 1.2) {
      var p = Math.min(y / vh, 1);
      heroMedia.style.transform = 'translate3d(0,' + (y * 0.35) + 'px,0) scale(' + (1 + p * 0.08) + ')';
      heroInner.style.transform = 'translate3d(0,' + (-y * 0.18) + 'px,0) scale(' + (1 - p * 0.06) + ')';
      heroInner.style.opacity = String(Math.max(0, 1 - p * 1.4));
    }

    // parallax bands
    bands.forEach(function (b) {
      var r = b.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var prog = (r.top + r.height / 2 - vh / 2) / (vh + r.height);
      b.style.transform = 'translate3d(0,' + (prog * -22) + '%,0)';
    });

    // pinned horizontal work strip
    var wr = work.getBoundingClientRect();
    var span = wr.height - vh;
    var wp = span > 0 ? Math.min(Math.max(-wr.top / span, 0), 1) : 0;
    track.style.transform = 'translate3d(' + (-wp * trackDist) + 'px,0,0)';
    workBar.style.transform = 'scaleX(' + wp + ')';
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { sizeWork(); onScroll(); });
  window.addEventListener('load', function () { sizeWork(); onScroll(); });
  track.querySelectorAll('img').forEach(function (img) {
    if (!img.complete) img.addEventListener('load', sizeWork);
  });
  sizeWork(); frame();

  /* reveal + counters */
  function count(el) {
    var to = parseFloat(el.dataset.to), dec = +(el.dataset.dec || 0);
    if (reduce || to === 0) { el.textContent = to.toFixed(dec); return; }
    var t0 = null, dur = 1600;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = (to * e).toFixed(dec);
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        en.target.querySelectorAll('.count').forEach(count);
        io.unobserve(en.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
    document.querySelectorAll('.count').forEach(count);
  }

  /* quote form: send in place, fall back to normal post */
  var form = $('#quoteForm'), note = $('#formNote');
  form.addEventListener('submit', function (e) {
    if (!window.fetch) return;
    e.preventDefault();
    var btn = form.querySelector('button');
    btn.disabled = true; note.className = 'form-note'; note.textContent = 'Sending...';
    fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
      method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form)
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || String(res.j.success) === 'false') throw new Error(res.j.message || 'failed');
        form.reset();
        note.textContent = "Got it. We'll call you shortly. Need us sooner? Call (208) 371-2100.";
      })
      .catch(function () {
        note.className = 'form-note err';
        note.innerHTML = 'That didn’t go through. Please call or text <a href="tel:+12083712100">(208) 371-2100</a>.';
      })
      .then(function () { btn.disabled = false; });
  });
})();
