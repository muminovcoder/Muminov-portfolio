/**
 * MUMINOV PORTFOLIO — ELITE INTERACTIONS ENGINE
 * Premium • Performant • Accessible • Modular
 */

// ========================================
// 🎯 CONFIGURATION & STATE
// ========================================
const CONFIG = {
  // Animation
  revealThreshold: 0.15,
  scrollDebounce: 100,
  throttleMs: 16, // ~60fps
  
  // Cursor
  cursorSmoothing: 0.15,
  cursorGlowSmoothing: 0.08,
  
  // Particles
  particleCount: 50,
  particleSpeed: 0.4,
  
  // AI
  aiTimeout: 15000,
  aiEndpoint: 'https://api.groq.com/openai/v1/responses',
  aiModel: 'openai/gpt-oss-20b',
  
  // Storage
  storageKeys: {
    theme: 'mm-portfolio-theme',
    comments: 'mm-portfolio-comments',
    ratings: 'mm-portfolio-rated'
  }
};

const state = {
  theme: 'dark',
  comments: [],
  ratedComments: {},
  showAllComments: false,
  introComplete: false,
  cursorActive: true
};

// ========================================
// 🔧 UTILITY FUNCTIONS
// ========================================
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
};

const throttle = (fn, limit) => {
  let inThrottle = false;
  return (...args) => {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

const smoothScroll = (target, offset = 100) => {
  const element = $(target);
  if (!element) return;
  
  const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
  window.scrollTo({
    top: elementTop - offset,
    behavior: 'smooth'
  });
};

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

const stars = (value) => {
  const filled = Math.round(value);
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
};

// ========================================
// 🎬 INTRO ANIMATION
// ========================================
const initIntro = () => {
  const overlay = $('#introOverlay');
  const canvas = $('#introCanvas');
  const enterBtn = $('#introEnterBtn');
  
  if (!overlay || !canvas) return;
  
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationId;
  
  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
  };
  
  const createParticles = () => {
    particles = [];
    const count = 80;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        color: `hsla(${Math.random() * 60 + 220}, 80%, 70%, ${Math.random() * 0.5 + 0.2})`
      });
    }
  };
  
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw connections
    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      
      // Bounce
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      
      // Draw connections to nearby particles
      particles.slice(i + 1).forEach(p2 => {
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(148, 163, 184, ${0.15 - dist/800})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });
    });
    
    animationId = requestAnimationFrame(animate);
  };
  
  const startIntro = () => {
    resize();
    createParticles();
    animate();
    
    // Auto-start after 3 seconds
    setTimeout(enterPortfolio, 3500);
  };
  
  const enterPortfolio = () => {
    if (state.introComplete) return;
    state.introComplete = true;
    
    cancelAnimationFrame(animationId);
    overlay.classList.add('exit');
    document.body.classList.remove('intro-active');
    
    // Trigger main animations after intro
    setTimeout(() => {
      initScrollReveal();
      initSkillBars();
      initTypedRole();
    }, 800);
  };
  
  // Event listeners
  if (enterBtn) {
    enterBtn.addEventListener('click', enterPortfolio);
  }
  
  window.addEventListener('resize', debounce(() => {
    if (!state.introComplete) {
      resize();
      createParticles();
    }
  }, 250));
  
  // Start
  startIntro();
};

