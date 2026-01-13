# 🔧 Fix 404 Not Found - API Routes

## ⚠️ Lỗi
```
GET https://green-fc.vercel.app/api/players/
→ {"detail":"Not Found"}
```

## 🎯 Nguyên nhân
Khi Vercel route `/api/players/` đến `/api/index.py`, Mangum nhận được path đầy đủ là `/api/players/`, nhưng FastAPI routes được define với prefix `/players` (không có `/api`).

**Ví dụ:**
- Vercel route: `/api/players/` → `/api/index.py`
- Mangum nhận: `/api/players/`
- FastAPI tìm route: `/players/` (không có `/api`)
- → **404 Not Found**

## ✅ Fix: Mount FastAPI app tại `/api`

Đã thêm `root_path="/api"` vào FastAPI constructor trong `app/main.py`:

```python
app = FastAPI(
    title="GREEN FC",
    description="Lightweight football team management backend",
    version="1.0.0",
    root_path="/api"  # Mount app at /api for Vercel routing
)
```

**Giải thích:**
- `root_path="/api"` cho FastAPI biết app được mount tại `/api`
- Khi nhận request `/api/players/`, FastAPI sẽ tự động strip `/api` và tìm route `/players/`
- → **Route match!** ✅

## 🚀 Các bước deploy:

### Bước 1: Commit và push code

```bash
cd /Users/mac/Desktop/green_fc

# Kiểm tra thay đổi
git status

# Commit
git add app/main.py
git commit -m "Fix: Add root_path=/api to FastAPI for Vercel routing"

# Push
git push origin main
```

### Bước 2: Vercel tự động deploy

Vercel sẽ tự động detect push và deploy. Đợi 1-2 phút.

### Bước 3: Test API

Sau khi deploy xong, test:

1. **API Root:**
   ```
   https://green-fc.vercel.app/api
   ```
   → Phải hiển thị: `{"message":"Football Team Management API"}`

2. **Players:**
   ```
   https://green-fc.vercel.app/api/players/
   ```
   → Phải trả về: `[]` (rỗng nhưng không 404)

3. **Teams:**
   ```
   https://green-fc.vercel.app/api/teams/
   ```
   → Phải trả về: `[]`

4. **Matches:**
   ```
   https://green-fc.vercel.app/api/matches/
   ```
   → Phải trả về: `[]`

## 📋 Checklist:

- [ ] Đã thêm `root_path="/api"` vào `app/main.py`
- [ ] Đã commit và push code
- [ ] Vercel đã deploy thành công
- [ ] Test `/api` → OK
- [ ] Test `/api/players/` → OK (không còn 404)
- [ ] Test `/api/teams/` → OK
- [ ] Test `/api/matches/` → OK

## 🔍 Nếu vẫn 404:

### 1. Kiểm tra Function Logs:
- **Vercel Dashboard** → Functions → `api/index.py` → Runtime Logs
- Xem có error gì không

### 2. Kiểm tra DATABASE_URL:
- **Vercel Dashboard** → Settings → Environment Variables
- Đảm bảo `DATABASE_URL` đã được set
- Đảm bảo apply cho **Production**, **Preview**, **Development**

### 3. Kiểm tra migrations:
- Đã chạy migrations chưa?
- Tables đã được tạo trên Supabase chưa?

```bash
# Chạy migrations
export DATABASE_URL="postgresql://postgres.btbadzadbfjjdstmrrmb:mMoJUH93lEI0djB0@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
python3 -m alembic upgrade heads
```

## 💡 Lưu ý:

- `root_path="/api"` chỉ ảnh hưởng đến URL routing, không ảnh hưởng đến code
- Routes vẫn được define như cũ: `router = APIRouter(prefix="/players")`
- FastAPI sẽ tự động handle `/api` prefix

---

**Sau khi thêm `root_path="/api"` và deploy, API sẽ hoạt động!** ✅

