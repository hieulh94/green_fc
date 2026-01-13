# 🔧 Fix "Not Found" Error

## ⚠️ Lỗi
Website hiện `{"detail":"Not Found"}` thay vì frontend HTML.

## 🎯 Nguyên nhân
Vercel đang match với API trước frontend, và API trả về 404 cho route không tồn tại.

## ✅ Đã sửa

**Sắp xếp lại thứ tự routing** trong `vercel.json`:
- Frontend routes được đặt **TRƯỚC** API routes
- Đảm bảo static files được serve trước
- API routes chỉ match khi path bắt đầu với `/api`

## 📋 Routing Order (Quan trọng!):

1. `/static/*` → Static uploads
2. `/index.html`, `/styles.css`, `/app.js`, etc. → Frontend files
3. `/api/*` → Backend API (chỉ match khi có `/api` prefix)
4. `/api` → Backend API root
5. `/` → Frontend homepage
6. `/*` → Frontend SPA fallback

## 🔍 Kiểm tra:

### Test các URLs:
- `https://green-fc.vercel.app/` → Phải hiển thị frontend HTML
- `https://green-fc.vercel.app/api` → Phải hiển thị API JSON
- `https://green-fc.vercel.app/api/teams/` → Phải hiển thị API response
- `gihttps://green-fc.vercel.app/styles.css` → Phải serve CSS file

## 🚀 Next Steps:

1. **Commit và push**:
   ```bash
   git add .
   git commit -m "Fix routing order: Frontend before API"
   git push
   ```

2. **Vercel sẽ tự động redeploy**
   - Đợi build hoàn tất
   - Test lại

3. **Clear browser cache** (nếu cần):
   - Hard refresh: `Ctrl+Shift+R` (Windows) hoặc `Cmd+Shift+R` (Mac)
   - Hoặc mở incognito/private window

## ⚠️ Nếu vẫn lỗi:

### Option 1: Kiểm tra file structure
Đảm bảo `frontend/index.html` tồn tại:
```bash
ls -la frontend/index.html
```

### Option 2: Test trực tiếp frontend path
Truy cập: `https://green-fc.vercel.app/frontend/index.html`
- Nếu hoạt động → Routing issue
- Nếu không → File không được deploy

### Option 3: Kiểm tra Vercel build logs
- Vào Vercel Dashboard → Deployments
- Xem build logs để đảm bảo frontend files được deploy

---

**Sau khi deploy với routing order mới, frontend sẽ hiển thị đúng!** ✅

