# 🚀 Quick Deploy Guide - Vercel

## Bước 1: Push code lên GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Bước 2: Deploy trên Vercel

1. Truy cập [vercel.com](https://vercel.com) và đăng nhập
2. Click **"Add New Project"**
3. Import repository từ GitHub
4. Vercel sẽ tự động detect cấu hình

## Bước 3: Cấu hình Environment Variables

Trên Vercel Dashboard → Settings → Environment Variables, thêm:

- **DATABASE_URL**: `postgresql://user:password@host:5432/dbname`
- **ENVIRONMENT**: `production`

**Lưu ý**: Bạn cần có PostgreSQL database. Có thể dùng:
- Vercel Postgres (tích hợp sẵn)
- Supabase (miễn phí)
- Railway, Render, hoặc database khác

## Bước 4: Chạy Migration

Sau khi deploy, chạy migration để tạo tables:

```bash
# Option 1: Dùng Vercel CLI
vercel env pull .env.local
alembic upgrade head

# Option 2: Set DATABASE_URL trực tiếp
export DATABASE_URL="your_database_url"
alembic upgrade head
```

## Bước 5: Test

Sau khi deploy thành công:
- Frontend: `https://your-project.vercel.app`
- API: `https://your-project.vercel.app/api/teams/`
- API Docs: `https://your-project.vercel.app/api/docs`

## ⚠️ Lưu ý quan trọng

1. **File Uploads**: Files trong `static/uploads/` sẽ không persist. Cần dùng:
   - Vercel Blob Storage
   - AWS S3
   - Cloudinary
   - Hoặc storage service khác

2. **Database**: Đảm bảo database có thể truy cập từ internet (whitelist IP nếu cần)

3. **Cold Start**: Serverless functions có thể có delay lần đầu tiên

## 📁 Cấu trúc đã được cấu hình

- ✅ `api/index.py` - Vercel serverless function
- ✅ `vercel.json` - Vercel configuration
- ✅ `requirements.txt` - Đã thêm `mangum`
- ✅ `frontend/api.js` - Auto-detect API URL

## 🔧 Troubleshooting

**Lỗi import module:**
- Kiểm tra `api/index.py` có đúng path không

**Database connection failed:**
- Kiểm tra `DATABASE_URL` environment variable
- Đảm bảo database cho phép connection từ internet

**Frontend không load:**
- Kiểm tra `vercel.json` routes
- Kiểm tra console browser để xem lỗi

