# Đọc trước khi bắt đầu

Tài liệu này để cả team align cách chia việc, tránh conflict khi nhiều người
(và nhiều Claude Code agent) cùng sửa code trong repo này.

## 1. Vì sao chia theo domain, không chia theo site

Ban đầu hợp lý nhất tưởng là chia theo site (`admin/` / `merchant/` / `worker`),
nhưng không đều và quan trọng hơn: vài service file bị **cả 3 site cùng sửa**
(`lib/services/jobPostService.ts`, `lib/services/applicationService.ts`). Chia
theo site sẽ làm 2-3 người cùng đụng đúng những file đó → conflict liên tục.

Thay vào đó, chia theo **domain/entity**: ai sở hữu 1 entity thì làm luôn mọi
route/trang liên quan đến entity đó ở cả 3 site.

## 2. 4 cụm việc

| Cụm | Sở hữu chính | Owner (CODEOWNERS) |
|---|---|---|
| **Job Post** | `jobPostService.ts`, mọi route/trang job (admin moderate, merchant CRUD, worker listing/detail) | `@member-A` |
| **Application** | `applicationService.ts`, mọi route/trang ứng tuyển (admin, merchant, worker apply) | `@member-B` |
| **Merchant identity / Store** | merchant mgmt (admin), profile, store listing, AI description | `@member-C` |
| **Shared UI / Infra** | prisma schema, auth, db, globals.css, `Shell.tsx`, `middleware.ts`, `Pagination.tsx`, `WorkerHeader.tsx` | `@member-D` |

File chi tiết từng cụm: xem `.github/CODEOWNERS` — GitHub sẽ tự yêu cầu đúng
owner review khi PR đụng vào path thuộc cụm họ.

> Điền username GitHub thật vào `.github/CODEOWNERS` (đang để placeholder
> `@member-A/B/C/D`) trước khi dùng thật.

## 3. File "nóng" — cần báo trước khi sửa

Những file này dù đã có owner riêng, vẫn là điểm dễ xung đột nhất vì nhiều
task/feature khác nhau cùng append vào:

- `lib/services/jobPostService.ts`
- `lib/services/applicationService.ts`
- `components/Shell.tsx`, `middleware.ts` (khi thêm nav/route mới cho admin
  hoặc merchant)

Quy tắc: ai chuẩn bị sửa 1 trong các file này → báo trước trong group chat,
không 2 người (hoặc 2 agent) cùng sửa song song.

## 4. Thứ tự làm (wave)

1. **Shared UI / Infra** xong và merge trước (nền cho 3 cụm còn lại).
2. **Job Post / Application / Merchant identity** chạy song song — vì 3 cụm
   này không đụng file của nhau.
3. Trong mỗi cụm, nếu có nhiều task con cùng đụng 1 file nóng (ví dụ Job Post
   có cả phần merchant-CRUD và worker-listing cùng sửa `jobPostService.ts`)
   thì làm nối tiếp, không song song.

## 5. Quy trình dùng Claude Code agent (worktree)

Cách đã demo và dùng chính thức từ giờ:

1. Dispatch 1 agent cho 1 task/feature cụ thể, agent chạy trong **git
   worktree riêng** (`isolation: worktree`) — không đụng working directory
   chính, không đụng agent khác đang chạy song song.
2. Agent tự code + tự chạy test, **tự commit local, KHÔNG tự push, KHÔNG tự
   mở PR**.
3. Member/owner của cụm đó vào kiểm tra:
   ```
   cd <worktree-path>
   git diff main...HEAD     # phải chỉ đụng file thuộc cụm mình
   npx vitest run            # tự chạy lại test
   ```
4. Nếu ổn → push branch đó, mở PR như bình thường. Nếu thấy agent đụng file
   ngoài phạm vi → không push, sửa lại hoặc báo lại agent.

## 6. Checklist trước khi mở PR

- [ ] `npx vitest run` xanh hết (trừ test cần DB thật nếu máy không có DB —
      ghi rõ trong PR).
- [ ] `git diff --stat main...HEAD` chỉ ra đúng file thuộc cụm mình (so với
      `.github/CODEOWNERS`).
- [ ] Nếu có đụng "file nóng" ở mục 3 — đã báo trước trong group chat.
- [ ] Branch đặt tên theo dạng `feature/<cụm>/<mô-tả-ngắn>`, ví dụ
      `feature/job-post/admin-moderate-fix`.