// ========================================
// 🖱️ CURSOR SYSTEM
// ========================================
const initCursor = () => {
  const glow = $('.cursor-glow');
  const dot = $('.cursor-dot');
  const follower = $('.cursor-follower');
  
  if (!glow || !dot || !follower) return;
  
  // Hide on touch devices
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    glow.style.display = 'none';
    dot.style.display = 'none';
    follower.style.display = 'none';
    return;
  }
  
  let mouseX = 0, mouseY = 0;
  let glowX = 0, glowY = 0;
  let dotX = 0, dotY = 0;
  let followerX = 0, followerY = 0;
  
  const animate = () => {
    // Smooth following with different easing
    dotX += (mouseX - dotX) * 0.25;
    dotY += (mouseY - dotY) * 0.25;
    dot.style.left = dotX + 'px';
    dot.style.top = dotY + 'px';
    
    glowX += (mouseX - glowX) * CONFIG.cursorGlowSmoothing;
    glowY += (mouseY - glowY) * CONFIG.cursorGlowSmoothing;
    glow.style.left = glowX + 'px';
    glow.style.top = glowY + 'px';
    
    followerX += (mouseX - followerX) * 0.1;
    followerY += (mouseY - followerY) * 0.1;
    follower.style.left = followerX + 'px';
    follower.style.top = followerY + 'px';
    
    requestAnimationFrame(animate);
  };
  
  const handleMouseMove = throttle((e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, CONFIG.throttleMs);
  
  window.addEventListener('mousemove', handleMouseMove, { passive: true });
  
  // Interactive element hover effects
  const interactive = 'a, button, [role="button"], [tabindex]:not([tabindex="-1"]), input, textarea, select, .card, .project-card, .skill-card';
  
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactive)) {
      glow.style.opacity = '1';
      glow.style.transform = 'translate(-50%, -50%) scale(1.15)';
      dot.style.transform = 'translate(-50%, -50%) scale(1.4)';
      follower.style.opacity = '1';
      follower.style.transform = 'translate(-50%, -50%) scale(1)';
      follower.style.borderColor = 'var(--color-secondary)';
    }
  });
  
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactive)) {
      glow.style.opacity = '0';
      glow.style.transform = 'translate(-50%, -50%) scale(1)';
      dot.style.transform = 'translate(-50%, -50%) scale(1)';
      follower.style.opacity = '0';
      follower.style.transform = 'translate(-50%, -50%) scale(0)';
    }
  });
  
  animate();
};

// ========================================
// 🧭 MOBILE NAVIGATION
// ========================================
const initMobileNav = () => {
  const menuBtn = $('#menuBtn');
  const nav = $('#nav');
  
  if (!menuBtn || !nav) return;
  
  const toggleNav = () => {
    const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
    menuBtn.setAttribute('aria-expanded', !expanded);
    nav.classList.toggle('show');
    nav.style.pointerEvents = expanded ? 'none' : 'auto';
  };
  
  menuBtn.addEventListener('click', toggleNav);
  
  // Close on link click
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('show');
      menuBtn.setAttribute('aria-expanded', 'false');
      nav.style.pointerEvents = 'none';
    });
  });
  
  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('show')) {
      toggleNav();
      menuBtn.focus();
    }
  });
};

// ========================================
// ✨ SCROLL REVEAL
// ========================================
const initScrollReveal = () => {
  const items = $$('.reveal');
  
  const reveal = () => {
    const triggerBottom = window.innerHeight * 0.85;
    
    items.forEach(item => {
      const itemTop = item.getBoundingClientRect().top;
      if (itemTop < triggerBottom) {
        item.classList.add('active');
      }
    });
  };
  
  // Initial check
  reveal();
  
  // Scroll listener
  window.addEventListener('scroll', debounce(reveal, CONFIG.scrollDebounce), { passive: true });
  window.addEventListener('resize', debounce(reveal, CONFIG.scrollDebounce), { passive: true });
};

// ========================================
// 🎴 3D TILT EFFECT
// ========================================
const initTiltEffect = () => {
  const cards = $$('.tilt');
  
  cards.forEach(card => {
    const handleMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = Math.max(-4, Math.min(4, ((y - centerY) / centerY) * -4));
      const rotateY = Math.max(-4, Math.min(4, ((x - centerX) / centerX) * 4));
      
      card.style.transform = `
        perspective(1200px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        translateY(-4px)
        scale(1.01)
      `;
    };
    
    const handleLeave = () => {
      card.style.transform = 'perspective(1200px) rotateX(0) rotateY(0) translateY(0) scale(1)';
    };
    
    card.addEventListener('mousemove', handleMove, { passive: true });
    card.addEventListener('mouseleave', handleLeave, { passive: true });
    card.addEventListener('touchend', handleLeave, { passive: true });
  });
};

// ========================================
// ⌨️ TYPED ROLE ANIMATION
// ========================================
const initTypedRole = () => {
  const el = $('#typedRole');
  if (!el) return;
  
  const roles = ['Developer', 'Junior Developer', 'Designer', 'Bot Builder', 'Creative'];
  let roleIndex = 0, charIndex = 0, deleting = false, paused = false;
  
  const type = () => {
    if (paused) return;
    
    const current = roles[roleIndex];
    
    if (!deleting) {
      charIndex++;
      el.textContent = current.slice(0, charIndex);
      
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(type, 1800);
        return;
      }
    } else {
      charIndex--;
      el.textContent = current.slice(0, charIndex);
      
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        setTimeout(type, 400);
        return;
      }
    }
    
    setTimeout(type, deleting ? 40 : 80);
  };
  
  // Start after intro
  setTimeout(() => {
    el.classList.remove('typed');
    setTimeout(() => {
      el.classList.add('typed');
      type();
    }, 500);
  }, 1000);
  
  // Pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (!paused && charIndex === 0 && !deleting) type();
  });
};

