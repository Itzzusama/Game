(() => {
  "use strict";

  const doc = document;
  const hero = doc.getElementById("birthday-hero");
  const surpriseIntro = doc.getElementById("surprise-intro");
  const surpriseReveal = doc.getElementById("surprise-reveal");
  const openSurprise = doc.getElementById("open-surprise");
  const celebrationRain = doc.getElementById("celebration-rain");
  const musicBeatStage = doc.getElementById("music-beat-stage");
  const musicToggle = doc.getElementById("birthday-music-toggle");
  const musicLabel = musicToggle?.querySelector(".music-label");
  const audioFallback = doc.getElementById("birthday-audio-fallback");
  const storyTransition = doc.getElementById("story-transition");
  const yearRing = doc.getElementById("year-ring");
  const counterDays = doc.getElementById("counter-days");
  const counterHours = doc.getElementById("counter-hours");
  const counterMinutes = doc.getElementById("counter-minutes");
  const cakeSection = doc.getElementById("cake-surprise");
  const makeWishButton = doc.getElementById("make-wish");
  const cakeConfetti = doc.getElementById("cake-confetti");
  const cursorTrail = doc.getElementById("cursor-trail");
  const canvas = doc.getElementById("hero-particles");
  const petalField = doc.getElementById("petal-field");
  const progressFill = doc.getElementById("reading-progress-fill");
  const backToTop = doc.getElementById("back-to-top");
  const navToggle = doc.querySelector(".nav-toggle");
  const chapterMenu = doc.getElementById("chapter-menu");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  let heroVisible = true;
  let animationFrame = 0;
  let ticking = false;
  let surpriseOpened = false;
  let startHeroAnimation = () => {};
  let audioContext = null;
  let musicMaster = null;
  let musicToneBus = null;
  let tuneEndTimer = 0;
  let tunePlaying = false;
  let musicMuted = false;
  let musicVisualTimers = [];
  let usingAudioFallback = false;


  const birthdayMelody = [
    ["G4", .5], ["G4", .5], ["A4", 1], ["G4", 1], ["C5", 1], ["B4", 2],
    ["G4", .5], ["G4", .5], ["A4", 1], ["G4", 1], ["D5", 1], ["C5", 2],
    ["G4", .5], ["G4", .5], ["G5", 1], ["E5", 1], ["C5", 1], ["B4", 1], ["A4", 2],
    ["F5", .5], ["F5", .5], ["E5", 1], ["C5", 1], ["D5", 1], ["C5", 2]
  ];
  const noteFrequencies = {
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196,
    C4: 261.63, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, C6: 1046.5
  };

  const birthdayHarmony = [
    { beat: 0, length: 3, notes: ["C4", "E4", "G4"], bass: "C3" },
    { beat: 3, length: 3, notes: ["G4", "B4", "D5"], bass: "G3" },
    { beat: 6, length: 3, notes: ["G4", "B4", "D5"], bass: "G3" },
    { beat: 9, length: 3, notes: ["C4", "E4", "G4"], bass: "C3" },
    { beat: 12, length: 3, notes: ["C4", "E4", "G4"], bass: "C3" },
    { beat: 15, length: 2, notes: ["F4", "A4", "C5"], bass: "F3" },
    { beat: 17, length: 2, notes: ["C4", "E4", "G4"], bass: "C3" },
    { beat: 19, length: 3, notes: ["F4", "A4", "C5"], bass: "F3" },
    { beat: 22, length: 3, notes: ["C4", "E4", "G4"], bass: "C3" }
  ];

  const updateMusicControl = (state) => {
    if (!musicToggle || !musicLabel) return;
    musicToggle.hidden = false;
    musicToggle.classList.toggle("is-playing", state === "playing");
    musicToggle.classList.toggle("is-muted", state === "muted");
    musicToggle.setAttribute("aria-pressed", String(state === "muted"));
    musicToggle.setAttribute("aria-label",
      state === "ended" ? "Replay birthday tune" :
      state === "muted" ? "Unmute birthday tune" : "Mute birthday tune");
    musicLabel.textContent =
      state === "ended" ? "Replay tune" :
      state === "muted" ? "Tune muted" : "Birthday tune";
  };

  const scheduleBirthdayNote = (frequency, start, duration) => {
    if (!audioContext || !musicToneBus) return;
    const voices = [
      { type: "sine", frequency, volume: .082, attack: .004, release: .9 },
      { type: "sine", frequency: frequency * 2.01, volume: .024, attack: .003, release: .58 },
      { type: "triangle", frequency: frequency / 2, volume: .016, attack: .008, release: .82 }
    ];

    voices.forEach((voice, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = voice.type;
      oscillator.frequency.setValueAtTime(voice.frequency, start);
      if (index === 1) oscillator.detune.setValueAtTime(2, start);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(voice.volume, start + voice.attack);
      gain.gain.exponentialRampToValueAtTime(.0001, start + Math.max(.1, duration * voice.release));
      oscillator.connect(gain);
      gain.connect(musicToneBus);
      oscillator.start(start);
      oscillator.stop(start + duration);
    });
  };

  const clearMusicVisuals = () => {
    musicVisualTimers.forEach((timer) => window.clearTimeout(timer));
    musicVisualTimers = [];
    musicBeatStage?.replaceChildren();
  };

  const triggerBeatVisual = (beatIndex) => {
    if (!hero || !musicBeatStage || reducedMotion.matches) return;
    const positions = [[18,30],[80,26],[28,65],[72,62],[49,18],[12,54],[88,48],[50,72]];
    const colors = ["#ffd8a8", "#ff8fb6", "#fff4df", "#ef6f9e", "#f6c3d4", "#d9b7ff"];
    const phraseBeat = [0, 6, 12, 19, 24].includes(beatIndex);
    const [x, y] = positions[beatIndex % positions.length];
    const effect = doc.createElement("div");
    const useEmoji = !phraseBeat && beatIndex % 3 === 2;
    effect.className = `beat-effect ${phraseBeat ? "beat-effect--firework" : useEmoji ? "beat-effect--emoji" : "beat-effect--spark"}`;
    effect.style.setProperty("--beat-x", `${x}%`);
    effect.style.setProperty("--beat-y", `${y}%`);
    effect.style.setProperty("--beat-color", colors[beatIndex % colors.length]);

    if (useEmoji) {
      const symbol = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
      symbol.setAttribute("viewBox", "0 0 64 64");
      symbol.setAttribute("class", "beat-symbol");
      symbol.innerHTML = beatIndex % 2
        ? '<path d="M32 54S9 42 9 23c0-13 17-18 23-6 6-12 23-7 23 6 0 19-23 31-23 31Z" fill="currentColor"/>'
        : '<path d="M32 5l6 19 20-1-16 12 8 19-18-11-18 11 8-19L6 23l20 1 6-19Z" fill="currentColor"/>';
      effect.appendChild(symbol);
    } else {
      const particleCount = phraseBeat ? 12 : 8;
      for (let index = 0; index < particleCount; index += 1) {
        const particle = doc.createElement("i");
        particle.style.setProperty("--particle-angle", `${index * (360 / particleCount)}deg`);
        effect.appendChild(particle);
      }
    }

    musicBeatStage.appendChild(effect);
    window.setTimeout(() => effect.remove(), phraseBeat ? 1150 : 900);
  };

  const scheduleBeatVisuals = (songStart, beat, beatCount) => {
    if (!audioContext || reducedMotion.matches) return;
    for (let beatIndex = 0; beatIndex < beatCount; beatIndex += 1) {
      const delay = Math.max(0, (songStart - audioContext.currentTime + beatIndex * beat) * 1000);
      const timer = window.setTimeout(() => triggerBeatVisual(beatIndex, beatIndex % 3 === 0), delay);
      musicVisualTimers.push(timer);
    }
  };

  const scheduleWarmChord = (notes, bass, start, duration) => {
    if (!audioContext || !musicToneBus) return;
    notes.forEach((note, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = index === 1 ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(noteFrequencies[note], start);
      oscillator.detune.setValueAtTime((index - 1) * 3, start);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(.013, start + .18);
      gain.gain.setValueAtTime(.013, start + Math.max(.19, duration - .3));
      gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(musicToneBus);
      oscillator.start(start);
      oscillator.stop(start + duration + .02);
    });

    const bassOscillator = audioContext.createOscillator();
    const bassGain = audioContext.createGain();
    bassOscillator.type = "sine";
    bassOscillator.frequency.setValueAtTime(noteFrequencies[bass], start);
    bassGain.gain.setValueAtTime(.0001, start);
    bassGain.gain.exponentialRampToValueAtTime(.026, start + .08);
    bassGain.gain.exponentialRampToValueAtTime(.0001, start + Math.min(duration, .82));
    bassOscillator.connect(bassGain);
    bassGain.connect(musicMaster);
    bassOscillator.start(start);
    bassOscillator.stop(start + Math.min(duration, .86));
  };

  const playBirthdayTune = () => {
    const fallbackSource = audioFallback?.getAttribute("src");
    if (fallbackSource) {
      window.clearTimeout(tuneEndTimer);
      clearMusicVisuals();
      usingAudioFallback = true;
      audioFallback.currentTime = 0;
      audioFallback.volume = 0;
      audioFallback.muted = false;
      audioFallback.play().catch(() => {});
      const fadeStarted = performance.now();
      const fadeIn = (time) => {
        if (!usingAudioFallback || !audioFallback) return;
        audioFallback.volume = Math.min(.72, ((time - fadeStarted) / 900) * .72);
        if (audioFallback.volume < .72) window.requestAnimationFrame(fadeIn);
      };
      window.requestAnimationFrame(fadeIn);
      for (let beatIndex = 0; beatIndex < 25; beatIndex += 1) {
        musicVisualTimers.push(window.setTimeout(() => triggerBeatVisual(beatIndex, beatIndex % 3 === 0), beatIndex * 540));
      }
      tunePlaying = true;
      musicMuted = false;
      updateMusicControl("playing");
      audioFallback.onended = () => {
        tunePlaying = false;
        updateMusicControl("ended");
      };
      return true;
    }

    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) return false;
    window.clearTimeout(tuneEndTimer);
    clearMusicVisuals();
    if (audioContext && audioContext.state !== "closed") audioContext.close().catch(() => {});

    audioContext = new AudioEngine();
    usingAudioFallback = false;
    audioContext.resume().catch(() => {});
    musicMaster = audioContext.createGain();
    const compressor = audioContext.createDynamicsCompressor();
    const toneFilter = audioContext.createBiquadFilter();
    const roomDelay = audioContext.createDelay(.6);
    const roomFeedback = audioContext.createGain();
    musicToneBus = audioContext.createGain();
    toneFilter.type = "lowpass";
    toneFilter.frequency.value = 4800;
    roomDelay.delayTime.value = .17;
    roomFeedback.gain.value = .065;
    musicMaster.gain.setValueAtTime(.72, audioContext.currentTime);
    musicToneBus.connect(toneFilter);
    toneFilter.connect(musicMaster);
    musicToneBus.connect(roomDelay);
    roomDelay.connect(roomFeedback);
    roomFeedback.connect(roomDelay);
    roomDelay.connect(musicMaster);
    musicMaster.connect(compressor);
    compressor.connect(audioContext.destination);

    const beat = .54;
    const songStart = audioContext.currentTime + .14;
    scheduleBeatVisuals(songStart, beat, 25);

    birthdayHarmony.forEach(({ beat: beatOffset, length, notes, bass }) => {
      scheduleWarmChord(notes, bass, songStart + beatOffset * beat, length * beat);
    });
    let cursor = songStart;
    birthdayMelody.forEach(([note, units]) => {
      const duration = units * beat;
      scheduleBirthdayNote(noteFrequencies[note], cursor, Math.max(.3, duration * .96));
      cursor += duration;
    });

    scheduleWarmChord(["C4", "E4", "G4"], "C3", cursor, 1.35);
    scheduleBirthdayNote(noteFrequencies.C5, cursor, 1.1);
    musicMaster.gain.setValueAtTime(.72, cursor + .45);
    musicMaster.gain.exponentialRampToValueAtTime(.0001, cursor + 1.4);
    tunePlaying = true;
    musicMuted = false;
    updateMusicControl("playing");
    tuneEndTimer = window.setTimeout(() => {
      tunePlaying = false;
      updateMusicControl("ended");
      audioContext?.close().catch(() => {});
    }, Math.max(0, (cursor - audioContext.currentTime + 1.55) * 1000));
    return true;
  };

  musicToggle?.addEventListener("click", () => {
    if (usingAudioFallback && audioFallback) {
      if (audioFallback.ended || audioFallback.paused) {
        playBirthdayTune();
        return;
      }
      musicMuted = !musicMuted;
      audioFallback.muted = musicMuted;
      updateMusicControl(musicMuted ? "muted" : "playing");
      return;
    }
    if (!tunePlaying || !audioContext || audioContext.state === "closed") {
      playBirthdayTune();
      return;
    }
    musicMuted = !musicMuted;
    musicMaster?.gain.setTargetAtTime(musicMuted ? .0001 : .72, audioContext.currentTime, .05);
    updateMusicControl(musicMuted ? "muted" : "playing");
  });

  const launchCelebration = () => {
    if (!celebrationRain || reducedMotion.matches) return;
    celebrationRain.replaceChildren();
    const symbols = ["♥", "♥", "✿", "❀", "♥", "✦"];
    const colors = ["#ffd4e2", "#ff91b5", "#fff0df", "#f35f91", "#f7b9cd", "#e7aa82"];
    const fragment = doc.createDocumentFragment();
    const count = window.innerWidth < 768 ? 34 : 56;

    for (let index = 0; index < count; index += 1) {
      const piece = doc.createElement("span");
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      piece.className = `celebration-piece ${symbol === "♥" ? "is-heart" : "is-flower"}`;
      piece.textContent = symbol;
      piece.style.setProperty("--left", `${Math.random() * 100}%`);
      piece.style.setProperty("--piece-size", `${12 + Math.random() * 22}px`);
      piece.style.setProperty("--piece-color", colors[Math.floor(Math.random() * colors.length)]);
      piece.style.setProperty("--fall-time", `${5.5 + Math.random() * 4}s`);
      piece.style.setProperty("--fall-delay", `${Math.random() * 1.8}s`);
      piece.style.setProperty("--fall-drift", `${-100 + Math.random() * 200}px`);
      piece.style.setProperty("--fall-spin", `${-540 + Math.random() * 1080}deg`);
      fragment.appendChild(piece);
    }
    celebrationRain.appendChild(fragment);
    window.setTimeout(() => celebrationRain.replaceChildren(), 11200);
  };

  const revealBirthdaySurprise = () => {
    if (surpriseOpened || !hero) return;
    surpriseOpened = true;
    openSurprise.disabled = true;
    hero.classList.add("is-opening");
    playBirthdayTune();

    window.setTimeout(() => {
      hero.classList.add("is-revealed");
      surpriseIntro?.setAttribute("aria-hidden", "true");
      surpriseReveal?.setAttribute("aria-hidden", "false");
      doc.documentElement.classList.remove("surprise-locked");
      doc.body.classList.remove("surprise-locked");
      startHeroAnimation();
      launchCelebration();
      surpriseReveal?.focus({ preventScroll: true });
    }, reducedMotion.matches ? 20 : 520);
  };

  openSurprise?.addEventListener("click", revealBirthdaySurprise);
  window.addEventListener("pagehide", () => {
    window.clearTimeout(tuneEndTimer);
    clearMusicVisuals();
    if (audioFallback) audioFallback.pause();
    audioContext?.close().catch(() => {});
  });

  const updateScrollUI = () => {
    const scrollable = Math.max(1, doc.documentElement.scrollHeight - window.innerHeight);
    progressFill.style.width = `${Math.min(1, Math.max(0, window.scrollY / scrollable)) * 100}%`;
    backToTop.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.7);
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateScrollUI);
    }
  }, { passive: true });
  window.addEventListener("resize", updateScrollUI, { passive: true });
  updateScrollUI();

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
  });

  const setMenu = (open) => {
    navToggle.setAttribute("aria-expanded", String(open));
    chapterMenu.setAttribute("aria-hidden", String(!open));
    chapterMenu.classList.toggle("is-open", open);
    doc.body.classList.toggle("menu-open", open && window.innerWidth < 768);
  };

  navToggle.addEventListener("click", () => setMenu(navToggle.getAttribute("aria-expanded") !== "true"));
  chapterMenu.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  doc.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      navToggle.focus();
    }
  });
  doc.addEventListener("click", (event) => {
    if (navToggle.getAttribute("aria-expanded") === "true" &&
        !chapterMenu.contains(event.target) && !navToggle.contains(event.target)) setMenu(false);
  });

  doc.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const selector = anchor.getAttribute("href");
      if (!selector || selector === "#") return;
      const target = doc.querySelector(selector);
      if (!target) return;
      event.preventDefault();
      if (anchor.classList.contains("hero-cta") && storyTransition && window.gsap && !reducedMotion.matches) {
        storyTransition.classList.add("is-active");
        const curtains = storyTransition.querySelectorAll("i");
        window.gsap.set(curtains, { yPercent: 105 });
        window.gsap.timeline({
          onComplete: () => storyTransition.classList.remove("is-active")
        })
          .to(curtains, { yPercent: 0, duration: .65, stagger: .08, ease: "power3.inOut" })
          .add(() => target.scrollIntoView({ behavior: "auto", block: "start" }))
          .to(curtains, { yPercent: -105, duration: .72, stagger: .06, ease: "power3.inOut" }, "+=.12");
      } else {
        target.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
      }
      if (window.history && history.replaceState) history.replaceState(null, "", selector);
    });
  });

  // Refined magnetic movement and a restrained click ripple.
  if (finePointer.matches && !reducedMotion.matches) {
    doc.querySelectorAll(".magnetic-button").forEach((button) => {
      button.addEventListener("pointermove", (event) => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * .16;
        const y = (event.clientY - rect.top - rect.height / 2) * .2;
        button.style.transform = `translate3d(${x}px,${y}px,0)`;
      });
      button.addEventListener("pointerleave", () => { button.style.transform = ""; });
    });
  }
  doc.querySelectorAll(".magnetic-button").forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.remove("is-rippling");
      void button.offsetWidth;
      button.classList.add("is-rippling");
      window.setTimeout(() => button.classList.remove("is-rippling"), 700);
    });
  });

  doc.querySelectorAll("[data-scroll-to]").forEach((button) => {
    button.addEventListener("click", () => {
      doc.getElementById(button.dataset.scrollTo)?.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
    });
  });

  const letterSection = doc.getElementById("page-letters");
  const tabButtons = letterSection ? [...letterSection.querySelectorAll(".tab-btn")] : [];
  const tabPanels = letterSection ? [...letterSection.querySelectorAll(".tab-content")] : [];
  const activateLetter = (tabId, moveFocus = false) => {
    tabButtons.forEach((button) => {
      const active = button.dataset.tabTarget === tabId;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && moveFocus) button.focus();
    });
    tabPanels.forEach((panel) => {
      const active = panel.id === tabId;
      panel.classList.toggle("active", active);
      panel.hidden = !active;
    });
  };

  tabButtons.forEach((button, index) => {
    const inlineTarget = button.getAttribute("onclick")?.match(/'([^']+)'/)?.[1];
    const tabId = inlineTarget || tabPanels[index]?.id;
    button.removeAttribute("onclick");
    button.dataset.tabTarget = tabId;
    button.id = `letter-tab-${index + 1}`;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", tabId);
    button.addEventListener("click", () => activateLetter(tabId));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "ArrowRight") next = (index + 1) % tabButtons.length;
      if (event.key === "ArrowLeft") next = (index - 1 + tabButtons.length) % tabButtons.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabButtons.length - 1;
      activateLetter(tabButtons[next].dataset.tabTarget, true);
    });
  });
  tabPanels.forEach((panel, index) => {
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", `letter-tab-${index + 1}`);
  });
  if (tabButtons.length) {
    tabButtons[0].parentElement.setAttribute("role", "tablist");
    tabButtons[0].parentElement.setAttribute("aria-label", "Love letters");
    activateLetter(tabButtons.find((button) => button.classList.contains("active"))?.dataset.tabTarget || tabButtons[0].dataset.tabTarget);
  }

  // Reading content stays painted as the viewport moves between chapters.

  if ("IntersectionObserver" in window) {
    const featuredLinks = [...doc.querySelectorAll(".nav-featured a")];
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        featuredLinks.forEach((link) => {
          link.toggleAttribute("aria-current", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    doc.querySelectorAll(".story-section").forEach((section) => sectionObserver.observe(section));
  }


  // Replace legacy emoji glyphs with a consistent custom SVG icon family.
  const luxuryIconPaths = [
    '<path d="M32 54S9 42 9 23c0-13 17-18 23-6 6-12 23-7 23 6 0 19-23 31-23 31Z" fill="none" stroke="currentColor" stroke-width="3"/>',
    '<path d="M32 6l6 18 19 1-15 11 5 19-15-10-15 10 5-19L7 25l19-1 6-18Z" fill="none" stroke="currentColor" stroke-width="3"/>',
    '<path d="M49 10c-14 3-22 17-17 30 4 10 14 16 25 13-7 6-17 8-26 4C17 51 11 35 18 22 24 11 37 6 49 10Z" fill="none" stroke="currentColor" stroke-width="3"/>',
    '<path d="M12 31l20-17 20 17v23H12V31Zm12 23V39h16v15" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>',
    '<path d="M12 43c9-10 15-13 20-7 5-6 11-3 20 7M18 29c3-8 10-10 14-3 4-7 11-5 14 3" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>'
  ];
  doc.querySelectorAll(".icon, .quality-icon, .right-icon, .dua-icon, .timeline-emoji, .inspiration-icon, .feature-icon, .page-icon, .memory-image, .photo-placeholder").forEach((icon, index) => {
    const originalLabel = icon.textContent.trim();
    icon.setAttribute("aria-label", originalLabel || "Decorative keepsake icon");
    icon.innerHTML = `<svg class="luxury-icon" viewBox="0 0 64 64" aria-hidden="true">${luxuryIconPaths[index % luxuryIconPaths.length]}</svg>`;
  });
  const emojiWalker = doc.createTreeWalker(doc.getElementById("main-content"), NodeFilter.SHOW_TEXT);
  const emojiTextNodes = [];
  while (emojiWalker.nextNode()) emojiTextNodes.push(emojiWalker.currentNode);
  emojiTextNodes.forEach((node) => {
    node.nodeValue = node.nodeValue.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "").replace(/\s{2,}/g, " ");
  });

  // Live first-year counter. Change this date to customize the anniversary start.
  const firstYearStart = new Date("2025-01-30T00:00:00+05:00");
  const updateFirstYearCounter = () => {
    if (!counterDays || !counterHours || !counterMinutes || !yearRing) return;
    const elapsed = Math.max(0, Date.now() - firstYearStart.getTime());
    const totalMinutes = Math.floor(elapsed / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    counterDays.textContent = String(days);
    counterHours.textContent = String(hours).padStart(2, "0");
    counterMinutes.textContent = String(minutes).padStart(2, "0");
    const yearProgress = Math.min(1, elapsed / (365 * 24 * 60 * 60 * 1000));
    yearRing.style.setProperty("--year-progress", `${yearProgress * 360}deg`);
  };
  updateFirstYearCounter();
  window.setInterval(updateFirstYearCounter, 60000);

  const launchCakeCelebration = () => {
    if (!cakeConfetti || reducedMotion.matches) return;
    cakeConfetti.replaceChildren();
    const colors = ["#e6c27a", "#f8c8d8", "#fff6ee", "#c2185b", "#d9769b"];
    const fragment = doc.createDocumentFragment();
    const count = window.innerWidth < 768 ? 44 : 76;
    for (let index = 0; index < count; index += 1) {
      const particle = doc.createElement("i");
      const angle = Math.random() * Math.PI * 2;
      const distance = 150 + Math.random() * (window.innerWidth < 768 ? 260 : 430);
      particle.style.setProperty("--x", `${42 + Math.random() * 16}%`);
      particle.style.setProperty("--size", `${5 + Math.random() * 10}px`);
      particle.style.setProperty("--color", colors[index % colors.length]);
      particle.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
      particle.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
      particle.style.setProperty("--spin", `${-480 + Math.random() * 960}deg`);
      particle.style.setProperty("--duration", `${1.4 + Math.random() * 1.2}s`);
      fragment.appendChild(particle);
    }
    cakeConfetti.appendChild(fragment);
    window.setTimeout(() => cakeConfetti.replaceChildren(), 3000);
  };

  makeWishButton?.addEventListener("click", () => {
    if (cakeSection?.classList.contains("is-wished")) return;
    cakeSection?.classList.add("is-wished");
    makeWishButton.disabled = true;
    makeWishButton.querySelector("span").textContent = "Wish made";
    launchCakeCelebration();
  });

  // Lightweight sparkle cursor for precise pointers only.
  if (cursorTrail && finePointer.matches && !reducedMotion.matches) {
    let lastSpark = 0;
    window.addEventListener("pointermove", (event) => {
      const now = performance.now();
      if (now - lastSpark < 55) return;
      lastSpark = now;
      const spark = doc.createElement("i");
      spark.className = "cursor-spark";
      spark.style.left = `${event.clientX}px`;
      spark.style.top = `${event.clientY}px`;
      cursorTrail.appendChild(spark);
      window.setTimeout(() => spark.remove(), 760);
    }, { passive: true });
  }

  if (petalField && !reducedMotion.matches) {
    const fragment = doc.createDocumentFragment();
    const petalCount = window.innerWidth < 768 ? 10 : 16;
    for (let i = 0; i < petalCount; i += 1) {
      const petal = doc.createElement("i");
      petal.className = "petal";
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.setProperty("--size", `${8 + Math.random() * 11}px`);
      petal.style.setProperty("--duration", `${10 + Math.random() * 10}s`);
      petal.style.setProperty("--delay", `${-Math.random() * 18}s`);
      petal.style.setProperty("--drift", `${-80 + Math.random() * 160}px`);
      fragment.appendChild(petal);
    }
    petalField.appendChild(fragment);
  }

  if (hero && canvas && !reducedMotion.matches) {
    const context = canvas.getContext("2d", { alpha: true });
    const particles = [];
    let width = 0;
    let height = 0;

    const resizeCanvas = () => {
      const rect = hero.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      particles.length = 0;
      const count = Math.min(55, Math.max(22, Math.round(width / 22)));
      for (let i = 0; i < count; i += 1) {
        particles.push({
          x: Math.random() * width, y: Math.random() * height,
          radius: 0.5 + Math.random() * 1.7, speed: 0.06 + Math.random() * 0.15,
          phase: Math.random() * Math.PI * 2, alpha: 0.15 + Math.random() * 0.5
        });
      }
    };

    const render = (time) => {
      animationFrame = 0;
      if (!heroVisible) return;
      context.clearRect(0, 0, width, height);
      particles.forEach((particle) => {
        particle.y -= particle.speed;
        if (particle.y < -4) {
          particle.y = height + 4;
          particle.x = Math.random() * width;
        }
        const pulse = 0.55 + Math.sin(time * 0.0012 + particle.phase) * 0.35;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(255, 230, 214, ${particle.alpha * pulse})`;
        context.fill();
      });
      animationFrame = window.requestAnimationFrame(render);
    };

    const startAnimation = () => {
      if (!animationFrame && heroVisible && surpriseOpened) animationFrame = window.requestAnimationFrame(render);
    };
    startHeroAnimation = startAnimation;
    resizeCanvas();
    if (surpriseOpened) startAnimation();
    window.addEventListener("resize", () => {
      resizeCanvas();
      startAnimation();
    }, { passive: true });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        heroVisible = entry.isIntersecting;
        hero.classList.toggle("is-paused", !heroVisible);
        if (heroVisible) startAnimation();
        else if (animationFrame) {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = 0;
        }
      }, { threshold: 0.01 }).observe(hero);
    }
  }
})();
