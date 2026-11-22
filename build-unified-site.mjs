import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const indexPath = path.join(root, 'index.html');
const backupPath = path.join(root, 'index-original.html');

if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(indexPath, backupPath);
}

const chapters = [
  { file: 'index-original.html', id: 'journey', label: 'Our Journey' },
  { file: 'promises.html', id: 'promises', label: 'Promises' },
  { file: 'qualities.html', id: 'qualities', label: 'Why I Love You' },
  { file: 'quranic-verses.html', id: 'verses', label: 'Quranic Verses' },
  { file: 'hadith-collection.html', id: 'hadith', label: 'Hadith' },
  { file: 'rights-duties.html', id: 'rights', label: 'Rights & Duties' },
  { file: 'love-letters.html', id: 'letters', label: 'Love Letters' },
  { file: 'dua-gallery.html', id: 'duas', label: 'Duas' },
  { file: 'timeline.html', id: 'timeline', label: 'Timeline' },
  { file: 'gallery.html', id: 'gallery', label: 'Memories' },
  { file: 'inspirations.html', id: 'inspirations', label: 'Inspirations' },
  { file: 'collection.html', id: 'collection', label: 'Collection' },
];

const linkMap = {
  'index.html': '#page-journey',
  'promises.html': '#page-promises',
  'qualities.html': '#page-qualities',
  'quranic-verses.html': '#page-verses',
  'hadith-collection.html': '#page-hadith',
  'rights-duties.html': '#page-rights',
  'love-letters.html': '#page-letters',
  'dua-gallery.html': '#page-duas',
  'timeline.html': '#page-timeline',
  'gallery.html': '#page-gallery',
  'inspirations.html': '#page-inspirations',
  'collection.html': '#page-collection',
};

function bodyContent(file) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const match = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!match) throw new Error(`No body found in ${file}`);

  let body = match[1]
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/\sdata-aos(?:-delay)?="[^"]*"/gi, '')
    .replace(/<footer\b([^>]*)>/gi, '<div class="chapter-footer"$1>')
    .replace(/<\/footer>/gi, '</div>')
    .replace(/\sid="(?:home|collection|features|footer)"/gi, '')
    .replace(/onclick="switchTab\('([^']+)'\)"/gi, 'data-tab-target="$1"')
    .replace(/onclick="document\.getElementById\('collection'\)\.scrollIntoView\(\{behavior: 'smooth'\}\)"/gi, 'data-scroll-to="page-journey"');

  for (const [from, to] of Object.entries(linkMap)) {
    body = body.replaceAll(`href="${from}"`, `href="${to}"`);
  }

  body = body
    .replace(/<p class="(arabic-verse|arabic-text|dua-text)"/g, '<p class="$1" lang="ar" dir="rtl"')
    .replace(/<h1 class="bismillah"/g, '<h1 class="bismillah" lang="ar" dir="rtl"')
    .replace(/<div class="dua-box">\s*<p>/g, '<div class="dua-box">\n                    <p lang="ar" dir="rtl">');

  body = body.replace(/<p([^>]*)>([^<]*[\u0600-\u06ff][^<]*)<\/p>/g, (full, attributes, text) => {
    if (/\blang="ar"/.test(attributes)) return full;
    return `<p${attributes} lang="ar" dir="rtl">${text}</p>`;
  });

  if (file === 'collection.html') {
    body = body
      .replace(/<!-- Main Collection -->[\s\S]*?(?=\s*<!-- Features -->)/, '')
      .replace(/<!-- Features -->[\s\S]*?(?=\s*<!-- Footer -->)/, '');
  }

  return body.trim();
}

const navLinks = chapters.map(({ id, label }) => `          <a href="#page-${id}">${label}</a>`).join('\n');
const chapterSections = chapters.map(({ file, id, label }, index) => `
      <section id="page-${id}" class="story-section story-section--${id}" aria-labelledby="chapter-${id}">
        <div class="chapter-marker" aria-hidden="true"><span></span><i>✦</i><span></span></div>
        <p class="chapter-kicker">Chapter ${String(index + 1).padStart(2, '0')}</p>
        <h2 id="chapter-${id}" class="sr-only">${label}</h2>
        <div class="chapter-shell">
${bodyContent(file)}
        </div>
      </section>`).join('\n');

