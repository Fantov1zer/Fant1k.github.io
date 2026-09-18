/* =========================================================
   Fantov1zer — интерактив
   ========================================================= */

/* ---------- 0. SFX — мягкие приятные звуки (Web Audio API) ---------- */
const SFX = (function () {
    let ctx = null;
    let enabled = true;

    function ensure() {
        if (!ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) { enabled = false; return null; }
            ctx = new AC();
        }
        if (ctx.state === "suspended") ctx.resume();
        return ctx;
    }

    function tone(freq, dur, vol, type = "sine", delay = 0) {
        const c = ensure();
        if (!c) return;

        const osc = c.createOscillator();
        const gain = c.createGain();
        const filter = c.createBiquadFilter();

        filter.type = "lowpass";
        filter.frequency.value = 4200;
        filter.Q.value = 0.6;

        osc.type = type;
        osc.frequency.value = freq;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(c.destination);

        const t0 = c.currentTime + delay;

        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.linearRampToValueAtTime(vol, t0 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

        const lfo = c.createOscillator();
        const lfoGain = c.createGain();
        lfo.frequency.value = 5;
        lfoGain.gain.value = freq * 0.006;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        osc.start(t0);
        lfo.start(t0);
        osc.stop(t0 + dur + 0.05);
        lfo.stop(t0 + dur + 0.05);
    }

    return {
        hover() { if (enabled) tone(1320, 0.18, 0.010, "sine"); },
        click() {
            if (enabled) {
                tone(880, 0.22, 0.028, "sine", 0);
                tone(1320, 0.18, 0.018, "sine", 0.03);
            }
        },
        play() {
            if (enabled) {
                tone(660, 0.22, 0.030, "sine", 0);
                tone(990, 0.26, 0.026, "sine", 0.07);
            }
        },
        pause() {
            if (enabled) {
                tone(990, 0.20, 0.028, "sine", 0);
                tone(660, 0.24, 0.022, "sine", 0.07);
            }
        },
        swap() {
            if (enabled) {
                tone(784, 0.20, 0.026, "sine", 0);
                tone(1046, 0.22, 0.024, "sine", 0.06);
                tone(1318, 0.30, 0.020, "sine", 0.12);
            }
        },
        tick() { if (enabled) tone(1560, 0.08, 0.012, "sine"); },
        unlock() { ensure(); }
    };
})();

/* ---------- 1. ИНТРО-ЗАГРУЗКА ---------- */
(function initLoader() {
    const loader = document.getElementById("loader");
    const fill = document.getElementById("loaderFill");
    const text = document.getElementById("loaderText");
    if (!loader) return;

    const steps = ["Загрузка", "Подготовка", "Почти готово", "Погнали"];
    let progress = 0;
    let step = 0;

    const interval = setInterval(() => {
        progress += Math.random() * 14 + 6;
        if (progress > 100) progress = 100;
        fill.style.width = progress + "%";

        if (progress > step * 25 + 10 && step < steps.length - 1) {
            step++;
            text.textContent = steps[step];
        }

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                loader.classList.add("hidden");
                document.body.classList.add("loaded");
            }, 380);
        }
    }, 160);
})();

/* ---------- 2. ЧАСТИЦЫ-ЗВЁЗДОЧКИ ---------- */
(function initParticles() {
    const canvas = document.getElementById("particles");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W = 0, H = 0, particles = [];
    const mouse = { x: -9999, y: -9999 };

    function createParticles() {
        const count = Math.min(80, Math.floor(W / 20));
        particles = [];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * W,
                y: Math.random() * H,
                vx: (Math.random() - 0.5) * 0.32,
                vy: (Math.random() - 0.5) * 0.32,
                r: Math.random() * 1.6 + 0.5
            });
        }
    }

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
        createParticles();
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > W) p.vx *= -1;
            if (p.y < 0 || p.y > H) p.vy *= -1;

            const dx = p.x - mouse.x, dy = p.y - mouse.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 130 && dist > 0) {
                const force = (130 - dist) / 130;
                p.x += (dx / dist) * force * 1.6;
                p.y += (dy / dist) * force * 1.6;
            }

            for (let j = i + 1; j < particles.length; j++) {
                const q = particles[j];
                const d = Math.hypot(p.x - q.x, p.y - q.y);
                if (d < 130) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.strokeStyle = `rgba(124,92,255,${0.16 * (1 - d / 130)})`;
                    ctx.lineWidth = 0.7;
                    ctx.stroke();
                }
            }
        }

        particles.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(160,140,255,0.75)";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "rgba(124,92,255,0.9)";
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        requestAnimationFrame(draw);
    }

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener("mouseout", () => { mouse.x = -9999; mouse.y = -9999; });

    resize();
    draw();
})();

