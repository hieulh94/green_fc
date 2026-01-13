# 🚀 Chạy Migrations Ngay - Connection String đã có!

## ✅ Bạn đã có connection string:
```
postgresql://postgres.btbadzadbfjjdstmrrmb:mMoJUH93lEI0djB0@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

## 📋 Các bước chạy migrations:

### Bước 1: Set DATABASE_URL

```bash
cd /Users/mac/Desktop/green_fc

# Set DATABASE_URL
export DATABASE_URL="postgresql://postgres.btbadzadbfjjdstmrrmb:mMoJUH93lEI0djB0@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

### Bước 2: Kiểm tra DATABASE_URL đã được set

```bash
echo $DATABASE_URL
# Phải hiển thị connection string
```

### Bước 3: Cài dependencies (nếu chưa có)

```bash
# Tạo venv (nếu chưa có)
python3 -m venv venv
source venv/bin/activate

# Cài dependencies
pip install -r requirements.txt
```

### Bước 4: Chạy migrations

```bash
# Chạy migrations
python3 -m alembic upgrade head
```

**Nếu thành công**, sẽ thấy:
```
INFO  [alembic.runtime.migration] Running upgrade ... -> ..., <migration_name>
```

### Bước 5: Kiểm tra trên Supabase

1. Vào **Supabase Dashboard** → Project
2. **Table Editor**
3. Xem các tables đã được tạo:
   - ✅ `teams`
   - ✅ `players`
   - ✅ `opponents`
   - ✅ `matches`
   - ✅ `match_goals`
   - ✅ `match_participants`
   - ✅ `alembic_version`

## 🔧 Set DATABASE_URL trên Vercel:

**QUAN TRỌNG**: Phải set connection string này trên Vercel!

1. **Vercel Dashboard** → Project `green-fc`
2. **Settings** → **Environment Variables**
3. **Thêm hoặc cập nhật:**
   - Name: `DATABASE_URL`
   - Value: `postgresql://postgres.btbadzadbfjjdstmrrmb:mMoJUH93lEI0djB0@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`
   - Environments: ✅ Production, ✅ Preview, ✅ Development
4. **Click Save**

5. **Redeploy**:
   - Deployments → Click **...** (3 chấm)
   - **Redeploy**

## ✅ Sau khi hoàn tất:

1. ✅ Migrations đã chạy → Tables được tạo trên Supabase
2. ✅ Vercel có DATABASE_URL → Connect tới Supabase
3. ✅ Test API:
   - `https://green-fc.vercel.app/api/teams/` → Phải trả về `[]`
   - `https://green-fc.vercel.app/api/players/` → Phải trả về `[]`

---

**Bây giờ hãy chạy migrations!** 🚀

