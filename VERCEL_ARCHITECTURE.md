# 🏗️ Kiến trúc Deploy trên Vercel

## 📦 Deploy gì lên Vercel?

**CẢ BACKEND VÀ FRONTEND** được deploy cùng lúc trên Vercel!

## 🎯 Cách hoạt động:

### 1. **Backend (API)** - Serverless Functions
- **File**: `api/index.py`
- **Runtime**: Python 3.11 (FastAPI)
- **Routes**: `/api/*`
- **Ví dụ**: 
  - `https://your-project.vercel.app/api/teams/`
  - `https://your-project.vercel.app/api/players/`

### 2. **Frontend** - Static Files
- **Files**: `frontend/index.html`, `frontend/styles.css`, `frontend/app.js`
- **Routes**: `/*` (tất cả routes khác)
- **Ví dụ**: 
  - `https://your-project.vercel.app/` → `frontend/index.html`
  - `https://your-project.vercel.app/styles.css` → `frontend/styles.css`

## 🔄 Routing trong `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",        // Backend API
      "destination": "/api/index.py"
    },
    {
      "source": "/static/(.*)",     // Uploaded files
      "destination": "/static/$1"
    },
    {
      "source": "/(.*)",            // Frontend (tất cả routes khác)
      "destination": "/frontend/$1"
    }
  ]
}
```

## 📁 Cấu trúc Project:

```
green_fc/
├── api/
│   └── index.py              ← Backend (Serverless Function)
├── app/                      ← Backend code (FastAPI)
│   ├── main.py
│   ├── routers/
│   ├── services/
│   └── ...
├── frontend/                 ← Frontend (Static Files)
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── api.js
├── static/                   ← Uploaded files
│   └── uploads/
└── vercel.json               ← Routing config
```

## 🌐 URL Structure sau khi deploy:

```
https://your-project.vercel.app/
├── /                          → Frontend (index.html)
├── /api/teams/                → Backend API
├── /api/players/               → Backend API
├── /api/matches/               → Backend API
├── /static/uploads/...         → Uploaded images
└── /styles.css                 → Frontend CSS
```

## 🔗 Frontend gọi Backend như thế nào?

Trong `frontend/api.js`:
```javascript
// Tự động detect URL
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000'  // Local development
  : '/api';                   // Production (Vercel)
```

**Ví dụ**:
- Local: `http://localhost:8000/api/teams/`
- Production: `https://your-project.vercel.app/api/teams/`

## ✅ Lợi ích:

1. **Một domain duy nhất**: Cả frontend và backend cùng domain
2. **Không cần CORS**: Cùng origin, không cần CORS config phức tạp
3. **Deploy đơn giản**: Chỉ cần push code lên GitHub, Vercel tự động deploy cả hai
4. **Serverless**: Backend tự động scale, không cần quản lý server

## 🚀 Deploy Process:

1. **Push code lên GitHub**
2. **Vercel tự động detect**:
   - Python files → Tạo serverless functions
   - HTML/CSS/JS → Serve như static files
3. **Build và deploy**:
   - Install Python dependencies từ `requirements.txt`
   - Deploy `api/index.py` như serverless function
   - Deploy `frontend/` như static files
4. **Ready**: Cả frontend và backend đều accessible

## 📝 Tóm tắt:

| Component | Type | Location | URL Pattern |
|-----------|------|----------|-------------|
| **Backend** | Serverless Function | `api/index.py` | `/api/*` |
| **Frontend** | Static Files | `frontend/` | `/*` |
| **Uploads** | Static Files | `static/uploads/` | `/static/*` |

**Kết luận**: Vercel deploy **CẢ BACKEND VÀ FRONTEND** cùng lúc trên cùng một domain! 🎉

