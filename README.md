# Boring Time

Boring Time là ứng dụng web tiếng Việt giúp chủ động dành một khoảng thời gian yên tĩnh, ít kích thích để nghỉ ngơi và quay lại với công việc. Ứng dụng không có backend; cài đặt và lịch sử chỉ được lưu trong `localStorage` của trình duyệt hiện tại.

## Chạy bằng Docker

Cài Docker Desktop (có Docker Compose), sau đó chạy tại thư mục dự án:

```bash
docker compose up --build
```

Mở [http://localhost:8080](http://localhost:8080). Dừng ứng dụng bằng `Ctrl+C`; có thể chạy nền với `docker compose up --build -d`, rồi dừng bằng `docker compose down`.

Dữ liệu nằm trong trình duyệt, không nằm trong container, vì vậy vẫn còn sau khi container khởi động lại miễn là dùng cùng trình duyệt và cùng origin. Dùng Xuất JSON để sao lưu hoặc chuyển dữ liệu.

## Chạy phát triển

Cần Node.js 20 LTS.

```bash
npm ci
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal (thường là `http://localhost:5173`). Kiểm tra build production bằng `npm run build`; xem bản build bằng `npm run preview`.

## Tính năng và giả định

- Chọn 5, 10, 15 hoặc 20 phút, một trong năm hoạt động chậm và một trong năm lựa chọn âm thanh.
- Âm thanh được tạo bằng Web Audio API; trình duyệt chỉ khởi tạo âm thanh sau thao tác Bắt đầu. Nếu trình duyệt không hỗ trợ âm thanh, session vẫn chạy bình thường.
- Khi tab bị ẩn, session và âm thanh tạm dừng; cần bấm tiếp tục khi quay lại. Esc cần được giữ đủ hai giây để thoát; nút Thoát ở góc là lối thoát tức thời.
- Service worker precache giao diện và các tệp build để có thể mở ứng dụng ngoại tuyến sau lần tải đầu tiên. Mở qua `localhost`/HTTPS để trình duyệt cho phép service worker.
- Dữ liệu có `schemaVersion` và được kiểm tra khi đọc/nhập. Nếu dữ liệu localStorage hỏng, ứng dụng bắt đầu với cấu hình mặc định; trình duyệt có thể từ chối lưu khi ở chế độ riêng tư hoặc hết dung lượng.
- Nhập JSON thay thế toàn bộ cài đặt và lịch sử hiện có; hãy xuất dữ liệu trước nếu cần giữ bản cũ.
- Cài đặt “Không ghi lại dữ liệu” ngăn lưu các phiên mới nhưng không xóa lịch sử trước đó. Xóa dữ liệu/xóa lịch sử là thao tác riêng.
- Các điểm cảm xúc và tập trung là tùy chọn; bỏ qua lưu phiên với hai điểm rỗng. Biểu đồ cho thấy số phiên và điểm trung bình trong bảy ngày gần nhất.

## Cấu trúc

```text
src/
  components/
    activities/       # Năm hoạt động có thể hoán đổi
    ui/               # Thành phần giao diện dùng chung
  composables/         # Timer, âm thanh, Wake Lock
  router/              # Điều hướng Vue Router
  services/storage.js  # localStorage, schema và nhập/xuất JSON
  stores/              # Pinia: cài đặt, lịch sử, phiên hiện tại
  views/               # Bắt đầu, phiên, hoàn tất, lịch sử, cài đặt
Dockerfile
docker-compose.yml
nginx.conf
```

## Thêm hoạt động mới

1. Tạo component Vue trong `src/components/activities/`, ví dụ `QuietActivity.vue`. Component được render trong vùng `.activity-stage`; hoạt động có thể dùng toàn bộ vùng này. Giữ chuyển động chậm, hỗ trợ reduced-motion và thêm `aria-label` mô tả ngắn.
2. Thêm mã hoạt động vào danh sách lựa chọn tại `src/views/HomeView.vue` và component tương ứng vào map `activities` trong `src/views/SessionView.vue`.
3. Thêm mã hợp lệ trong `normalizeSettings` của `src/services/storage.js` để cấu hình có thể được lưu/nhập; thêm nhãn tương ứng ở `src/views/SettingsView.vue` và tên hiển thị trong lịch sử ở `src/views/HistoryView.vue`.
4. Chạy `npm run build`, rồi kiểm tra cả phiên mới và dữ liệu nhập/xuất.
