# 🗄️ Hướng dẫn Setup Supabase Database

## Bước 1: Lấy Connection String từ Supabase

### 1.1. Truy cập Supabase Dashboard
1. Vào [supabase.com](https://supabase.com)
2. Đăng nhập và chọn project vừa tạo

### 1.2. Lấy Connection String
1. Vào **Settings** (biểu tượng bánh răng) ở sidebar trái
2. Chọn **Database**
3. Scroll xuống phần **Connection string**
4. Chọn tab **URI**
5. Copy connection string (sẽ có dạng):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### 1.3. Thay thế Password
- Thay `[YOUR-PASSWORD]` bằng password bạn đã set khi tạo project
- Hoặc reset password nếu quên:
  - Settings → Database → Database password → Reset password

**Ví dụ connection string:**
```
postgresql://postgres:your_password@db.abcdefghijklmnop.supabase.co:5432/postgres
```

---

## Bước 2: Cấu hình trên Vercel

### 2.1. Thêm Environment Variable
1. Vào Vercel Dashboard → Project của bạn
2. Vào **Settings** → **Environment Variables**
3. Thêm 2 biến:

   | Name | Value | Environments |
   |------|-------|--------------|
   | `DATABASE_URL` | `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres` | Production, Preview, Development |
   | `ENVIRONMENT` | `production` | Production, Preview, Development |

4. Click **Save**

### 2.2. Redeploy (nếu đã deploy)
- Vào **Deployments** tab
- Click **Redeploy** để apply environment variables mới

---

## Bước 3: Chạy Database Migrations

### 3.1. Cài đặt Vercel CLI (nếu chưa có)
```bash
npm install -g vercel
```

### 3.2. Login và Link Project
```bash
cd /Users/mac/Desktop/green_fc

# Login vào Vercel
vercel login

# Link với project trên Vercel
vercel link
```
- Chọn project vừa tạo
- Chọn scope (thường là personal hoặc team)

### 3.3. Pull Environment Variables
```bash
# Pull environment variables về local
vercel env pull .env.local
```

### 3.4. Chạy Migrations
```bash
# Cách 1: Sử dụng .env.local
export $(cat .env.local | grep DATABASE_URL | xargs)
alembic upgrade head

# Cách 2: Set trực tiếp (thay YOUR_CONNECTION_STRING)
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" alembic upgrade head
```

### 3.5. Kiểm tra Tables đã được tạo
Bạn có thể kiểm tra trên Supabase:
1. Vào **Table Editor** trong Supabase Dashboard
2. Xem các tables đã được tạo:
   - `teams`
   - `players`
   - `opponents`
   - `matches`
   - `match_goals`
   - `match_participants`
   - `alembic_version`

---

## Bước 4: Test Connection

### 4.1. Test từ Local (tùy chọn)
```bash
# Set DATABASE_URL
export DATABASE_URL="your_supabase_connection_string"

# Test connection
python3 -c "from app.database import engine; engine.connect(); print('✅ Database connected!')"
```

### 4.2. Test từ Vercel
1. Vào Vercel Dashboard → Project → **Functions** tab
2. Xem logs để kiểm tra có lỗi connection không
3. Hoặc test API endpoint: `https://your-project.vercel.app/api/teams/`

---

## Bước 5: Tạo Team đầu tiên (nếu cần)

Sau khi deploy, bạn cần tạo ít nhất 1 team để có thể thêm players:

### Cách 1: Qua API
```bash
curl -X POST https://your-project.vercel.app/api/teams/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "FC Green",
    "country": "Vietnam",
    "founded_year": 2024,
    "result": "draw",
    "our_score": 0,
    "opponent_score": 0
  }'
```

### Cách 2: Qua Supabase Dashboard
1. Vào **Table Editor** → `teams`
2. Click **Insert row**
3. Điền thông tin:
   - `name`: "FC Green"
   - `country`: "Vietnam"
   - `founded_year`: 2024 (hoặc null)
   - `result`: "draw"
   - `our_score`: 0
   - `opponent_score`: 0
   - `is_completed`: false
4. Click **Save**

---

## ⚠️ Lưu ý quan trọng về Supabase

### 1. Connection Pooling
Supabase có 2 loại connection:
- **Direct connection**: Cho migrations và admin tasks
- **Connection pooling**: Cho ứng dụng (khuyến nghị)

**Connection string với pooling:**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Lưu ý**: Port `6543` cho pooling, port `5432` cho direct connection.

### 2. Row Level Security (RLS)
- Supabase mặc định có RLS enabled
- Nếu gặp lỗi permission, có thể cần disable RLS cho các tables:
  ```sql
  ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
  ALTER TABLE players DISABLE ROW LEVEL SECURITY;
  -- ... cho các tables khác
  ```

### 3. Database Extensions
Nếu cần, enable extensions trong Supabase:
- Settings → Database → Extensions
- Enable `uuid-ossp` nếu cần

---

## ✅ Checklist

- [ ] Đã lấy connection string từ Supabase
- [ ] Đã thêm `DATABASE_URL` vào Vercel environment variables
- [ ] Đã thêm `ENVIRONMENT=production` vào Vercel
- [ ] Đã chạy `vercel link`
- [ ] Đã pull environment variables về local
- [ ] Đã chạy `alembic upgrade head`
- [ ] Đã kiểm tra tables được tạo trên Supabase
- [ ] Đã test API endpoint
- [ ] Đã tạo team đầu tiên (nếu cần)

---

## 🔧 Troubleshooting

### Lỗi: "Connection refused" hoặc "Timeout"
- Kiểm tra connection string đúng chưa
- Kiểm tra password đúng chưa
- Đảm bảo Supabase project đang active

### Lỗi: "Permission denied" hoặc "Access denied"
- Kiểm tra RLS settings trên Supabase
- Có thể cần disable RLS cho development

### Lỗi: "Table does not exist"
- Chạy lại migrations: `alembic upgrade head`
- Kiểm tra `alembic_version` table có version mới nhất không

### Lỗi: "Too many connections"
- Sử dụng connection pooling (port 6543)
- Hoặc kiểm tra connection pooling settings trên Supabase

---

## 📝 Next Steps

Sau khi setup xong:
1. ✅ Test đăng nhập trên frontend (fcgreen/123)
2. ✅ Tạo team đầu tiên
3. ✅ Thêm players
4. ✅ Test các chức năng CRUD
5. ⚠️ Lưu ý: File uploads sẽ không persist (cần storage service)

Chúc bạn setup thành công! 🚀