const html = `<!DOCTYPE html>
<html lang="en" class="surprise-locked">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#6a0f24">
  <meta name="description" content="A first-year birthday keepsake filled with love, duas, Quranic reminders, and heartfelt promises.">
  <title>Happy Birthday Aiman — From Your Husband Usama</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='18' fill='%239b1b30'/%3E%3Cpath d='M42 13a22 22 0 1 0 8 39A24 24 0 1 1 42 13Z' fill='%23ffe5d1'/%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cormorant+Garamond:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body class="surprise-locked">
  <a class="skip-link" href="#main-content">Skip to the birthday story</a>
  <div class="reading-progress" aria-hidden="true"><span id="reading-progress-fill"></span></div>

  <header id="birthday-hero" class="birthday-hero">
    <canvas id="hero-particles" aria-hidden="true"></canvas>
    <div class="hero-glow hero-glow--one" aria-hidden="true"></div>
    <div class="hero-glow hero-glow--two" aria-hidden="true"></div>
    <div class="hero-pattern" aria-hidden="true"></div>
    <div class="hero-arch" aria-hidden="true"><span class="arch-star">✦</span></div>
    <div id="petal-field" class="petal-field" aria-hidden="true"></div>
    <div id="celebration-rain" class="celebration-rain" aria-hidden="true"></div>
    <div id="music-beat-stage" class="music-beat-stage" aria-hidden="true"></div>
    <button id="birthday-music-toggle" class="music-toggle" type="button" hidden aria-pressed="false" aria-label="Mute birthday tune">
      <span class="music-icon music-equalizer" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="music-label">Birthday tune</span>
    </button>
    <!-- Add src="assets/your-song.mp3" to use an optional audio file instead of Web Audio. -->
    <audio id="birthday-audio-fallback" preload="none"></audio>

    <div id="surprise-intro" class="surprise-intro">
      <div class="intro-glass">
        <svg class="intro-crescent" viewBox="0 0 64 64" aria-hidden="true"><path d="M45 8c-13 4-21 18-16 31 4 11 15 17 26 14-6 5-13 8-21 7C18 58 7 44 9 28 11 14 24 4 38 4c3 0 5 1 7 1Z" fill="currentColor"/><path d="M48 18l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7L48 18Z" fill="currentColor" opacity=".72"/></svg>
        <p class="intro-bismillah" lang="ar" dir="rtl">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
        <div class="intro-rule" aria-hidden="true"><span></span><i>✦</i><span></span></div>
        <p class="intro-dedication">To My Beautiful Beloved Wife</p>
        <button id="open-surprise" class="surprise-open-button" type="button"><span>Tap to begin</span></button>
      </div>
    </div>

    <div id="surprise-reveal" class="hero-content surprise-reveal" aria-hidden="true" tabindex="-1">
      <p class="hero-reveal-eyebrow">A celebration made with love &amp; dua to my beloved wife</p>

      <div class="emblem-scene" id="emblem-scene">
        <div class="emblem" id="birthday-emblem">
          <svg class="hero-illustration hero-illustration--left" viewBox="0 0 180 320" aria-hidden="true">
            <defs><linearGradient id="balloonRose" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffd7e3"/><stop offset="1" stop-color="#b51f5b"/></linearGradient><linearGradient id="balloonGold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff2c8"/><stop offset="1" stop-color="#d49a49"/></linearGradient></defs>
            <g class="svg-balloon svg-balloon--one"><ellipse cx="64" cy="72" rx="37" ry="48" fill="url(#balloonRose)"/><path d="M60 120l4 8 5-8" fill="#b51f5b"/><path d="M64 128c-10 42 16 61 0 119" fill="none" stroke="#f6d3a0" stroke-width="2"/></g>
            <g class="svg-balloon svg-balloon--two"><ellipse cx="126" cy="116" rx="31" ry="41" fill="url(#balloonGold)"/><path d="M122 157l4 7 5-7" fill="#d49a49"/><path d="M126 164c9 36-17 59-4 110" fill="none" stroke="#f6d3a0" stroke-width="2"/></g>
            <path class="svg-star" d="M142 35l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1 3-7Z" fill="#f4d39f"/>
          </svg>
          <svg class="hero-illustration hero-illustration--right" viewBox="0 0 180 320" aria-hidden="true">
            <g class="svg-lantern"><path d="M65 61h50l-6 18H71l-6-18Z" fill="#e6c27a"/><path d="M74 79h32l10 82-26 25-26-25 10-82Z" fill="rgba(255,234,186,.18)" stroke="#e6c27a" stroke-width="4"/><path d="M90 83v96M67 128h46" stroke="#e6c27a" stroke-width="3"/><circle cx="90" cy="128" r="18" fill="#ffd99b" opacity=".48"/><path d="M82 59c0-14 16-14 16 0" fill="none" stroke="#e6c27a" stroke-width="4"/></g>
            <path class="svg-star" d="M42 48l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1 3-7Z" fill="#f4d39f"/><path class="svg-star svg-star--small" d="M136 202l2 5 6 1-4 4 1 6-5-3-5 3 1-6-4-4 6-1 2-5Z" fill="#f7b7ca"/>
          </svg>
          <h1 class="birthday-logo" aria-label="Happy Birthday">
            <span class="birthday-word" aria-hidden="true">Happy</span>
            <span class="birthday-word" aria-hidden="true">Birthday</span>
          </h1>
          <p class="hero-dedication">To my beloved wife <strong>Aiman</strong><span class="name-underline" aria-hidden="true"></span></p>
          <div class="emblem-flourish" aria-hidden="true"><span></span><i>◆</i><span></span></div>
        </div>
      </div>

      <p class="from-husband">From your husband, <strong>Usama</strong></p>
      <div class="occasion-details" aria-label="Birthday details">
        <time datetime="2026-11-23">23 November 2026</time>
        <span class="detail-separator" aria-hidden="true"></span>
        <span class="milestone-badge">Our First Year</span>
      </div>
      <a class="hero-cta magnetic-button" href="#page-journey"><span>Begin Our Story</span></a>
      <p class="scroll-hint" aria-hidden="true"><span></span> A keepsake made with dua &amp; love</p>
    </div>
    <div id="story-transition" class="story-transition" aria-hidden="true"><i></i><i></i><i></i></div>
  </header>
  <noscript><style>html.surprise-locked,body.surprise-locked{overflow:auto}.surprise-intro{display:none}.surprise-reveal{opacity:1;visibility:visible;transform:none}</style></noscript>

  <nav class="story-nav" aria-label="Birthday story navigation">
    <a class="nav-brand" href="#birthday-hero" aria-label="Back to the birthday opening"><span>HB</span><b>23 · 11 · 26</b></a>
    <div class="nav-featured" aria-label="Featured chapters">
      <a href="#page-journey">Journey</a>
      <a href="#page-promises">Promises</a>
      <a href="#page-verses">Verses</a>
      <a href="#page-letters">Letters</a>
      <a href="#page-duas">Duas</a>
    </div>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="chapter-menu">
      <span class="nav-toggle-label">Chapters</span><span class="nav-toggle-icon" aria-hidden="true"><i></i><i></i></span>
    </button>
    <div id="chapter-menu" class="chapter-menu" aria-hidden="true">
      <div class="chapter-menu-inner">
        <p>Explore the keepsake</p>
${navLinks}
      </div>
    </div>
  </nav>

  <main id="main-content">
${chapterSections}
  </main>

  <section id="first-year" class="milestone-section" aria-labelledby="milestone-title">
    <div class="milestone-inner">
      <p class="section-eyebrow">Since 30 January 2025</p>
      <h2 id="milestone-title">Our First Year, Written in Moments</h2>
      <div class="year-ring" id="year-ring" aria-hidden="true"><span></span></div>
      <div class="time-counter" aria-label="Time since our first birthday year began">
        <div><strong id="counter-days">0</strong><span>Days</span></div>
        <div><strong id="counter-hours">0</strong><span>Hours</span></div>
        <div><strong id="counter-minutes">0</strong><span>Minutes</span></div>
      </div>
      <p class="milestone-copy">Every ordinary day became precious because I lived it with you.</p>
    </div>
  </section>

  <section id="cake-surprise" class="cake-surprise" aria-labelledby="cake-title">
    <div id="cake-confetti" class="cake-confetti" aria-hidden="true"></div>
    <div class="cake-inner">
      <p class="section-eyebrow">One last little surprise</p>
      <h2 id="cake-title">Make a Birthday Wish</h2>
      <div class="cake-stage" aria-hidden="true">
        <svg class="birthday-cake" viewBox="0 0 420 390">
          <defs><linearGradient id="cakeIcing" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff8f0"/><stop offset="1" stop-color="#f8c8d8"/></linearGradient><linearGradient id="cakeBody" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d84d7c"/><stop offset="1" stop-color="#7d1648"/></linearGradient></defs>
          <ellipse cx="210" cy="340" rx="158" ry="23" fill="#2b0920" opacity=".28"/>
          <rect x="80" y="190" width="260" height="140" rx="30" fill="url(#cakeBody)" stroke="#e6c27a" stroke-width="4"/>
          <path d="M82 220c34 30 48-25 78 2s52-25 82 1 54-24 96-3v-42H82v42Z" fill="url(#cakeIcing)"/>
          <ellipse cx="210" cy="185" rx="130" ry="35" fill="#fff6ee" stroke="#e6c27a" stroke-width="4"/>
          <g class="cake-candle cake-candle--one"><rect x="139" y="108" width="18" height="73" rx="8" fill="#f0bdca"/><path class="candle-flame" d="M148 103c-19-18 4-34 1-49 20 20 19 35-1 49Z" fill="#ffd270"/></g>
          <g class="cake-candle cake-candle--two"><rect x="201" y="92" width="18" height="89" rx="8" fill="#e6c27a"/><path class="candle-flame" d="M210 87c-19-18 4-34 1-49 20 20 19 35-1 49Z" fill="#ffd270"/></g>
          <g class="cake-candle cake-candle--three"><rect x="263" y="108" width="18" height="73" rx="8" fill="#f0bdca"/><path class="candle-flame" d="M272 103c-19-18 4-34 1-49 20 20 19 35-1 49Z" fill="#ffd270"/></g>
          <g class="cake-smoke" fill="none" stroke="#fff6ee" stroke-width="4" stroke-linecap="round"><path d="M148 95c-18-18 18-23 0-44"/><path d="M210 80c-18-18 18-23 0-44"/><path d="M272 95c-18-18 18-23 0-44"/></g>
          <path d="M135 270c45 30 105 30 150 0" fill="none" stroke="#e6c27a" stroke-width="5" stroke-linecap="round"/>
          <circle cx="157" cy="252" r="7" fill="#f8c8d8"/><circle cx="210" cy="266" r="7" fill="#f8c8d8"/><circle cx="263" cy="252" r="7" fill="#f8c8d8"/>
        </svg>
      </div>
      <button id="make-wish" class="wish-button magnetic-button" type="button"><span>Make a wish</span></button>
      <p id="final-birthday-message" class="final-birthday-message" aria-live="polite">Happy Birthday, my love. Forever yours, Usama.</p>
    </div>
  </section>

  <footer class="site-footer" id="closing-dua">
    <div class="footer-crescent" aria-hidden="true">☾</div>
    <p class="footer-eyebrow">A prayer for the year ahead</p>
    <p class="footer-arabic" lang="ar" dir="rtl">بَارَكَ اللَّهُ لَكِ فِي عُمْرِكِ وَمَلَأَ أَيَّامَكِ خَيْرًا وَسَكِينَةً</p>
    <p class="footer-translation">May Allah bless your life and fill your days with goodness and tranquility.</p>
    <div class="footer-rule" aria-hidden="true"><span></span><i>✦</i><span></span></div>
    <p class="footer-signoff">For my beloved wife Aiman — with love, gratitude, and dua.</p>
    <p class="footer-date">23 November 2026 · Our First Year</p>
    <p class="footer-from">From your husband, Usama</p>
  </footer>

  <button id="back-to-top" class="back-to-top" type="button" aria-label="Back to the top"><span aria-hidden="true">⌃</span></button>
  <div id="cursor-trail" class="cursor-trail" aria-hidden="true"></div>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js" defer></script>
  <script src="script.js" defer></script>
</body>
</html>
`;

fs.writeFileSync(indexPath, html);
console.log(`Built ${indexPath} with ${chapters.length} preserved chapters.`);