/* ---------- 3. СВЕЧЕНИЕ ЗА КУРСОРОМ ---------- */
(function initCursorGlow() {
    const glow = document.querySelector(".cursor-glow");
    if (!glow) return;

    let targetX = window.innerWidth / 2, targetY = window.innerHeight / 2;
    let curX = targetX, curY = targetY;

    window.addEventListener("mousemove", (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
    });

    (function animate() {
        curX += (targetX - curX) * 0.09;
        curY += (targetY - curY) * 0.09;
        glow.style.transform = `translate(${curX}px, ${curY}px)`;
        requestAnimationFrame(animate);
    })();
})();

/* ---------- 4. КАСТОМНЫЙ КУРСОР ---------- */
(function initCustomCursor() {
    const dot = document.getElementById("cursorDot");
    const ring = document.getElementById("cursorRing");
    if (!dot || !ring) return;

    const isFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!isFine) { dot.style.display = "none"; ring.style.display = "none"; return; }

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener("mousemove", (e) => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.transform = `translate(${mx}px, ${my}px)`;
    });

    (function loop() {
        rx += (mx - rx) * 0.18;
        ry += (my - ry) * 0.18;
        ring.style.transform = `translate(${rx}px, ${ry}px)`;
        requestAnimationFrame(loop);
    })();

    document.querySelectorAll("a, button, .btn, .card, .pl-item, .tag, .nav-links a, .vol-btn, .volume-slider")
        .forEach((el) => {
            el.addEventListener("mouseenter", () => document.body.classList.add("cursor-hover"));
            el.addEventListener("mouseleave", () => document.body.classList.remove("cursor-hover"));
        });

    document.addEventListener("mouseleave", () => { dot.style.opacity = 0; ring.style.opacity = 0; });
    document.addEventListener("mouseenter", () => { dot.style.opacity = 1; ring.style.opacity = 1; });
})();

/* ---------- 5. SFX НА ИНТЕРАКТИВ ---------- */
(function initSFX() {
    const unlock = () => { SFX.unlock(); document.removeEventListener("click", unlock); };
    document.addEventListener("click", unlock);

    document.querySelectorAll("a, button, .btn, .pl-item, .nav-links a, .tag")
        .forEach((el) => {
            el.addEventListener("mouseenter", () => SFX.hover());
            el.addEventListener("click", () => SFX.click());
        });
})();

/* ---------- 6. ПОЯВЛЕНИЕ ПРИ СКРОЛЛЕ ---------- */
(function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const delay = parseInt(el.dataset.delay || "0", 10) * 110;
            setTimeout(() => el.classList.add("visible"), delay);
            obs.unobserve(el);
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

    items.forEach((el) => observer.observe(el));
})();

