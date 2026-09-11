type SearchItem = {title: string; text: string; action?: () => void};

type Notice = {id: string; text: string; time: number; read: boolean};

const STORAGE_KEYS = {
  recentSearches: 'vakilchee:recent-searches',
  notices: 'vakilchee:notices',
  tabs: 'vakilchee:tabs',
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage may be unavailable */ }
}

function notify(text: string) {
  const notices = readJson<Notice[]>(STORAGE_KEYS.notices, []);
  notices.unshift({id: `${Date.now()}-${Math.random()}`, text, time: Date.now(), read: false});
  writeJson(STORAGE_KEYS.notices, notices.slice(0, 100));
  window.dispatchEvent(new CustomEvent('vakilchee:notification', {detail: {text}}));
}

function collectSearchItems(): SearchItem[] {
  const selectors = [
    '[data-searchable]',
    'button',
    'a',
    '[role="button"]',
    'input[placeholder]',
    'textarea[placeholder]',
  ];
  const seen = new Set<string>();
  const items: SearchItem[] = [];
  document.querySelectorAll<HTMLElement>(selectors.join(',')).forEach((el) => {
    const text = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ');
    if (!text || text.length < 2 || text.length > 220 || seen.has(text)) return;
    seen.add(text);
    items.push({title: text.slice(0, 100), text, action: () => {
      el.scrollIntoView({behavior: 'smooth', block: 'center'});
      el.focus?.();
      el.click?.();
    }});
  });
  return items;
}

class VakilcheeProductivity extends HTMLElement {
  private root: ShadowRoot;
  private paletteOpen = false;
  private noticeOpen = false;
  private query = '';
  private selected = 0;
  private results: SearchItem[] = [];
  private toastTimer?: number;

  constructor() {
    super();
    this.root = this.attachShadow({mode: 'open'});
  }

  connectedCallback() {
    this.render();
    window.addEventListener('keydown', this.onKeyDown, {capture: true});
    window.addEventListener('vakilchee:notification', this.onNotification as EventListener);
    this.installNavigationObserver();
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', this.onKeyDown, {capture: true});
    window.removeEventListener('vakilchee:notification', this.onNotification as EventListener);
  }

  private onNotification = (event: Event) => {
    const detail = (event as CustomEvent).detail as {text?: string} | undefined;
    if (detail?.text) this.showToast(detail.text);
    this.render();
  };

