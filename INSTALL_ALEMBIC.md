# 📦 Hướng dẫn cài đặt và chạy Alembic

## ⚠️ Lỗi
```
zsh: command not found: alembic
```

## 🎯 Nguyên nhân
Alembic chưa được cài đặt hoặc không có trong PATH.

## ✅ Cách fix:

### Cách 1: Cài đặt dependencies từ requirements.txt (Khuyến nghị)

#### Bước 1: Tạo virtual environment (nếu chưa có)
```bash
cd /Users/mac/Desktop/green_fc

# Tạo virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate
```

#### Bước 2: Cài đặt dependencies
```bash
# Cài tất cả dependencies (bao gồm alembic)
pip install -r requirements.txt
```

#### Bước 3: Chạy migrations
```bash
# Cách 1: Dùng python -m alembic
python -m alembic upgrade head

# Hoặc cách 2: Dùng alembic trực tiếp (sau khi activate venv)
alembic upgrade head
```

---

### Cách 2: Cài alembic global (Không khuyến nghị)

```bash
pip3 install alembic
alembic upgrade head
```

**Lưu ý**: Cách này có thể gây conflict với các projects khác.

---

### Cách 3: Dùng python -m alembic (Không cần cài global)

```bash
# Không cần cài alembic global
python3 -m alembic upgrade head
```

**Lưu ý**: Cần có alembic trong requirements.txt và đã cài dependencies.

---

## 🚀 Workflow đầy đủ:

### 1. Setup virtual environment:
```bash
cd /Users/mac/Desktop/green_fc

# Tạo venv (nếu chưa có)
python3 -m venv venv

# Activate venv
source venv/bin/activate

# Cài dependencies
pip install -r requirements.txt
```

### 2. Pull environment variables từ Vercel:
```bash
# Cài Vercel CLI (nếu chưa có)
npm install -g vercel

# Login và link
vercel login
vercel link

# Pull env vars
vercel env pull .env.local
```

### 3. Set DATABASE_URL và chạy migrations:
```bash
# Set DATABASE_URL từ .env.local
export $(cat .env.local | grep DATABASE_URL | xargs)

# Chạy migrations
python -m alembic upgrade head
```

---

## 🔍 Kiểm tra:

### Kiểm tra alembic đã được cài:
```bash
# Trong virtual environment
source venv/bin/activate
python -m alembic --version

# Hoặc
alembic --version
```

### Kiểm tra dependencies đã được cài:
```bash
pip list | grep alembic
# Phải thấy: alembic x.x.x
```

---

## ⚠️ Troubleshooting:

### Lỗi: "No module named 'alembic'"
**Nguyên nhân**: Alembic chưa được cài trong virtual environment

**Fix**:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Lỗi: "alembic: command not found" (ngay cả sau khi cài)
**Nguyên nhân**: Virtual environment chưa được activate

**Fix**:
```bash
source venv/bin/activate
alembic upgrade head

# Hoặc dùng python -m
python -m alembic upgrade head
```

### Lỗi: "DATABASE_URL is not set"
**Nguyên nhân**: Environment variable chưa được set

**Fix**:
```bash
# Pull từ Vercel
vercel env pull .env.local

# Set environment variable
export $(cat .env.local | grep DATABASE_URL | xargs)

# Chạy migrations
python -m alembic upgrade head
```

---

## 📋 Quick Commands:

```bash
# Setup (chỉ cần làm 1 lần)
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Pull env và chạy migrations (mỗi lần cần)
vercel env pull .env.local
export $(cat .env.local | grep DATABASE_URL | xargs)
python -m alembic upgrade head
```

---

## ✅ Sau khi chạy migrations:

Kiểm tra trên Supabase:
1. Vào Supabase Dashboard → Project
2. **Table Editor**
3. Xem các tables đã được tạo:
   - ✅ `teams`
   - ✅ `players`
   - ✅ `opponents`
   - ✅ `matches`
   - ✅ `match_goals`
   - ✅ `match_participants`
   - ✅ `alembic_version`

---

**Sau khi cài đặt và chạy migrations, database sẽ có đầy đủ tables!** ✅

