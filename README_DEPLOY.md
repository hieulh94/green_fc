# 🚀 Quick Deploy Guide

## Chuẩn bị nhanh (5 phút)

### 1. Push code lên GitHub
```bash
# Nếu chưa có git
git init
git add .
git commit -m "Ready for deployment"

# Tạo repo trên GitHub, sau đó:
git remote add origin https://github.com/YOUR_USERNAME/green-fc.git
git push -u origin main
```

### 2. Tạo Database
- **Khuyến nghị**: [Supabase](https://supabase.com) (miễn phí)
- Hoặc: Vercel Postgres, Railway, Render

### 3. Deploy trên Vercel
1. Vào [vercel.com](https://vercel.com) → "Add New Project"
2. Import repository từ GitHub
3. Thêm Environment Variables:
   - `DATABASE_URL`: connection string từ database
   - `ENVIRONMENT`: `production`
4. Click "Deploy"

### 4. Chạy Migration
```bash
# Cài Vercel CLI
npm install -g vercel

# Link project
vercel link

# Pull env và chạy migration
vercel env pull .env.local
export $(cat .env.local | grep DATABASE_URL | xargs)
alembic upgrade head
```

## ✅ Xong!

Truy cập: `https://your-project.vercel.app`

**Login**: 
- Username: `fcgreen`
- Password: `123`

---

## 📋 Files đã được cấu hình

- ✅ `vercel.json` - Vercel routing config
- ✅ `api/index.py` - Serverless function wrapper
- ✅ `requirements.txt` - Đã thêm mangum
- ✅ `frontend/api.js` - Auto-detect API URL
- ✅ `app/main.py` - Static files serving

## ⚠️ Lưu ý

- File uploads sẽ không persist (cần storage service)
- Database phải accessible từ internet
- Cold start có thể mất 1-3 giây lần đầu

Xem chi tiết trong `DEPLOY_STEP_BY_STEP.md`