/* ---------- 7. 3D-НАКЛОН КАРТОЧЕК ---------- */
(function initCardTilt() {
    document.querySelectorAll(".card").forEach((card) => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty("--mx", `${x}px`);
            card.style.setProperty("--my", `${y}px`);
            const rotateY = ((x / rect.width) - 0.5) * 12;
            const rotateX = ((y / rect.height) - 0.5) * -12;
            card.style.transform =
                `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
        });
        card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
})();

/* ---------- 8. НАВИГАЦИЯ ---------- */
(function initNav() {
    const nav = document.getElementById("nav");
    if (!nav) return;
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
})();

/* ---------- 9. ПОЛОСА ПРОГРЕССА ---------- */
(function initProgress() {
    const bar = document.querySelector(".scroll-progress");
    if (!bar) return;
    const update = () => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
})();

/* ---------- 10. ГОД В ФУТЕРЕ ---------- */
(function initYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
})();

/* ---------- 11. ПЛАВНЫЕ ЯКОРЯ ---------- */
(function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (e) => {
            const id = link.getAttribute("href");
            if (id === "#" || id.length < 2) return;
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });
})();

/* ---------- 12. ПАСХАЛКА — ДОЖДЬ ИЗ ЛОРИСОВ ---------- */
(function initEasterEgg() {
    const logo = document.getElementById("logo");
    const rainBox = document.getElementById("lorisRain");
    if (!logo || !rainBox) return;

    let clicks = 0;
    let resetTimer = null;

    logo.addEventListener("click", () => {
        clicks++;
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => { clicks = 0; }, 1500);

        if (clicks >= 10) {
            clicks = 0;
            lorisRain();
        }
    });

    function lorisRain() {
        const N = 35;
        for (let i = 0; i < N; i++) {
            const img = document.createElement("img");
            img.src = "img/loris.png";
            img.className = "loris-fall";
            img.style.left = Math.random() * 100 + "vw";
            img.style.width = 40 + Math.random() * 50 + "px";
            img.style.height = img.style.width;
            img.style.animationDuration = (2.6 + Math.random() * 2.4) + "s";
            img.style.animationDelay = (Math.random() * 0.8) + "s";
            rainBox.appendChild(img);
            setTimeout(() => img.remove(), 7000);
        }

        if (typeof SFX !== "undefined") SFX.swap();

        document.body.style.transition = "filter .15s ease";
        document.body.style.filter = "brightness(1.6) saturate(1.4)";
        setTimeout(() => { document.body.style.filter = ""; }, 180);
    }
})();

/* =========================================================
   13. МУЗЫКАЛЬНЫЙ ПЛЕЕР + СМЕНА ФОНА + ГРОМКОСТЬ
   ========================================================= */
(function initPlayer() {
    const audio = document.getElementById("audioEl");
    const cover = document.getElementById("playerCover");
    const trackNameEl = document.getElementById("trackName");
    const trackArtistEl = document.getElementById("trackArtist");
    const playBtn = document.getElementById("playBtn");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const playIcon = document.getElementById("playIcon");
    const pauseIcon = document.getElementById("pauseIcon");
    const currentTimeEl = document.getElementById("currentTime");
    const totalTimeEl = document.getElementById("totalTime");
    const progressBar = document.getElementById("progressBar");
    const progressFill = document.getElementById("progressFill");
    const playlistEl = document.getElementById("playlist");

    const volBtn = document.getElementById("volBtn");
    const volOnIcon = document.getElementById("volOnIcon");
    const volOffIcon = document.getElementById("volOffIcon");
    const volumeSlider = document.getElementById("volumeSlider");
    const volumeFill = document.getElementById("volumeFill");
    const volValue = document.getElementById("volValue");

    if (!audio) return;

    const DEFAULT_THEME = {
        o1: "#7c5cff",
        o2: "#00d4ff",
        o3: "#ff2d95",
        glow: "rgba(124,92,255,0.13)"
    };

    const tracks = [
        {
            title: "V krayu magnolij", artist: "Arijel", src: "music/track1.mp3",
            theme: { o1: "#ff7ac6", o2: "#ffb300", o3: "#c56bff", glow: "rgba(255,122,198,0.16)" }
        },
        {
            title: "SOPHIE · VYZEE", artist: "frigyanya", src: "music/track2.mp3",
            theme: { o1: "#ff2d95", o2: "#7c5cff", o3: "#00d4ff", glow: "rgba(255,45,149,0.18)" }
        },
        {
            title: "Hot N Cold", artist: "Katy Perry", src: "music/track3.mp3",
            theme: { o1: "#ff2d55", o2: "#ff5c8a", o3: "#ffd700", glow: "rgba(255,45,85,0.18)" }
        },
        {
            title: "Where Is My Mind", artist: "Pixies", src: "music/track4.mp3",
            theme: { o1: "#00d4ff", o2: "#4a5a8c", o3: "#2a3a5c", glow: "rgba(0,212,255,0.16)" }
        },
        {
            title: "fake ur face", artist: "s0rrow", src: "music/track5.mp3",
            theme: { o1: "#4a5a8c", o2: "#2a3a5c", o3: "#6a7a9c", glow: "rgba(74,90,140,0.20)" }
        }
    ];

    let current = 0;
    let lastVolume = 1;

    function formatTime(sec) {
        if (!isFinite(sec) || isNaN(sec)) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    }

    function buildPlaylist() {
        playlistEl.innerHTML = "";
        tracks.forEach((t, i) => {
            const item = document.createElement("div");
            item.className = "pl-item";
            item.dataset.index = i;
            item.innerHTML = `
        <span class="pl-num">${String(i + 1).padStart(2, "0")}</span>
        <span class="pl-eq"><span></span><span></span><span></span></span>
        <span class="pl-title">${t.title}</span>
        <span class="pl-artist">${t.artist}</span>
      `;
            item.addEventListener("click", () => loadTrack(i, true));
            item.addEventListener("mouseenter", () => SFX.hover());
            playlistEl.appendChild(item);
        });
    }

    function updatePlaylistUI() {
        playlistEl.querySelectorAll(".pl-item").forEach((el, i) => {
            el.classList.toggle("active", i === current);
        });
    }

    function applyTheme(theme) {
        const root = document.documentElement;
        root.style.setProperty("--orb-1", theme.o1);
        root.style.setProperty("--orb-2", theme.o2);
        root.style.setProperty("--orb-3", theme.o3);
        const glow = document.querySelector(".cursor-glow");
        if (glow) {
            glow.style.background = `radial-gradient(circle, ${theme.glow}, transparent 65%)`;
        }
    }
    function resetTheme() { applyTheme(DEFAULT_THEME); }

    function loadTrack(index, autoplay = false) {
        current = (index + tracks.length) % tracks.length;
        const t = tracks[current];
        audio.src = t.src;
        trackNameEl.textContent = t.title;
        trackArtistEl.textContent = t.artist;
        progressFill.style.width = "0%";
        currentTimeEl.textContent = "0:00";
        totalTimeEl.textContent = "0:00";
        updatePlaylistUI();

        if (autoplay) audio.play().catch(() => { });
    }

    function setPlayingUI(isPlaying) {
        playIcon.style.display = isPlaying ? "none" : "";
        pauseIcon.style.display = isPlaying ? "" : "none";
        cover.classList.toggle("playing", isPlaying);
    }

    /* ---------- ГРОМКОСТЬ ---------- */
    function setVolume(value) {
        value = Math.min(Math.max(value, 0), 1);
        audio.volume = value;
        audio.muted = value === 0;
        volumeFill.style.width = (value * 100) + "%";
        volValue.textContent = Math.round(value * 100) + "%";

        const isMuted = value === 0;
        volOnIcon.style.display = isMuted ? "none" : "";
        volOffIcon.style.display = isMuted ? "" : "none";
        volBtn.classList.toggle("muted", isMuted);

        if (value > 0) lastVolume = value;
        try { localStorage.setItem("fz_volume", String(value)); } catch (_) { }
    }

    function volumeFromEvent(e) {
        const rect = volumeSlider.getBoundingClientRect();
        const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
        setVolume(ratio);
    }

    let isDraggingVol = false;

    volumeSlider.addEventListener("mousedown", (e) => {
        isDraggingVol = true;
        volumeFromEvent(e);
        SFX.tick();
    });
    window.addEventListener("mousemove", (e) => {
        if (isDraggingVol) volumeFromEvent(e);
    });
    window.addEventListener("mouseup", () => { isDraggingVol = false; });

    volumeSlider.addEventListener("touchstart", (e) => {
        volumeFromEvent(e.touches[0]);
        SFX.tick();
    }, { passive: true });
    volumeSlider.addEventListener("touchmove", (e) => {
        volumeFromEvent(e.touches[0]);
    }, { passive: true });

    volBtn.addEventListener("click", () => {
        if (audio.volume > 0 && !audio.muted) {
            lastVolume = audio.volume;
            setVolume(0);
        } else {
            setVolume(lastVolume || 1);
        }
        SFX.click();
    });

    /* ---------- Кнопки транспорта ---------- */
    playBtn.addEventListener("click", () => {
        if (audio.paused) { audio.play().catch(() => { }); SFX.play(); }
        else { audio.pause(); SFX.pause(); }
    });

    prevBtn.addEventListener("click", () => {
        SFX.swap();
        if (audio.currentTime > 3) { audio.currentTime = 0; return; }
        loadTrack(current - 1, !audio.paused);
    });

    nextBtn.addEventListener("click", () => {
        SFX.swap();
        loadTrack(current + 1, !audio.paused);
    });

    /* ---------- События audio ---------- */
    audio.addEventListener("play", () => {
        setPlayingUI(true);
        applyTheme(tracks[current].theme);
    });

    audio.addEventListener("pause", () => {
        setPlayingUI(false);
        resetTheme();
    });

    audio.addEventListener("ended", () => loadTrack(current + 1, true));

    audio.addEventListener("loadedmetadata", () => {
        totalTimeEl.textContent = formatTime(audio.duration);
    });

    audio.addEventListener("timeupdate", () => {
        const percent = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
        progressFill.style.width = percent + "%";
        currentTimeEl.textContent = formatTime(audio.currentTime);
    });

    progressBar.addEventListener("click", (e) => {
        const rect = progressBar.getBoundingClientRect();
        const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
        if (audio.duration) audio.currentTime = ratio * audio.duration;
    });

    document.addEventListener("keydown", (e) => {
        if (e.code === "Space" && e.target === document.body) {
            e.preventDefault();
            playBtn.click();
        }
        if (e.code === "ArrowRight" && e.altKey) nextBtn.click();
        if (e.code === "ArrowLeft" && e.altKey) prevBtn.click();

        if (e.target === document.body) {
            if (e.code === "ArrowUp") { e.preventDefault(); setVolume(audio.volume + 0.05); SFX.tick(); }
            if (e.code === "ArrowDown") { e.preventDefault(); setVolume(audio.volume - 0.05); SFX.tick(); }
        }
    });

    /* ---------- Старт ---------- */
    buildPlaylist();
    loadTrack(0);

    let saved = 1;
    try {
        const s = localStorage.getItem("fz_volume");
        if (s !== null) saved = parseFloat(s);
    } catch (_) { }
    setVolume(isNaN(saved) ? 1 : saved);

    resetTheme();
})();