/**
 * fatefor-v3 — 盘古宇宙 / 山海观象
 * Empty-universe defaults: all signals 0, boards empty, no seeded fixtures.
 * localStorage only for THIS browser's own joins/predictions.
 */
(function () {
  "use strict";

  const STORE = "fatefor-v3";
  const INVITE_MONTH_CAP = 3;
  const JOIN_BONUS = 500;
  const LIFE_BONUS = 120;
  const PRED_BONUS = 15;
  const INVITE_BONUS = 200;

  /** Hypothesis symbols — price & n start at 0 until real aggregates exist */
  const SYMBOLS = [
    { sym: "LOVE", name: "关系假说" },
    { sym: "CAREER", name: "事业假说" },
    { sym: "WEALTH", name: "财富假说" },
    { sym: "HEALTH", name: "健康模式假说" },
  ];

  const HELP = {
    "help-tickers": {
      title: "假说行情 · 玩法",
      body: "<p>四座假说山脉显示研究信号。当前宇宙为空：脉动为 <strong>0</strong>，样本 n=0。</p><p>有真实观测汇入前，不展示虚构涨跌。你可先观察并投递预测简。</p>",
    },
    "help-ticket": {
      title: "研究预测 · 玩法",
      body: "<p>选择山脉 + 方向（看多 / 看空 / 震荡）投递<strong>预测简</strong>。</p><p>按准确率结算；参与可得少量创世值。<strong>无本金、无赔率、不是下注。</strong>样本不足时结算会标记数据不足。</p>",
    },
    "help-positions": {
      title: "在途预测 · 玩法",
      body: "<p>「浮动准确期望」衡量方向与脉动是否同向——不是资金盈亏。脉动为 0 时期望亦为中性。</p>",
    },
    "help-boards": {
      title: "贡献榜 · 玩法",
      body: "<p>主榜看数据质量贡献，次榜看预测准确率。当前无远程排行：仅在你本机产生贡献后显示自己。</p><p>奖励为徽章 / 编号 / 框，不是财富。</p>",
    },
    "help-earn": {
      title: "创世值 · 玩法",
      body: "<p>免费登记 +500；记年表 +120；每简预测 +15；一级邀请 +200（月封顶）。</p><p>创世值<strong>不可提现、不可转让、不是币</strong>。</p>",
    },
    "help-radar": {
      title: "同生时雷达 · 玩法",
      body: "<p>按出生窗口估算同生密度。当前无聚合数据：匹配数为 <strong>0</strong>。提交年表后仅标记本机已贡献，不伪造全球人数。</p>",
    },
    "help-life": {
      title: "人生简册 · 玩法",
      body: "<p>填写出生信息进入校验漏斗，+120 创世值。健康项为自我报告。</p><p>结果页在 n=0 / 数据不足时明确提示，不展示虚构百分比。</p>",
    },
  };

  const DIR_LABEL = { long: "看多", short: "看空", range: "震荡" };

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORE) || "{}");
    } catch {
      return {};
    }
  }
  function save(state) {
    localStorage.setItem(STORE, JSON.stringify(state));
  }
  function ensureState() {
    const s = load();
    if (!s.predictions) s.predictions = [];
    if (typeof s.points !== "number") s.points = 0;
    if (!s.badges) s.badges = [];
    if (!s.inviteMonth) s.inviteMonth = { key: monthKey(), used: 0 };
    if (s.inviteMonth.key !== monthKey()) s.inviteMonth = { key: monthKey(), used: 0 };
    if (!s.inviteCode) s.inviteCode = "PG-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    // Resident count: only this browser. First join → 1
    if (typeof s.residentTotal !== "number") s.residentTotal = s.joined ? 1 : 0;
    return s;
  }
  function monthKey() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  }
  function formatInt(n) {
    return Math.round(n).toLocaleString("en-US");
  }
  function toast(msg) {
    const stack = document.getElementById("toast-stack");
    if (!stack) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  const quotes = SYMBOLS.map((s) => ({
    ...s,
    price: 0,
    chg: 0,
    n: 0,
  }));

  function renderQuotes() {
    const grid = document.getElementById("quote-grid");
    const offline = document.getElementById("offline-index-grid");
    const cardHtml = quotes
      .map(
        (q) => `<div class="quote-card" data-sym="${q.sym}">
          <div class="sym">${q.sym}</div>
          <div class="val">0.00</div>
          <div class="chg pnl-flat">— · 尚无波动</div>
          <div class="meta">${q.name} · n=0 · 数据不足</div>
        </div>`
      )
      .join("");
    if (grid) grid.innerHTML = cardHtml;
    if (offline) {
      offline.innerHTML = quotes
        .map(
          (q) => `<div class="index-card">
            <div class="sym">${q.sym}</div>
            <div class="val">0.00</div>
            <div class="chg">— · n=0</div>
            <div class="n">${q.name} · 等待观测</div>
          </div>`
        )
        .join("");
    }
    const tape = document.getElementById("ticker-tape");
    if (tape) {
      tape.innerHTML = `<div class="tape-empty">尚无观测事件 · 假说山脉脉动为 0 · 等待第一份生命年表或预测简</div>`;
    }
    updateTide();
  }

  function updateTide() {
    const sel = document.getElementById("pred-symbol");
    const sym = sel ? sel.value : "LOVE";
    const q = quotes.find((x) => x.sym === sym) || quotes[0];
    const last = document.getElementById("book-last");
    if (last) last.textContent = "0.00";
    // No community weight yet
    const set = (id, pctId, v) => {
      const el = document.getElementById(id);
      const p = document.getElementById(pctId);
      if (el) el.style.width = v + "%";
      if (p) p.textContent = v + "%";
    };
    set("tide-bid", "tide-bid-pct", 0);
    set("tide-ask", "tide-ask-pct", 0);
    set("tide-range", "tide-range-pct", 0);
    void q;
  }

  function paintCitizen() {
    const s = ensureState();
    const citizen = document.getElementById("desk-citizen");
    const pts = document.getElementById("desk-points");
    const aggId = document.getElementById("agg-id");
    const aggPts = document.getElementById("agg-pts");
    const aggAcc = document.getElementById("agg-acc");
    const aggBadges = document.getElementById("agg-badges");
    const invite = document.getElementById("invite-code");
    const cap = document.getElementById("invite-cap");
    if (citizen) {
      citizen.textContent = s.citizenId
        ? "创世 " + s.citizenId + " · 本机居民总数 " + s.residentTotal
        : "居民 0 · 未登记";
    }
    if (pts) pts.textContent = formatInt(s.points || 0);
    if (aggId) aggId.textContent = s.citizenId || "—";
    if (aggPts) aggPts.textContent = formatInt(s.points || 0);
    if (aggAcc) {
      const n = (s.predictions || []).length;
      aggAcc.textContent = n
        ? `本机 ${n} 简 · 全局准确率 n=0（数据不足）`
        : "n=0 · 数据不足";
    }
    if (aggBadges) {
      aggBadges.textContent =
        s.badges && s.badges.length ? s.badges.join(" · ") : "尚未获得";
    }
    if (invite) invite.textContent = s.inviteCode || "—";
    if (cap) cap.textContent = `本月已用 ${s.inviteMonth.used} / ${INVITE_MONTH_CAP}`;
    if (s.life) {
      const prev = document.getElementById("bazi-preview");
      const out = document.getElementById("bazi-out");
      if (prev) prev.hidden = false;
      if (out) out.textContent = s.life.baziText || "";
    }
    paintRadar();
  }

  function paintRadar() {
    const s = ensureState();
    const near = document.getElementById("radar-near");
    const day = document.getElementById("radar-day");
    const cluster = document.getElementById("radar-cluster");
    // No backend matches — always 0. Local life submit does not invent global peers.
    if (near) near.textContent = "0";
    if (day) day.textContent = "0";
    if (cluster) cluster.textContent = s.life ? "0" : "0";
    const box = document.getElementById("radar-blips");
    if (box) box.innerHTML = "";
  }

  function joinUniverse() {
    const s = ensureState();
    if (!s.joined) {
      s.joined = true;
      s.residentTotal = 1; // this browser only
      s.citizenN = 1;
      s.citizenId = "DX-" + String(s.citizenN).padStart(6, "0");
      s.points = (s.points || 0) + JOIN_BONUS;
      if (!s.badges.includes("创世居民")) s.badges.push("创世居民");
      save(s);
      toast("你是本机第 1 位创世居民 · " + s.citizenId + " · +500 创世值");
    }
    paintCitizen();
    renderBoards();
    closeWelcome();
  }

  function openWelcome() {
    const s = ensureState();
    const modal = document.getElementById("welcome-modal");
    const n = document.getElementById("welcome-n");
    // Next resident number for THIS client: 1 if not joined
    const nextN = s.joined ? s.citizenN : 1;
    if (n) n.textContent = formatInt(nextN);
    if (modal) modal.hidden = false;
  }
  function closeWelcome() {
    const modal = document.getElementById("welcome-modal");
    if (modal) modal.hidden = true;
    const s = ensureState();
    s.seenWelcome = true;
    save(s);
  }

  function addPrediction(sym, direction, note) {
    const s = ensureState();
    if (!s.joined) {
      toast("请先进入宇宙（免费登记）");
      openWelcome();
      return;
    }
    const q = quotes.find((x) => x.sym === sym) || quotes[0];
    const id = "YC-" + Date.now().toString(36).toUpperCase();
    s.predictions.unshift({
      id,
      sym,
      direction,
      note: note || "",
      open: q.price, // 0
      at: Date.now(),
      status: "在途 · 待样本",
    });
    s.points += PRED_BONUS;
    if (s.predictions.length >= 5 && !s.badges.includes("准心印")) {
      s.badges.push("准心印");
      toast("点亮徽章：准心印");
    }
    save(s);
    toast("预测简已投递 · +" + PRED_BONUS + " 创世值（参与）· 结算需真实样本");
    paintCitizen();
    renderPositions();
    renderBoards();
  }

  function renderPositions() {
    const s = ensureState();
    const body = document.getElementById("positions-body");
    const count = document.getElementById("pos-count");
    if (count) count.textContent = String((s.predictions || []).length);
    if (!body) return;
    if (!s.predictions.length) {
      body.innerHTML = `<tr class="empty-row"><td colspan="7">尚无预测简 — 在潮汐区投递一简</td></tr>`;
      return;
    }
    body.innerHTML = s.predictions
      .map((p) => {
        return `<tr>
          <td class="mono">${p.id}</td>
          <td>${p.sym}</td>
          <td>${DIR_LABEL[p.direction] || p.direction}</td>
          <td class="mono">0.00</td>
          <td class="mono">0.00</td>
          <td class="pnl-flat">— · 样本不足</td>
          <td>${p.status}</td>
        </tr>`;
      })
      .join("");
  }

  function renderBoards() {
    const s = ensureState();
    const c = document.getElementById("board-contrib");
    const a = document.getElementById("board-accuracy");
    const empty = `<tr class="empty-row"><td colspan="4">暂无贡献者 · 等待第一位创世居民</td></tr>`;
    if (c) {
      if (!s.joined) {
        c.innerHTML = empty;
      } else {
        c.innerHTML = `<tr>
          <td class="rank">#1</td>
          <td>${s.citizenId}（本机）</td>
          <td style="color:#a88b86;font-size:12px">${s.life ? "生命年表" : "创世登记"}</td>
          <td class="pts">${formatInt(s.points)}</td>
        </tr>`;
      }
    }
    if (a) {
      if (!s.predictions.length) {
        a.innerHTML = `<tr class="empty-row"><td colspan="4">暂无准确率数据 · n=0</td></tr>`;
      } else {
        a.innerHTML = `<tr>
          <td class="rank">#1</td>
          <td>${s.citizenId || "本机"}（本机）</td>
          <td class="mono">— · 待结算</td>
          <td>${(s.badges || []).includes("准心印") ? "准心印" : "—"}</td>
        </tr>
        <tr class="empty-row"><td colspan="4">全局准确率样本 n=0 · 数据不足</td></tr>`;
      }
    }
  }

  function demoBazi(dateStr, hour) {
    if (!dateStr) return "";
    const hourLabel = hour || "时辰未知";
    return [
      `出生：${dateStr} · ${hourLabel}`,
      `校验状态：已收入本机年表`,
      `聚合对照：n=0 · 数据不足（无全球样本可对齐）`,
      `用途：研究假说对照，不输出吉凶断言或虚构命中率`,
      `健康自我报告：仅本机标签，非正式医疗意见`,
    ].join("\n");
  }

  function submitLife(form) {
    const s = ensureState();
    if (!s.joined) {
      toast("请先进入宇宙（免费登记）");
      openWelcome();
      return;
    }
    if (s.life) {
      toast("本机已提交过年表（不重复加分）");
      return;
    }
    const fd = new FormData(form);
    const birthDate = fd.get("birthDate");
    const birthHour = fd.get("birthHour") || "";
    const city = (fd.get("city") || "").toString().trim();
    const tags = fd.getAll("healthTags");
    const text =
      demoBazi(birthDate, birthHour) +
      (city ? `\n大致出生地：${city}` : "") +
      (tags.length ? `\n健康自评标签（本机）：${tags.join(", ")}` : "");
    s.life = { birthDate, birthHour, city, tags, baziText: text };
    s.points += LIFE_BONUS;
    if (!s.badges.includes("同生雷达")) s.badges.push("同生雷达");
    save(s);
    toast("年表已记入 · +120 创世值 · 同生匹配仍为 0（无后端聚合）");
    paintCitizen();
    renderBoards();
  }

  function simInvite() {
    const s = ensureState();
    if (!s.joined) {
      toast("请先进入宇宙");
      openWelcome();
      return;
    }
    if (s.inviteMonth.used >= INVITE_MONTH_CAP) {
      toast("本月邀请已达上限（防 MLM）");
      return;
    }
    s.inviteMonth.used += 1;
    s.points += INVITE_BONUS;
    // Do NOT increment residentTotal — invite is simulated credit only, no fake users
    save(s);
    toast("模拟一级邀请奖励 +200 创世值（未增加虚构居民数）");
    paintCitizen();
    renderBoards();
  }

  function nextFridaySettle() {
    const d = new Date();
    const day = d.getDay();
    let add = (5 - day + 7) % 7;
    const target = new Date(d);
    target.setHours(20, 0, 0, 0);
    if (add === 0 && d >= target) add = 7;
    target.setDate(target.getDate() + add);
    return target;
  }
  function paintSettle() {
    const el = document.getElementById("settle-countdown");
    if (!el) return;
    const t = nextFridaySettle();
    const ms = t - Date.now();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    el.textContent = `距下次准确率结算 ${h} 时 ${m} 分（周五 20:00 CST）· 当前可结算样本 n=0`;
  }
  function paintClock() {
    const el = document.getElementById("desk-clock");
    if (!el) return;
    el.textContent = new Date().toLocaleString("zh-CN", { hour12: false }) + " CST";
  }

  function placePopover(anchor) {
    const pop = document.getElementById("help-popover");
    if (!pop) return;
    const r = anchor.getBoundingClientRect();
    let top = r.bottom + 8;
    let left = r.left;
    pop.hidden = false;
    const pw = pop.offsetWidth;
    const ph = pop.offsetHeight;
    if (left + pw > window.innerWidth - 12) left = window.innerWidth - pw - 12;
    if (left < 12) left = 12;
    if (top + ph > window.innerHeight - 12) top = Math.max(12, r.top - ph - 8);
    pop.style.top = top + "px";
    pop.style.left = left + "px";
  }
  function openHelp(id, anchor) {
    const data = HELP[id];
    if (!data) return;
    document.getElementById("help-popover-title").textContent = data.title;
    document.getElementById("help-popover-body").innerHTML = data.body;
    placePopover(anchor);
  }
  function closeHelp() {
    const pop = document.getElementById("help-popover");
    if (pop) pop.hidden = true;
  }

  function maybeOffline() {
    const params = new URLSearchParams(location.search);
    if (params.get("offline") === "1") document.body.classList.add("show-offline-hero");
    if (params.get("compact") === "1") document.body.classList.add("compact-shot");
    document.getElementById("live-iframe")?.addEventListener("error", () => {
      document.body.classList.add("show-offline-hero");
    });
  }

  function wire() {
    document.getElementById("btn-welcome-join")?.addEventListener("click", joinUniverse);
    document.getElementById("btn-welcome-later")?.addEventListener("click", closeWelcome);

    document.getElementById("predict-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      addPrediction(fd.get("symbol"), fd.get("direction"), fd.get("note"));
      e.target.reset();
      const sym = document.getElementById("pred-symbol");
      if (sym) sym.value = "LOVE";
    });
    document.getElementById("pred-symbol")?.addEventListener("change", updateTide);

    document.getElementById("btn-clear-preds")?.addEventListener("click", () => {
      const s = ensureState();
      s.predictions = [];
      save(s);
      renderPositions();
      renderBoards();
      paintCitizen();
      toast("本机预测已清空");
    });

    document.getElementById("life-data-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      submitLife(e.target);
    });

    document.getElementById("btn-copy-invite")?.addEventListener("click", async () => {
      const s = ensureState();
      try {
        await navigator.clipboard.writeText(s.inviteCode);
        toast("邀请符已复制");
      } catch {
        toast(s.inviteCode);
      }
    });
    document.getElementById("btn-sim-invite")?.addEventListener("click", simInvite);

    document.querySelectorAll(".help-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openHelp(btn.getAttribute("data-help"), btn);
      });
    });
    document.getElementById("help-close")?.addEventListener("click", closeHelp);
    document.addEventListener("click", (e) => {
      const pop = document.getElementById("help-popover");
      if (!pop || pop.hidden) return;
      if (!pop.contains(e.target) && !e.target.closest(".help-btn")) closeHelp();
    });
    window.addEventListener("scroll", closeHelp, { passive: true });
  }

  function boot() {
    maybeOffline();
    renderQuotes();
    renderBoards();
    renderPositions();
    paintCitizen();
    paintSettle();
    paintClock();
    wire();
    const s = ensureState();
    if (!s.seenWelcome) setTimeout(openWelcome, 400);
    // No fake quote ticker — universe stays at 0
    setInterval(paintSettle, 30000);
    setInterval(paintClock, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
