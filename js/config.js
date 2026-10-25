/**
 * ============================================================================
 * FILE CẤU HÌNH MẶC ĐỊNH (js/config.js)
 * ============================================================================
 * Bạn có thể dễ dàng chỉnh sửa các thông số mặc định của ứng dụng tại đây
 * trước hoặc sau khi đưa code lên GitHub!
 */

window.APP_CONFIG = {
  // Khóa lưu trữ dữ liệu trên trình duyệt (LocalStorage)
  storageKey: 'finflow_personal_finance_v1',

  // Cài đặt mặc định ban đầu của ứng dụng
  defaultSettings: {
    appName: 'FinFlow',
    appSubtitle: 'Quản lý tài chính cá nhân',
    currency: 'VND',        // Hỗ trợ: 'VND', 'USD', 'EUR', 'JPY'
    theme: 'light',         // 'light' | 'dark' | 'system'
    accentColor: 'indigo',  // 'indigo' | 'emerald' | 'rose' | 'amber' | 'violet' | 'cyan'
    monthlyOverallBudget: 15000000 // Hạn mức tổng chi tiêu tháng mặc định (0 = không giới hạn)
  },

  // Danh sách các đơn vị tiền tệ hỗ trợ
  currencies: {
    VND: { code: 'VND', symbol: '₫', locale: 'vi-VN', decimals: 0, label: 'Việt Nam Đồng (₫)', quickAmounts: [20000, 50000, 100000, 200000, 500000, 1000000] },
    USD: { code: 'USD', symbol: '$', locale: 'en-US', decimals: 2, label: 'US Dollar ($)', quickAmounts: [5, 10, 25, 50, 100, 500] },
    EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', decimals: 2, label: 'Euro (€)', quickAmounts: [5, 10, 25, 50, 100, 500] },
    JPY: { code: 'JPY', symbol: '¥', locale: 'ja-JP', decimals: 0, label: 'Yên Nhật (¥)', quickAmounts: [500, 1000, 3000, 5000, 10000, 50000] }
  },

  // Bảng màu chủ đạo (Accent Colors)
  accentPalettes: {
    indigo:  { name: 'Xanh Indigo', primary: '#4f46e5', hover: '#4338ca', soft: 'rgba(79, 70, 229, 0.12)' },
    emerald: { name: 'Xanh Ngọc',   primary: '#059669', hover: '#047857', soft: 'rgba(5, 150, 105, 0.12)' },
    rose:    { name: 'Hồng Đỏ',     primary: '#e11d48', hover: '#be123c', soft: 'rgba(225, 29, 72, 0.12)' },
    amber:   { name: 'Vàng Hổ Phách', primary: '#d97706', hover: '#b45309', soft: 'rgba(217, 119, 6, 0.12)' },
    violet:  { name: 'Tím Violet',  primary: '#7c3aed', hover: '#6d28d9', soft: 'rgba(124, 58, 237, 0.12)' },
    cyan:    { name: 'Xanh Đại Dương', primary: '#0284c7', hover: '#0369a1', soft: 'rgba(2, 132, 199, 0.12)' }
  },

  // Gợi ý biểu tượng Emoji khi tạo Ví hoặc Danh mục mới
  emojiPresets: [
    '🍔', '🍜', '☕', '🛒', '🏠', '💡', '🚗', '⛽', '📱', '💊',
    '🎓', '🎬', '✈️', '🎁', '👗', '💄', '🏋️', '🐾', '👶', '🔧',
    '💰', '💼', '📈', '🏆', '🏦', '💳', '👛', '💎', '🤝', '📦'
  ],

  // Danh sách Ví / Tài khoản mặc định
  defaultWallets: [
    { id: 'w_cash', name: 'Tiền mặt', type: 'cash', icon: '👛', color: '#10b981', initialBalance: 0 },
    { id: 'w_bank', name: 'Tài khoản Ngân hàng', type: 'bank', icon: '🏦', color: '#3b82f6', initialBalance: 0 },
    { id: 'w_ewallet', name: 'Ví điện tử (MoMo/ZaloPay)', type: 'ewallet', icon: '📱', color: '#ec4899', initialBalance: 0 }
  ],

  // Danh mục Thu / Chi mặc định (kèm hạn mức ngân sách tháng mẫu)
  defaultCategories: [
    // Danh mục Chi tiêu (expense)
    { id: 'c_food',      name: 'Ăn uống & Cafe',   type: 'expense', icon: '🍜', color: '#f97316', budget: 4500000 },
    { id: 'c_housing',   name: 'Nhà ở & Điện nước', type: 'expense', icon: '🏠', color: '#6366f1', budget: 5000000 },
    { id: 'c_transport', name: 'Di chuyển & Xăng xe', type: 'expense', icon: '🚗', color: '#0ea5e9', budget: 1500000 },
    { id: 'c_shopping',  name: 'Mua sắm',          type: 'expense', icon: '🛒', color: '#ec4899', budget: 2000000 },
    { id: 'c_bills',     name: 'Viễn thông & Hóa đơn', type: 'expense', icon: '📱', color: '#8b5cf6', budget: 800000 },
    { id: 'c_health',    name: 'Sức khỏe & Thể thao', type: 'expense', icon: '💊', color: '#10b981', budget: 1000000 },
    { id: 'c_entertain', name: 'Giải trí & Du lịch', type: 'expense', icon: '🎬', color: '#f59e0b', budget: 1500000 },
    { id: 'c_education', name: 'Học tập & Sách vở', type: 'expense', icon: '🎓', color: '#14b8a6', budget: 1000000 },
    { id: 'c_other_exp', name: 'Chi phí khác',      type: 'expense', icon: '📦', color: '#64748b', budget: 0 },

    // Danh mục Thu nhập (income)
    { id: 'c_salary',    name: 'Tiền lương',        type: 'income',  icon: '💼', color: '#10b981', budget: 0 },
    { id: 'c_bonus',     name: 'Thưởng & Phụ cấp',  type: 'income',  icon: '🏆', color: '#f59e0b', budget: 0 },
    { id: 'c_freelance', name: 'Làm thêm / Kinh doanh', type: 'income', icon: '💰', color: '#3b82f6', budget: 0 },
    { id: 'c_invest',    name: 'Lãi đầu tư / Tiết kiệm', type: 'income', icon: '📈', color: '#8b5cf6', budget: 0 },
    { id: 'c_other_inc', name: 'Thu nhập khác',     type: 'income',  icon: '🎁', color: '#06b6d4', budget: 0 }
  ]
};