  private onKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === 'k') {
      event.preventDefault(); event.stopPropagation(); this.openPalette(); return;
    }
    if ((event.ctrlKey || event.metaKey) && key === 'n') {
      event.preventDefault(); event.stopPropagation(); this.dispatch('new-document'); return;
    }
    if ((event.ctrlKey || event.metaKey) && key === 'e') {
      event.preventDefault(); event.stopPropagation(); this.dispatch('open-cases'); return;
    }
    if ((event.ctrlKey || event.metaKey) && key === 'd') {
      event.preventDefault(); event.stopPropagation(); this.dispatch('open-camera'); return;
    }
    if (event.key === 'Escape') {
      if (this.paletteOpen || this.noticeOpen) { event.preventDefault(); this.closePanels(); }
    }
    if (this.paletteOpen) {
      if (event.key === 'ArrowDown') { event.preventDefault(); this.selected = Math.min(this.selected + 1, Math.max(0, this.results.length - 1)); this.render(); }
      if (event.key === 'ArrowUp') { event.preventDefault(); this.selected = Math.max(0, this.selected - 1); this.render(); }
      if (event.key === 'Enter') { event.preventDefault(); this.results[this.selected]?.action?.(); this.closePanels(); }
    }
  };

  private dispatch(action: string, detail: Record<string, unknown> = {}) {
    window.dispatchEvent(new CustomEvent(`vakilchee:${action}`, {detail, bubbles: true, composed: true}));
    const messages: Record<string, string> = {
      'new-document': 'ایجاد سند جدید',
      'open-cases': 'پرونده‌ها',
      'open-camera': 'دوربین و اسکن',
    };
    notify(`${messages[action] || action} اجرا شد`);
  }

  private openPalette() {
    this.paletteOpen = true; this.noticeOpen = false; this.query = ''; this.selected = 0;
    this.results = collectSearchItems(); this.render();
    requestAnimationFrame(() => this.root.querySelector<HTMLInputElement>('#search')?.focus());
  }

  private closePanels() { this.paletteOpen = false; this.noticeOpen = false; this.render(); }

  private showToast(text: string) {
    const toast = this.root.querySelector<HTMLElement>('#toast');
    if (!toast) return;
    toast.textContent = text; toast.classList.add('show');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2600);
  }

  private installNavigationObserver() {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement | null;
      const searchable = target?.closest?.('[data-searchable]') as HTMLElement | null;
      if (searchable) {
        const label = (searchable.innerText || searchable.getAttribute('aria-label') || '').trim();
        if (label) notify(`آخرین عملیات: ${label.slice(0, 100)}`);
      }
    }, {passive: true});
  }

  private render() {
    const notices = readJson<Notice[]>(STORAGE_KEYS.notices, []);
    const unread = notices.filter(n => !n.read).length;
    const filtered = this.query.trim()
      ? this.results.filter(r => `${r.title} ${r.text}`.toLocaleLowerCase('fa').includes(this.query.toLocaleLowerCase('fa')))
      : this.results.slice(0, 12);
    if (this.paletteOpen) this.results = filtered;

    this.root.innerHTML = `
      <style>
        :host { position: fixed; inset: 0; z-index: 2147483000; pointer-events: none; font-family: Vazirmatn, Tahoma, sans-serif; }
        * { box-sizing: border-box; }
        .rail { position: fixed; left: 18px; top: 50%; transform: translateY(-50%); display:flex; flex-direction:column; gap:8px; pointer-events:auto; }
        .rail button { width:42px; height:42px; border:1px solid rgba(15,23,42,.12); border-radius:14px; background:rgba(255,255,255,.88); backdrop-filter:blur(14px); box-shadow:0 8px 30px rgba(15,23,42,.10); cursor:pointer; font-size:18px; }
        .rail button:hover { transform:translateY(-1px); box-shadow:0 12px 34px rgba(15,23,42,.16); }
        .badge { position:absolute; top:-3px; right:-3px; min-width:17px; height:17px; padding:0 4px; border-radius:99px; background:#dc2626; color:white; font:700 10px/17px sans-serif; }
        .backdrop { position:fixed; inset:0; background:rgba(15,23,42,.18); backdrop-filter:blur(3px); pointer-events:auto; }
        .panel { position:fixed; top:10vh; left:50%; transform:translateX(-50%); width:min(720px,calc(100vw - 28px)); max-height:76vh; overflow:hidden; background:rgba(255,255,255,.97); border:1px solid rgba(15,23,42,.12); border-radius:22px; box-shadow:0 30px 100px rgba(15,23,42,.24); pointer-events:auto; direction:rtl; }
        .searchbar { display:flex; align-items:center; gap:10px; padding:14px 16px; border-bottom:1px solid rgba(15,23,42,.08); }
        #search { flex:1; border:0; outline:0; background:transparent; font:400 15px Vazirmatn,Tahoma,sans-serif; color:#0f172a; }
        .kbd { padding:3px 7px; border:1px solid #cbd5e1; border-radius:7px; font:11px monospace; color:#64748b; }
        .results { max-height:58vh; overflow:auto; padding:8px; }
        .result { width:100%; text-align:right; border:0; background:transparent; padding:11px 13px; border-radius:12px; cursor:pointer; color:#0f172a; }
        .result:hover,.result.selected { background:#f1f5f9; }
        .result small { display:block; margin-top:3px; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .notice-panel { width:min(420px,calc(100vw - 28px)); left:auto; right:18px; transform:none; top:72px; }
        .notice-head { display:flex; justify-content:space-between; align-items:center; padding:15px 17px; border-bottom:1px solid #e2e8f0; }
        .notice-list { max-height:55vh; overflow:auto; padding:8px; }
        .notice { padding:11px 12px; border-radius:12px; margin-bottom:4px; background:#f8fafc; }
        .notice time { display:block; color:#94a3b8; font-size:10px; margin-top:4px; }
        .toast { position:fixed; left:50%; bottom:24px; transform:translate(-50%,20px); opacity:0; padding:11px 17px; border-radius:13px; background:#0f172a; color:#fff; box-shadow:0 12px 40px rgba(0,0,0,.22); transition:.22s; pointer-events:none; font-size:12px; }
        .toast.show { opacity:1; transform:translate(-50%,0); }
        @media(max-width:700px){ .rail{left:10px;top:auto;bottom:14px;transform:none;flex-direction:row}.rail button{width:44px;height:44px}.panel{top:5vh;max-height:88vh}.notice-panel{top:auto;bottom:70px;right:10px} }
      </style>
      <div class="rail" aria-label="دسترسی سریع">
        <button title="جستجوی سریع (Ctrl+K)" id="searchBtn">⌕</button>
        <button title="اعلان‌ها" id="noticeBtn" style="position:relative">🔔${unread ? `<span class="badge">${unread > 99 ? '99+' : unread}</span>` : ''}</button>
        <button title="سند جدید (Ctrl+N)" id="newBtn">＋</button>
        <button title="پرونده‌ها (Ctrl+E)" id="caseBtn">▤</button>
      </div>
      ${this.paletteOpen ? `
        <div class="backdrop" id="closePalette"></div>
        <section class="panel" role="dialog" aria-label="جستجوی سریع">
          <div class="searchbar"><span>⌕</span><input id="search" autocomplete="off" placeholder="جستجو در برنامه، اسناد، فرم‌ها و عملیات…" value="${this.escape(this.query)}"><span class="kbd">ESC</span></div>
          <div class="results">${this.results.length ? this.results.map((r,i)=>`<button class="result ${i===this.selected?'selected':''}" data-index="${i}">${this.escape(r.title)}<small>${this.escape(r.text)}</small></button>`).join('') : '<div style="padding:24px;text-align:center;color:#64748b">نتیجه‌ای پیدا نشد</div>'}</div>
        </section>` : ''}
      ${this.noticeOpen ? `
        <section class="panel notice-panel" role="dialog" aria-label="مرکز اعلان‌ها">
          <div class="notice-head"><strong>مرکز اعلان‌ها</strong><button id="clearNotices" style="border:0;background:transparent;cursor:pointer;color:#64748b">پاک‌سازی</button></div>
          <div class="notice-list">${notices.length ? notices.slice(0,50).map(n=>`<div class="notice">${this.escape(n.text)}<time>${new Date(n.time).toLocaleString('fa-IR')}</time></div>`).join('') : '<div style="padding:24px;text-align:center;color:#64748b">اعلان جدیدی وجود ندارد</div>'}</div>
        </section>` : ''}
      <div class="toast" id="toast"></div>
    `;

    this.root.querySelector('#searchBtn')?.addEventListener('click', () => this.openPalette());
    this.root.querySelector('#noticeBtn')?.addEventListener('click', () => { this.noticeOpen = !this.noticeOpen; this.paletteOpen = false; if (this.noticeOpen) { const ns=readJson<Notice[]>(STORAGE_KEYS.notices,[]).map(n=>({...n,read:true})); writeJson(STORAGE_KEYS.notices,ns); } this.render(); });
    this.root.querySelector('#newBtn')?.addEventListener('click', () => this.dispatch('new-document'));
    this.root.querySelector('#caseBtn')?.addEventListener('click', () => this.dispatch('open-cases'));
    this.root.querySelector('#closePalette')?.addEventListener('click', () => this.closePanels());
    this.root.querySelector('#clearNotices')?.addEventListener('click', () => { writeJson(STORAGE_KEYS.notices,[]); this.render(); });
    const input = this.root.querySelector<HTMLInputElement>('#search');
    input?.addEventListener('input', () => { this.query=input.value; this.selected=0; this.results=collectSearchItems(); this.render(); requestAnimationFrame(()=>this.root.querySelector<HTMLInputElement>('#search')?.focus()); });
    this.root.querySelectorAll<HTMLButtonElement>('.result').forEach((button) => button.addEventListener('click', () => { const index=Number(button.dataset.index); this.results[index]?.action?.(); this.closePanels(); }));
  }

  private escape(value: string) { return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c] || c)); }
}

if (!customElements.get('vakilchee-productivity')) customElements.define('vakilchee-productivity', VakilcheeProductivity);
if (!document.querySelector('vakilchee-productivity')) document.body.appendChild(document.createElement('vakilchee-productivity'));
