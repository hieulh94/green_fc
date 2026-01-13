# 📁 Di chuyển Frontend Files vào Public Directory

## 🎯 Vấn đề
Vercel không serve files từ subdirectory `frontend/` đúng cách.

## ✅ Giải pháp
Di chuyển frontend files vào `public/` directory - Vercel tự động serve files từ đó.

## 📋 Các bước:

### 1. Tạo public directory và copy files:
```bash
cd /Users/mac/Desktop/green_fc
mkdir -p public
cp frontend/index.html public/
cp frontend/styles.css public/
cp frontend/app.js public/
cp frontend/api.js public/
cp frontend/positions.js public/
```

### 2. Update vercel.json (ĐÃ SỬA):
Routing giờ sẽ serve từ root thay vì `/frontend/`:
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.py"
    },
    {
      "source": "/api",
      "destination": "/api/index.py"
    },
    {
      "source": "/static/(.*)",
      "destination": "/static/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/$1"
    }
  ]
}
```

### 3. Commit và push:
```bash
git add .
git commit -m "Move frontend files to public directory for Vercel"
git push
```

## ✅ Kết quả:

Sau khi deploy:
- `https://green-fc.vercel.app/` → Sẽ serve `public/index.html`
- `https://green-fc.vercel.app/styles.css` → Sẽ serve `public/styles.css`
- `https://green-fc.vercel.app/app.js` → Sẽ serve `public/app.js`
- `https://green-fc.vercel.app/api/teams/` → API endpoint

## 📁 Cấu trúc mới:

```
green_fc/
├── public/              ← Frontend files (Vercel tự động serve)
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── api.js
│   └── positions.js
├── frontend/            ← Có thể giữ lại hoặc xóa
├── api/
├── app/
└── vercel.json
```

---

**Sau khi di chuyển files và deploy, frontend sẽ hoạt động!** ✅

