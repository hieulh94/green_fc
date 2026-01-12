# Hướng dẫn triển khai lên Vercel

## Bước 1: Chuẩn bị

1. Đảm bảo code đã được commit và push lên GitHub/GitLab/Bitbucket
2. Cài đặt Vercel CLI (tùy chọn):
   ```bash
   npm i -g vercel
   ```

## Bước 2: Cấu hình Environment Variables

Trên Vercel Dashboard, thêm các biến môi trường sau:

- `DATABASE_URL`: PostgreSQL connection string (ví dụ: `postgresql://user:password@host:5432/dbname`)
- `ENVIRONMENT`: `production`

**Lưu ý**: Bạn cần có PostgreSQL database (có thể dùng Vercel Postgres, Supabase, hoặc database khác)

## Bước 3: Deploy

### Cách 1: Deploy qua Vercel Dashboard

1. Truy cập [vercel.com](https://vercel.com)
2. Đăng nhập và chọn "Add New Project"
3. Import repository từ GitHub/GitLab
4. Vercel sẽ tự động detect cấu hình từ `vercel.json`
5. Thêm Environment Variables
6. Click "Deploy"

### Cách 2: Deploy qua CLI

```bash
# Login vào Vercel
vercel login

# Deploy
vercel

# Deploy production
vercel --prod
```

## Bước 4: Chạy Migration

Sau khi deploy, bạn cần chạy migration để tạo database tables:

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="your_postgresql_connection_string"

# Run migrations
alembic upgrade head
```

Hoặc sử dụng Vercel CLI:
```bash
vercel env pull .env.local
alembic upgrade head
```

## Cấu trúc Project

- `api/index.py`: Vercel serverless function wrapper
- `vercel.json`: Vercel configuration
- `frontend/`: Static files (HTML, CSS, JS)
- `app/`: FastAPI application

## API Endpoints

Sau khi deploy, API sẽ có sẵn tại:
- `https://your-project.vercel.app/api/teams/`
- `https://your-project.vercel.app/api/players/`
- `https://your-project.vercel.app/api/matches/`
- etc.

Frontend sẽ tự động sử dụng `/api` làm base URL trong production.

## Lưu ý quan trọng

1. **Database**: Cần có PostgreSQL database (Vercel không cung cấp database miễn phí)
2. **File Uploads**: Static files trong `static/uploads/` sẽ không persist trên Vercel (cần dùng S3 hoặc storage khác)
3. **Cold Start**: Serverless functions có thể có cold start delay
4. **Environment Variables**: Đảm bảo set đúng `DATABASE_URL` trên Vercel

## Troubleshooting

- Nếu gặp lỗi import, kiểm tra `api/index.py` có đúng path không
- Nếu database connection fail, kiểm tra `DATABASE_URL` environment variable
- Nếu frontend không load, kiểm tra `vercel.json` routes configuration

