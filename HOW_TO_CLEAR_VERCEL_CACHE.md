# 🗑️ Hướng dẫn xóa Cache trên Vercel

## 📋 Các cách xóa cache trên Vercel:

### Cách 1: Clear Build Cache (Khuyến nghị)

1. **Vào Vercel Dashboard**
   - Truy cập: https://vercel.com/dashboard
   - Đăng nhập vào tài khoản của bạn

2. **Chọn Project**
   - Click vào project **green_fc** (hoặc tên project của bạn)

3. **Vào Settings**
   - Click tab **Settings** ở menu trên cùng

4. **Vào General Settings**
   - Click **General** ở sidebar trái (hoặc scroll xuống)

5. **Tìm Build & Development Settings**
   - Scroll xuống phần **Build & Development Settings**
   - Hoặc tìm section có tiêu đề tương tự

6. **Clear Build Cache**
   - Tìm nút **"Clear Build Cache"** hoặc **"Clear Cache"**
   - Click vào nút đó
   - Confirm trong popup (nếu có)

7. **Đợi hoàn tất**
   - Đợi vài giây để cache được clear
   - Có thể thấy thông báo "Cache cleared" hoặc tương tự

### Cách 2: Redeploy với Cache Disabled

1. **Vào Deployments**
   - Click tab **Deployments** ở menu trên cùng

2. **Chọn Deployment**
   - Click vào deployment mới nhất (hoặc deployment có vấn đề)

3. **Redeploy**
   - Click nút **...** (3 chấm) ở góc phải deployment
   - Chọn **"Redeploy"**
   - **QUAN TRỌNG**: Tích vào checkbox **"Use existing Build Cache"** → **BỎ TÍCH** để không dùng cache
   - Click **"Redeploy"**

### Cách 3: Xóa qua Vercel CLI (Nếu có cài CLI)

```bash
# Cài Vercel CLI (nếu chưa có)
npm install -g vercel

# Login vào Vercel
vercel login

# Link với project
vercel link

# Clear cache (nếu có command)
# Lưu ý: Không có command trực tiếp để clear cache qua CLI
# Nhưng có thể trigger redeploy không dùng cache:
vercel --prod --no-cache
```

## 📸 Hướng dẫn bằng hình ảnh (văn bản):

```
Vercel Dashboard
├── [Chọn Project: green_fc]
│   ├── Settings (tab trên cùng)
│   │   ├── General (sidebar trái)
│   │   │   └── Build & Development Settings
│   │   │       └── [Button: Clear Build Cache] ← Click đây!
│   │
│   └── Deployments (tab trên cùng)
│       ├── [Deployment mới nhất]
│       │   └── [...] (3 chấm)
│       │       └── Redeploy
│       │           └── [Bỏ tích: Use existing Build Cache]
│       │               └── [Button: Redeploy] ← Click đây!
```

## ✅ Checklist sau khi clear cache:

- [ ] Đã clear build cache trên Vercel
- [ ] Đã commit và push code mới lên GitHub
- [ ] Đã redeploy (với cache disabled)
- [ ] Build logs không còn lỗi cache cũ
- [ ] Dependencies được install lại từ đầu

## 💡 Lưu ý:

1. **Clear Build Cache** chỉ clear cache của build process, không ảnh hưởng đến deployments hiện tại
2. Sau khi clear cache, phải **redeploy** để build lại từ đầu
3. Nếu không thấy nút "Clear Build Cache", có thể:
   - Project đang ở plan miễn phí (một số tính năng có thể bị giới hạn)
   - Hoặc cache đã được clear tự động
   - Hoặc cần upgrade plan

## 🔍 Nếu không tìm thấy nút Clear Build Cache:

### Option 1: Redeploy với cache disabled
- Vào **Deployments** → Click deployment → **Redeploy** → **Bỏ tích** "Use existing Build Cache"

### Option 2: Trigger deployment mới
```bash
# Push một commit mới (có thể empty commit)
git commit --allow-empty -m "Trigger redeploy without cache"
git push
```

### Option 3: Check Settings khác
- **Settings** → **General** → Scroll xuống tìm **"Build Cache"** section
- Hoặc **Settings** → **Build & Development Settings** → Tìm cache options

---

## 🚀 Sau khi clear cache:

1. **Đợi cache được clear** (vài giây)
2. **Redeploy** project
3. **Đợi build hoàn tất** (2-3 phút)
4. **Kiểm tra Function Logs** để xem có còn lỗi không

---

**Sau khi clear cache và redeploy, lỗi `mangum==0.18.1` sẽ được fix!** ✅

