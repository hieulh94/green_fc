# 🔧 Fix Frontend Routing - Hiển thị Frontend thay vì API JSON

## ⚠️ Vấn đề
Khi mở web, chỉ hiện:
```json
{"message":"Football Team Management API"}
```

Thay vì hiển thị frontend HTML.

## 🎯 Nguyên nhân
Routing trong `vercel.json` không đúng:
- Route `/` đang match với pattern `/(.*)` và rewrite thành `/frontend/`
- Nhưng `/frontend/` không phải file, cần `/frontend/index.html`

## ✅ Đã sửa

Thêm route riêng cho `/` trước route `/(.*)`:
```json
{
  "source": "/",
  "destination": "/frontend/index.html"
}
```

## 📋 Routing hiện tại:

1. `/api/*` → `/api/index.py` (Backend API)
2. `/static/*` → `/static/$1` (Static files)
3. `/` → `/frontend/index.html` (Frontend homepage) ← **MỚI**
4. `/*` → `/frontend/$1` (Other frontend files)

## 🚀 Next Steps:

1. **Commit và push**:
   ```bash
   git add .
   git commit -m "Fix frontend routing: Add explicit route for root path"
   git push
   ```

2. **Vercel sẽ tự động redeploy**
   - Đợi build hoàn tất
   - Test lại

3. **Test lại**:
   - `https://your-project.vercel.app/` → Sẽ hiển thị frontend HTML
   - `https://your-project.vercel.app/api/` → Sẽ hiển thị API JSON

## ✅ Kết quả mong đợi:

Sau khi deploy:
- Truy cập `/` → Hiển thị frontend HTML (index.html)
- Truy cập `/api/` → Hiển thị API JSON
- Truy cập `/api/teams/` → API endpoint
- Truy cập `/styles.css` → Frontend CSS file

---

**Sau khi deploy, frontend sẽ hiển thị đúng!** ✅

