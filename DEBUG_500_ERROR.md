# 🐛 Debug 500 Error - Serverless Function Crashed

## ⚠️ Lỗi
Deploy thành công nhưng khi mở web báo lỗi 500: FUNCTION_INVOCATION_FAILED

## 🔍 Bước 1: Xem Function Logs (QUAN TRỌNG NHẤT!)

### Cách 1: Qua Vercel Dashboard
1. Vào **Vercel Dashboard** → Project của bạn
2. Click tab **Functions** (hoặc **Deployments** → deployment mới nhất)
3. Click vào function `api/index.py`
4. Xem **Runtime Logs** hoặc **Function Logs**
5. **Copy toàn bộ error message** (quan trọng!)

### Cách 2: Qua Deployments
1. **Deployments** → Click vào deployment mới nhất
2. Scroll xuống **Function Logs** hoặc **Build Logs**
3. Tìm dòng có chữ **ERROR** hoặc **Exception**
4. **Copy error message đầy đủ**

## 🔍 Bước 2: Kiểm tra Environment Variables

**QUAN TRỌNG**: Đảm bảo đã set environment variables trên Vercel!

1. Vào **Settings** → **Environment Variables**
2. Kiểm tra có đủ:
   - ✅ `DATABASE_URL` = `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres`
   - ✅ `ENVIRONMENT` = `production`
3. Đảm bảo chọn **Production**, **Preview**, **Development**
4. Click **Save**

## 🚨 Các lỗi thường gặp:

### 1. **DATABASE_URL không được set** (Phổ biến nhất!)
**Error**: `ValueError: DATABASE_URL environment variable is not set`

**Fix**:
- Set `DATABASE_URL` trong Vercel Environment Variables
- Redeploy sau khi set

### 2. **Database connection failed**
**Error**: `Connection refused` hoặc `timeout`

**Fix**:
- Kiểm tra connection string đúng chưa
- Đảm bảo database accessible từ internet
- Test connection: `psql "your_connection_string" -c "SELECT 1;"`

### 3. **Import error**
**Error**: `ModuleNotFoundError: No module named 'app'`

**Fix**:
- Kiểm tra `api/index.py` có đúng path không
- Redeploy

### 4. **Settings validation error**
**Error**: `ValidationError` hoặc `database_url is required`

**Fix**:
- Set `DATABASE_URL` trong Environment Variables
- Đảm bảo format đúng: `postgresql://...`

## ✅ Checklist Debug:

- [ ] Đã xem Function Logs và có error message cụ thể
- [ ] `DATABASE_URL` đã được set trong Vercel Environment Variables
- [ ] `ENVIRONMENT` = `production` đã được set
- [ ] Environment variables apply cho **Production**, **Preview**, **Development**
- [ ] Đã test database connection string
- [ ] Đã redeploy sau khi set environment variables
- [ ] Đã check Function Logs để xem lỗi cụ thể

## 🔧 Next Steps:

1. **Xem Function Logs** → Copy error message
2. **Kiểm tra Environment Variables** → Đảm bảo có `DATABASE_URL`
3. **Redeploy** → Sau khi set environment variables
4. **Test lại** → Truy cập `https://your-project.vercel.app/api/`

## 💡 Nếu vẫn lỗi:

Vui lòng cung cấp:
1. **Error message đầy đủ** từ Function Logs
2. **Environment variables đã set** (ẩn password)
3. **Screenshot** của error (nếu có)

---

**Lưu ý**: 99% trường hợp lỗi này là do **DATABASE_URL chưa được set** trong Vercel Environment Variables! 🎯

