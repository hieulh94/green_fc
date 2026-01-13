# 🔧 Fix API 404 - Final Solution

## ⚠️ Lỗi
```
GET https://green-fc.vercel.app/api/players/ 404 (Not Found)
```

## 🎯 Nguyên nhân có thể:

### 1. **Database chưa có tables** (Phổ biến nhất!)
- Migrations chưa được chạy
- Tables chưa được tạo trên Supabase

### 2. **DATABASE_URL chưa được set trên Vercel**
- Environment variable chưa được set
- Hoặc connection string sai

### 3. **Database connection failed**
- Connection string sai
- Database không accessible

## ✅ Các bước fix:

### Bước 1: Chạy migrations (QUAN TRỌNG!)

```bash
cd /Users/mac/Desktop/green_fc

# Set DATABASE_URL
export DATABASE_URL="postgresql://postgres.btbadzadbfjjdstmrrmb:mMoJUH93lEI0djB0@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# Upgrade tất cả heads (fix multiple heads error)
python3 -m alembic upgrade heads
```

**Phải thấy:**
```
INFO  [alembic.runtime.migration] Running upgrade ... -> add_match_participants
INFO  [alembic.runtime.migration] Running upgrade ... -> add_rating_review
```

### Bước 2: Kiểm tra tables đã được tạo trên Supabase

1. **Supabase Dashboard** → Project
2. **Table Editor**
3. **Xem các tables:**
   - ✅ `teams`
   - ✅ `players`
   - ✅ `opponents`
   - ✅ `matches`
   - ✅ `match_goals`
   - ✅ `match_participants`
   - ✅ `alembic_version`

### Bước 3: Set DATABASE_URL trên Vercel

**QUAN TRỌNG**: Phải set connection string này trên Vercel!

1. **Vercel Dashboard** → Project `green-fc`
2. **Settings** → **Environment Variables**
3. **Thêm hoặc cập nhật:**
   - Name: `DATABASE_URL`
   - Value: `postgresql://postgres.btbadzadbfjjdstmrrmb:mMoJUH93lEI0djB0@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`
   - Environments: ✅ Production, ✅ Preview, ✅ Development
4. **Click Save**

### Bước 4: Redeploy Vercel

**QUAN TRỌNG**: Phải redeploy sau khi set environment variables!

1. **Deployments** → Click **...** (3 chấm)
2. **Redeploy**
3. **Bỏ tích** "Use existing Build Cache" (nếu có)
4. **Click Redeploy**
5. Đợi build hoàn tất (1-2 phút)

### Bước 5: Xem Function Logs để debug

1. **Vercel Dashboard** → Project
2. **Functions** tab → Click vào `api/index.py`
3. **Runtime Logs** → Xem error messages

**Hoặc:**
1. **Deployments** → Deployment mới nhất
2. **Function Logs** → Tìm error messages

**Các lỗi thường gặp:**
- `DATABASE_URL environment variable is not set` → Chưa set env var
- `relation "players" does not exist` → Chưa chạy migrations
- `Connection refused` → Database không accessible

## 🔍 Test sau khi fix:

### 1. Test API root:
```
https://green-fc.vercel.app/api
```
→ Phải hiển thị: `{"message":"Football Team Management API"}`

### 2. Test Teams:
```
https://green-fc.vercel.app/api/teams/
```
→ Phải trả về: `[]` (rỗng nhưng không 404)

### 3. Test Players:
```
https://green-fc.vercel.app/api/players/
```
→ Phải trả về: `[]` (rỗng nhưng không 404)

**Lưu ý**: `[]` là OK! Có nghĩa là database hoạt động, chỉ chưa có data.

## 📋 Checklist:

- [ ] Đã chạy migrations (`python3 -m alembic upgrade heads`)
- [ ] Đã kiểm tra tables trên Supabase Dashboard
- [ ] `DATABASE_URL` đã được set trên Vercel Environment Variables
- [ ] `ENVIRONMENT` = `production` đã được set
- [ ] Environment variables apply cho **Production**, **Preview**, **Development**
- [ ] Đã redeploy Vercel sau khi set environment variables
- [ ] Đã xem Function Logs để tìm lỗi cụ thể (nếu vẫn 404)

## 🆘 Nếu vẫn 404 sau khi làm tất cả:

### Kiểm tra Function Logs:
1. **Vercel Dashboard** → Functions → `api/index.py` → Runtime Logs
2. Copy full error message
3. Kiểm tra xem có lỗi gì:
   - Database connection error?
   - Import error?
   - Route not found?

### Test trực tiếp:
```bash
# Test từ terminal
curl https://green-fc.vercel.app/api/players/

# Hoặc test từ browser
# Mở: https://green-fc.vercel.app/api/players/
```

---

**Sau khi chạy migrations và set DATABASE_URL trên Vercel, API sẽ hoạt động!** ✅

