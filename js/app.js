/**
 * ============================================================================
 * BỘ ĐIỀU KHIỂN GIAO DIỆN CHÍNH (js/app.js)
 * ============================================================================
 * Kết nối dữ liệu từ FinStore với giao diện người dùng, biểu đồ FinCharts,
 * bộ lọc tìm kiếm, hộp thoại chỉnh sửa và xuất/nhập file.
 */

(function () {
  const CONFIG = window.APP_CONFIG;
  const store = window.FinStore;
  const charts = window.FinCharts;
  const { getCurrentMonthKey, getTodayStr } = window.FinUtils;

  const uiState = {
    activeTab: 'dashboard',
    selectedMonth: getCurrentMonthKey(),
    isAllTime: false,
    donutType: 'expense',
    manageCatType: 'expense',
    txModalType: 'expense',
    filters: {
      search: '',
      type: 'all',
      walletId: 'all',
      categoryId: 'all',
      sortBy: 'date_desc'
    }
  };

  const TAB_TITLES = {
    dashboard: 'Tổng quan tài chính',
    transactions: 'Sổ giao dịch chi tiết',
    wallets: 'Quản lý Ví & Danh mục',
    budgets: 'Ngân sách & Phân tích chi tiêu',
    settings: 'Tùy chỉnh ứng dụng & Sao lưu'
  };

  const WALLET_TYPE_LABELS = {
    cash: 'Tiền mặt',
    bank: 'Ngân hàng',
    ewallet: 'Ví điện tử',
    saving: 'Tiết kiệm / Đầu tư',
    credit: 'Thẻ tín dụng'
  };

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDisplayDate(isoDate) {
    if (!isoDate || !isoDate.includes('-')) return isoDate || '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  }

  function getEffectivePeriod() {
    return uiState.isAllTime ? 'all' : uiState.selectedMonth;
  }

  function getPeriodLabel() {
    if (uiState.isAllTime) return 'Toàn bộ thời gian';
    const [y, m] = uiState.selectedMonth.split('-');
    return `Tháng ${Number(m)}/${y}`;
  }

  function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3200);
  }

  // ---------------------------------------------------------------------------
  // ÁP DỤNG GIAO DIỆN SÁNG/TỐI, MÀU CHỦ ĐẠO & TÊN APP
  // ---------------------------------------------------------------------------
  function applyAppearance() {
    const { settings } = store.state;

    // Tên ứng dụng & tiêu đề trình duyệt
    const appName = settings.appName || CONFIG.defaultSettings.appName;
    const appSubtitle = settings.appSubtitle || '';
    document.getElementById('brandAppName').textContent = appName;
    document.getElementById('brandAppSubtitle').textContent = appSubtitle;
    document.title = appSubtitle ? `${appName} — ${appSubtitle}` : appName;

    // Chế độ Sáng / Tối
    let resolvedTheme = settings.theme || 'light';
    if (resolvedTheme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', resolvedTheme);

    const quickThemeBtn = document.getElementById('btnQuickTheme');
    if (quickThemeBtn) {
      quickThemeBtn.textContent = resolvedTheme === 'dark' ? '☀️ Chế độ sáng' : '🌙 Chế độ tối';
    }

    // Màu chủ đạo (Accent)
    const palette = CONFIG.accentPalettes[settings.accentColor] || CONFIG.accentPalettes.indigo;
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--accent-primary', palette.primary);
    rootStyle.setProperty('--accent-hover', palette.hover);
    rootStyle.setProperty('--accent-soft', palette.soft);
  }

  // ---------------------------------------------------------------------------
  // ĐIỀU HƯỚNG TAB & BỘ CHỌN KỲ BÁO CÁO
  // ---------------------------------------------------------------------------
  function switchTab(tabName) {
    if (!TAB_TITLES[tabName]) return;
    uiState.activeTab = tabName;

    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-view').forEach((sec) => {
      const isMatch = sec.id === `view-${tabName}`;
      sec.hidden = !isMatch;
      sec.classList.toggle('is-active', isMatch);
    });

    document.getElementById('currentViewTitle').textContent = TAB_TITLES[tabName];
    renderActiveView();
  }

  function shiftMonth(delta) {
    uiState.isAllTime = false;
    const [y, m] = uiState.selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const nextKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    uiState.selectedMonth = nextKey;
    syncPeriodControls();
    renderAll();
  }

  function syncPeriodControls() {
    const input = document.getElementById('periodMonthInput');
    const group = document.getElementById('periodPickerGroup');
    if (input) input.value = uiState.selectedMonth;
    if (group) group.classList.toggle('is-all-time', uiState.isAllTime);
  }

  // ---------------------------------------------------------------------------
  // RENDER TỔNG HỢP
  // ---------------------------------------------------------------------------
  function renderAll() {
    applyAppearance();
    renderDemoBanner();
    populateFilterDropdowns();
    renderActiveView();
  }

  function renderActiveView() {
    switch (uiState.activeTab) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'transactions':
        renderTransactionsView();
        break;
      case 'wallets':
        renderWalletsAndCategoriesView();
        break;
      case 'budgets':
        renderBudgetsView();
        break;
      case 'settings':
        renderSettingsView();
        break;
    }
  }

  function renderDemoBanner() {
    const banner = document.getElementById('demoBanner');
    if (banner) {
      banner.hidden = !store.state.isDemoData;
    }
  }

  // ---------------------------------------------------------------------------
  // TAB 1: DASHBOARD (TỔNG QUAN)
  // ---------------------------------------------------------------------------
  function renderDashboard() {
    const period = getEffectivePeriod();
    const periodLabel = getPeriodLabel();
    const wallets = store.getWalletsWithBalances();
    const netWorth = wallets.reduce((s, w) => s + w.currentBalance, 0);
    const summary = store.getPeriodSummary(period);

    document.getElementById('kpiNetWorth').textContent = store.formatCurrency(netWorth);
    document.getElementById('kpiWalletCount').textContent = `Tổng số dư trên ${wallets.length} ví/tài khoản`;

    document.getElementById('kpiIncome').textContent = store.formatCurrency(summary.income, true);
    document.getElementById('kpiIncomeSub').textContent = periodLabel;

    document.getElementById('kpiExpense').textContent = store.formatCurrency(summary.expense);
    document.getElementById('kpiExpenseSub').textContent = `${summary.txCount} giao dịch (${periodLabel})`;

    const netEl = document.getElementById('kpiNetBalance');
    netEl.textContent = store.formatCurrency(summary.net, true);
    netEl.className = `kpi-value ${summary.net >= 0 ? 'text-income' : 'text-expense'}`;

    const rateText = summary.income > 0
      ? `Tỷ lệ tiết kiệm: ${summary.savingsRate.toFixed(1)}%`
      : 'Chưa có thu nhập trong kỳ';
    document.getElementById('kpiSavingsRate').textContent = rateText;

    // Render dải Ví
    const walletsGrid = document.getElementById('dashboardWalletsGrid');
    walletsGrid.innerHTML = wallets.map((w) => `
      <div class="wallet-mini-card" data-filter-wallet="${esc(w.id)}" title="Nhấp để lọc giao dịch của ví này">
        <div class="wallet-avatar" style="background:${esc(w.color)}22; color:${esc(w.color)}">
          ${esc(w.icon)}
        </div>
        <div class="wallet-mini-info">
          <div class="wallet-mini-name">${esc(w.name)}</div>
          <div class="wallet-bal ${w.currentBalance < 0 ? 'text-expense' : ''}">
            ${esc(store.formatCurrency(w.currentBalance))}
          </div>
        </div>
      </div>
    `).join('');

    walletsGrid.querySelectorAll('[data-filter-wallet]').forEach((card) => {
      card.addEventListener('click', () => {
        uiState.filters.walletId = card.dataset.filterWallet;
        switchTab('transactions');
      });
    });

    // Biểu đồ Donut cơ cấu danh mục
    const breakdown = store.getCategoryBreakdown(period, uiState.donutType);
    charts.renderDonutChart(
      document.getElementById('dashboardDonutChart'),
      breakdown,
      store,
      uiState.donutType === 'expense' ? 'Chưa có khoản chi' : 'Chưa có khoản thu'
    );

    // Biểu đồ Xu hướng 6 tháng
    const trendData = store.getMonthlyTrend(uiState.selectedMonth, 6);
    charts.renderMonthlyTrendChart(
      document.getElementById('dashboardTrendChart'),
      trendData,
      store,
      uiState.isAllTime ? '' : uiState.selectedMonth
    );

    // Cảnh báo ngân sách trên Dashboard (chỉ tính theo tháng đang chọn)
    renderDashboardBudgets();

    // Giao dịch gần đây
    renderDashboardRecentTransactions(period);
  }

  function renderDashboardBudgets() {
    const container = document.getElementById('dashboardBudgetList');
    const monthBreakdown = store.getCategoryBreakdown(uiState.selectedMonth, 'expense');
    const budgeted = monthBreakdown.items
      .filter((c) => c.budget > 0)
      .sort((a, b) => b.budgetPercent - a.budgetPercent)
      .slice(0, 5);

    if (budgeted.length === 0) {
      container.innerHTML = `
        <div class="empty-center muted-text">
          Chưa đặt hạn mức ngân sách cho danh mục nào.
          <button type="button" class="btn btn-outline btn-sm" data-goto-tab="budgets">Thiết lập ngay</button>
        </div>
      `;
      bindGotoLinks(container);
      return;
    }

    container.innerHTML = budgeted.map((item) => {
      const pct = Math.min(100, item.budgetPercent);
      const tone = item.budgetPercent >= 100 ? 'danger' : (item.budgetPercent >= 75 ? 'warn' : 'safe');
      const statusText = item.budgetPercent >= 100
        ? `Vượt ${store.formatCompact(Math.abs(item.remainingBudget))}`
        : `${item.budgetPercent.toFixed(0)}%`;

      return `
        <div class="budget-row">
          <div class="budget-row-top">
            <span><strong>${esc(item.icon)} ${esc(item.name)}</strong></span>
            <span>
              <strong>${esc(store.formatCompact(item.amount))}</strong> / ${esc(store.formatCompact(item.budget))}
              <span class="status-pill pill-${tone}">${esc(statusText)}</span>
            </span>
          </div>
          <div class="progress-track">
            <div class="progress-fill progress-${tone}" style="width:${pct.toFixed(1)}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderDashboardRecentTransactions(period) {
    const container = document.getElementById('dashboardRecentTx');
    const recent = store.getFilteredTransactions({ monthKey: period, sortBy: 'date_desc' }).slice(0, 6);

    if (recent.length === 0) {
      container.innerHTML = `<p class="muted-text empty-center">Chưa có giao dịch nào trong kỳ này.</p>`;
      return;
    }

    container.innerHTML = recent.map((tx) => {
      const meta = getTxDisplayMeta(tx);
      return `
        <div class="recent-tx-item">
          <div class="recent-tx-left">
            <div class="cat-icon-badge" style="background:${esc(meta.color)}20; color:${esc(meta.color)}">
              ${esc(meta.icon)}
            </div>
            <div class="recent-tx-meta">
              <div class="recent-tx-title">${esc(tx.note || meta.title)}</div>
              <div class="recent-tx-sub">${esc(formatDisplayDate(tx.date))} · ${esc(meta.walletLabel)}</div>
            </div>
          </div>
          <div class="tx-amount ${meta.amountClass}">
            ${esc(meta.formattedAmount)}
          </div>
        </div>
      `;
    }).join('');
  }

  function getTxDisplayMeta(tx) {
    const wallet = store.getWalletById(tx.walletId);
    const walletName = wallet ? wallet.name : 'Ví đã xóa';

    if (tx.type === 'transfer') {
      const toW = store.getWalletById(tx.toWalletId);
      return {
        icon: '⇄',
        color: '#0ea5e9',
        title: 'Chuyển tiền nội bộ',
        walletLabel: `${walletName} → ${toW ? toW.name : 'Ví đích'}`,
        amountClass: 'text-transfer',
        formattedAmount: store.formatCurrency(tx.amount)
      };
    }

    const cat = store.getCategoryById(tx.categoryId);
    const isInc = tx.type === 'income';
    return {
      icon: cat ? cat.icon : (isInc ? '💰' : '🏷️'),
      color: cat ? cat.color : (isInc ? '#10b981' : '#64748b'),
      title: cat ? cat.name : 'Chưa phân loại',
      walletLabel: walletName,
      amountClass: isInc ? 'text-income' : 'text-expense',
      formattedAmount: (isInc ? '+' : '-') + store.formatCurrency(tx.amount)
    };
  }

  // ---------------------------------------------------------------------------
  // TAB 2: SỔ GIAO DỊCH (BỘ LỌC + BẢNG ĐẦY ĐỦ + SỬA / NHÂN BẢN / XÓA)
  // ---------------------------------------------------------------------------
  function populateFilterDropdowns() {
    const walletSel = document.getElementById('txWalletFilter');
    const catSel = document.getElementById('txCategoryFilter');
    if (!walletSel || !catSel) return;

    walletSel.innerHTML = `<option value="all">Tất cả ví</option>` +
      store.state.wallets.map((w) => `<option value="${esc(w.id)}">${esc(w.icon)} ${esc(w.name)}</option>`).join('');
    walletSel.value = store.getWalletById(uiState.filters.walletId) ? uiState.filters.walletId : 'all';

    catSel.innerHTML = `<option value="all">Tất cả danh mục</option>` +
      store.state.categories.map((c) => `<option value="${esc(c.id)}">${esc(c.icon)} ${esc(c.name)}</option>`).join('');
    catSel.value = store.getCategoryById(uiState.filters.categoryId) ? uiState.filters.categoryId : 'all';

    document.getElementById('txSearchInput').value = uiState.filters.search;
    document.getElementById('txTypeFilter').value = uiState.filters.type;
    document.getElementById('txSortSelect').value = uiState.filters.sortBy;
  }

  function renderTransactionsView() {
    const period = getEffectivePeriod();
    const list = store.getFilteredTransactions({
      monthKey: period,
      ...uiState.filters
    });

    let totalInc = 0;
    let totalExp = 0;
    list.forEach((tx) => {
      if (tx.type === 'income') totalInc += tx.amount;
      if (tx.type === 'expense') totalExp += tx.amount;
    });

    const summaryEl = document.getElementById('txFilteredSummary');
    summaryEl.innerHTML = `
      <span>Tìm thấy: <strong>${list.length}</strong> giao dịch (${esc(getPeriodLabel())})</span>
      <span>Tổng thu: <strong class="text-income">+${esc(store.formatCurrency(totalInc))}</strong></span>
      <span>Tổng chi: <strong class="text-expense">-${esc(store.formatCurrency(totalExp))}</strong></span>
      <span>Chênh lệch: <strong>${esc(store.formatCurrency(totalInc - totalExp, true))}</strong></span>
    `;

    const tbody = document.getElementById('txTableBody');
    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-center muted-text" style="padding: 36px 16px;">
            Không có giao dịch nào khớp với bộ lọc hiện tại.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map((tx) => {
      const meta = getTxDisplayMeta(tx);
      return `
        <tr>
          <td><strong>${esc(formatDisplayDate(tx.date))}</strong></td>
          <td>
            <div class="tx-cat-cell">
              <div class="cat-icon-badge" style="background:${esc(meta.color)}20; color:${esc(meta.color)}">
                ${esc(meta.icon)}
              </div>
              <div>
                <div><strong>${esc(meta.title)}</strong></div>
                ${tx.note ? `<div class="tx-note-text">${esc(tx.note)}</div>` : ''}
              </div>
            </div>
          </td>
          <td>${esc(meta.walletLabel)}</td>
          <td class="text-right tx-amount ${meta.amountClass}">${esc(meta.formattedAmount)}</td>
          <td class="text-right">
            <div class="row-actions">
              <button type="button" class="btn-icon" data-edit-tx="${esc(tx.id)}" title="Chỉnh sửa giao dịch">✏️</button>
              <button type="button" class="btn-icon" data-dup-tx="${esc(tx.id)}" title="Nhân bản giao dịch sang hôm nay">📋</button>
              <button type="button" class="btn-icon" data-del-tx="${esc(tx.id)}" title="Xóa giao dịch">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('[data-edit-tx]').forEach((btn) => {
      btn.addEventListener('click', () => openTransactionModal(btn.dataset.editTx));
    });
    tbody.querySelectorAll('[data-dup-tx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        store.duplicateTransaction(btn.dataset.dupTx);
        showToast('📋 Đã nhân bản giao dịch sang ngày hôm nay!');
      });
    });
    tbody.querySelectorAll('[data-del-tx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn xóa giao dịch này không?')) {
          store.deleteTransaction(btn.dataset.delTx);
          showToast('🗑️ Đã xóa giao dịch.');
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // TAB 3: QUẢN LÝ VÍ & DANH MỤC TÙY CHỈNH
  // ---------------------------------------------------------------------------
  function renderWalletsAndCategoriesView() {
    const wallets = store.getWalletsWithBalances();
    const wGrid = document.getElementById('walletsManageGrid');

    wGrid.innerHTML = wallets.map((w) => `
      <article class="wallet-full-card">
        <div class="wallet-full-top">
          <div class="category-card-left">
            <div class="wallet-avatar" style="background:${esc(w.color)}22; color:${esc(w.color)}">
              ${esc(w.icon)}
            </div>
            <div>
              <div class="category-card-title">${esc(w.name)}</div>
              <div class="small-note muted-text">${esc(WALLET_TYPE_LABELS[w.type] || 'Tài khoản')}</div>
            </div>
          </div>
          <div class="card-inline-actions">
            <button type="button" class="btn-icon" data-edit-wallet="${esc(w.id)}" title="Sửa ví">✏️</button>
            <button type="button" class="btn-icon" data-del-wallet="${esc(w.id)}" title="Xóa ví">🗑️</button>
          </div>
        </div>

        <div>
          <div class="small-note muted-text">Số dư hiện tại</div>
          <div class="kpi-value ${w.currentBalance < 0 ? 'text-expense' : ''}" style="font-size:1.35rem;">
            ${esc(store.formatCurrency(w.currentBalance))}
          </div>
        </div>

        <div class="wallet-full-stats">
          <div>Khởi tạo: <strong>${esc(store.formatCompact(w.initialBalance))}</strong></div>
          <div>Giao dịch: <strong>${w.stats.txCount}</strong></div>
          <div>Tổng thu: <span class="text-income">+${esc(store.formatCompact(w.stats.income + w.stats.transferIn))}</span></div>
          <div>Tổng chi: <span class="text-expense">-${esc(store.formatCompact(w.stats.expense + w.stats.transferOut))}</span></div>
        </div>
      </article>
    `).join('');

    wGrid.querySelectorAll('[data-edit-wallet]').forEach((btn) => {
      btn.addEventListener('click', () => openWalletModal(btn.dataset.editWallet));
    });
    wGrid.querySelectorAll('[data-del-wallet]').forEach((btn) => {
      btn.addEventListener('click', () => {
        try {
          if (confirm('Xóa ví này? Các giao dịch thuộc ví này sẽ được chuyển sang ví còn lại để tránh mất dữ liệu.')) {
            store.deleteWallet(btn.dataset.delWallet);
            showToast('🗑️ Đã xóa ví.');
          }
        } catch (err) {
          alert(err.message);
        }
      });
    });

    // Danh mục
    const cats = store.getCategoriesByType(uiState.manageCatType);
    const cGrid = document.getElementById('categoriesManageGrid');

    cGrid.innerHTML = cats.map((c) => `
      <div class="category-card">
        <div class="category-card-left">
          <div class="cat-icon-badge" style="background:${esc(c.color)}22; color:${esc(c.color)}">
            ${esc(c.icon)}
          </div>
          <div>
            <div class="category-card-title">${esc(c.name)}</div>
            <div class="small-note muted-text">
              ${c.type === 'expense'
                ? (c.budget > 0 ? `Hạn mức: ${esc(store.formatCompact(c.budget))}/tháng` : 'Chưa giới hạn ngân sách')
                : 'Danh mục Thu nhập'}
            </div>
          </div>
        </div>
        <div class="card-inline-actions">
          <button type="button" class="btn-icon" data-edit-cat="${esc(c.id)}" title="Sửa danh mục">✏️</button>
          <button type="button" class="btn-icon" data-del-cat="${esc(c.id)}" title="Xóa danh mục">🗑️</button>
        </div>
      </div>
    `).join('');

    cGrid.querySelectorAll('[data-edit-cat]').forEach((btn) => {
      btn.addEventListener('click', () => openCategoryModal(btn.dataset.editCat));
    });
    cGrid.querySelectorAll('[data-del-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        try {
          if (confirm(`Xóa danh mục "${store.getCategoryById(btn.dataset.delCat)?.name}"?`)) {
            store.deleteCategory(btn.dataset.delCat);
            showToast('🗑️ Đã xóa danh mục.');
          }
        } catch (err) {
          alert(err.message);
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // TAB 4: NGÂN SÁCH & PHÂN TÍCH CHI TIẾT
  // ---------------------------------------------------------------------------
  function renderBudgetsView() {
    const monthKey = uiState.selectedMonth;
    const [y, m] = monthKey.split('-').map(Number);
    const summary = store.getPeriodSummary(monthKey);
    const overallLimit = Number(store.state.settings.monthlyOverallBudget) || 0;

    // Tính số ngày còn lại trong tháng để gợi ý chi tiêu/ngày
    const now = new Date();
    const daysInMonth = new Date(y, m, 0).getDate();
    let remainingDays = daysInMonth;
    if (now.getFullYear() === y && now.getMonth() + 1 === m) {
      remainingDays = Math.max(1, daysInMonth - now.getDate() + 1);
    }

    const overallCard = document.getElementById('overallBudgetCard');
    if (overallLimit > 0) {
      const pct = (summary.expense / overallLimit) * 100;
      const barWidth = Math.min(100, pct);
      const tone = pct >= 100 ? 'danger' : (pct >= 75 ? 'warn' : 'safe');
      const remain = overallLimit - summary.expense;
      const dailySafe = remain > 0 ? remain / remainingDays : 0;

      overallCard.innerHTML = `
        <div class="card-head">
          <div>
            <h3>Tổng ngân sách chi tiêu Tháng ${m}/${y}</h3>
            <p class="muted-text small-note">
              ${remain >= 0
                ? `Còn dư <strong>${esc(store.formatCurrency(remain))}</strong> · Gợi ý chi tối đa <strong>${esc(store.formatCurrency(Math.round(dailySafe)))}/ngày</strong> trong ${remainingDays} ngày tới.`
                : `⚠️ Bạn đã chi vượt tổng hạn mức tháng <strong>${esc(store.formatCurrency(Math.abs(remain)))}</strong>!`}
            </p>
          </div>
          <button type="button" class="btn btn-outline btn-sm" data-goto-tab="settings">Đổi tổng hạn mức</button>
        </div>
        <div class="budget-row-top" style="margin-bottom:8px;">
          <span>Đã chi: <strong class="text-expense">${esc(store.formatCurrency(summary.expense))}</strong></span>
          <span>Hạn mức tháng: <strong>${esc(store.formatCurrency(overallLimit))}</strong> (${pct.toFixed(1)}%)</span>
        </div>
        <div class="progress-track" style="height:12px;">
          <div class="progress-fill progress-${tone}" style="width:${barWidth.toFixed(1)}%"></div>
        </div>
      `;
    } else {
      overallCard.innerHTML = `
        <div class="card-head" style="margin-bottom:0;">
          <div>
            <h3>Tổng ngân sách chi tiêu Tháng ${m}/${y}</h3>
            <p class="muted-text small-note">Bạn chưa đặt tổng hạn mức chi tiêu hàng tháng. Đã chi trong tháng: <strong>${esc(store.formatCurrency(summary.expense))}</strong>.</p>
          </div>
          <button type="button" class="btn btn-primary btn-sm" data-goto-tab="settings">Thiết lập hạn mức tháng</button>
        </div>
      `;
    }
    bindGotoLinks(overallCard);

    // Biểu đồ chi tiêu từng ngày trong tháng
    const dailyData = store.getDailySpending(monthKey);
    charts.renderDailyChart(document.getElementById('analyticsDailyChart'), dailyData, store);

    // Danh sách hạn mức từng danh mục Chi tiêu
    const breakdown = store.getCategoryBreakdown(monthKey, 'expense');
    const listContainer = document.getElementById('budgetCategoriesList');

    listContainer.innerHTML = breakdown.items.map((item) => {
      const hasBudget = item.budget > 0;
      const pct = hasBudget ? item.budgetPercent : 0;
      const barWidth = Math.min(100, pct);
      const tone = pct >= 100 ? 'danger' : (pct >= 75 ? 'warn' : 'safe');

      let badgeHtml = `<span class="status-pill pill-safe">Không giới hạn</span>`;
      if (hasBudget) {
        if (pct >= 100) badgeHtml = `<span class="status-pill pill-danger">Vượt ${esc(store.formatCompact(Math.abs(item.remainingBudget)))}</span>`;
        else if (pct >= 75) badgeHtml = `<span class="status-pill pill-warn">Sắp chạm mức (${pct.toFixed(0)}%)</span>`;
        else badgeHtml = `<span class="status-pill pill-safe">An toàn (${pct.toFixed(0)}%)</span>`;
      }

      return `
        <div class="budget-detail-card">
          <div class="wallet-full-top">
            <div class="category-card-left">
              <div class="cat-icon-badge" style="background:${esc(item.color)}20; color:${esc(item.color)}">
                ${esc(item.icon)}
              </div>
              <div>
                <div class="category-card-title">${esc(item.name)}</div>
                <div class="small-note muted-text">${item.count} giao dịch · Chiếm ${item.share.toFixed(1)}% tổng chi</div>
              </div>
            </div>
            ${badgeHtml}
          </div>

          <div class="budget-row-top">
            <span>Đã chi: <strong>${esc(store.formatCurrency(item.amount))}</strong></span>
            <span>Hạn mức: <strong>${hasBudget ? esc(store.formatCurrency(item.budget)) : '—'}</strong></span>
          </div>

          <div class="progress-track">
            <div class="progress-fill progress-${hasBudget ? tone : 'safe'}" style="width:${hasBudget ? barWidth.toFixed(1) : 0}%"></div>
          </div>

          <div style="display:flex; justify-content:flex-end;">
            <button type="button" class="btn btn-ghost btn-sm" data-budget-cat="${esc(item.id)}">
              🎯 ${hasBudget ? 'Sửa hạn mức' : 'Đặt hạn mức'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    listContainer.querySelectorAll('[data-budget-cat]').forEach((btn) => {
      btn.addEventListener('click', () => openCategoryModal(btn.dataset.budgetCat));
    });
  }

  // ---------------------------------------------------------------------------
  // TAB 5: CÀI ĐẶT TÙY CHỈNH & SAO LƯU DỮ LIỆU
  // ---------------------------------------------------------------------------
  function renderSettingsView() {
    const { settings } = store.state;
    document.getElementById('settingAppName').value = settings.appName || '';
    document.getElementById('settingAppSubtitle').value = settings.appSubtitle || '';
    document.getElementById('settingOverallBudget').value = settings.monthlyOverallBudget || 0;

    // Đơn vị tiền tệ
    const curSel = document.getElementById('settingCurrency');
    curSel.innerHTML = Object.values(CONFIG.currencies)
      .map((c) => `<option value="${esc(c.code)}">${esc(c.label)}</option>`)
      .join('');
    curSel.value = settings.currency || 'VND';

    // Nút Sáng / Tối
    document.querySelectorAll('#settingThemeGroup .seg-btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.themeVal === settings.theme);
    });

    // Bảng màu chủ đạo
    const swatchRow = document.getElementById('settingAccentGroup');
    swatchRow.innerHTML = Object.entries(CONFIG.accentPalettes).map(([key, pal]) => `
      <button
        type="button"
        class="accent-swatch ${settings.accentColor === key ? 'is-selected' : ''}"
        style="background:${esc(pal.primary)}"
        data-accent-key="${esc(key)}"
        title="${esc(pal.name)}"
        aria-label="${esc(pal.name)}"
      ></button>
    `).join('');

    swatchRow.querySelectorAll('[data-accent-key]').forEach((btn) => {
      btn.addEventListener('click', () => {
        store.updateSettings({ accentColor: btn.dataset.accentKey });
        showToast(`🎨 Đã đổi màu chủ đạo: ${CONFIG.accentPalettes[btn.dataset.accentKey].name}`);
      });
    });
  }

  // ---------------------------------------------------------------------------
  // MODAL THÊM / SỬA GIAO DỊCH
  // ---------------------------------------------------------------------------
  function openTransactionModal(editTxId = null, forceType = null) {
    const dialog = document.getElementById('modalTransaction');
    const idInput = document.getElementById('txId');
    const amountInput = document.getElementById('txAmount');
    const dateInput = document.getElementById('txDate');
    const noteInput = document.getElementById('txNote');
    const titleEl = document.getElementById('modalTxTitle');

    const existing = editTxId ? store.state.transactions.find((t) => t.id === editTxId) : null;

    if (existing) {
      titleEl.textContent = 'Chỉnh sửa giao dịch';
      idInput.value = existing.id;
      uiState.txModalType = existing.type;
      amountInput.value = existing.amount;
      dateInput.value = existing.date;
      noteInput.value = existing.note || '';
    } else {
      titleEl.textContent = 'Thêm giao dịch mới';
      idInput.value = '';
      uiState.txModalType = forceType || 'expense';
      amountInput.value = '';
      dateInput.value = getTodayStr();
      noteInput.value = '';
    }

    syncTxModalFields(existing);
    updateAmountPreview();
    renderQuickAmountChips();

    dialog.showModal();
    setTimeout(() => amountInput.focus(), 50);
  }

  function syncTxModalFields(existingTx = null) {
    const type = uiState.txModalType;

    document.querySelectorAll('#txModalTypeSwitch .seg-btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.txType === type);
    });

    const walletSelect = document.getElementById('txWallet');
    const toWalletSelect = document.getElementById('txToWallet');
    const catSelect = document.getElementById('txCategory');
    const catField = document.getElementById('txCategoryField');
    const toWalletField = document.getElementById('txToWalletField');
    const walletLabel = document.getElementById('txWalletLabel');

    const walletsHtml = store.state.wallets
      .map((w) => `<option value="${esc(w.id)}">${esc(w.icon)} ${esc(w.name)}</option>`)
      .join('');
    walletSelect.innerHTML = walletsHtml;
    toWalletSelect.innerHTML = walletsHtml;

    if (existingTx && existingTx.walletId) {
      walletSelect.value = existingTx.walletId;
    }

    if (type === 'transfer') {
      catField.hidden = true;
      toWalletField.hidden = false;
      walletLabel.innerHTML = 'Từ ví nguồn <span class="req">*</span>';
      if (existingTx && existingTx.toWalletId) {
        toWalletSelect.value = existingTx.toWalletId;
      } else if (store.state.wallets.length > 1) {
        const diff = store.state.wallets.find((w) => w.id !== walletSelect.value);
        if (diff) toWalletSelect.value = diff.id;
      }
    } else {
      catField.hidden = false;
      toWalletField.hidden = true;
      walletLabel.innerHTML = type === 'income'
        ? 'Nhận vào ví <span class="req">*</span>'
        : 'Ví thanh toán <span class="req">*</span>';

      const cats = store.getCategoriesByType(type);
      catSelect.innerHTML = cats
        .map((c) => `<option value="${esc(c.id)}">${esc(c.icon)} ${esc(c.name)}</option>`)
        .join('');

      if (existingTx && existingTx.categoryId && cats.some((c) => c.id === existingTx.categoryId)) {
        catSelect.value = existingTx.categoryId;
      }
    }
  }

  function updateAmountPreview() {
    const val = Number(document.getElementById('txAmount').value) || 0;
    document.getElementById('txAmountPreview').textContent = store.formatCurrency(val);
  }

  function renderQuickAmountChips() {
    const container = document.getElementById('quickAmountChips');
    const cur = store.getCurrencyInfo();
    const presets = cur.quickAmounts || [];

    const zeroBtn = cur.code === 'VND'
      ? `<button type="button" class="chip-btn" data-mul-thousand="1">+000</button>`
      : '';

    container.innerHTML = zeroBtn + presets.map((amt) => `
      <button type="button" class="chip-btn" data-quick-amt="${amt}">
        ${esc(store.formatCompact(amt))}
      </button>
    `).join('');

    container.querySelectorAll('[data-quick-amt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.getElementById('txAmount').value = btn.dataset.quickAmt;
        updateAmountPreview();
      });
    });

    const mulBtn = container.querySelector('[data-mul-thousand]');
    if (mulBtn) {
      mulBtn.addEventListener('click', () => {
        const input = document.getElementById('txAmount');
        const current = Number(input.value) || 0;
        if (current > 0) {
          input.value = current * 1000;
          updateAmountPreview();
        }
      });
    }
  }

  // ---------------------------------------------------------------------------
  // MODAL THÊM / SỬA VÍ & DANH MỤC
  // ---------------------------------------------------------------------------
  function openWalletModal(editId = null) {
    const dialog = document.getElementById('modalWallet');
    const existing = editId ? store.getWalletById(editId) : null;

    document.getElementById('modalWalletTitle').textContent = existing ? 'Chỉnh sửa ví' : 'Thêm ví mới';
    document.getElementById('walletEditId').value = existing ? existing.id : '';
    document.getElementById('walletName').value = existing ? existing.name : '';
    document.getElementById('walletType').value = existing ? existing.type : 'bank';
    document.getElementById('walletInitialBalance').value = existing ? existing.initialBalance : 0;
    document.getElementById('walletIcon').value = existing ? existing.icon : '🏦';
    document.getElementById('walletColor').value = existing ? existing.color : '#3b82f6';

    dialog.showModal();
  }

  function openCategoryModal(editId = null) {
    const dialog = document.getElementById('modalCategory');
    const existing = editId ? store.getCategoryById(editId) : null;
    const defaultType = existing ? existing.type : uiState.manageCatType;

    document.getElementById('modalCategoryTitle').textContent = existing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới';
    document.getElementById('catEditId').value = existing ? existing.id : '';
    document.getElementById('catName').value = existing ? existing.name : '';
    document.getElementById('catType').value = defaultType;
    document.getElementById('catBudget').value = existing ? existing.budget : 0;
    document.getElementById('catIcon').value = existing ? existing.icon : (defaultType === 'income' ? '💰' : '🍜');
    document.getElementById('catColor').value = existing ? existing.color : '#6366f1';

    document.getElementById('catBudgetField').hidden = defaultType === 'income';
    dialog.showModal();
  }

  function initEmojiPickers() {
    document.querySelectorAll('.emoji-picker-grid').forEach((grid) => {
      const targetId = grid.dataset.targetInput;
      grid.innerHTML = CONFIG.emojiPresets.map((em) => `
        <button type="button" class="emoji-btn" data-emoji="${esc(em)}">${esc(em)}</button>
      `).join('');

      grid.querySelectorAll('[data-emoji]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const input = document.getElementById(targetId);
          if (input) input.value = btn.dataset.emoji;
        });
      });
    });
  }

  // ---------------------------------------------------------------------------
  // TẢI FILE XUỐNG (JSON / CSV)
  // ---------------------------------------------------------------------------
  function triggerDownload(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function bindGotoLinks(root = document) {
    root.querySelectorAll('[data-goto-tab]').forEach((btn) => {
      btn.onclick = () => switchTab(btn.dataset.gotoTab);
    });
  }

  // ---------------------------------------------------------------------------
  // GẮN SỰ KIỆN TƯƠNG TÁC (EVENT LISTENERS)
  // ---------------------------------------------------------------------------
  function bindEvents() {
    // Chuyển tab trên Sidebar / Mobile nav
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    bindGotoLinks(document);

    // Bộ chọn tháng / kỳ báo cáo
    document.getElementById('btnPrevMonth').addEventListener('click', () => shiftMonth(-1));
    document.getElementById('btnNextMonth').addEventListener('click', () => shiftMonth(1));
    document.getElementById('periodMonthInput').addEventListener('change', (e) => {
      if (e.target.value) {
        uiState.selectedMonth = e.target.value;
        uiState.isAllTime = false;
        syncPeriodControls();
        renderAll();
      }
    });
    document.getElementById('btnAllTimeToggle').addEventListener('click', () => {
      uiState.isAllTime = !uiState.isAllTime;
      syncPeriodControls();
      renderAll();
    });

    // Nút đổi nhanh giao diện Sáng / Tối
    document.getElementById('btnQuickTheme').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      store.updateSettings({ theme: next });
      showToast(next === 'dark' ? '🌙 Đã bật chế độ Tối' : '☀️ Đã bật chế độ Sáng');
    });

    // Nút mở Hướng dẫn GitHub
    const openGuide = () => document.getElementById('modalGithubGuide').showModal();
    document.getElementById('btnOpenGithubGuide').addEventListener('click', openGuide);
    document.getElementById('btnOpenGithubGuide2').addEventListener('click', openGuide);

    // Banner dữ liệu mẫu
    document.getElementById('btnStartFreshBanner').addEventListener('click', () => {
      if (confirm('Xóa toàn bộ giao dịch mẫu và đặt số dư ban đầu của các ví về 0 để bạn bắt đầu ghi chép thật?')) {
        store.startFresh(true);
        showToast('✨ Đã làm mới sổ! Bạn có thể cập nhật số dư ví và thêm giao dịch đầu tiên.');
      }
    });
    document.getElementById('btnDismissBanner').addEventListener('click', () => {
      store.dismissDemoBanner();
    });

    // Nút thêm giao dịch chính
    document.getElementById('btnAddTransactionTop').addEventListener('click', () => openTransactionModal());

    // Chuyển loại biểu đồ Donut trên Dashboard
    document.querySelectorAll('#donutTypeSwitch .seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        uiState.donutType = btn.dataset.donutType;
        document.querySelectorAll('#donutTypeSwitch .seg-btn').forEach((b) => {
          b.classList.toggle('is-active', b === btn);
        });
        renderDashboard();
      });
    });

    // Bộ lọc trên trang Sổ giao dịch
    document.getElementById('txSearchInput').addEventListener('input', (e) => {
      uiState.filters.search = e.target.value;
      renderTransactionsView();
    });
    document.getElementById('txTypeFilter').addEventListener('change', (e) => {
      uiState.filters.type = e.target.value;
      renderTransactionsView();
    });
    document.getElementById('txWalletFilter').addEventListener('change', (e) => {
      uiState.filters.walletId = e.target.value;
      renderTransactionsView();
    });
    document.getElementById('txCategoryFilter').addEventListener('change', (e) => {
      uiState.filters.categoryId = e.target.value;
      renderTransactionsView();
    });
    document.getElementById('txSortSelect').addEventListener('change', (e) => {
      uiState.filters.sortBy = e.target.value;
      renderTransactionsView();
    });
    document.getElementById('btnResetTxFilters').addEventListener('click', () => {
      uiState.filters = { search: '', type: 'all', walletId: 'all', categoryId: 'all', sortBy: 'date_desc' };
      populateFilterDropdowns();
      renderTransactionsView();
    });
    document.getElementById('btnQuickExportCsv').addEventListener('click', () => {
      const csv = store.exportCSV(getEffectivePeriod());
      triggerDownload(`so-giao-dich-${getTodayStr()}.csv`, csv, 'text/csv;charset=utf-8');
      showToast('📊 Đã xuất file CSV mở được bằng Excel!');
    });

    // Trang Quản lý Ví & Danh mục
    document.getElementById('btnAddWallet').addEventListener('click', () => openWalletModal());
    document.getElementById('btnQuickTransfer').addEventListener('click', () => {
      if (store.state.wallets.length < 2) {
        alert('Bạn cần có ít nhất 2 ví để thực hiện chuyển tiền nội bộ.');
        return;
      }
      openTransactionModal(null, 'transfer');
    });
    document.getElementById('btnAddCategory').addEventListener('click', () => openCategoryModal());
    document.querySelectorAll('#catManageTypeSwitch .seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        uiState.manageCatType = btn.dataset.catType;
        document.querySelectorAll('#catManageTypeSwitch .seg-btn').forEach((b) => {
          b.classList.toggle('is-active', b === btn);
        });
        renderWalletsAndCategoriesView();
      });
    });

    // Đóng các hộp thoại Modal (<dialog>)
    document.querySelectorAll('[data-close-dialog]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dlg = document.getElementById(btn.dataset.closeDialog);
        if (dlg) dlg.close();
      });
    });
    document.querySelectorAll('dialog.app-dialog').forEach((dlg) => {
      dlg.addEventListener('click', (e) => {
        if (e.target === dlg) dlg.close();
      });
    });

    // Xử lý trong Modal Giao dịch
    document.querySelectorAll('#txModalTypeSwitch .seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        uiState.txModalType = btn.dataset.txType;
        syncTxModalFields();
      });
    });
    document.getElementById('txAmount').addEventListener('input', updateAmountPreview);

    document.getElementById('formTransaction').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('txId').value;
      const type = uiState.txModalType;
      const amount = Number(document.getElementById('txAmount').value);
      const date = document.getElementById('txDate').value;
      const walletId = document.getElementById('txWallet').value;
      const toWalletId = document.getElementById('txToWallet').value;
      const categoryId = document.getElementById('txCategory').value;
      const note = document.getElementById('txNote').value;

      if (!amount || amount <= 0) {
        alert('Vui lòng nhập số tiền lớn hơn 0.');
        return;
      }
      if (type === 'transfer' && walletId === toWalletId) {
        alert('Ví nguồn và Ví nhận phải khác nhau.');
        return;
      }

      const payload = { type, amount, date, walletId, toWalletId, categoryId, note };
      if (id) {
        store.updateTransaction(id, payload);
        showToast('✅ Đã cập nhật giao dịch!');
      } else {
        store.addTransaction(payload);
        showToast('✅ Đã thêm giao dịch mới!');
      }
      document.getElementById('modalTransaction').close();
    });

    // Xử lý trong Modal Ví
    document.getElementById('formWallet').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('walletEditId').value;
      const payload = {
        name: document.getElementById('walletName').value,
        type: document.getElementById('walletType').value,
        initialBalance: Number(document.getElementById('walletInitialBalance').value) || 0,
        icon: document.getElementById('walletIcon').value || '👛',
        color: document.getElementById('walletColor').value || '#3b82f6'
      };
      if (id) {
        store.updateWallet(id, payload);
        showToast('✅ Đã cập nhật thông tin ví!');
      } else {
        store.addWallet(payload);
        showToast('✅ Đã tạo ví mới!');
      }
      document.getElementById('modalWallet').close();
    });

    // Xử lý trong Modal Danh mục
    document.getElementById('catType').addEventListener('change', (e) => {
      document.getElementById('catBudgetField').hidden = e.target.value === 'income';
    });

    document.getElementById('formCategory').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('catEditId').value;
      const payload = {
        name: document.getElementById('catName').value,
        type: document.getElementById('catType').value,
        budget: Number(document.getElementById('catBudget').value) || 0,
        icon: document.getElementById('catIcon').value || '🏷️',
        color: document.getElementById('catColor').value || '#6366f1'
      };
      if (id) {
        store.updateCategory(id, payload);
        showToast('✅ Đã cập nhật danh mục!');
      } else {
        store.addCategory(payload);
        showToast('✅ Đã thêm danh mục mới!');
      }
      document.getElementById('modalCategory').close();
    });

    // Trang Cài đặt Tùy chỉnh & Sao lưu
    document.querySelectorAll('#settingThemeGroup .seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        store.updateSettings({ theme: btn.dataset.themeVal });
      });
    });

    document.getElementById('settingsForm').addEventListener('submit', (e) => {
      e.preventDefault();
      store.updateSettings({
        appName: document.getElementById('settingAppName').value.trim() || CONFIG.defaultSettings.appName,
        appSubtitle: document.getElementById('settingAppSubtitle').value.trim(),
        currency: document.getElementById('settingCurrency').value,
        monthlyOverallBudget: Math.max(0, Number(document.getElementById('settingOverallBudget').value) || 0)
      });
      showToast('💾 Đã lưu tùy chỉnh ứng dụng!');
    });

    document.getElementById('btnExportJSON').addEventListener('click', () => {
      const json = store.exportJSON();
      triggerDownload(`finflow-backup-${getTodayStr()}.json`, json, 'application/json;charset=utf-8');
      showToast('⬇️ Đã tải xuống file sao lưu JSON!');
    });

    document.getElementById('btnExportCSV').addEventListener('click', () => {
      const csv = store.exportCSV('all');
      triggerDownload(`finflow-toan-bo-giao-dich-${getTodayStr()}.csv`, csv, 'text/csv;charset=utf-8');
      showToast('📊 Đã xuất toàn bộ giao dịch ra file CSV!');
    });

    document.getElementById('inputImportJSON').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const count = store.importJSON(String(reader.result));
          showToast(`✅ Khôi phục thành công (${count} giao dịch)!`);
        } catch (err) {
          alert(`Không thể khôi phục file JSON: ${err.message}`);
        }
        e.target.value = '';
      };
      reader.readAsText(file, 'utf-8');
    });

    document.getElementById('inputImportCSV').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const count = store.importCSV(String(reader.result));
          showToast(`📥 Đã nhập thêm ${count} giao dịch từ CSV!`);
        } catch (err) {
          alert(`Lỗi nhập file CSV: ${err.message}`);
        }
        e.target.value = '';
      };
      reader.readAsText(file, 'utf-8');
    });

    document.getElementById('btnLoadDemo').addEventListener('click', () => {
      if (confirm('Nạp bộ dữ liệu mẫu? Dữ liệu hiện tại chưa sao lưu sẽ được thay thế bằng dữ liệu mẫu.')) {
        store.loadDemoData();
        showToast('✨ Đã nạp lại dữ liệu mẫu!');
      }
    });

    document.getElementById('btnClearTransactions').addEventListener('click', () => {
      if (confirm('Xóa toàn bộ các giao dịch và đặt số dư ban đầu về 0 để bắt đầu ghi chép mới?')) {
        store.startFresh(true);
        showToast('🗑️ Đã làm sạch sổ giao dịch!');
      }
    });

    document.getElementById('btnFactoryReset').addEventListener('click', () => {
      if (confirm('Khôi phục toàn bộ cài đặt, danh mục, ví về mặc định ban đầu và xóa mọi giao dịch?')) {
        store.resetAllToFactory();
        showToast('🔄 Đã khôi phục cài đặt gốc ban đầu.');
      }
    });
  }

  // Khởi chạy ứng dụng khi DOM sẵn sàng
  document.addEventListener('DOMContentLoaded', () => {
    initEmojiPickers();
    syncPeriodControls();
    bindEvents();
    store.subscribe(() => renderAll());
    renderAll();
  });
})();
