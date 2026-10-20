# Boring Time

! Url claude: https://claude.ai/chat/f66f4ad5-0898-455f-800d-56d6841ae352

Boring Time là ứng dụng web tiếng Việt giúp chủ động dành một khoảng lặng ít kích thích, sau đó nhẹ nhàng trở lại với việc định làm. Ứng dụng không có backend hay database: cài đặt và nhật ký phiên chỉ nằm trong `localStorage` trên thiết bị/trình duyệt hiện tại.

## Chạy bằng Docker

Cần Docker Desktop có Docker Compose:

```bash
docker compose up --build
```

Mở [http://localhost:8080](http://localhost:8080). Dừng ứng dụng bằng `Ctrl+C`; để chạy nền dùng `docker compose up --build -d`, rồi `docker compose down`.

## Chạy phát triển

Cần Node.js 20 LTS:

```bash
npm ci
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal (thường là `http://localhost:5173`). Chạy `npm test` để kiểm tra migrate dữ liệu và `npm run build` để tạo bản production.

## Tính năng hiện có

- Chọn thời lượng, một trong năm hoạt động chậm, âm thanh Web Audio và âm lượng nhỏ.
- Có thể nhập việc định làm và ghi nhận cảm xúc/tập trung trước phiên; tùy chọn hít thở mở đầu 30 giây.
- Tab ẩn sẽ tạm dừng phiên; mất focus và ý định thoát được ghi nhận trung tính. Giữ Esc hoặc nút Thoát ba giây mới kết thúc.
- Sau session là một phút đáp xuống với nền dịu, tiếp theo là đánh giá cảm xúc/tập trung và nhật ký tùy chọn.
- Có thể tiếp tục bằng bộ đếm tập trung 25 phút, kết thúc với một âm thanh Web Audio nhỏ.
- Lịch sử, biểu đồ tuần, cài đặt sáng/tối, nhập và xuất JSON.
- Báo cáo tuần, heatmap 26 tuần, biểu đồ SVG khi có ít nhất năm phiên được chấm tập trung; lọc lịch sử theo ngày và hoạt động.
- Mix tối đa ba lớp âm thanh với âm lượng riêng, tùy chọn im lặng hoàn toàn; mix gần nhất được lưu.
- Lịch nhắc theo ngày/giờ, thông báo hệ thống nếu được cấp quyền hoặc lời nhắc trong app. Hiển thị số buổi trong tuần, gợi ý tăng thời lượng 2 phút sau ba phiên hoàn thành (nếu bật), và chọn ngẫu nhiên hoạt động/âm thanh.
- Phím tắt: Space bắt đầu/tạm dừng, giữ Esc 3 giây để kết thúc, phím 1–5 chọn điểm tập trung.
- Mục **Tập thở** có ba nhịp dẫn chậm; nhịp mặc định 4 giây hít vào, 6 giây thở ra, một lượt làm quen 20 giây và buổi mặc định 3 phút. Âm tông được tạo bằng Web Audio sau khi bấm bắt đầu; buổi thở được ghi chung vào lịch sử.
- Lưu ý nhẹ nhàng: thở không gắng sức, quay lại nhịp tự nhiên nếu thấy khó chịu. Bài tập thư giãn không thay thế tư vấn y tế.
- PWA có manifest, icon đơn giản và service worker precache để sử dụng offline sau lần mở đầu tiên; có thông báo nhỏ khi bản mới sẵn sàng.
- Giao diện responsive, hỗ trợ bàn phím và `prefers-reduced-motion`.

## Dữ liệu, riêng tư và giới hạn

- Dữ liệu được lưu cục bộ trong localStorage của origin đang mở; restart container không xóa dữ liệu, nhưng đổi trình duyệt/thiết bị hoặc dọn dữ liệu trình duyệt thì không tự đồng bộ. Cài đặt “Không ghi lại dữ liệu” ngăn ghi session mới.
- Storage dùng `schemaVersion: 4`; khi mở ứng dụng, dữ liệu phiên bản 1, 2 và 3 được migrate tại chỗ, giữ cài đặt/phiên cũ. Chạy `npm test` để xác minh. Tệp JSON phiên bản 1, 2 và 3 cũng được migrate khi nhập.
- Dùng **Lịch sử → Xuất JSON** để sao lưu định kỳ và trước khi nhập tệp khác. Nhập sẽ thay thế cài đặt và lịch sử hiện tại; ứng dụng không gửi dữ liệu tới máy chủ.
- Lời nhắc được kiểm tra khi ứng dụng đang chạy. Notification API có thể hiện thông báo hệ thống khi được cấp quyền; nếu không, nhắc trong giao diện. Trình duyệt không thể nhắc khi ứng dụng/PWA hoàn toàn đã đóng vì không có backend hoặc dịch vụ push.
- Cài PWA cần mở qua `localhost` hoặc HTTPS. Tính năng offline có hiệu lực sau lần tải đầy đủ đầu tiên.
- Hít thở mở đầu mặc định tắt; các thẻ cảm xúc, điểm và nhật ký đều không bắt buộc. Thoát sớm không bị phạt.

## Cấu trúc

```text
src/
  components/
    activities/       # Năm hoạt động riêng biệt
    breathing/        # Hình ảnh dẫn nhịp thở
    ui/               # Picker, header và thành phần dùng chung
  composables/         # Timer, âm thanh, Wake Lock, PWA update và engine thở
  data/breathingPatterns.js # Cấu hình các bài thở
  router/              # Điều hướng Vue Router
  services/storage.js  # localStorage, schema/migrate, nhập/xuất JSON
  stores/              # Pinia: cài đặt, lịch sử, session hiện tại
  views/               # Bắt đầu, session, đáp xuống, hoàn tất, tập trung, lịch sử, cài đặt
public/
  manifest.webmanifest
  icon.svg
tests/
  storage-migration.test.js
Dockerfile
docker-compose.yml
nginx.conf
```

## Thêm hoạt động

1. Tạo component trong `src/components/activities/`; dùng vùng `.activity-stage`, giữ chuyển động chậm, thêm `aria-label` và đảm bảo hiển thị phù hợp với reduced-motion.
2. Thêm mã và nhãn hoạt động ở `src/views/HomeView.vue`, map component trong `src/views/SessionView.vue`, và nhãn lịch sử trong `src/views/HistoryView.vue`.
3. Cho phép mã hoạt động mới trong `normalizeSettings` tại `src/services/storage.js`.
4. Chạy `npm test` và `npm run build`.

## Thêm bài thở

Thêm một object vào `BREATHING_PATTERNS` trong `src/data/breathingPatterns.js`, gồm `id`, `name`, `description`, `recommendation` và danh sách `phases` (`id`, `label`, `seconds`). Mỗi pha hiện cần nằm trong 1–12 giây; nên giữ nhịp tự nhiên và tránh yêu cầu gắng sức. Pha giữ hơi không bắt buộc và người tập luôn có thể dừng hoặc quay về thở bình thường.

## Chuẩn bị thêm ngôn ngữ

Giao diện hiện dùng tiếng Việt làm ngôn ngữ mặc định (`lang="vi"` trong `index.html`). Khi bổ sung tiếng Anh, tạo dictionary `vi`/`en` trong `src/locales/`, thay chuỗi giao diện bằng key dịch, rồi thêm lựa chọn ngôn ngữ vào Settings. Có thể dùng `vue-i18n` ở giai đoạn đó; hiện chưa thêm thư viện dịch để giữ bundle gọn.
