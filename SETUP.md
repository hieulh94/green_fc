# Quick Setup Guide

## Bước 1: Cài đặt dependencies

```bash
pip install -r requirements.txt
```

Hoặc sử dụng virtual environment (khuyến nghị):

```bash
python3 -m venv venv
source venv/bin/activate  # Trên macOS/Linux
# hoặc: venv\Scripts\activate  # Trên Windows
pip install -r requirements.txt
```

## Bước 2: Tạo file .env

Tạo file `.env` trong thư mục root với nội dung:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/green_fc
ENVIRONMENT=development
```

**Lưu ý**: Thay `user:password` và `localhost:5432` bằng thông tin database PostgreSQL của bạn.

## Bước 3: Setup database

```bash
# Tạo database (nếu chưa có)
createdb green_fc

# Tạo migration đầu tiên
alembic revision --autogenerate -m "initial migration"

# Chạy migration
alembic upgrade head
```

## Bước 4: Chạy ứng dụng

```bash
uvicorn app.main:app --reload
```

Hoặc sử dụng script:

```bash
./run.sh
```

## Truy cập API

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- API: http://localhost:8000