// ========================================
// 🌓 THEME TOGGLE
// ========================================
const initThemeToggle = () => {
  const btn = $('#themeBtn');
  const storageKey = CONFIG.storageKeys.theme;
  
  // Load saved theme or system preference
  const saved = localStorage.getItem(storageKey);
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (saved === 'light' || (!saved && !systemDark)) {
    document.documentElement.setAttribute('data-theme', 'light');
    btn?.setAttribute('aria-pressed', 'true');
    state.theme = 'light';
  }
  
  if (btn) {
    btn.addEventListener('click', () => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      
      if (newTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        document.documentElement.removeAttribute('data-theme');
        btn.setAttribute('aria-pressed', 'false');
      }
      
      state.theme = newTheme;
      localStorage.setItem(storageKey, newTheme);
      
      // Announce for screen readers
      showToast(`Theme changed to ${newTheme} mode`, 'info');
    });
  }
  
  // Listen for system changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(storageKey)) {
      const newTheme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      state.theme = newTheme;
    }
  });
};

// ========================================
// 📊 SKILL BARS ANIMATION
// ========================================
const initSkillBars = () => {
  const bars = $$('.skill-progress');
  const animated = new Set();
  
  const animate = () => {
    bars.forEach(bar => {
      const card = bar.closest('.skill-card');
      if (!card || animated.has(card)) return;
      
      const rect = card.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85) {
        animated.add(card);
        
        const target = parseInt(bar.dataset.level) || 0;
        const label = card.querySelector('.skill-percent');
        
        // Animate width
        bar.style.width = target + '%';
        
        // Animate counter
        if (label) {
          let current = 0;
          const increment = Math.ceil(target / 30);
          const counter = setInterval(() => {
            current += increment;
            if (current >= target) {
              label.textContent = target + '%';
              clearInterval(counter);
            } else {
              label.textContent = current + '%';
            }
          }, 30);
        }
      }
    });
  };
  
  animate();
  window.addEventListener('scroll', debounce(animate, CONFIG.scrollDebounce), { passive: true });
};

