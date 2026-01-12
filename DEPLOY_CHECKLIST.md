# ✅ Deployment Checklist

## Trước khi Deploy

### 1. Git Repository
- [ ] Code đã được commit
- [ ] Đã push lên GitHub/GitLab
- [ ] Repository là public hoặc đã connect với Vercel

### 2. Database
- [ ] Đã tạo PostgreSQL database
- [ ] Đã có connection string
- [ ] Database accessible từ internet

### 3. Files đã được tạo
- [x] `vercel.json` - ✅ Đã tạo
- [x] `api/index.py` - ✅ Đã tạo
- [x] `requirements.txt` - ✅ Đã cập nhật (có mangum)
- [x] `frontend/api.js` - ✅ Đã cập nhật (auto-detect URL)
- [x] `app/main.py` - ✅ Đã cập nhật (static files)
- [x] `.vercelignore` - ✅ Đã tạo

## Deploy Steps

### Step 1: Vercel Project
- [ ] Đăng nhập [vercel.com](https://vercel.com)
- [ ] Click "Add New Project"
- [ ] Import repository
- [ ] Framework: Other (hoặc để Vercel tự detect)

### Step 2: Environment Variables
- [ ] Thêm `DATABASE_URL` = `postgresql://...`
- [ ] Thêm `ENVIRONMENT` = `production`
- [ ] Apply cho Production, Preview, Development

### Step 3: Deploy
- [ ] Click "Deploy"
- [ ] Đợi build hoàn tất
- [ ] Copy deployment URL

### Step 4: Migration
- [ ] Cài Vercel CLI: `npm install -g vercel`
- [ ] Login: `vercel login`
- [ ] Link project: `vercel link`
- [ ] Pull env: `vercel env pull .env.local`
- [ ] Run migration: `alembic upgrade head`

### Step 5: Test
- [ ] Truy cập frontend URL
- [ ] Test đăng nhập (fcgreen/123)
- [ ] Test CRUD operations
- [ ] Test file upload (lưu ý: sẽ không persist)

## Sau khi Deploy

- [ ] Update CORS nếu cần (hiện tại đang allow all)
- [ ] Cấu hình custom domain (nếu có)
- [ ] Setup file storage service (cho uploads)
- [ ] Monitor logs trên Vercel Dashboard

## Troubleshooting

Nếu gặp lỗi, kiểm tra:
1. Vercel Build Logs
2. Function Logs
3. Browser Console
4. Network tab trong DevTools

