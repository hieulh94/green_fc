# 🚨 Fix 500 Error - Step by Step

## ⚠️ Lỗi: 500 INTERNAL_SERVER_ERROR

## 🔍 Bước 1: Xem Function Logs để tìm lỗi cụ thể

### Cách xem logs:

**Option 1: Qua Functions Tab**
1. Vào **Vercel Dashboard** → Project của bạn
2. Click tab **Functions**
3. Click vào function `api/index.py`
4. Xem **Runtime Logs**
5. Copy error message đầy đủ

**Option 2: Qua Deployments**
1. **Deployments** → Click vào deployment mới nhất
2. Scroll xuống **Function Logs**
3. Tìm dòng có chữ **ERROR** hoặc **Exception**
4. Copy error message

---

## 🔧 Bước 2: Fix DATABASE_URL (Nguyên nhân phổ biến nhất!)

### 99% trường hợp lỗi này là do **DATABASE_URL chưa được set**!

### Cách set Environment Variables:

1. **Vào Vercel Dashboard** → Project của bạn
2. **Settings** → **Environment Variables**
3. **Thêm 2 biến**:

   | Name | Value | Environments |
   |------|-------|--------------|
   | `DATABASE_URL` | `postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres` | ✅ Production<br>✅ Preview<br>✅ Development |
   | `ENVIRONMENT` | `production` | ✅ Production<br>✅ Preview<br>✅ Development |

4. **QUAN TRỌNG**: 
   - Chọn **Production**, **Preview**, và **Development**
   - Click **Save**

5. **Lấy DATABASE_URL từ Supabase**:
   - Vào Supabase Dashboard → Project của bạn
   - **Settings** → **Database**
   - Scroll xuống **Connection string**
   - Chọn tab **URI**
   - Copy connection string
   - **Thay `[YOUR-PASSWORD]` bằng password của bạn**

### Ví dụ DATABASE_URL:
```
postgresql://postgres:your_password_here@db.abcdefghijklmnop.supabase.co:5432/postgres
```

---

## 🔄 Bước 3: Redeploy sau khi set Environment Variables

**QUAN TRỌNG**: Phải redeploy sau khi set environment variables!

### Cách 1: Redeploy từ Dashboard
1. Vào **Deployments**
2. Click **...** (3 chấm) ở deployment mới nhất
3. Click **Redeploy**
4. Confirm

### Cách 2: Push code mới
```bash
git commit --allow-empty -m "Trigger redeploy after setting env vars"
git push
```

---

## ✅ Bước 4: Test lại

Sau khi redeploy:
1. Đợi build hoàn tất (1-2 phút)
2. Test API endpoint:
   ```
   https://your-project.vercel.app/api/
   ```
3. Hoặc test frontend:
   ```
   https://your-project.vercel.app/
   ```

---

## 🐛 Các lỗi thường gặp:

### Error 1: `DATABASE_URL environment variable is not set`
**Nguyên nhân**: Chưa set `DATABASE_URL` trong Vercel
**Fix**: Set `DATABASE_URL` như hướng dẫn ở Bước 2

### Error 2: `Connection refused` hoặc `timeout`
**Nguyên nhân**: Database không accessible hoặc connection string sai
**Fix**: 
- Kiểm tra connection string đúng chưa
- Test connection: `psql "your_connection_string" -c "SELECT 1;"`
- Đảm bảo database accessible từ internet

### Error 3: `ModuleNotFoundError`
**Nguyên nhân**: Dependencies thiếu
**Fix**: Kiểm tra `requirements.txt` có đầy đủ không

---

## 📋 Checklist:

- [ ] Đã xem Function Logs và có error message cụ thể
- [ ] `DATABASE_URL` đã được set trong Vercel Environment Variables
- [ ] `ENVIRONMENT` = `production` đã được set
- [ ] Environment variables apply cho **Production**, **Preview**, **Development**
- [ ] Đã click **Save** sau khi set environment variables
- [ ] Đã **Redeploy** sau khi set environment variables
- [ ] Đã test lại API endpoint
- [ ] Build logs không còn lỗi

---

## 💡 Nếu vẫn lỗi sau khi set DATABASE_URL:

1. **Kiểm tra lại Function Logs** để xem lỗi mới
2. **Kiểm tra connection string** đúng chưa
3. **Test database connection** từ local:
   ```bash
   psql "your_connection_string" -c "SELECT 1;"
   ```
4. **Clear build cache** và redeploy:
   - Settings → General → Clear Build Cache

---

## 🆘 Cần giúp đỡ?

Nếu vẫn lỗi, vui lòng cung cấp:
1. **Error message đầy đủ** từ Function Logs
2. **Environment variables đã set** (ẩn password)
3. **Screenshot** của error (nếu có)

---

**Lưu ý quan trọng**: 
- ⚠️ Phải **redeploy** sau khi set environment variables!
- ⚠️ Environment variables chỉ áp dụng cho deployments mới!
- ⚠️ Không thể set environment variables cho deployment cũ!

