# 🔧 Fix Vercel 500 Error - Serverless Function Crashed

## Vấn đề
Deploy thành công nhưng serverless function bị crash với lỗi 500.

## Nguyên nhân có thể:

### 1. **DATABASE_URL không được set** (Phổ biến nhất)
Vercel cần environment variable `DATABASE_URL` để kết nối database.

### 2. **Static files path không đúng**
Serverless environment không có filesystem như local.

### 3. **Missing dependencies**
Một số packages có thể thiếu.

## ✅ Đã sửa:

1. **Thêm fallback cho DATABASE_URL** trong `app/config.py`
2. **Thêm error handling** cho static files trong `app/main.py`
3. **Thêm validation** cho database connection trong `app/database.py`
4. **Thêm error logging** trong `api/index.py`

## 🔍 Kiểm tra và Fix:

### Bước 1: Kiểm tra Environment Variables trên Vercel

1. Vào **Vercel Dashboard** → Project của bạn
2. **Settings** → **Environment Variables**
3. Đảm bảo có:
   - `DATABASE_URL` = `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres`
   - `ENVIRONMENT` = `production`

4. **QUAN TRỌNG**: 
   - Chọn **Production**, **Preview**, và **Development**
   - Click **Save**

### Bước 2: Xem Function Logs

1. Vào **Vercel Dashboard** → Project
2. **Functions** tab
3. Click vào function `api/index.py`
4. Xem **Runtime Logs** để tìm lỗi cụ thể

Hoặc:
1. **Deployments** → Click vào deployment mới nhất
2. Scroll xuống **Function Logs**
3. Tìm error message

### Bước 3: Test Database Connection

```bash
# Test connection string
psql "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" -c "SELECT 1;"
```

### Bước 4: Redeploy sau khi set Environment Variables

Sau khi set `DATABASE_URL`:
1. Vào **Deployments**
2. Click **Redeploy** (hoặc push code mới)
3. Đợi build hoàn tất
4. Test lại API endpoint

## 🧪 Test API Endpoint:

Sau khi deploy, test:
```
https://your-project.vercel.app/api/
```

Hoặc:
```
https://your-project.vercel.app/api/teams/
```

## 📋 Checklist:

- [ ] `DATABASE_URL` đã được set trong Vercel Environment Variables
- [ ] `ENVIRONMENT` = `production` đã được set
- [ ] Environment variables apply cho **Production**, **Preview**, **Development**
- [ ] Đã xem Function Logs để tìm lỗi cụ thể
- [ ] Database connection string đúng và accessible
- [ ] Đã redeploy sau khi set environment variables

## 🔍 Common Errors:

### Error: "DATABASE_URL environment variable is not set"
**Fix**: Set `DATABASE_URL` trong Vercel Environment Variables

### Error: "Connection refused" hoặc "timeout"
**Fix**: 
- Kiểm tra database connection string
- Đảm bảo database accessible từ internet
- Kiểm tra firewall settings trên Supabase

### Error: "ModuleNotFoundError"
**Fix**: 
- Kiểm tra `requirements.txt` có đầy đủ dependencies
- Redeploy để install dependencies mới

### Error: "Static files not found"
**Fix**: 
- Đã thêm error handling, sẽ không crash nữa
- Static files sẽ không available trong serverless (cần storage service)

## 💡 Next Steps:

1. **Set Environment Variables** trên Vercel
2. **Redeploy** project
3. **Check Function Logs** để xem lỗi cụ thể
4. **Test API endpoints**

---

**Nếu vẫn lỗi, vui lòng cung cấp:**
- Error message từ Function Logs
- Environment variables đã set (ẩn password)
- Screenshot của error (nếu có)

