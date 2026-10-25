/**
 * ============================================================================
 * BỘ VẼ BIỂU ĐỒ TƯƠNG TÁC SVG THUẦN (js/charts.js)
 * ============================================================================
 * Không phụ thuộc thư viện ngoài — Chạy offline 100%, siêu nhẹ, tự động
 * tương thích chế độ Sáng/Tối và có hiệu ứng rê chuột (hover) trực quan.
 */

(function () {
  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * 1. BIỂU ĐỒ TRÒN DONUT (Cơ cấu Danh mục Chi tiêu / Thu nhập)
   */
  function renderDonutChart(container, breakdown, store, emptyTitle = 'Chưa có phát sinh') {
    if (!container) return;
    const activeItems = (breakdown.items || []).filter((i) => i.amount > 0);
    const total = breakdown.grandTotal || 0;

    if (total <= 0 || activeItems.length === 0) {
      container.innerHTML = `
        <div class="donut-empty">
          <svg viewBox="0 0 180 180" class="donut-svg">
            <circle cx="90" cy="90" r="64" fill="none" stroke="var(--border-color)" stroke-width="22" stroke-dasharray="6 6"></circle>
          </svg>
          <p class="muted-text">${esc(emptyTitle)} trong kỳ này</p>
        </div>
      `;
      return;
    }

    const radius = 64;
    const circumference = 2 * Math.PI * radius;
    let cumulativeFraction = 0;

    const circlesHtml = activeItems.map((item, idx) => {
      const fraction = item.amount / total;
      const dashLength = Math.max(0, fraction * circumference - (activeItems.length > 1 ? 2 : 0));
      const dashOffset = -cumulativeFraction * circumference;
      cumulativeFraction += fraction;

      return `
        <circle
          class="donut-segment"
          data-idx="${idx}"
          cx="90"
          cy="90"
          r="${radius}"
          fill="none"
          stroke="${esc(item.color)}"
          stroke-width="24"
          stroke-dasharray="${dashLength.toFixed(2)} ${circumference.toFixed(2)}"
          stroke-dashoffset="${dashOffset.toFixed(2)}"
          transform="rotate(-90 90 90)"
        ></circle>
      `;
    }).join('');

    const legendHtml = activeItems.slice(0, 7).map((item, idx) => `
      <div class="donut-legend-item" data-idx="${idx}">
        <span class="legend-dot" style="background:${esc(item.color)}"></span>
        <span class="legend-name">${esc(item.icon)} ${esc(item.name)}</span>
        <span class="legend-pct">${item.share.toFixed(1)}%</span>
        <span class="legend-amt">${esc(store.formatCompact(item.amount))}</span>
      </div>
    `).join('');

    const extraCount = activeItems.length - 7;
    const extraHtml = extraCount > 0
      ? `<div class="muted-text small-note">+ ${extraCount} danh mục khác</div>`
      : '';

    const defaultLabel = 'Tổng cộng';
    const defaultValue = store.formatCompact(total);
    const defaultSub = `${activeItems.reduce((s, x) => s + x.count, 0)} giao dịch`;

    container.innerHTML = `
      <div class="donut-layout">
        <div class="donut-visual">
          <svg viewBox="0 0 180 180" class="donut-svg" role="img" aria-label="Biểu đồ cơ cấu danh mục">
            <circle cx="90" cy="90" r="${radius}" fill="none" stroke="var(--bg-subtle)" stroke-width="24"></circle>
            ${circlesHtml}
          </svg>
          <div class="donut-center">
            <span class="donut-center-label" data-role="label">${esc(defaultLabel)}</span>
            <strong class="donut-center-value" data-role="value">${esc(defaultValue)}</strong>
            <span class="donut-center-sub" data-role="sub">${esc(defaultSub)}</span>
          </div>
        </div>
        <div class="donut-legend">
          ${legendHtml}
          ${extraHtml}
        </div>
      </div>
    `;

    const labelEl = container.querySelector('[data-role="label"]');
    const valueEl = container.querySelector('[data-role="value"]');
    const subEl = container.querySelector('[data-role="sub"]');
    const segments = container.querySelectorAll('.donut-segment');
    const legendRows = container.querySelectorAll('.donut-legend-item');

    function highlight(idx) {
      const item = activeItems[idx];
      if (!item) return;
      segments.forEach((seg, i) => {
        seg.style.opacity = i === idx ? '1' : '0.35';
        seg.setAttribute('stroke-width', i === idx ? '28' : '22');
      });
      legendRows.forEach((row, i) => {
        row.classList.toggle('is-active', i === idx);
      });
      labelEl.textContent = `${item.icon} ${item.name}`;
      valueEl.textContent = store.formatCompact(item.amount);
      subEl.textContent = `${item.share.toFixed(1)}% (${store.formatCurrency(item.amount)})`;
    }

    function resetHighlight() {
      segments.forEach((seg) => {
        seg.style.opacity = '1';
        seg.setAttribute('stroke-width', '24');
      });
      legendRows.forEach((row) => row.classList.remove('is-active'));
      labelEl.textContent = defaultLabel;
      valueEl.textContent = defaultValue;
      subEl.textContent = defaultSub;
    }

    segments.forEach((seg) => {
      const idx = Number(seg.dataset.idx);
      seg.addEventListener('mouseenter', () => highlight(idx));
      seg.addEventListener('mouseleave', resetHighlight);
    });
    legendRows.forEach((row) => {
      const idx = Number(row.dataset.idx);
      row.addEventListener('mouseenter', () => highlight(idx));
      row.addEventListener('mouseleave', resetHighlight);
    });
  }

  /**
   * 2. BIỂU ĐỒ CỘT ĐÔI XU HƯỚNG THU - CHI 6 THÁNG
   */
  function renderMonthlyTrendChart(container, trendData, store, activeMonthKey) {
    if (!container) return;
    const maxVal = Math.max(
      1,
      ...trendData.map((d) => Math.max(d.income, d.expense))
    );

    // Làm tròn mốc cao nhất cho đẹp
    const niceMax = getNiceCeiling(maxVal);
    const svgW = 560;
    const svgH = 240;
    const padLeft = 64;
    const padRight = 18;
    const padTop = 20;
    const padBottom = 38;
    const chartW = svgW - padLeft - padRight;
    const chartH = svgH - padTop - padBottom;

    // Đường lưới ngang (4 bậc)
    const steps = 4;
    let gridHtml = '';
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const y = padTop + chartH - ratio * chartH;
      const val = niceMax * ratio;
      gridHtml += `
        <line x1="${padLeft}" y1="${y.toFixed(1)}" x2="${svgW - padRight}" y2="${y.toFixed(1)}" stroke="var(--border-color)" stroke-dasharray="${i === 0 ? '0' : '4 4'}"></line>
        <text x="${padLeft - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" class="chart-axis-text">${esc(val === 0 ? '0' : store.formatCompact(val))}</text>
      `;
    }

    const groupWidth = chartW / trendData.length;
    const barWidth = Math.min(20, groupWidth * 0.28);
    const gap = 4;

    const barsHtml = trendData.map((item, idx) => {
      const centerX = padLeft + idx * groupWidth + groupWidth / 2;
      const incH = Math.max(item.income > 0 ? 3 : 0, (item.income / niceMax) * chartH);
      const expH = Math.max(item.expense > 0 ? 3 : 0, (item.expense / niceMax) * chartH);

      const incX = centerX - barWidth - gap / 2;
      const expX = centerX + gap / 2;
      const incY = padTop + chartH - incH;
      const expY = padTop + chartH - expH;
      const isCurrent = item.monthKey === activeMonthKey;

      return `
        <g class="trend-bar-group ${isCurrent ? 'is-selected' : ''}" data-idx="${idx}">
          <rect
            x="${(padLeft + idx * groupWidth + 4).toFixed(1)}"
            y="${padTop}"
            width="${(groupWidth - 8).toFixed(1)}"
            height="${chartH}"
            rx="8"
            class="trend-hover-bg"
          ></rect>
          <rect
            x="${incX.toFixed(1)}"
            y="${incY.toFixed(1)}"
            width="${barWidth.toFixed(1)}"
            height="${incH.toFixed(1)}"
            rx="4"
            fill="var(--color-income)"
          ></rect>
          <rect
            x="${expX.toFixed(1)}"
            y="${expY.toFixed(1)}"
            width="${barWidth.toFixed(1)}"
            height="${expH.toFixed(1)}"
            rx="4"
            fill="var(--color-expense)"
          ></rect>
          <text
            x="${centerX.toFixed(1)}"
            y="${svgH - 12}"
            text-anchor="middle"
            class="chart-axis-text ${isCurrent ? 'is-current-label' : ''}"
          >${esc(item.label)}</text>
        </g>
      `;
    }).join('');

    container.innerHTML = `
      <div class="bar-chart-wrap">
        <div class="chart-inline-legend">
          <span><i class="legend-dot" style="background:var(--color-income)"></i> Thu nhập</span>
          <span><i class="legend-dot" style="background:var(--color-expense)"></i> Chi tiêu</span>
          <span class="chart-hover-readout" data-role="readout">Rê chuột vào cột để xem chi tiết từng tháng</span>
        </div>
        <svg viewBox="0 0 ${svgW} ${svgH}" class="bar-chart-svg" role="img" aria-label="Biểu đồ xu hướng thu chi 6 tháng">
          ${gridHtml}
          ${barsHtml}
        </svg>
      </div>
    `;

    const readout = container.querySelector('[data-role="readout"]');
    const groups = container.querySelectorAll('.trend-bar-group');

    groups.forEach((g) => {
      const idx = Number(g.dataset.idx);
      const d = trendData[idx];
      g.addEventListener('mouseenter', () => {
        const netSign = d.net >= 0 ? '+' : '';
        readout.innerHTML = `<strong>${esc(d.fullLabel)}:</strong> Thu <b class="text-income">${esc(store.formatCurrency(d.income))}</b> · Chi <b class="text-expense">${esc(store.formatCurrency(d.expense))}</b> · Dư <b>${netSign}${esc(store.formatCompact(d.net))}</b>`;
      });
      g.addEventListener('mouseleave', () => {
        readout.textContent = 'Rê chuột vào cột để xem chi tiết từng tháng';
      });
    });
  }

  /**
   * 3. BIỂU ĐỒ CHI TIÊU THEO NGÀY TRONG THÁNG
   */
  function renderDailyChart(container, dailyData, store) {
    if (!container) return;
    const days = dailyData.days || [];
    const totalExp = days.reduce((s, d) => s + d.expense, 0);

    if (totalExp <= 0) {
      container.innerHTML = `<p class="muted-text empty-center">Chưa có khoản chi tiêu nào trong tháng ${esc(dailyData.monthKey)}.</p>`;
      return;
    }

    const maxExp = Math.max(1, ...days.map((d) => d.expense));
    const niceMax = getNiceCeiling(maxExp);
    const avgDaily = totalExp / days.length;

    const svgW = 680;
    const svgH = 200;
    const padLeft = 58;
    const padRight = 14;
    const padTop = 18;
    const padBottom = 30;
    const chartW = svgW - padLeft - padRight;
    const chartH = svgH - padTop - padBottom;

    const avgY = padTop + chartH - (avgDaily / niceMax) * chartH;
    const colW = chartW / days.length;
    const barW = Math.max(6, colW * 0.62);

    const barsHtml = days.map((d, idx) => {
      const h = d.expense > 0 ? Math.max(3, (d.expense / niceMax) * chartH) : 0;
      const x = padLeft + idx * colW + (colW - barW) / 2;
      const y = padTop + chartH - h;
      const showTick = d.day === 1 || d.day % 5 === 0 || d.day === days.length;

      return `
        <g class="daily-bar-group" data-idx="${idx}">
          <rect x="${(padLeft + idx * colW).toFixed(1)}" y="${padTop}" width="${colW.toFixed(1)}" height="${chartH}" fill="transparent"></rect>
          <rect
            x="${x.toFixed(1)}"
            y="${y.toFixed(1)}"
            width="${barW.toFixed(1)}"
            height="${h.toFixed(1)}"
            rx="3"
            fill="${d.expense > avgDaily * 1.8 ? 'var(--color-expense)' : 'var(--accent-primary)'}"
          ></rect>
          ${showTick ? `<text x="${(padLeft + idx * colW + colW / 2).toFixed(1)}" y="${svgH - 8}" text-anchor="middle" class="chart-axis-text">${d.day}</text>` : ''}
        </g>
      `;
    }).join('');

    container.innerHTML = `
      <div class="bar-chart-wrap">
        <div class="chart-inline-legend">
          <span>Trung bình ngày: <strong>${esc(store.formatCurrency(Math.round(avgDaily)))}</strong></span>
          <span class="chart-hover-readout" data-role="daily-readout">Rê chuột xem chi tiêu từng ngày</span>
        </div>
        <svg viewBox="0 0 ${svgW} ${svgH}" class="bar-chart-svg" role="img" aria-label="Biểu đồ chi tiêu theo ngày">
          <line x1="${padLeft}" y1="${padTop}" x2="${svgW - padRight}" y2="${padTop}" stroke="var(--border-color)" stroke-dasharray="4 4"></line>
          <text x="${padLeft - 8}" y="${padTop + 4}" text-anchor="end" class="chart-axis-text">${esc(store.formatCompact(niceMax))}</text>
          <line x1="${padLeft}" y1="${padTop + chartH}" x2="${svgW - padRight}" y2="${padTop + chartH}" stroke="var(--border-color)"></line>
          <text x="${padLeft - 8}" y="${padTop + chartH + 4}" text-anchor="end" class="chart-axis-text">0</text>
          <line x1="${padLeft}" y1="${avgY.toFixed(1)}" x2="${svgW - padRight}" y2="${avgY.toFixed(1)}" stroke="var(--color-warning)" stroke-width="1.5" stroke-dasharray="5 4"></line>
          ${barsHtml}
        </svg>
      </div>
    `;

    const readout = container.querySelector('[data-role="daily-readout"]');
    container.querySelectorAll('.daily-bar-group').forEach((g) => {
      const d = days[Number(g.dataset.idx)];
      g.addEventListener('mouseenter', () => {
        readout.innerHTML = `Ngày <strong>${esc(d.date.split('-').reverse().join('/'))}</strong>: Chi <b class="text-expense">${esc(store.formatCurrency(d.expense))}</b>${d.income > 0 ? ` · Thu <b class="text-income">${esc(store.formatCurrency(d.income))}</b>` : ''}`;
      });
      g.addEventListener('mouseleave', () => {
        readout.textContent = 'Rê chuột xem chi tiêu từng ngày';
      });
    });
  }

  function getNiceCeiling(value) {
    if (value <= 0) return 100;
    const exp = Math.floor(Math.log10(value));
    const base = Math.pow(10, exp);
    const frac = value / base;
    if (frac <= 1.2) return 1.2 * base;
    if (frac <= 1.5) return 1.5 * base;
    if (frac <= 2) return 2 * base;
    if (frac <= 3) return 3 * base;
    if (frac <= 4) return 4 * base;
    if (frac <= 5) return 5 * base;
    if (frac <= 6) return 6 * base;
    if (frac <= 8) return 8 * base;
    return 10 * base;
  }

  window.FinCharts = {
    renderDonutChart,
    renderMonthlyTrendChart,
    renderDailyChart
  };
})();
