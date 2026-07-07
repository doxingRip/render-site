(function () {
  'use strict';

  var hiddenNavTexts = ['Partnership', 'Партнёрство'];
  var hiddenAuthHrefs = ['/login', '/registration'];
  var downloadUrl = '/downloads/Render_1.0.0_x64-setup.exe';
  var downloadFileName = 'Render_1.0.0_x64-setup.exe';
  var heroPlayerUrl = '/player/?embed=1';
  var themeStorageKey = 'render_site_theme';

  var sunIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="4"></circle>' +
    '<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>' +
    '</svg>';

  var moonIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>' +
    '</svg>';

  function getSavedTheme() {
    try {
      return localStorage.getItem(themeStorageKey) === 'light' ? 'light' : 'dark';
    } catch (err) {
      return 'dark';
    }
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('theme-light');
    } else {
      root.classList.remove('theme-light');
    }

    try {
      localStorage.setItem(themeStorageKey, theme);
    } catch (err) {
      /* ignore */
    }

    var btn = document.getElementById('render-theme-toggle');
    if (btn) {
      updateThemeToggleButton(btn);
    }
  }

  function updateThemeToggleButton(btn) {
    var light = document.documentElement.classList.contains('theme-light');
    var ru = isRussian();
    btn.innerHTML = light ? moonIcon : sunIcon;
    btn.setAttribute('aria-pressed', light ? 'true' : 'false');
    btn.setAttribute(
      'aria-label',
      light
        ? ru
          ? 'Включить тёмную тему'
          : 'Switch to dark theme'
        : ru
          ? 'Включить светлую тему'
          : 'Switch to light theme'
    );
    btn.title = btn.getAttribute('aria-label');
  }

  function findLanguageControl(root) {
    if (!root) return null;

    var buttons = root.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].id === 'render-theme-toggle') continue;

      var text = (buttons[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (
        text === 'EN' ||
        text === 'RU' ||
        /English|Russian|Русский|Українська/i.test(text)
      ) {
        return buttons[i];
      }
    }

    return null;
  }

  function findHeaderRow() {
    var logoBtn = document.querySelector('.nav-logo-btn');
    if (logoBtn && logoBtn.parentElement) {
      return { logoBtn: logoBtn, row: logoBtn.parentElement };
    }
    return null;
  }

  function setupLanguageActions(root) {
    if (!root) return;

    var lang = findLanguageControl(root);
    if (!lang || !lang.parentNode) return;

    var actions = document.getElementById('render-header-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.id = 'render-header-actions';
      actions.className = 'render-header-actions';
      lang.parentNode.insertBefore(actions, lang);
      actions.appendChild(lang);
    } else if (lang.parentNode !== actions) {
      actions.appendChild(lang);
    }
  }

  function setupThemeToggle() {
    var header = findHeaderRow();
    if (!header) return;

    var logoBtn = header.logoBtn;
    var row = header.row;

    var btn = document.getElementById('render-theme-toggle');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'render-theme-toggle';
      btn.type = 'button';
      btn.className = 'render-theme-toggle';
      btn.addEventListener('click', function () {
        var next = document.documentElement.classList.contains('theme-light') ? 'dark' : 'light';
        applyTheme(next);
      });
    }

    updateThemeToggleButton(btn);
    setupLanguageActions(row);

    var brandGroup = document.getElementById('render-brand-group');
    if (!brandGroup) {
      brandGroup = document.createElement('div');
      brandGroup.id = 'render-brand-group';
      brandGroup.className = 'render-brand-group';
      row.insertBefore(brandGroup, logoBtn);
      brandGroup.appendChild(logoBtn);
    } else if (logoBtn.parentNode !== brandGroup) {
      brandGroup.insertBefore(logoBtn, brandGroup.firstChild);
    }

    if (btn.parentNode !== brandGroup) {
      brandGroup.appendChild(btn);
    }
  }

  function watchThemeToggle() {
    if (typeof MutationObserver === 'undefined') return;

    var timer = null;
    var observer = new MutationObserver(function () {
      if (document.getElementById('render-theme-toggle')) return;
      if (!document.querySelector('.nav-logo-btn')) return;
      clearTimeout(timer);
      timer = setTimeout(setupThemeToggle, 100);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function isRussian() {
    if (document.documentElement.lang === 'ru') return true;
    var nav = document.querySelector('nav, header');
    return nav ? /[а-яё]/i.test(nav.textContent || '') : false;
  }

  function hideAuthButtons() {
    document.querySelectorAll('a[href], button').forEach(function (el) {
      var href = el.getAttribute('href') || '';
      if (hiddenAuthHrefs.indexOf(href) !== -1) {
        el.style.display = 'none';
        return;
      }
      if (el.classList && el.classList.contains('nav-cta')) {
        el.style.display = 'none';
      }
    });
  }

  function setupDownloadNav() {
    var ru = isRussian();
    document.querySelectorAll('nav button, nav a, header button, header a').forEach(function (el) {
      var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (text !== 'Pricing' && text !== 'Цены') return;

      el.textContent = ru ? 'Скачать' : 'Download';
      el.style.display = '';

      if (el.tagName === 'A') {
        el.setAttribute('href', '#pricing');
      }

      el.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.getElementById('pricing');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function hideNavItems() {
    document.querySelectorAll('nav button, nav a, header button, header a').forEach(function (el) {
      var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (hiddenNavTexts.indexOf(text) === -1) return;

      if (text === 'Partnership' || text === 'Партнёрство') {
        var dropdown = el.closest('.relative');
        if (dropdown) dropdown.style.display = 'none';
      }

      el.style.display = 'none';
    });
  }

  function setupHeroPreview() {
    var frame = document.querySelector('.hero-gui-frame');
    var existing = document.getElementById('render-hero-preview');

    if (existing) return;

    var wrap = document.createElement('div');
    wrap.id = 'render-hero-preview';
    wrap.className = 'render-hero-preview';

    var iframe = document.createElement('iframe');
    iframe.className = 'render-hero-preview__frame';
    iframe.src = heroPlayerUrl;
    iframe.title = 'Render Music Player';
    iframe.loading = 'eager';
    iframe.setAttribute('allow', 'autoplay');
    wrap.appendChild(iframe);

    if (frame && frame.parentNode) {
      frame.parentNode.insertBefore(wrap, frame);
      return;
    }

    var heroSection = null;
    document.querySelectorAll('section').forEach(function (section) {
      if (heroSection) return;
      if (section.querySelector('h1')) heroSection = section;
    });

    if (heroSection) {
      heroSection.appendChild(wrap);
    }
  }

  function watchHeroPreview() {
    if (typeof MutationObserver === 'undefined') return;

    var timer = null;
    var observer = new MutationObserver(function () {
      if (document.getElementById('render-hero-preview')) return;
      if (!document.querySelector('.hero-gui-frame') && !document.querySelector('section h1')) return;
      clearTimeout(timer);
      timer = setTimeout(setupHeroPreview, 100);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function buildDownloadSection() {
    var ru = isRussian();
    var block = document.createElement('div');
    block.id = 'render-download-block';
    block.className = 'render-download';
    block.innerHTML =
      '<div class="render-download__card">' +
      '<img class="render-download__logo" src="/images/logo.png" alt="Render Music" width="72" height="72">' +
      '<h2 class="render-download__title">' +
      (ru ? 'Скачать Render' : 'Download Render') +
      '</h2>' +
      '<p class="render-download__subtitle">' +
      (ru
        ? 'Современный аудиоплеер для Windows — установите и начните слушать любимую музыку.'
        : 'A modern audio player for Windows — install and start listening to your favorite music.') +
      '</p>' +
      '<div class="render-download__tags">' +
      '<span class="render-download__tag">Windows 10/11</span>' +
      '<span class="render-download__tag">' +
      (ru ? 'Последняя версия' : 'Latest version') +
      '</span>' +
      '</div>' +
      '<a class="render-download__btn" href="' +
      downloadUrl +
      '" download="' +
      downloadFileName +
      '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>' +
      '<polyline points="7 10 12 15 17 10"></polyline>' +
      '<line x1="12" x2="12" y1="15" y2="3"></line>' +
      '</svg>' +
      (ru ? 'Скачать Render' : 'Download Render') +
      '</a>' +
      '<p class="render-download__note">' +
      (ru ? 'Установщик ~3 МБ' : 'Installer ~3 MB') +
      '</p>' +
      '</div>';

    return block;
  }

  function setupDownloadSection() {
    var pricing = document.getElementById('pricing');
    if (!pricing) return;

    var existing = document.getElementById('render-download-block');
    var block = buildDownloadSection();

    if (existing) {
      existing.replaceWith(block);
    } else {
      pricing.appendChild(block);
    }

    pricing.classList.add('render-download-ready');
  }

  function watchDownloadSection() {
    var pricing = document.getElementById('pricing');
    if (!pricing || typeof MutationObserver === 'undefined') return;

    var timer = null;
    var observer = new MutationObserver(function () {
      if (document.getElementById('render-download-block')) return;
      clearTimeout(timer);
      timer = setTimeout(setupDownloadSection, 100);
    });

    observer.observe(pricing, { childList: true });
  }

  function hideSections() {
    document.querySelectorAll('.footer-columns').forEach(function (el) {
      el.style.display = 'none';
    });

    document.querySelectorAll('.footer-social a').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      var text = a.textContent || '';
      if (/youtube/i.test(href) || /youtube/i.test(text)) {
        a.style.display = 'none';
      }
    });
  }

  function hideHelpExtras() {
    document.querySelectorAll('#help ul').forEach(function (ul) {
      ul.style.display = 'none';
    });

    document.querySelectorAll('#help a.faq-glass').forEach(function (a) {
      var text = a.textContent || '';
      if (/profile|профил/i.test(text)) {
        a.style.display = 'none';
      }
    });
  }

  function hideExploreButton() {
    document.querySelectorAll('section button[type="button"]').forEach(function (btn) {
      var text = (btn.textContent || '').replace(/\s+/g, ' ').trim();
      if (text === 'Explore' || text === 'Изучить') {
        btn.style.display = 'none';
      }
    });
  }

  function setupFeatureTileAnimations() {
    if (typeof IntersectionObserver === 'undefined') return;

    var cards = [];
    document.querySelectorAll('#features .relative').forEach(function (el) {
      if ((el.className || '').indexOf('312px') === -1) return;
      if (el.classList.contains('render-feature-card')) {
        cards.push(el);
        return;
      }
      el.classList.add('render-feature-card');
      cards.push(el);
    });

    cards.forEach(function (el, index) {
      el.style.setProperty('--feature-i', String(index));
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('render-feature-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    cards.forEach(function (el) {
      if (!el.classList.contains('render-feature-visible')) {
        observer.observe(el);
      }
    });
  }

  function fixVisibleText() {
    document.documentElement.classList.add('app-ready');

    document.querySelectorAll('.blur-reveal-char').forEach(function (el) {
      el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('filter', 'none', 'important');
      el.style.setProperty('transform', 'none', 'important');
      el.style.setProperty('animation', 'none', 'important');
    });

    document.querySelectorAll('.scroll-reveal').forEach(function (el) {
      el.classList.add('scroll-reveal-visible');
    });

    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('filter', 'none', 'important');
      el.style.setProperty('transform', 'none', 'important');
    });
  }

  function applyUnboundedFont() {
    document.querySelectorAll('[style*="font-family"], [style*="fontFamily"]').forEach(function (el) {
      el.style.setProperty('font-family', '"Unbounded", sans-serif', 'important');
    });
  }

  function fixFooterCopy() {
    var ru = isRussian();

    document.querySelectorAll('footer *').forEach(function (el) {
      if (el.children.length > 0) return;

      var text = (el.textContent || '').trim();
      if (!text) return;

      if (/Современный клиент Minecraft/i.test(text)) {
        el.textContent = ru
          ? 'Современный аудиоплеер. Чистый визуал, удобное управление и комфортное прослушивание.'
          : 'Modern audio player. Clean visuals, smooth controls and comfortable listening.';
      }

      if (/Modern Minecraft client/i.test(text)) {
        el.textContent =
          'Modern audio player. Clean visuals, smooth controls and comfortable listening.';
      }

      if (/Не связан с Mojang|Mojang or Microsoft/i.test(text)) {
        el.textContent = ru
          ? '© 2026 Render Music. Все права защищены.'
          : '© 2026 Render Music. All rights reserved.';
      }
    });
  }

  function removeLegacyBackground() {
    var bg = document.getElementById('render-ambient-bg');
    if (bg) bg.remove();
  }

  function run() {
    try {
      removeLegacyBackground();
      applyTheme(getSavedTheme());
      fixVisibleText();
      applyUnboundedFont();
      hideExploreButton();
      setupFeatureTileAnimations();
      hideNavItems();
      setupDownloadNav();
      hideAuthButtons();
      setupThemeToggle();
      setupHeroPreview();
      setupDownloadSection();
      hideSections();
      hideHelpExtras();
      fixFooterCopy();
    } catch (err) {
      console.warn('custom-assets:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  window.addEventListener('load', function () {
    setTimeout(run, 500);
    setTimeout(fixVisibleText, 700);
    setTimeout(fixVisibleText, 2000);
    setTimeout(applyUnboundedFont, 900);
    setTimeout(hideExploreButton, 600);
    setTimeout(setupFeatureTileAnimations, 900);
    setTimeout(setupFeatureTileAnimations, 2200);
    setTimeout(setupThemeToggle, 1200);
    setTimeout(setupThemeToggle, 2500);
  });

  if (typeof MutationObserver !== 'undefined') {
    var textFixTimer = null;
    var textObserver = new MutationObserver(function () {
      clearTimeout(textFixTimer);
      textFixTimer = setTimeout(function () {
        fixVisibleText();
        hideExploreButton();
        setupFeatureTileAnimations();
      }, 150);
    });
    textObserver.observe(document.body, { childList: true, subtree: true });
  }

  watchDownloadSection();
  watchHeroPreview();
  watchThemeToggle();
})();
