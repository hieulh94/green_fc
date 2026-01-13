# 🔧 Fix Frontend Routing - Version 2

## ⚠️ Vấn đề
Website vẫn chỉ hiện JSON `{"message":"Football Team Management API"}` thay vì frontend HTML.

## 🎯 Nguyên nhân
1. **FastAPI đang handle route `/`** và trả về JSON
2. Vercel routing có thể match API trước frontend
3. Cần đảm bảo frontend được serve trước API

## ✅ Đã sửa

### 1. Đổi FastAPI root route
- Từ `@app.get("/")` → `@app.get("/api")`
- Route `/` giờ không còn bị FastAPI handle

### 2. Cải thiện Vercel routing
- Thêm route `/api` → `/api/index.py`
- Thêm pattern cho static files (`.html`, `.css`, `.js`, etc.)
- Route `/(.*)` cuối cùng sẽ serve `index.html` (cho SPA routing)

## 📋 Routing hiện tại:

1. `/api/*` → `/api/index.py` (Backend API)
2. `/api` → `/api/index.py` (Backend API root) ← **MỚI**
3. `/static/*` → `/static/$1` (Static files)
4. `/` → `/frontend/index.html` (Frontend homepage)
5. `/*.html`, `/*.css`, `/*.js`, etc. → `/frontend/$1` (Frontend files) ← **MỚI**
6. `/*` → `/frontend/index.html` (SPA fallback) ← **CẢI THIỆN**

## 🚀 Next Steps:

1. **Commit và push**:
   ```bash
   git add .
   git commit -m "Fix frontend routing: Remove FastAPI root route, improve Vercel routing"
   git push
   ```

2. **Vercel sẽ tự động redeploy**
   - Đợi build hoàn tất
   - Test lại

3. **Test lại**:
   - `https://green-fc.vercel.app/` → Sẽ hiển thị frontend HTML
   - `https://green-fc.vercel.app/api` → Sẽ hiển thị API JSON
   - `https://green-fc.vercel.app/api/teams/` → API endpoint

## ✅ Kết quả mong đợi:

Sau khi deploy:
- ✅ Truy cập `/` → Hiển thị frontend HTML (index.html)
- ✅ Truy cập `/api` → Hiển thị API JSON
- ✅ Truy cập `/api/teams/` → API endpoint
- ✅ Truy cập `/styles.css` → Frontend CSS file
- ✅ Truy cập `/app.js` → Frontend JS file

## 🔍 Nếu vẫn không hoạt động:

### Option 1: Clear cache và redeploy
- Clear build cache trên Vercel
- Redeploy lại

### Option 2: Kiểm tra file structure
Đảm bảo `frontend/index.html` tồn tại và có nội dung đúng.

### Option 3: Test trực tiếp
Truy cập: `https://green-fc.vercel.app/frontend/index.html`
- Nếu hoạt động → Routing issue
- Nếu không → File không được deploy

---

**Sau khi deploy, frontend sẽ hiển thị đúng!** ✅

