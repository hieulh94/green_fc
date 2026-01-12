# 🚀 Hướng dẫn Deploy lên Vercel - Từng bước

## Bước 1: Chuẩn bị Git Repository

### 1.1. Kiểm tra Git
```bash
cd /Users/mac/Desktop/green_fc
git status
```

### 1.2. Nếu chưa có Git repository:
```bash
git init
git add .
git commit -m "Initial commit - Ready for Vercel deployment"
```

### 1.3. Tạo repository trên GitHub
1. Truy cập [github.com](https://github.com)
2. Click "New repository"
3. Đặt tên: `green-fc` (hoặc tên bạn muốn)
4. **KHÔNG** tích vào "Initialize with README"
5. Click "Create repository"

### 1.4. Push code lên GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/green-fc.git
git branch -M main
git push -u origin main
```

**Lưu ý**: Thay `YOUR_USERNAME` bằng username GitHub của bạn.

---

## Bước 2: Tạo PostgreSQL Database

Vercel không cung cấp database, bạn cần tạo database riêng:

### Option 1: Vercel Postgres (Khuyến nghị)
1. Trên Vercel Dashboard → Storage → Create Database
2. Chọn "Postgres"
3. Chọn region gần nhất
4. Copy connection string

### Option 2: Supabase (Miễn phí)
1. Truy cập [supabase.com](https://supabase.com)
2. Tạo project mới
3. Vào Settings → Database
4. Copy "Connection string" (URI format)

### Option 3: Railway/Render/Neon
- Tương tự, tạo PostgreSQL database và lấy connection string

**Format connection string:**
```
postgresql://user:password@host:5432/dbname
```

---

## Bước 3: Deploy lên Vercel

### 3.1. Đăng nhập Vercel
1. Truy cập [vercel.com](https://vercel.com)
2. Đăng nhập bằng GitHub account

### 3.2. Tạo Project mới
1. Click **"Add New Project"**
2. Import repository `green-fc` từ GitHub
3. Vercel sẽ tự động detect:
   - Framework: Other
   - Build Command: (để trống)
   - Output Directory: (để trống)
   - Install Command: (để trống)

### 3.3. Cấu hình Environment Variables
Trong phần "Environment Variables", thêm:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://user:password@host:5432/dbname` |
| `ENVIRONMENT` | `production` |

**Lưu ý**: 
- Thay connection string bằng database thực tế của bạn
- Chọn "Production", "Preview", và "Development" cho cả 2 variables

### 3.4. Deploy
1. Click **"Deploy"**
2. Đợi quá trình build hoàn tất (khoảng 2-5 phút)

---

## Bước 4: Chạy Database Migrations

Sau khi deploy thành công:

### 4.1. Cài đặt Vercel CLI (nếu chưa có)
```bash
npm install -g vercel
```

### 4.2. Login vào Vercel
```bash
vercel login
```

### 4.3. Link project
```bash
cd /Users/mac/Desktop/green_fc
vercel link
```
- Chọn project vừa tạo trên Vercel

### 4.4. Pull environment variables
```bash
vercel env pull .env.local
```

### 4.5. Chạy migrations
```bash
# Set DATABASE_URL từ .env.local
export $(cat .env.local | grep DATABASE_URL | xargs)
alembic upgrade head
```

Hoặc:
```bash
# Sử dụng trực tiếp
DATABASE_URL="your_database_url" alembic upgrade head
```

---

## Bước 5: Kiểm tra Deployment

Sau khi deploy xong, bạn sẽ có URL:
- **Frontend**: `https://your-project.vercel.app`
- **API**: `https://your-project.vercel.app/api/`
- **API Docs**: `https://your-project.vercel.app/api/docs`

### Test các endpoints:
```bash
# Test root
curl https://your-project.vercel.app/api/

# Test teams
curl https://your-project.vercel.app/api/teams/
```

---

## ⚠️ Lưu ý quan trọng

### 1. File Uploads
**Vấn đề**: Files trong `static/uploads/` sẽ **KHÔNG persist** trên Vercel vì filesystem là read-only.

**Giải pháp**: Cần tích hợp storage service:
- **Vercel Blob Storage** (khuyến nghị)
- AWS S3
- Cloudinary
- Supabase Storage

**Tạm thời**: Upload vẫn hoạt động nhưng files sẽ mất sau khi function restart.

### 2. Database Connection
- Đảm bảo database cho phép connection từ internet
- Nếu dùng Supabase/Railway, thường đã được cấu hình sẵn
- Nếu dùng database riêng, cần whitelist IP của Vercel

### 3. Cold Start
- Serverless functions có thể có delay 1-3 giây lần đầu tiên
- Đây là hành vi bình thường của serverless

---

## 🔧 Troubleshooting

### Lỗi: "Module not found"
- Kiểm tra `api/index.py` có đúng path không
- Đảm bảo `requirements.txt` có đầy đủ dependencies

### Lỗi: "Database connection failed"
- Kiểm tra `DATABASE_URL` environment variable
- Đảm bảo database accessible từ internet
- Kiểm tra username/password đúng

### Lỗi: "404 Not Found" khi truy cập frontend
- Kiểm tra `vercel.json` routes configuration
- Đảm bảo `frontend/index.html` tồn tại

### Frontend không kết nối được API
- Kiểm tra `frontend/api.js` có detect đúng URL không
- Mở browser console để xem lỗi cụ thể

---

## 📝 Checklist trước khi deploy

- [ ] Code đã được push lên GitHub
- [ ] `vercel.json` đã được tạo
- [ ] `api/index.py` đã được tạo
- [ ] `requirements.txt` có `mangum`
- [ ] `frontend/api.js` đã cập nhật để auto-detect API URL
- [ ] PostgreSQL database đã được tạo
- [ ] Environment variables đã được set trên Vercel
- [ ] Migrations đã được chạy

---

## 🎉 Sau khi deploy thành công

1. Test đăng nhập: username `fcgreen`, password `123`
2. Test các chức năng CRUD
3. Kiểm tra file uploads (lưu ý sẽ không persist)
4. Test trên mobile để đảm bảo responsive

Chúc bạn deploy thành công! 🚀

