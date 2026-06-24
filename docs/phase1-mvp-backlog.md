# Phase 1 MVP — Backlog theo domain

> Đọc `CONTRIBUTING.md` ở root trước để hiểu vì sao chia theo domain
> (Job Post / Application / Merchant identity-Store / Shared UI-Infra) thay vì
> theo site (merchant/admin/worker), và quy trình review/PR.

Nguồn: list to-do gốc do PO/PM gửi, đã đối chiếu với `prisma/schema.prisma` và
code hiện tại để xác nhận field nào đã có sẵn (không cần migration) và file
nào thực sự bị đụng.

---

## 🟦 Job Post domain (`@member-A`)

- [ ] [Improve] Bước 2/3/4 màn tạo job: bổ sung CTA **Back** nằm bên phải CTA
      Tiếp theo
- [ ] [Improve] Bước 2 "Thông tin công việc": bổ sung `salary_min` /
      `salary_max` / `salary_type` + các field khác theo DB hiện tại, UI theo
      `docs/superpowers/specs/UI admin merchant/5952fdd1c503445d1d12.jpg`.
      Field này **đã có sẵn trong schema** (`JobPost.salaryMin/Max/Type`) —
      chỉ là việc UI/wiring, không cần migration. Bước 3 (gen AI) giữ nguyên.
- [ ] [Improve] Quản lý tin tuyển dụng (merchant): wording lại trạng thái
      hiển thị trên web
- [ ] [Improve] Admin: update wording trạng thái tin tuyển dụng — đồng bộ với
      wording mới bên merchant ở trên (làm sau, phụ thuộc item trước)
- [ ] [Bug] Worker: không hiển thị logo merchant trên trang job — đã trace
      code: `logoUrl` đã được trả đúng từ service
      (`lib/services/jobPostService.ts:237`) và có trong type của
      `app/jobs/page.tsx` / `app/jobs/[id]/page.tsx`. Nhiều khả năng là lỗi
      render ở UI (thiếu `<img>`/sai field/fallback), không phải thiếu data.
      Cần repro trước khi sửa.

## 🟩 Application domain (`@member-B`)

- [ ] [New feature] Export data ứng viên + bộ filter tương ứng (ngày nộp, tên
      vị trí)
- [ ] [Improve] Admin: menu ứng viên bổ sung thêm cột **merchant**

## 🟨 Merchant identity / Store domain (`@member-C`)

- [ ] [Improve] Search keyword không dấu chưa đúng — ví dụ "Au Co" không match
      "Jollibee Âu Cơ" (store search, `useStoreSearch`/`storeService`)
- [ ] [Improve] Hồ sơ thương hiệu: update UI theo
      `docs/superpowers/specs/UI admin merchant/87236c5e558cd4d28d9d.jpg` —
      bổ sung logo, banner, config `job_category`, hiển thị detail cửa hàng
      (tên + địa chỉ). `Merchant.logoUrl/bannerUrl/jobCategories` **đã có sẵn
      trong schema** — chỉ là UI, không cần migration.
- [ ] [New feature] Admin: xem chi tiết hồ sơ thương hiệu khi click tên
      thương hiệu ở màn Merchant — UI tái dùng lại UI hồ sơ thương hiệu bên
      merchant ở trên (làm sau khi item đó xong, để tái dùng component)

## 🟧 Cross-domain — cần 2 owner phối hợp, không gán 1 người được

- [ ] **Update UI bước chọn cửa hàng + cho phép chọn theo Tỉnh/Thành phố hoặc
      Quận/Huyện** (giữ bộ filter hiện tại) — ref:
      `docs/superpowers/specs/UI admin merchant/a07710f52827a979f036.jpg`.
      Trang thuộc Job Post (`app/merchant/jobs/new/page.tsx`, bước chọn cửa
      hàng), nhưng logic filter thuộc Store domain (`StoreFilterBar`,
      `useStoreSearch`). **Đề xuất:** `@member-A` chủ trì UI step,
      `@member-C` mở rộng `useStoreSearch` để filter theo
      Tỉnh/Thành-Quận/Huyện.
- [ ] **Click tên vị trí job → xem detail job kèm danh sách ứng viên đã
      apply** — trang detail thuộc Job Post (`@member-A`), danh sách ứng viên
      thuộc Application domain (`@member-B`). **Đề xuất:** `@member-A` dựng
      trang, gọi service `listApplications` hiện có của `@member-B`; người
      còn lại review PR.

## ⬜ Shared UI / Infra (`@member-D`) — làm trước, làm nền cho 3 cụm trên

- [ ] Update design system — merchant + admin + worker
      **Đề xuất:** `@member-D` định nghĩa/chuẩn hoá token màu, spacing,
      component dùng chung trong `app/globals.css` trước. Sau đó từng domain
      owner tự áp dụng token lên trang mình quản lý — không để 1 người sửa
      UI cả 3 site (tránh đúng vấn đề "file nóng" đã nói ở `CONTRIBUTING.md`).

---

## Gợi ý thứ tự chạy

1. `@member-D` chốt design tokens (Shared UI/Infra) trước — các domain khác
   cần token này để áp dụng UI mới.
2. `@member-A`, `@member-B`, `@member-C` chạy song song phần riêng của mình.
3. 2 item cross-domain chạy sau khi phần nền (store filter, applicants list)
   bên domain liên quan đã ổn định.
4. Item phụ thuộc thứ tự rõ (đã ghi chú "làm sau" ở trên) — không chạy trước
   item nó phụ thuộc.
