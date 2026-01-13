# 🔧 Fix PostgreSQL Dialect Error

## ⚠️ Lỗi
```
sqlalchemy.exc.NoSuchModuleError: Can't load plugin: sqlalchemy.dialects:postgres
```

## 🎯 Nguyên nhân
SQLAlchemy không thể load PostgreSQL dialect vì:
1. Connection string không có explicit driver (`postgresql+psycopg2://`)
2. Hoặc `psycopg2-binary` không được detect đúng cách

## ✅ Đã sửa

1. **Thêm explicit driver vào connection string**:
   - Tự động convert `postgresql://` → `postgresql+psycopg2://`
   - Đảm bảo SQLAlchemy sử dụng đúng driver

2. **Code trong `app/database.py`**:
   - Tự động detect và fix connection string format
   - Thêm `postgresql+psycopg2://` prefix nếu thiếu

## 🔍 Kiểm tra DATABASE_URL

Đảm bảo `DATABASE_URL` trong Vercel Environment Variables có format:
```
postgresql://postgres:password@host:5432/database
```

Hoặc:
```
postgresql+psycopg2://postgres:password@host:5432/database
```

Code sẽ tự động convert sang format đúng.

## 🚀 Next Steps:

1. **Commit và push**:
   ```bash
   git add .
   git commit -m "Fix PostgreSQL dialect: Add explicit psycopg2 driver"
   git push
   ```

2. **Vercel sẽ tự động redeploy**
   - Đợi build hoàn tất
   - Kiểm tra Function Logs

3. **Test lại**:
   - `https://your-project.vercel.app/api/`
   - `https://your-project.vercel.app/`

## ⚠️ Lưu ý:

- **DATABASE_URL** phải được set trong Vercel Environment Variables
- Connection string phải có format `postgresql://...` hoặc `postgresql+psycopg2://...`
- Code sẽ tự động fix format nếu cần

---

**Sau khi deploy, lỗi PostgreSQL dialect sẽ được fix!** ✅

