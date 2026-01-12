# Quick Start Guide

## ✅ Đã hoàn thành:

1. **Database đã được tạo**: `green_fc`
2. **File .env đã được tạo** với connection string:
   ```
   DATABASE_URL=postgresql://mac@localhost:5432/green_fc
   ENVIRONMENT=development
   ```

## 📋 Các bước tiếp theo:

### 1. Cài đặt dependencies
```bash
pip install -r requirements.txt
```

### 2. Tạo migration đầu tiên
```bash
alembic revision --autogenerate -m "initial migration"
```

### 3. Chạy migration để tạo tables
```bash
alembic upgrade head
```

### 4. Chạy server
```bash
uvicorn app.main:app --reload
```

### 5. Truy cập API
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **API**: http://localhost:8000

## 🔍 Kiểm tra database

Xem danh sách databases:
```bash
psql -l
```

Kết nối vào database:
```bash
psql green_fc
```

Xem tables sau khi chạy migration:
```bash
psql green_fc -c "\dt"
```

## 🚀 Hoặc chạy tất cả trong một lệnh:

```bash
# Cài dependencies
pip install -r requirements.txt

# Tạo và chạy migration
alembic revision --autogenerate -m "initial migration"
alembic upgrade head

# Chạy server
uvicorn app.main:app --reload
```

