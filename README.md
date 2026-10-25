# 💎 FinFlow — Ứng dụng Quản lý Tài chính Cá nhân

Ứng dụng web quản lý thu chi, nhiều ví tiền, ngân sách hàng tháng và phân tích tài chính trực quan. Được xây dựng bằng **HTML5 / CSS3 / JavaScript thuần (Zero Dependencies)** giúp chạy siêu nhanh, dễ dàng tự chỉnh sửa mã nguồn và triển khai miễn phí 100% lên **GitHub Pages**.

---

## ✨ Tính năng nổi bật

- **📊 Bảng điều khiển Tổng quan (Dashboard):** Theo dõi Tổng tài sản ròng, Thu nhập, Chi tiêu, Tỷ lệ tiết kiệm, Biểu đồ tròn cơ cấu danh mục (Donut Chart) và Biểu đồ xu hướng 6 tháng.
- **🧾 Quản lý Sổ giao dịch linh hoạt:** Thêm mới, **chỉnh sửa**, **nhân bản**, **xóa** các khoản *Chi tiêu*, *Thu nhập* và *Chuyển tiền nội bộ giữa các ví*; bộ lọc tìm kiếm đa tiêu chí.
- **👛 Quản lý nhiều Ví & Danh mục tùy chỉnh:** Tạo không giới hạn Ví tiền mặt, Ngân hàng, Ví điện tử, Sổ tiết kiệm; tự tạo/sửa Danh mục với biểu tượng Emoji và màu sắc riêng.
- **🎯 Ngân sách & Cảnh báo vượt mức:** Đặt hạn mức tổng chi tiêu tháng và hạn mức riêng cho từng danh mục kèm gợi ý mức chi tiêu an toàn mỗi ngày còn lại trong tháng.
- **🎨 Tùy biến giao diện trực tiếp:** Đổi tên ứng dụng, dòng mô tả phụ, đơn vị tiền tệ (`VND`, `USD`, `EUR`, `JPY`), chế độ **Sáng / Tối (Dark Mode)** và **6 bảng màu chủ đạo** ngay trên giao diện.
- **🔒 Bảo mật riêng tư 100% + Sao lưu Excel/JSON:** Dữ liệu lưu trực tiếp trên trình duyệt (`LocalStorage`) của người dùng — không gửi lên máy chủ bên thứ ba. Hỗ trợ **Xuất/Nhập file Excel (`.csv` chuẩn tiếng Việt UTF-8)** và **Sao lưu/Khôi phục toàn bộ (`.json`)**.

---

## 📁 Cấu trúc thư mục dễ chỉnh sửa

```text
quan-ly-tai-chinh/
├── index.html        # Giao diện và bố cục chính của ứng dụng
├── .nojekyll         # Giúp GitHub Pages phục vụ file tĩnh chuẩn xác
├── .gitignore        # Ngăn đẩy nhầm file sao lưu cá nhân lên GitHub
├── css/
│   └── styles.css    # Bảng màu (:root), chế độ Sáng/Tối và Responsive
└── js/
    ├── config.js     # ⭐ File cấu hình mặc định (Tên app, Ví mẫu, Danh mục mẫu, Tiền tệ)
    ├── store.js      # Lưu trữ LocalStorage, tính số dư, Xuất/Nhập JSON & CSV
    ├── charts.js     # Bộ vẽ biểu đồ tương tác SVG thuần
    └── app.js        # Điều khiển sự kiện giao diện, bộ lọc và hộp thoại
```

### Cách tự chỉnh sửa mã nguồn nhanh
1. **Chỉnh sửa trực tiếp không cần code:** Mở mục **⚙️ Tùy chỉnh** trên ứng dụng để đổi tên app, tiền tệ, màu sắc, hoặc vào mục **👛 Ví & Danh mục** để sửa các ví và danh mục.
2. **Chỉnh sửa mặc định trong code (khi muốn public bản riêng lên GitHub):** Mở file `js/config.js` bằng bất kỳ trình soạn thảo nào (Notepad, VS Code, hoặc trình sửa trực tiếp trên web GitHub) để thay đổi `defaultSettings`, `defaultWallets`, và `defaultCategories`.

---

## 🚀 Hướng dẫn Public lên GitHub & Bật trang web GitHub Pages miễn phí

### Cách 1: Kéo-thả trực tiếp trên trình duyệt (Không cần cài đặt Git — Chỉ mất 2 phút)

1. Truy cập [https://github.com/new](https://github.com/new) và đăng nhập tài khoản GitHub của bạn.
2. Nhập **Repository name** (ví dụ: `quan-ly-tai-chinh`), chọn **Public**, sau đó nhấn nút **Create repository**.
3. Ở màn hình tiếp theo, bấm vào dòng chữ **uploading an existing file**.
4. Mở thư mục `quan-ly-tai-chinh` trên máy tính, chọn toàn bộ bên trong (`index.html`, `README.md`, `.nojekyll`, thư mục `css`, thư mục `js`) rồi **kéo-thả** vào khung tải lên của GitHub.
5. Nhấn nút **Commit changes** màu xanh ở cuối trang.
6. Bật trang web công khai:
   - Nhấn tab **Settings** (trên thanh menu của repository).
   - Chọn mục **Pages** ở cột bên trái.
   - Tại phần **Build and deployment** → **Branch**, đổi `None` thành **`main`** (thư mục `/(root)`), rồi bấm **Save**.
7. Đợi khoảng 1–2 phút và tải lại trang, bạn sẽ nhận được đường link ứng dụng hoạt động trực tuyến tại:
   `https://<ten-github-cua-ban>.github.io/quan-ly-tai-chinh/`

### Cách 2: Đẩy code bằng dòng lệnh Git (nếu máy đã cài Git)

```bash
cd quan-ly-tai-chinh
git init
git add .
git commit -m "Khởi tạo ứng dụng quản lý tài chính cá nhân"
git branch -M main
git remote add origin https://github.com/<ten-github-cua-ban>/quan-ly-tai-chinh.git
git push -u origin main
```

---

## 💻 Cách chạy ngay trên máy tính

- **Cách đơn giản nhất:** Nhấp đúp trực tiếp vào file `index.html` để mở ngay trên Chrome, Edge, Cốc Cốc hoặc Firefox.
- **Chạy qua máy chủ cục bộ (nếu có Python):**
  ```bash
  python -m http.server 8080
  ```
  Sau đó mở trình duyệt tại `http://localhost:8080`.
