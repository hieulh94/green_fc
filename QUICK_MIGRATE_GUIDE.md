# ⚡ Quick Guide: Chạy Migrations cho Vercel

## 🎯 Mục tiêu
Chạy migrations trên Supabase database để Vercel có thể kết nối.

## 📋 Các bước nhanh:

### Bước 1: Lấy DATABASE_URL từ Supabase

1. Vào **Supabase Dashboard** → Project của bạn
2. **Settings** → **Database**
3. **Connection string** → Tab **URI**
4. Copy connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
5. **Thay `[YOUR-PASSWORD]` bằng password của bạn**

### Bước 2: Set DATABASE_URL

```bash
cd /Users/mac/Desktop/green_fc

# Set DATABASE_URL (thay bằng connection string của bạn)
export DATABASE_URL="postgresql://postgres:your_password@db.xxx.supabase.co:5432/postgres"
```

### Bước 3: Test connection

```bash
# Chạy script test
./test_db_connection.sh
```

**Nếu thành công** → Tiếp tục Bước 4  
**Nếu lỗi** → Xem phần Troubleshooting bên dưới

### Bước 4: Cài dependencies (nếu chưa có)

```bash
# Tạo venv (nếu chưa có)
python3 -m venv venv
source venv/bin/activate

# Cài dependencies
pip install -r requirements.txt
```

### Bước 5: Chạy migrations

```bash
# Đảm bảo DATABASE_URL đã được set
echo $DATABASE_URL

# Chạy migrations
python3 -m alembic upgrade head
```

### Bước 6: Kiểm tra trên Supabase

1. **Supabase Dashboard** → **Table Editor**
2. Xem các tables đã được tạo:
   - ✅ `teams`
   - ✅ `players`
   - ✅ `opponents`
   - ✅ `matches`
   - ✅ `match_goals`
   - ✅ `match_participants`

## 🔍 Troubleshooting:

### Lỗi: "DATABASE_URL is not set"
**Fix**: Set DATABASE_URL như Bước 2

### Lỗi: "Connection refused" hoặc "timeout"
**Fix**: 
- Kiểm tra connection string đúng chưa
- Kiểm tra password đúng chưa
- Đảm bảo database accessible từ internet

### Lỗi: "psycopg2 not found"
**Fix**:
```bash
pip install psycopg2-binary
```

### Lỗi: "No module named 'app'"
**Fix**:
```bash
# Đảm bảo đang ở đúng directory
cd /Users/mac/Desktop/green_fc

# Chạy lại
python3 -m alembic upgrade head
```

## ✅ Sau khi migrations thành công:

1. **Kiểm tra trên Supabase**: Tables đã được tạo
2. **Set DATABASE_URL trên Vercel**: 
   - Vercel Dashboard → Settings → Environment Variables
   - Set `DATABASE_URL` = Connection string của Supabase
3. **Redeploy Vercel**: Deployments → Redeploy
4. **Test API**: 
   - `https://green-fc.vercel.app/api/teams/` → Phải trả về `[]`
   - `https://green-fc.vercel.app/api/players/` → Phải trả về `[]`

---

**Sau khi migrations thành công, Vercel sẽ có thể kết nối tới Supabase!** ✅

