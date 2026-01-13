# 🗄️ Migrate Database cho Vercel - Step by Step

## 🎯 Mục tiêu
Chạy migrations trên **Supabase database** để tạo tables, sau đó Vercel có thể kết nối và sử dụng.

## 📋 Các bước:

### Bước 1: Cài đặt dependencies (nếu chưa có)

```bash
cd /Users/mac/Desktop/green_fc

# Tạo virtual environment (nếu chưa có)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Cài dependencies (bao gồm alembic)
pip install -r requirements.txt
```

### Bước 2: Lấy DATABASE_URL từ Supabase

**Cách 1: Từ Supabase Dashboard (Khuyến nghị)**
1. Vào [supabase.com](https://supabase.com)
2. Chọn project của bạn
3. **Settings** → **Database**
4. Scroll xuống **Connection string**
5. Chọn tab **URI**
6. Copy connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
7. **Thay `[YOUR-PASSWORD]` bằng password của bạn**

**Cách 2: Từ Vercel (nếu đã set)**
```bash
# Cài Vercel CLI (nếu chưa có)
npm install -g vercel

# Login và link
vercel login
vercel link

# Pull env vars
vercel env pull .env.local

# Xem DATABASE_URL
cat .env.local | grep DATABASE_URL
```

### Bước 3: Set DATABASE_URL và chạy migrations

**Option A: Dùng script (Khuyến nghị)**
```bash
# Nếu đã có .env.local từ Vercel
./run_migration.sh
```

**Option B: Thủ công**
```bash
# Set DATABASE_URL (thay bằng connection string của bạn)
export DATABASE_URL="postgresql://postgres:your_password@db.xxx.supabase.co:5432/postgres"

# Chạy migrations
python3 -m alembic upgrade head
```

**Option C: Từ .env.local**
```bash
# Load từ .env.local
export $(cat .env.local | grep DATABASE_URL | xargs)

# Chạy migrations
python3 -m alembic upgrade head
```

### Bước 4: Kiểm tra migrations đã chạy thành công

**Trên Supabase Dashboard:**
1. Vào Supabase Dashboard → Project
2. **Table Editor**
3. Xem các tables đã được tạo:
   - ✅ `teams`
   - ✅ `players`
   - ✅ `opponents`
   - ✅ `matches`
   - ✅ `match_goals`
   - ✅ `match_participants`
   - ✅ `alembic_version`

**Hoặc test từ terminal:**
```bash
# Test connection và xem tables
psql "$DATABASE_URL" -c "\dt"
# Phải hiển thị danh sách tables
```

### Bước 5: Đảm bảo Vercel có DATABASE_URL

1. **Vercel Dashboard** → Project `green-fc`
2. **Settings** → **Environment Variables**
3. **Đảm bảo có:**
   - ✅ `DATABASE_URL` = Connection string của Supabase
   - ✅ `ENVIRONMENT` = `production`
4. **Chọn:** Production, Preview, Development
5. **Click Save**

### Bước 6: Redeploy Vercel (nếu cần)

Sau khi set environment variables:
1. **Deployments** → Click **...** (3 chấm)
2. **Redeploy**
3. Đợi build hoàn tất

## ✅ Kết quả:

Sau khi hoàn tất:
- ✅ Tables đã được tạo trên **Supabase database**
- ✅ Vercel có `DATABASE_URL` → Connect tới Supabase
- ✅ API endpoints sẽ hoạt động:
  - `https://green-fc.vercel.app/api/teams/` → Trả về `[]` (rỗng, nhưng không 404)
  - `https://green-fc.vercel.app/api/players/` → Trả về `[]` (rỗng, nhưng không 404)

## 🔍 Test sau khi migrate:

### 1. Test API endpoints:
```bash
# Test teams
curl https://green-fc.vercel.app/api/teams/
# Phải trả về: [] (rỗng nhưng không 404)

# Test players
curl https://green-fc.vercel.app/api/players/
# Phải trả về: [] (rỗng nhưng không 404)
```

### 2. Test trên browser:
- `https://green-fc.vercel.app/api/teams/` → Phải trả về `[]`
- `https://green-fc.vercel.app/api/players/` → Phải trả về `[]`

**Lưu ý**: `[]` là OK! Có nghĩa là database hoạt động, chỉ chưa có data.

## 📋 Checklist:

- [ ] Đã cài dependencies (`pip install -r requirements.txt`)
- [ ] Đã có DATABASE_URL (từ Supabase hoặc Vercel)
- [ ] Đã chạy migrations (`python3 -m alembic upgrade head`)
- [ ] Đã kiểm tra tables trên Supabase Dashboard
- [ ] Đã set DATABASE_URL trên Vercel Environment Variables
- [ ] Đã redeploy Vercel (nếu cần)
- [ ] Đã test API endpoints (phải trả về `[]` thay vì 404)

## 🆘 Nếu vẫn 404 sau khi migrate:

### Kiểm tra:
1. **Function Logs trên Vercel**:
   - Vercel Dashboard → Functions → `api/index.py` → Runtime Logs
   - Xem có lỗi gì không

2. **Environment Variables**:
   - Đảm bảo `DATABASE_URL` đã được set
   - Đảm bảo đã chọn Production, Preview, Development

3. **Redeploy**:
   - Sau khi set env vars, phải redeploy

---

**Sau khi chạy migrations, Vercel sẽ có thể kết nối tới Supabase và API sẽ hoạt động!** ✅

