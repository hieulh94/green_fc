# 🔧 Fix Frontend Not Deploying

## ⚠️ Vấn đề
Truy cập `/frontend/index.html` cũng bị lỗi `{"detail":"Not Found"}`.

## 🎯 Nguyên nhân
Vercel có thể không serve files từ subdirectory `frontend/` đúng cách. Cần đảm bảo:
1. Files được deploy
2. Routing đúng
3. Không bị ignore

## ✅ Đã sửa

### 1. Thêm `"public": true` vào vercel.json
- Đảm bảo tất cả files được public

### 2. Đơn giản hóa routing
- Chỉ dùng pattern `/(.*)` → `/frontend/$1`
- Vercel sẽ tự động serve static files

## 📋 Routing mới:

1. `/api/*` → `/api/index.py` (Backend API)
2. `/api` → `/api/index.py` (Backend API root)
3. `/static/*` → `/static/$1` (Static uploads)
4. `/*` → `/frontend/$1` (Frontend files - tất cả routes khác)

## 🔍 Kiểm tra:

### 1. Đảm bảo files không bị ignore
`.vercelignore` không có `frontend/` trong đó.

### 2. Test sau khi deploy:
- `https://green-fc.vercel.app/` → `/frontend/index.html`
- `https://green-fc.vercel.app/styles.css` → `/frontend/styles.css`
- `https://green-fc.vercel.app/app.js` → `/frontend/app.js`

## 🚀 Next Steps:

1. **Commit và push**:
   ```bash
   git add .
   git commit -m "Fix frontend deploy: Add public flag, simplify routing"
   git push
   ```

2. **Vercel sẽ tự động redeploy**
   - Đợi build hoàn tất
   - Test lại

3. **Kiểm tra Vercel build logs**:
   - Vào Vercel Dashboard → Deployments
   - Xem build logs
   - Đảm bảo không có lỗi về frontend files

## ⚠️ Nếu vẫn lỗi:

### Option 1: Di chuyển frontend files ra root
Nếu vẫn không hoạt động, có thể cần di chuyển files:
```bash
# Di chuyển files từ frontend/ ra root
mv frontend/index.html public/index.html
mv frontend/styles.css public/styles.css
mv frontend/app.js public/app.js
# ... etc
```

Sau đó update `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.py"
    },
    {
      "source": "/(.*)",
      "destination": "/public/$1"
    }
  ]
}
```

### Option 2: Tạo public directory
Vercel tự động serve files từ `public/` directory:
```bash
mkdir public
cp -r frontend/* public/
```

Sau đó update routing để serve từ `public/`.

---

**Sau khi deploy với routing mới, frontend sẽ được serve đúng!** ✅

