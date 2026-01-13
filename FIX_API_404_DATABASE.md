# 🔧 Fix API 404 - Database Issue

## ⚠️ Vấn đề
`https://green-fc.vercel.app/api/players/` trả về 404 - có thể do database.

## 🎯 Nguyên nhân có thể:

### 1. **DATABASE_URL chưa được set** (Phổ biến nhất!)
- Environment variable chưa được set trên Vercel
- Hoặc connection string sai

### 2. **Database chưa có tables**
- Chưa chạy migrations
- Tables chưa được tạo

### 3. **Database connection failed**
- Connection string sai
- Database không accessible
- Firewall blocking

## ✅ Các bước kiểm tra và fix:

### Bước 1: Kiểm tra Environment Variables trên Vercel

1. **Vào Vercel Dashboard** → Project `green-fc`
2. **Settings** → **Environment Variables**
3. **Đảm bảo có:**
   - ✅ `DATABASE_URL` = `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres`
   - ✅ `ENVIRONMENT` = `production`

4. **QUAN TRỌNG**: 
   - Chọn **Production**, **Preview**, **Development**
   - Click **Save**

### Bước 2: Xem Function Logs để tìm lỗi cụ thể

1. **Vercel Dashboard** → Project
2. **Functions** tab → Click vào `api/index.py`
3. **Runtime Logs** → Xem error messages

Hoặc:
1. **Deployments** → Deployment mới nhất
2. **Function Logs** → Tìm error messages

**Các lỗi thường gặp:**
- `DATABASE_URL environment variable is not set` → Chưa set env var
- `Connection refused` → Database không accessible
- `relation "players" does not exist` → Chưa chạy migrations
- `timeout` → Database connection timeout

### Bước 3: Chạy Database Migrations

**QUAN TRỌNG**: Phải chạy migrations để tạo tables!

```bash
# Cài Vercel CLI (nếu chưa có)
npm install -g vercel

# Login và link project
vercel login
vercel link

# Pull environment variables
vercel env pull .env.local

# Set DATABASE_URL và chạy migration
export $(cat .env.local | grep DATABASE_URL | xargs)
alembic upgrade head
```

Hoặc chạy migration trực tiếp với connection string:
```bash
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" alembic upgrade head
```

### Bước 4: Test Database Connection

```bash
# Test connection string
psql "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" -c "SELECT 1;"
```

Hoặc test từ Python:
```python
import psycopg2
conn = psycopg2.connect("postgresql://postgres:password@db.xxx.supabase.co:5432/postgres")
print("✅ Connection OK!")
```

### Bước 5: Redeploy sau khi set Environment Variables

**QUAN TRỌNG**: Phải redeploy sau khi set environment variables!

1. **Deployments** → Click **...** (3 chấm)
2. **Redeploy**
3. Đợi build hoàn tất

## 🔍 Test API Endpoints:

Sau khi fix, test các endpoints:

1. **Test API root:**
   ```
   https://green-fc.vercel.app/api
   ```
   → Phải hiển thị: `{"message":"Football Team Management API"}`

2. **Test Teams:**
   ```
   https://green-fc.vercel.app/api/teams/
   ```
   → Phải trả về array (có thể rỗng `[]`)

3. **Test Players:**
   ```
   https://green-fc.vercel.app/api/players/
   ```
   → Phải trả về array (có thể rỗng `[]`)

4. **Test với error:**
   - Nếu 404 → Routes chưa được register hoặc database issue
   - Nếu 500 → Database connection issue
   - Nếu `[]` → OK! Database hoạt động, chỉ chưa có data

## 📋 Checklist:

- [ ] `DATABASE_URL` đã được set trong Vercel Environment Variables
- [ ] `ENVIRONMENT` = `production` đã được set
- [ ] Environment variables apply cho **Production**, **Preview**, **Development**
- [ ] Đã chạy migrations (`alembic upgrade head`)
- [ ] Đã test database connection
- [ ] Đã redeploy sau khi set environment variables
- [ ] Đã xem Function Logs để tìm lỗi cụ thể

## 🆘 Nếu vẫn 404:

### Kiểm tra Routes:
1. Test `/api` → Phải hoạt động
2. Test `/api/teams/` → Phải hoạt động
3. Nếu `/api/teams/` hoạt động nhưng `/api/players/` không → Có thể lỗi trong players router

### Kiểm tra Function Logs:
- Copy error message đầy đủ
- Kiểm tra xem có lỗi import không
- Kiểm tra xem có lỗi database connection không

---

**Sau khi set DATABASE_URL và chạy migrations, API sẽ hoạt động!** ✅

