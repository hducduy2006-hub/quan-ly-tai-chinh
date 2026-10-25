/**
 * ============================================================================
 * BỘ QUẢN LÝ DỮ LIỆU & TÍNH TOÁN TÀI CHÍNH (js/store.js)
 * ============================================================================
 * Chịu trách nhiệm lưu trữ LocalStorage, tính số dư ví, thống kê ngân sách,
 * và Xuất/Nhập dữ liệu (JSON & Excel CSV chuẩn tiếng Việt UTF-8 BOM).
 */

(function () {
  const CONFIG = window.APP_CONFIG;

  function uid(prefix = 'id') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function toDateStr(year, monthIndex, day) {
    const maxDay = new Date(year, monthIndex + 1, 0).getDate();
    const safeDay = Math.min(Math.max(1, day), maxDay);
    return `${year}-${pad2(monthIndex + 1)}-${pad2(safeDay)}`;
  }

  function getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
  }

  function getTodayStr() {
    const now = new Date();
    return toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
  }

  /**
   * Tạo bộ dữ liệu mẫu thực tế xoay quanh tháng hiện tại để người dùng
   * thấy ngay biểu đồ, số dư ví và cảnh báo ngân sách khi mở app lần đầu.
   */
  function generateDemoTransactions() {
    const now = new Date();
    const curY = now.getFullYear();
    const curM = now.getMonth();
    const curDay = now.getDate();

    const txs = [];
    const addSample = (monthOffset, day, type, amount, categoryId, walletId, note, toWalletId = '') => {
      const target = new Date(curY, curM + monthOffset, 1);
      const y = target.getFullYear();
      const m = target.getMonth();
      // Với tháng hiện tại, ưu tiên ngày <= hôm nay để hợp lý
      const adjustedDay = monthOffset === 0 ? Math.min(day, Math.max(1, curDay)) : day;
      txs.push({
        id: uid('tx'),
        type,
        amount,
        date: toDateStr(y, m, adjustedDay),
        categoryId: type === 'transfer' ? '' : categoryId,
        walletId,
        toWalletId: type === 'transfer' ? toWalletId : '',
        note,
        createdAt: Date.now() - Math.abs(monthOffset) * 86400000
      });
    };

    // 4 tháng trước -> tháng trước để biểu đồ xu hướng 6 tháng sinh động
    const historyPlans = [
      { offset: -4, salary: 18000000, side: 2500000, rent: 4500000, food: 3600000, shop: 1400000, trans: 950000, ent: 900000 },
      { offset: -3, salary: 18000000, side: 1800000, rent: 4500000, food: 3900000, shop: 2200000, trans: 1100000, ent: 1200000 },
      { offset: -2, salary: 18500000, side: 3200000, rent: 4600000, food: 3750000, shop: 1650000, trans: 1050000, ent: 800000 },
      { offset: -1, salary: 18500000, side: 2900000, rent: 4600000, food: 4100000, shop: 1950000, trans: 1150000, ent: 1450000 }
    ];

    historyPlans.forEach((p) => {
      addSample(p.offset, 5, 'income', p.salary, 'c_salary', 'w_bank', 'Lương chính chuyển khoản');
      addSample(p.offset, 18, 'income', p.side, 'c_freelance', 'w_bank', 'Thu nhập dự án ngoài');
      addSample(p.offset, 6, 'expense', p.rent, 'c_housing', 'w_bank', 'Tiền thuê nhà & điện nước');
      addSample(p.offset, 12, 'expense', Math.round(p.food * 0.55), 'c_food', 'w_ewallet', 'Đi siêu thị & ăn uống nửa đầu tháng');
      addSample(p.offset, 24, 'expense', Math.round(p.food * 0.45), 'c_food', 'w_cash', 'Ăn uống & cafe nửa cuối tháng');
      addSample(p.offset, 15, 'expense', p.shop, 'c_shopping', 'w_ewallet', 'Mua sắm đồ dùng cá nhân');
      addSample(p.offset, 20, 'expense', p.trans, 'c_transport', 'w_cash', 'Đổ xăng & gửi xe');
      addSample(p.offset, 26, 'expense', p.ent, 'c_entertain', 'w_ewallet', 'Xem phim & tụ tập cuối tuần');
    });

    // Giao dịch chi tiết trong tháng hiện tại
    addSample(0, 1, 'income', 19000000, 'c_salary', 'w_bank', 'Lương tháng này');
    addSample(0, 3, 'expense', 4600000, 'c_housing', 'w_bank', 'Tiền nhà & phí dịch vụ');
    addSample(0, 4, 'transfer', 2000000, '', 'w_bank', 'Nạp tiền sang Ví điện tử chi tiêu', 'w_ewallet');
    addSample(0, 5, 'expense', 65000, 'c_food', 'w_cash', 'Phở bò & trà đá sáng');
    addSample(0, 6, 'expense', 420000, 'c_bills', 'w_ewallet', 'Cước Internet & gói 4G');
    addSample(0, 8, 'expense', 1250000, 'c_food', 'w_ewallet', 'Đi siêu thị mua thực phẩm tuần');
    addSample(0, 10, 'income', 3500000, 'c_freelance', 'w_bank', 'Thanh toán dự án thiết kế / freelance');
    addSample(0, 11, 'expense', 350000, 'c_transport', 'w_cash', 'Đổ xăng & thay nhớt xe');
    addSample(0, 13, 'expense', 1680000, 'c_shopping', 'w_bank', 'Mua giày thể thao & áo sơ mi');
    addSample(0, 15, 'expense', 580000, 'c_health', 'w_ewallet', 'Thẻ tập gym & vitamin');
    addSample(0, 17, 'expense', 890000, 'c_food', 'w_cash', 'Liên hoan cuối tuần cùng bạn bè');
    addSample(0, 19, 'expense', 450000, 'c_education', 'w_bank', 'Mua sách & khóa học online');
    addSample(0, 21, 'income', 850000, 'c_invest', 'w_bank', 'Tiền lãi tiết kiệm định kỳ');
    addSample(0, 22, 'expense', 720000, 'c_entertain', 'w_ewallet', 'Vé xem phim & cafe tối');

    return txs.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  }

  function createInitialState(withDemo = false) {
    const wallets = JSON.parse(JSON.stringify(CONFIG.defaultWallets));
    if (withDemo) {
      const demoInit = { w_cash: 15000000, w_bank: 20000000, w_ewallet: 22000000 };
      wallets.forEach((w) => {
        if (demoInit[w.id] !== undefined) w.initialBalance = demoInit[w.id];
      });
    }
    return {
      version: 1,
      isDemoData: withDemo,
      settings: JSON.parse(JSON.stringify(CONFIG.defaultSettings)),
      wallets,
      categories: JSON.parse(JSON.stringify(CONFIG.defaultCategories)),
      transactions: withDemo ? generateDemoTransactions() : []
    };
  }

  class FinanceStore {
    constructor() {
      this.listeners = [];
      this.state = this.load();
    }

    load() {
      try {
        const raw = localStorage.getItem(CONFIG.storageKey);
        if (!raw) {
          const initial = createInitialState(false);
          this.persistRaw(initial);
          return initial;
        }
        const parsed = JSON.parse(raw);
        return {
          version: 1,
          isDemoData: Boolean(parsed.isDemoData),
          settings: { ...CONFIG.defaultSettings, ...(parsed.settings || {}) },
          wallets: Array.isArray(parsed.wallets) && parsed.wallets.length > 0
            ? parsed.wallets
            : JSON.parse(JSON.stringify(CONFIG.defaultWallets)),
          categories: Array.isArray(parsed.categories) && parsed.categories.length > 0
            ? parsed.categories
            : JSON.parse(JSON.stringify(CONFIG.defaultCategories)),
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : []
        };
      } catch (err) {
        console.warn('Không thể đọc dữ liệu cũ, khởi tạo mặc định:', err);
        return createInitialState(false);
      }
    }

    persistRaw(stateObj) {
      try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(stateObj));
      } catch (err) {
        console.error('Lỗi lưu trữ LocalStorage:', err);
      }
    }

    save() {
      this.persistRaw(this.state);
      this.notify();
    }

    subscribe(fn) {
      this.listeners.push(fn);
      return () => {
        this.listeners = this.listeners.filter((l) => l !== fn);
      };
    }

    notify() {
      this.listeners.forEach((fn) => fn(this.state));
    }

    // -------------------------------------------------------------------------
    // ĐỊNH DẠNG TIỀN TỆ & NGÀY THÁNG
    // -------------------------------------------------------------------------
    getCurrencyInfo() {
      const code = this.state.settings.currency || 'VND';
      return CONFIG.currencies[code] || CONFIG.currencies.VND;
    }

    formatCurrency(amount, showSign = false) {
      const num = Number(amount) || 0;
      const cur = this.getCurrencyInfo();
      const absVal = Math.abs(num);

      let formatted;
      try {
        formatted = new Intl.NumberFormat(cur.locale, {
          minimumFractionDigits: cur.decimals,
          maximumFractionDigits: cur.decimals
        }).format(absVal);
      } catch (_) {
        formatted = absVal.toFixed(cur.decimals);
      }

      const withSymbol = cur.code === 'VND'
        ? `${formatted} ${cur.symbol}`
        : `${cur.symbol}${formatted}`;

      if (num < 0) return `-${withSymbol}`;
      if (showSign && num > 0) return `+${withSymbol}`;
      return withSymbol;
    }

    formatCompact(amount) {
      const num = Number(amount) || 0;
      const abs = Math.abs(num);
      const sign = num < 0 ? '-' : '';
      const cur = this.getCurrencyInfo();

      if (cur.code === 'VND') {
        if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(1).replace(/\.0$/, '')} tỷ`;
        if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(1).replace(/\.0$/, '')} tr`;
        if (abs >= 1e3) return `${sign}${Math.round(abs / 1e3)}k`;
        return `${sign}${abs} ₫`;
      }
      if (abs >= 1e6) return `${sign}${cur.symbol}${(abs / 1e6).toFixed(1)}M`;
      if (abs >= 1e3) return `${sign}${cur.symbol}${(abs / 1e3).toFixed(1)}K`;
      return this.formatCurrency(num);
    }

    // -------------------------------------------------------------------------
    // QUẢN LÝ CÀI ĐẶT TÙY CHỈNH
    // -------------------------------------------------------------------------
    updateSettings(partial) {
      this.state.settings = { ...this.state.settings, ...partial };
      this.save();
    }

    dismissDemoBanner() {
      this.state.isDemoData = false;
      this.save();
    }

    startFresh(zeroWallets = true) {
      this.state.transactions = [];
      this.state.isDemoData = false;
      if (zeroWallets) {
        this.state.wallets = this.state.wallets.map((w) => ({ ...w, initialBalance: 0 }));
      }
      this.save();
    }

    loadDemoData() {
      const demo = createInitialState(true);
      demo.settings = { ...this.state.settings };
      this.state = demo;
      this.save();
    }

    resetAllToFactory() {
      this.state = createInitialState(false);
      this.state.wallets = this.state.wallets.map((w) => ({ ...w, initialBalance: 0 }));
      this.save();
    }

    // -------------------------------------------------------------------------
    // QUẢN LÝ VÍ / TÀI KHOẢN
    // -------------------------------------------------------------------------
    getWalletById(id) {
      return this.state.wallets.find((w) => w.id === id) || null;
    }

    getWalletsWithBalances() {
      const balances = {};
      const stats = {};

      this.state.wallets.forEach((w) => {
        balances[w.id] = Number(w.initialBalance) || 0;
        stats[w.id] = { income: 0, expense: 0, transferIn: 0, transferOut: 0, txCount: 0 };
      });

      this.state.transactions.forEach((tx) => {
        const amt = Number(tx.amount) || 0;
        if (tx.type === 'income' && balances[tx.walletId] !== undefined) {
          balances[tx.walletId] += amt;
          stats[tx.walletId].income += amt;
          stats[tx.walletId].txCount += 1;
        } else if (tx.type === 'expense' && balances[tx.walletId] !== undefined) {
          balances[tx.walletId] -= amt;
          stats[tx.walletId].expense += amt;
          stats[tx.walletId].txCount += 1;
        } else if (tx.type === 'transfer') {
          if (balances[tx.walletId] !== undefined) {
            balances[tx.walletId] -= amt;
            stats[tx.walletId].transferOut += amt;
            stats[tx.walletId].txCount += 1;
          }
          if (tx.toWalletId && balances[tx.toWalletId] !== undefined) {
            balances[tx.toWalletId] += amt;
            stats[tx.toWalletId].transferIn += amt;
            stats[tx.toWalletId].txCount += 1;
          }
        }
      });

      return this.state.wallets.map((w) => ({
        ...w,
        currentBalance: balances[w.id] || 0,
        stats: stats[w.id]
      }));
    }

    getTotalNetWorth() {
      return this.getWalletsWithBalances().reduce((sum, w) => sum + w.currentBalance, 0);
    }

    addWallet(data) {
      const wallet = {
        id: uid('w'),
        name: (data.name || 'Ví mới').trim(),
        type: data.type || 'cash',
        icon: data.icon || '👛',
        color: data.color || '#3b82f6',
        initialBalance: Number(data.initialBalance) || 0
      };
      this.state.wallets.push(wallet);
      this.save();
      return wallet;
    }

    updateWallet(id, data) {
      const idx = this.state.wallets.findIndex((w) => w.id === id);
      if (idx === -1) return false;
      this.state.wallets[idx] = {
        ...this.state.wallets[idx],
        name: data.name !== undefined ? data.name.trim() : this.state.wallets[idx].name,
        type: data.type || this.state.wallets[idx].type,
        icon: data.icon || this.state.wallets[idx].icon,
        color: data.color || this.state.wallets[idx].color,
        initialBalance: data.initialBalance !== undefined
          ? Number(data.initialBalance) || 0
          : this.state.wallets[idx].initialBalance
      };
      this.save();
      return true;
    }

    deleteWallet(id) {
      if (this.state.wallets.length <= 1) {
        throw new Error('Cần giữ lại ít nhất 1 ví để ghi chép giao dịch.');
      }
      const fallbackWallet = this.state.wallets.find((w) => w.id !== id);
      // Chuyển giao dịch của ví bị xóa sang ví dự phòng hoặc xóa các giao dịch chuyển cùng ví
      this.state.transactions = this.state.transactions
        .map((tx) => {
          const updated = { ...tx };
          if (updated.walletId === id) updated.walletId = fallbackWallet.id;
          if (updated.toWalletId === id) updated.toWalletId = fallbackWallet.id;
          return updated;
        })
        .filter((tx) => !(tx.type === 'transfer' && tx.walletId === tx.toWalletId));

      this.state.wallets = this.state.wallets.filter((w) => w.id !== id);
      this.save();
    }

    // -------------------------------------------------------------------------
    // QUẢN LÝ DANH MỤC & HẠN MỨC NGÂN SÁCH
    // -------------------------------------------------------------------------
    getCategoryById(id) {
      return this.state.categories.find((c) => c.id === id) || null;
    }

    getCategoriesByType(type) {
      if (!type || type === 'all') return this.state.categories;
      return this.state.categories.filter((c) => c.type === type);
    }

    addCategory(data) {
      const cat = {
        id: uid('c'),
        name: (data.name || 'Danh mục mới').trim(),
        type: data.type === 'income' ? 'income' : 'expense',
        icon: data.icon || '🏷️',
        color: data.color || '#6366f1',
        budget: data.type === 'income' ? 0 : Math.max(0, Number(data.budget) || 0)
      };
      this.state.categories.push(cat);
      this.save();
      return cat;
    }

    updateCategory(id, data) {
      const idx = this.state.categories.findIndex((c) => c.id === id);
      if (idx === -1) return false;
      const existing = this.state.categories[idx];
      const nextType = data.type || existing.type;
      this.state.categories[idx] = {
        ...existing,
        name: data.name !== undefined ? data.name.trim() : existing.name,
        type: nextType,
        icon: data.icon || existing.icon,
        color: data.color || existing.color,
        budget: nextType === 'income'
          ? 0
          : (data.budget !== undefined ? Math.max(0, Number(data.budget) || 0) : existing.budget)
      };
      this.save();
      return true;
    }

    deleteCategory(id) {
      const target = this.getCategoryById(id);
      if (!target) return;
      const sameType = this.state.categories.filter((c) => c.type === target.type && c.id !== id);
      if (sameType.length === 0) {
        throw new Error('Cần giữ lại ít nhất 1 danh mục thuộc nhóm này.');
      }
      const fallback = sameType[sameType.length - 1];
      this.state.transactions = this.state.transactions.map((tx) =>
        tx.categoryId === id ? { ...tx, categoryId: fallback.id } : tx
      );
      this.state.categories = this.state.categories.filter((c) => c.id !== id);
      this.save();
    }

    // -------------------------------------------------------------------------
    // QUẢN LÝ GIAO DỊCH (THÊM / SỬA / XÓA / NHÂN BẢN / LỌC)
    // -------------------------------------------------------------------------
    addTransaction(data) {
      const tx = {
        id: uid('tx'),
        type: ['income', 'expense', 'transfer'].includes(data.type) ? data.type : 'expense',
        amount: Math.abs(Number(data.amount) || 0),
        date: data.date || getTodayStr(),
        categoryId: data.type === 'transfer' ? '' : data.categoryId,
        walletId: data.walletId,
        toWalletId: data.type === 'transfer' ? data.toWalletId : '',
        note: (data.note || '').trim(),
        createdAt: Date.now()
      };
      this.state.transactions.unshift(tx);
      this.state.isDemoData = false;
      this.save();
      return tx;
    }

    updateTransaction(id, data) {
      const idx = this.state.transactions.findIndex((t) => t.id === id);
      if (idx === -1) return false;
      const old = this.state.transactions[idx];
      const nextType = ['income', 'expense', 'transfer'].includes(data.type) ? data.type : old.type;
      this.state.transactions[idx] = {
        ...old,
        type: nextType,
        amount: data.amount !== undefined ? Math.abs(Number(data.amount) || 0) : old.amount,
        date: data.date || old.date,
        categoryId: nextType === 'transfer' ? '' : (data.categoryId ?? old.categoryId),
        walletId: data.walletId || old.walletId,
        toWalletId: nextType === 'transfer' ? (data.toWalletId || old.toWalletId) : '',
        note: data.note !== undefined ? data.note.trim() : old.note
      };
      this.save();
      return true;
    }

    deleteTransaction(id) {
      this.state.transactions = this.state.transactions.filter((t) => t.id !== id);
      this.save();
    }

    duplicateTransaction(id) {
      const orig = this.state.transactions.find((t) => t.id === id);
      if (!orig) return null;
      const copy = {
        ...orig,
        id: uid('tx'),
        date: getTodayStr(),
        note: orig.note ? `${orig.note} (bản sao)` : 'Giao dịch nhân bản',
        createdAt: Date.now()
      };
      this.state.transactions.unshift(copy);
      this.save();
      return copy;
    }

    getFilteredTransactions(filters = {}) {
      const {
        monthKey = 'all',
        dateFrom = '',
        dateTo = '',
        search = '',
        type = 'all',
        walletId = 'all',
        categoryId = 'all',
        sortBy = 'date_desc'
      } = filters;

      const keyword = search.trim().toLowerCase();

      const list = this.state.transactions.filter((tx) => {
        if (monthKey && monthKey !== 'all') {
          if (!tx.date || !tx.date.startsWith(monthKey)) return false;
        }
        if (dateFrom && tx.date < dateFrom) return false;
        if (dateTo && tx.date > dateTo) return false;
        if (type !== 'all' && tx.type !== type) return false;
        if (walletId !== 'all' && tx.walletId !== walletId && tx.toWalletId !== walletId) return false;
        if (categoryId !== 'all' && tx.categoryId !== categoryId) return false;

        if (keyword) {
          const cat = this.getCategoryById(tx.categoryId);
          const wallet = this.getWalletById(tx.walletId);
          const toWallet = tx.toWalletId ? this.getWalletById(tx.toWalletId) : null;
          const haystack = [
            tx.note || '',
            cat ? cat.name : '',
            wallet ? wallet.name : '',
            toWallet ? toWallet.name : '',
            String(tx.amount)
          ].join(' ').toLowerCase();
          if (!haystack.includes(keyword)) return false;
        }
        return true;
      });

      list.sort((a, b) => {
        switch (sortBy) {
          case 'date_asc':
            return a.date.localeCompare(b.date) || (a.createdAt - b.createdAt);
          case 'amount_desc':
            return b.amount - a.amount;
          case 'amount_asc':
            return a.amount - b.amount;
          case 'date_desc':
          default:
            return b.date.localeCompare(a.date) || (b.createdAt - a.createdAt);
        }
      });

      return list;
    }

    // -------------------------------------------------------------------------
    // BÁO CÁO, THỐNG KÊ & NGÂN SÁCH
    // -------------------------------------------------------------------------
    getPeriodSummary(monthKey = 'all') {
      const txs = this.getFilteredTransactions({ monthKey });
      let income = 0;
      let expense = 0;
      let transfer = 0;

      txs.forEach((tx) => {
        const amt = Number(tx.amount) || 0;
        if (tx.type === 'income') income += amt;
        else if (tx.type === 'expense') expense += amt;
        else if (tx.type === 'transfer') transfer += amt;
      });

      const net = income - expense;
      const savingsRate = income > 0 ? ((net / income) * 100) : 0;

      return {
        income,
        expense,
        transfer,
        net,
        savingsRate,
        txCount: txs.length
      };
    }

    getCategoryBreakdown(monthKey = 'all', type = 'expense') {
      const cats = this.getCategoriesByType(type);
      const txs = this.getFilteredTransactions({ monthKey, type });

      const map = {};
      cats.forEach((c) => {
        map[c.id] = {
          ...c,
          amount: 0,
          count: 0,
          share: 0,
          budgetPercent: 0,
          remainingBudget: c.budget > 0 ? c.budget : 0
        };
      });

      let grandTotal = 0;
      txs.forEach((tx) => {
        const amt = Number(tx.amount) || 0;
        grandTotal += amt;
        if (!map[tx.categoryId]) {
          map[tx.categoryId] = {
            id: tx.categoryId || 'uncategorized',
            name: 'Chưa phân loại',
            type,
            icon: '🏷️',
            color: '#94a3b8',
            budget: 0,
            amount: 0,
            count: 0,
            share: 0,
            budgetPercent: 0,
            remainingBudget: 0
          };
        }
        map[tx.categoryId].amount += amt;
        map[tx.categoryId].count += 1;
      });

      const items = Object.values(map).map((item) => {
        const share = grandTotal > 0 ? (item.amount / grandTotal) * 100 : 0;
        const budgetPercent = item.budget > 0 ? (item.amount / item.budget) * 100 : 0;
        const remainingBudget = item.budget > 0 ? item.budget - item.amount : 0;
        return {
          ...item,
          share,
          budgetPercent,
          remainingBudget
        };
      });

      items.sort((a, b) => b.amount - a.amount || b.budget - a.budget);
      return { items, grandTotal };
    }

    getMonthlyTrend(anchorMonthKey, count = 6) {
      let year, monthIdx;
      if (anchorMonthKey && anchorMonthKey !== 'all') {
        const [y, m] = anchorMonthKey.split('-').map(Number);
        year = y;
        monthIdx = m - 1;
      } else {
        const now = new Date();
        year = now.getFullYear();
        monthIdx = now.getMonth();
      }

      const result = [];
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(year, monthIdx - i, 1);
        const mk = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
        const summary = this.getPeriodSummary(mk);
        result.push({
          monthKey: mk,
          label: `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`,
          fullLabel: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`,
          income: summary.income,
          expense: summary.expense,
          net: summary.net
        });
      }
      return result;
    }

    getDailySpending(monthKey) {
      const mk = (!monthKey || monthKey === 'all') ? getCurrentMonthKey() : monthKey;
      const [y, m] = mk.split('-').map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();

      const days = Array.from({ length: daysInMonth }, (_, idx) => ({
        day: idx + 1,
        date: `${mk}-${pad2(idx + 1)}`,
        expense: 0,
        income: 0
      }));

      const txs = this.getFilteredTransactions({ monthKey: mk });
      txs.forEach((tx) => {
        const dayNum = Number(tx.date.slice(8, 10));
        if (dayNum >= 1 && dayNum <= daysInMonth) {
          if (tx.type === 'expense') days[dayNum - 1].expense += Number(tx.amount) || 0;
          if (tx.type === 'income') days[dayNum - 1].income += Number(tx.amount) || 0;
        }
      });

      return { monthKey: mk, days };
    }

    // -------------------------------------------------------------------------
    // SAO LƯU & XUẤT / NHẬP FILE (JSON & CSV EXCEL TIẾNG VIỆT)
    // -------------------------------------------------------------------------
    exportJSON() {
      const payload = {
        app: 'FinFlow Personal Finance',
        exportedAt: new Date().toISOString(),
        version: 1,
        data: {
          settings: this.state.settings,
          wallets: this.state.wallets,
          categories: this.state.categories,
          transactions: this.state.transactions
        }
      };
      return JSON.stringify(payload, null, 2);
    }

    importJSON(rawText) {
      const parsed = JSON.parse(rawText);
      const source = parsed.data ? parsed.data : parsed;

      if (!Array.isArray(source.wallets) || !Array.isArray(source.categories) || !Array.isArray(source.transactions)) {
        throw new Error('File JSON không đúng định dạng bản sao lưu của ứng dụng.');
      }

      this.state = {
        version: 1,
        isDemoData: false,
        settings: { ...CONFIG.defaultSettings, ...(source.settings || {}) },
        wallets: source.wallets,
        categories: source.categories,
        transactions: source.transactions
      };
      this.save();
      return this.state.transactions.length;
    }

    exportCSV(monthKey = 'all') {
      const txs = this.getFilteredTransactions({ monthKey, sortBy: 'date_desc' });
      const escapeCSV = (val) => {
        const str = String(val ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const typeLabel = { income: 'Thu nhập', expense: 'Chi tiêu', transfer: 'Chuyển ví' };
      const headers = ['Ngày', 'Loại giao dịch', 'Số tiền', 'Đơn vị', 'Danh mục', 'Ví nguồn', 'Ví đích', 'Ghi chú'];
      const rows = [headers.join(',')];
      const curCode = this.state.settings.currency || 'VND';

      txs.forEach((tx) => {
        const cat = tx.categoryId ? this.getCategoryById(tx.categoryId) : null;
        const wallet = this.getWalletById(tx.walletId);
        const toWallet = tx.toWalletId ? this.getWalletById(tx.toWalletId) : null;

        rows.push([
          escapeCSV(tx.date),
          escapeCSV(typeLabel[tx.type] || tx.type),
          escapeCSV(tx.amount),
          escapeCSV(curCode),
          escapeCSV(cat ? cat.name : (tx.type === 'transfer' ? 'Chuyển nội bộ' : '')),
          escapeCSV(wallet ? wallet.name : ''),
          escapeCSV(toWallet ? toWallet.name : ''),
          escapeCSV(tx.note || '')
        ].join(','));
      });

      // Thêm BOM \uFEFF để Microsoft Excel hiển thị chuẩn tiếng Việt có dấu
      return '\uFEFF' + rows.join('\r\n');
    }

    importCSV(csvText) {
      const clean = csvText.replace(/^\uFEFF/, '').trim();
      if (!clean) throw new Error('File CSV trống.');

      const lines = this.parseCSVLines(clean);
      if (lines.length < 2) throw new Error('File CSV không có dòng dữ liệu giao dịch nào.');

      const defaultWallet = this.state.wallets[0];
      let importedCount = 0;

      // Bỏ qua dòng tiêu đề đầu tiên
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i];
        if (!cols || cols.length < 3) continue;

        const rawDate = (cols[0] || '').trim();
        const rawType = (cols[1] || '').trim().toLowerCase();
        const rawAmount = String(cols[2] || '').replace(/[^\d.-]/g, '');
        const amount = Math.abs(Number(rawAmount));
        if (!amount || Number.isNaN(amount)) continue;

        // Hỗ trợ cả định dạng 8 cột (của app xuất ra) hoặc 6 cột cơ bản
        const hasCurrencyCol = cols.length >= 8;
        const catName = (cols[hasCurrencyCol ? 4 : 3] || '').trim();
        const walletName = (cols[hasCurrencyCol ? 5 : 4] || '').trim();
        const toWalletName = hasCurrencyCol ? (cols[6] || '').trim() : '';
        const note = (cols[hasCurrencyCol ? 7 : 5] || '').trim();

        let type = 'expense';
        if (rawType.includes('thu') || rawType === 'income') type = 'income';
        else if (rawType.includes('chuyển') || rawType === 'transfer') type = 'transfer';

        // Chuẩn hóa ngày (YYYY-MM-DD hoặc DD/MM/YYYY)
        let dateStr = getTodayStr();
        if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          dateStr = rawDate;
        } else if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(rawDate)) {
          const [d, m, y] = rawDate.split(/[/-]/).map(Number);
          dateStr = `${y}-${pad2(m)}-${pad2(d)}`;
        }

        // Tìm hoặc tạo Ví nguồn
        let wallet = this.state.wallets.find((w) => w.name.toLowerCase() === walletName.toLowerCase());
        if (!wallet && walletName) {
          wallet = { id: uid('w'), name: walletName, type: 'cash', icon: '👛', color: '#3b82f6', initialBalance: 0 };
          this.state.wallets.push(wallet);
        }
        const walletId = wallet ? wallet.id : defaultWallet.id;

        // Tìm Ví đích nếu là chuyển ví
        let toWalletId = '';
        if (type === 'transfer') {
          let toW = this.state.wallets.find((w) => w.name.toLowerCase() === toWalletName.toLowerCase());
          if (!toW) {
            toW = this.state.wallets.find((w) => w.id !== walletId) || defaultWallet;
          }
          toWalletId = toW.id;
        }

        // Tìm hoặc tạo Danh mục
        let categoryId = '';
        if (type !== 'transfer') {
          let cat = this.state.categories.find(
            (c) => c.type === type && c.name.toLowerCase() === catName.toLowerCase()
          );
          if (!cat && catName) {
            cat = {
              id: uid('c'),
              name: catName,
              type,
              icon: type === 'income' ? '💰' : '🏷️',
              color: type === 'income' ? '#10b981' : '#6366f1',
              budget: 0
            };
            this.state.categories.push(cat);
          }
          if (!cat) {
            const fallback = this.getCategoriesByType(type)[0];
            cat = fallback;
          }
          categoryId = cat ? cat.id : '';
        }

        this.state.transactions.push({
          id: uid('tx'),
          type,
          amount,
          date: dateStr,
          categoryId,
          walletId,
          toWalletId,
          note,
          createdAt: Date.now() + i
        });
        importedCount += 1;
      }

      if (importedCount === 0) {
        throw new Error('Không tìm thấy dòng giao dịch hợp lệ nào trong file CSV.');
      }

      this.state.isDemoData = false;
      this.save();
      return importedCount;
    }

    parseCSVLines(text) {
      const rows = [];
      let currentRow = [];
      let currentVal = '';
      let inQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const next = text[i + 1];

        if (inQuotes) {
          if (ch === '"' && next === '"') {
            currentVal += '"';
            i++;
          } else if (ch === '"') {
            inQuotes = false;
          } else {
            currentVal += ch;
          }
        } else {
          if (ch === '"') {
            inQuotes = true;
          } else if (ch === ',') {
            currentRow.push(currentVal);
            currentVal = '';
          } else if (ch === '\r' && next === '\n') {
            currentRow.push(currentVal);
            rows.push(currentRow);
            currentRow = [];
            currentVal = '';
            i++;
          } else if (ch === '\n' || ch === '\r') {
            currentRow.push(currentVal);
            rows.push(currentRow);
            currentRow = [];
            currentVal = '';
          } else {
            currentVal += ch;
          }
        }
      }
      if (currentVal !== '' || currentRow.length > 0) {
        currentRow.push(currentVal);
        rows.push(currentRow);
      }
      return rows;
    }
  }

  window.FinStore = new FinanceStore();
  window.FinUtils = { getCurrentMonthKey, getTodayStr, uid };
})();