// ========================================
// 💬 COMMENTS SYSTEM
// ========================================
const initComments = () => {
  const storageKey = CONFIG.storageKeys.comments;
  const ratedKey = CONFIG.storageKeys.ratings;
  const removedSeed = new Set([
    "Dizayn juda zamonaviy va oynadek chiroyli chiqibdi.",
    "Animatsiyalar juda silliq, portfolio professional ko'rinadi.",
    "Menga projectlar va UI uslubi juda yoqdi."
  ]);
  
  const load = (key, fallback) => {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      return Array.isArray(data) ? data : fallback;
    } catch { return fallback; }
  };
  
  const save = (key, data) => {
    try { localStorage.setItem(key, JSON.stringify(data)); }
    catch (e) { console.warn('Storage error:', e); }
  };
  
  let comments = load(storageKey, []).filter(c => !removedSeed.has(c.text));
  let rated = load(ratedKey, {});
  
  const render = (animated = false) => {
    const list = $('#commentsList');
    if (!list) return;
    
    list.innerHTML = '';
    
    // Sort & filter
    const sorted = state.showAllComments
      ? [...comments].sort((a, b) => b.createdAt - a.createdAt)
      : [...comments].sort((a, b) => (b.rating * b.votes) - (a.rating * a.votes)).slice(0, 8);
    
    // Update count
    const countEl = $('#commentsCount');
    if (countEl) {
      const count = comments.length;
      countEl.textContent = `${count} comment${count === 1 ? '' : 's'}`;
    }
    
    // Empty state
    if (!sorted.length) {
      const template = $('#emptyCommentsTemplate');
      list.innerHTML = template?.innerHTML || '<p class="comment-empty">No comments yet.</p>';
      return;
    }
    
    // Render cards
    sorted.forEach((c, i) => {
      const card = document.createElement('article');
      card.className = 'comment-card glass';
      card.setAttribute('role', 'listitem');
      card.innerHTML = `
        <div class="comment-head">
          <span class="comment-name">${escapeHtml(c.name)}</span>
          <span class="comment-score" aria-label="Rating: ${c.rating.toFixed(1)}">${stars(c.rating)} ${c.rating.toFixed(1)}</span>
        </div>
        <p class="comment-text">${escapeHtml(c.text)}</p>
        <div class="comment-actions">
          <div class="rate-row" role="radiogroup" aria-label="Rate this comment">
            ${[1,2,3,4,5].map(n => `
              <button class="rate-btn" data-id="${c.id}" data-rate="${n}" 
                ${rated[c.id] ? 'disabled' : ''}
                aria-pressed="${rated[c.id] && Math.round(c.rating) === n}"
                aria-label="${n} star${n>1?'s':''}">★</button>
            `).join('')}
          </div>
          <span class="comment-meta">
            ${rated[c.id] ? 'You rated • ' : ''}${c.votes} rating${c.votes>1?'s':''} • 
            <time datetime="${new Date(c.createdAt).toISOString()}">${formatTime(c.createdAt)}</time>
          </span>
        </div>
      `;
      list.appendChild(card);
      
      if (animated) {
        setTimeout(() => {
          card.classList.add('show');
          if (c.isNew) {
            card.classList.add('pulse');
            setTimeout(() => card.classList.remove('pulse'), 600);
          }
        }, i * 120);
      } else {
        card.classList.add('show');
      }
    });
  };
  
  // Modal handling
  const modal = $('#commentModal');
  const openModal = () => {
    if (!modal) return;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('#commentName')?.focus(), 300);
  };
  
  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    $('#openCommentModal')?.focus();
  };
  
  $('#openCommentModal')?.addEventListener('click', openModal);
  $('#closeCommentModal')?.addEventListener('click', closeModal);
  
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('modal-backdrop')) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
    });
  }
  
  // Form submission
  $('#commentForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = $('#commentName')?.value.trim();
    const text = $('#commentText')?.value.trim();
    const rating = parseInt($('#commentRating')?.value);
    
    if (!name || !text || !rating) {
      showToast('Please fill all fields', 'error');
      return;
    }
    
    const newComment = {
      id: Date.now(),
      name: escapeHtml(name),
      text: escapeHtml(text),
      rating,
      votes: 1,
      createdAt: Date.now(),
      isNew: true
    };
    
    comments.unshift(newComment);
    save(storageKey, comments);
    render(true);
    
    // Reset & close
    e.target.reset();
    closeModal();
    showToast('Thank you for your feedback! 🎉', 'success');
  });
  
  // Rating
  $('#commentsList')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.rate-btn');
    if (!btn || rated[btn.dataset.id]) return;
    
    const id = Number(btn.dataset.id);
    const rate = Number(btn.dataset.rate);
    
    comments = comments.map(c => {
      if (c.id !== id) return c;
      const total = c.rating * c.votes + rate;
      return { ...c, votes: c.votes + 1, rating: total / (c.votes + 1) };
    });
    
    rated[id] = true;
    save(storageKey, comments);
    save(ratedKey, rated);
    
    render(false);
    showToast('Thanks for rating! ⭐', 'success');
  });
  
  // Toggle view
  $('#toggleCommentsBtn')?.addEventListener('click', () => {
    state.showAllComments = !state.showAllComments;
    const btn = $('#toggleCommentsBtn');
    if (btn) {
      const txt = btn.querySelector('.toggle-text');
      if (txt) txt.textContent = state.showAllComments ? 'Show Top' : 'View All';
    }
    render(true);
  });
  
  // Char count
  $('#commentText')?.addEventListener('input', (e) => {
    const count = $('#charCount');
    if (count) count.textContent = e.target.value.length;
  });
  
  // Rating stars UI
  $$('.rating-star').forEach(star => {
    star.addEventListener('click', () => {
      const value = star.dataset.value;
      $('#commentRating').value = value;
      $$('.rating-star').forEach(s => {
        s.classList.toggle('active', s.dataset.value <= value);
      });
    });
  });
  
  // Initial render
  render(true);
  
  return { render };
};

