# 🔧 Fix Alembic Connection Error

## ⚠️ Lỗi
```
Traceback (most recent call last):
  File ".../sqlalchemy/engine/base.py", line 143, in __init__
    self._dbapi_connection = engine.raw_connection()
```

## 🎯 Nguyên nhân có thể:

### 1. **DATABASE_URL chưa được set**
- Environment variable không có
- Hoặc connection string sai

### 2. **Database không accessible**
- Connection string sai
- Database không accessible từ internet
- Firewall blocking

### 3. **psycopg2 chưa được cài đúng**
- Module chưa được cài
- Hoặc version không tương thích

## ✅ Các bước fix:

### Bước 1: Kiểm tra DATABASE_URL đã được set chưa

```bash
# Kiểm tra
echo $DATABASE_URL

# Nếu rỗng, cần set:
export DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

### Bước 2: Kiểm tra connection string đúng chưa

**Format đúng:**
```
postgresql://postgres:YOUR_PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
```

**Lấy từ Supabase:**
1. Supabase Dashboard → Settings → Database
2. Connection string → URI tab
3. Copy và thay `[YOUR-PASSWORD]` bằng password thật

### Bước 3: Test connection trước

```bash
# Test với psql (nếu có)
psql "$DATABASE_URL" -c "SELECT 1;"

# Hoặc test với Python
python3 -c "
import psycopg2
import os
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
print('✅ Connection OK!')
conn.close()
"
```

### Bước 4: Đảm bảo psycopg2 đã được cài

```bash
# Activate venv (nếu có)
source venv/bin/activate

# Cài dependencies
pip install -r requirements.txt

# Kiểm tra psycopg2
python3 -c "import psycopg2; print('✅ psycopg2 OK')"
```

### Bước 5: Chạy migrations với error handling tốt hơn

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# Chạy migrations
python3 -m alembic upgrade head
```

## 🔍 Debug Steps:

### 1. Kiểm tra full error message:
```bash
python3 -m alembic upgrade head 2>&1 | tee migration_error.log
cat migration_error.log
```

### 2. Kiểm tra alembic config:
```bash
# Xem alembic.ini
cat alembic.ini | grep sqlalchemy.url
```

### 3. Test database connection:
```bash
# Test với Python
python3 << EOF
import os
from sqlalchemy import create_engine

db_url = os.getenv('DATABASE_URL', '')
if not db_url:
    print('❌ DATABASE_URL not set!')
    exit(1)

print(f'Testing connection to: {db_url[:50]}...')

try:
    engine = create_engine(db_url)
    conn = engine.connect()
    print('✅ Connection successful!')
    conn.close()
except Exception as e:
    print(f'❌ Connection failed: {e}')
EOF
```

## 🚀 Quick Fix Script:

Tạo file `test_db_connection.sh`:

```bash
#!/bin/bash

echo "🔍 Testing Database Connection..."
echo ""

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set!"
    echo ""
    echo "Please set it:"
    echo "  export DATABASE_URL='postgresql://postgres:password@db.xxx.supabase.co:5432/postgres'"
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Test connection
echo "Testing connection..."
python3 << EOF
import os
import sys
from sqlalchemy import create_engine

db_url = os.getenv('DATABASE_URL', '')
try:
    engine = create_engine(db_url)
    conn = engine.connect()
    print('✅ Connection successful!')
    conn.close()
    sys.exit(0)
except Exception as e:
    print(f'❌ Connection failed: {e}')
    sys.exit(1)
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database connection OK! You can now run migrations."
else
    echo ""
    echo "❌ Database connection failed! Please check:"
    echo "  1. DATABASE_URL is correct"
    echo "  2. Database is accessible from internet"
    echo "  3. Password is correct"
fi
```

## 📋 Checklist:

- [ ] DATABASE_URL đã được set (`echo $DATABASE_URL`)
- [ ] Connection string đúng format
- [ ] Password đã được thay thế trong connection string
- [ ] psycopg2 đã được cài (`pip install -r requirements.txt`)
- [ ] Database accessible từ internet
- [ ] Đã test connection trước khi chạy migrations

## 🆘 Nếu vẫn lỗi:

### Copy full error message:
```bash
python3 -m alembic upgrade head 2>&1
```

Và gửi full error message để tôi có thể hỗ trợ cụ thể hơn.

---

**Sau khi fix connection, migrations sẽ chạy thành công!** ✅