// ========================================
// 🤖 AI Q&A
// ========================================
const initAIQA = () => {
  // ⚠️ Note: In production, proxy API calls through your backend
  const API_KEY = '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';
  const ENDPOINT = CONFIG.aiEndpoint;
  const MODEL = CONFIG.aiModel;
  
  const CONTEXT = `
Portfolio: Muhammadsolixon Muminov, 18, Uzbekistan.
Skills: Web Dev (HTML/CSS/JS), Telegram Bots (Python/aiogram), Graphic Design.
Experience: 2 years web dev, 1.5 years design.
Projects: 4 total (1 website, 3 Telegram bots).
Rules: Answer ONLY about this portfolio. If question is unrelated, politely decline in user's language.
  `.trim();
  
  const ask = async (question) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.aiTimeout);
    
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL,
          input: `${CONTEXT}\n\nUser: ${question}\nAssistant:`
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) throw new Error(data?.error?.message || `Error ${res.status}`);
      
      const answer = data?.output_text 
        || data?.output?.[0]?.content?.[0]?.text 
        || data?.choices?.[0]?.message?.content;
      
      if (!answer) throw new Error('Empty response');
      return answer;
      
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') throw new Error('Request timed out');
      throw err;
    }
  };
  
  const typeWriter = (el, text, speed = 20) => {
    let i = 0;
    el.textContent = '';
    el.classList.remove('typing');
    
    const type = () => {
      if (i < text.length) {
        el.textContent += text[i++];
        el.scrollTop = el.scrollHeight;
        setTimeout(type, speed);
      } else {
        el.classList.add('typing');
      }
    };
    type();
  };
  
  const handleAsk = async () => {
    const input = $('#aiQuestion');
    const answer = $('#aiAnswer');
    const btn = $('#askAiBtn');
    
    if (!input || !answer || !btn) return;
    
    const question = input.value.trim();
    if (!question) {
      showToast('Please enter a question', 'error');
      input.focus();
      return;
    }
    
    // Loading state
    btn.classList.add('loading');
    btn.disabled = true;
    answer.textContent = 'Thinking...';
    answer.style.opacity = '0.7';
    
    try {
      const response = await ask(question);
      typeWriter(answer, response, 15);
    } catch (err) {
      let msg = 'AI is temporarily unavailable. Please try again.';
      const e = String(err.message || '').toLowerCase();
      
      if (e.includes('api key')) msg = 'API configuration error. Please contact support.';
      else if (e.includes('quota') || e.includes('429')) msg = 'Rate limit reached. Please wait a moment.';
      else if (e.includes('cors') || e.includes('blocked')) msg = 'Browser security blocked the request. Try a local server.';
      else if (e.includes('timeout')) msg = 'Request timed out. Check your connection.';
      
      answer.textContent = msg;
      answer.style.color = 'var(--color-error)';
      showToast('Failed to get AI response', 'error');
    } finally {
      setTimeout(() => {
        btn.classList.remove('loading');
        btn.disabled = false;
        answer.style.opacity = '1';
        answer.style.color = '';
      }, 400);
    }
  };
  
  // Event listeners
  $('#askAiBtn')?.addEventListener('click', handleAsk);
  
  $('#aiQuestion')?.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAsk();
    }
  });
  
  $('#clearAiBtn')?.addEventListener('click', () => {
    const input = $('#aiQuestion');
    const answer = $('#aiAnswer');
    if (input) { input.value = ''; input.focus(); }
    if (answer) {
      answer.textContent = '';
      answer.style.color = '';
      answer.classList.remove('typing');
    }
  });
  
  // Suggestion chips
  $$('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const input = $('#aiQuestion');
      if (input) {
        input.value = chip.dataset.question;
        handleAsk();
      }
    });
  });
};

// ========================================
// 🌌 PARTICLE BACKGROUND
// ========================================
const initParticles = () => {
  const canvas = $('#bgParticles');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const particles = [];
  const count = CONFIG.particleCount;
  
  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
  };
  
  const create = () => {
    particles.length = 0;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * CONFIG.particleSpeed,
        vy: (Math.random() - 0.5) * CONFIG.particleSpeed,
        opacity: Math.random() * 0.4 + 0.1
      });
    }
  };
  
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1;
      if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(148, 163, 184, ${p.opacity})`;
      ctx.fill();
    });
    
    requestAnimationFrame(animate);
  };
  
  resize();
  create();
  animate();
  
  window.addEventListener('resize', debounce(() => {
    resize();
    create();
  }, 250), { passive: true });
  
  // Pause when hidden
  document.addEventListener('visibilitychange', () => {
    // Could cancelAnimationFrame here for performance
  });
};

// ========================================
// 🧭 ACTIVE NAVIGATION (Scroll Spy)
// ========================================
const initActiveNav = () => {
  const sections = $$('section[id]');
  const links = $$('.nav-link');
  const indicator = $('.nav-indicator');
  
  const update = throttle(() => {
    let current = '';
    
    sections.forEach(section => {
      const top = section.offsetTop - 120;
      if (window.scrollY >= top) current = section.id;
    });
    
    links.forEach(link => {
      link.classList.toggle('active', link.dataset.section === current);
      
      if (link.classList.contains('active') && indicator) {
        indicator.style.width = link.offsetWidth + 'px';
        indicator.style.left = link.offsetLeft + 'px';
      }
    });
  }, 100);
  
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', debounce(update, 150), { passive: true });
};

// ========================================
// ✨ RIPPLE EFFECT
// ========================================
const initRipple = () => {
  const addRipple = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position:absolute;
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background:rgba(255,255,255,0.4);
      left:${x}px;
      top:${y}px;
      transform:scale(0);
      animation:ripple-effect 0.6s ease-out forwards;
      pointer-events:none;
    `;
    
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };
  
  $$('[data-ripple]').forEach(btn => {
    btn.addEventListener('click', addRipple);
  });
  
  // Add keyframes if not exists
  if (!$('#ripple-styles')) {
    const style = document.createElement('style');
    style.id = 'ripple-styles';
    style.textContent = `@keyframes ripple-effect{to{transform:scale(4);opacity:0}}`;
    document.head.appendChild(style);
  }
};

// ========================================
// 🔗 SMOOTH SCROLL
// ========================================
const initSmoothScroll = () => {
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      
      e.preventDefault();
      smoothScroll(href);
      
      // Close mobile nav if open
      const nav = $('#nav');
      const menuBtn = $('#menuBtn');
      if (nav?.classList.contains('show')) {
        nav.classList.remove('show');
        menuBtn?.setAttribute('aria-expanded', 'false');
      }
    });
  });
};

// ========================================
// ♿ ACCESSIBILITY
// ========================================
const initAccessibility = () => {
  // Skip link
  const skip = document.createElement('a');
  skip.href = '#main-content';
  skip.className = 'skip-link';
  skip.textContent = 'Skip to content';
  document.body.insertBefore(skip, document.body.firstChild);
  
  // Focus management for modals
  let lastFocused;
  
  const trapFocus = (modal) => {
    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    
    modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === first) { last.focus(); e.preventDefault(); }
      } else {
        if (document.activeElement === last) { first.focus(); e.preventDefault(); }
      }
    });
    
    first?.focus();
  };
  
  // Modal focus trap
  const modal = $('#commentModal');
  if (modal) {
    modal.addEventListener('transitionend', (e) => {
      if (modal.classList.contains('show') && e.propertyName === 'opacity') {
        trapFocus(modal);
      }
    });
  }
};

// ========================================
// 🔔 TOAST NOTIFICATIONS
// ========================================
const showToast = (message, type = 'info') => {
  const container = $('#toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === 'success' ? '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>' :
        type === 'error' ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' :
        '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'}
    </svg>
    <span>${escapeHtml(message)}</span>
  `;
  
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
};

// ========================================
// 🔐 SECURITY UTILS
// ========================================
const escapeHtml = (str) => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

// ========================================
// 🚀 INITIALIZATION
// ========================================
const init = () => {
  // Core features
  initIntro();
  initCursor();
  initMobileNav();
  initScrollReveal();
  initTiltEffect();
  initThemeToggle();
  initSkillBars();
  initComments();
  initAIQA();
  initParticles();
  initActiveNav();
  initRipple();
  initSmoothScroll();
  initAccessibility();
  
  // Log
  console.log('✨ Muminov Elite Portfolio — Loaded');
};

// Start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Global error handling
window.addEventListener('error', (e) => {
  console.error('💥 Error:', e.error);
  showToast('Something went wrong. Please refresh.', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('💥 Promise rejected:', e.reason);
});