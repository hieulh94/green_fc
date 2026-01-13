# 🔧 Fix Mangum Version Cache Issue

## ⚠️ Lỗi
Vercel vẫn báo lỗi `mangum==0.18.1` không tồn tại, mặc dù local đã sửa về `0.17.0`.

## 🎯 Nguyên nhân
1. **Code chưa được push** lên GitHub
2. **Vercel đang cache** build cũ
3. **Commit hash không match** với code mới

## ✅ Giải pháp

### Bước 1: Kiểm tra code đã commit chưa

```bash
cd /Users/mac/Desktop/green_fc

# Kiểm tra files đã thay đổi
git status

# Xem nội dung pyproject.toml
cat pyproject.toml | grep mangum
# Phải thấy: "mangum==0.17.0"
```

### Bước 2: Commit và push code mới

```bash
# Thêm tất cả files
git add .

# Commit
git commit -m "Fix mangum version to 0.17.0"

# Push lên GitHub
git push origin main
```

### Bước 3: Clear Build Cache trên Vercel

**QUAN TRỌNG**: Phải clear cache để Vercel build lại!

1. Vào **Vercel Dashboard** → Project của bạn
2. **Settings** → **General**
3. Scroll xuống **Build & Development Settings**
4. Click **"Clear Build Cache"**
5. Confirm

### Bước 4: Redeploy

1. Vào **Deployments**
2. Click **...** (3 chấm) ở deployment mới nhất
3. Click **"Redeploy"**
4. Hoặc push code mới sẽ tự động trigger deployment

## 🔍 Kiểm tra lại

Sau khi push và clear cache, kiểm tra:
1. **GitHub repository** - `pyproject.toml` có `mangum==0.17.0` không?
2. **Vercel build logs** - Xem commit hash có match không?
3. **Build logs** - Không còn lỗi `mangum==0.18.1`

## 💡 Nếu vẫn lỗi:

### Option 1: Xóa và tạo lại pyproject.toml

```bash
# Backup
cp pyproject.toml pyproject.toml.backup

# Xóa
rm pyproject.toml

# Tạo lại với mangum==0.17.0
cat > pyproject.toml << 'EOF'
[project]
name = "green-fc"
version = "0.1.0"
description = "Lightweight football team management backend"
requires-python = ">=3.11"
authors = [
    { name = "Green FC Team", email = "team@greenfc.com" }
]
dependencies = [
    "fastapi==0.115.0",
    "uvicorn[standard]==0.32.0",
    "sqlalchemy==2.0.36",
    "alembic==1.14.0",
    "psycopg2-binary==2.9.10",
    "pydantic==2.9.2",
    "pydantic-settings==2.6.1",
    "python-dotenv==1.0.1",
    "python-multipart==0.0.12",
    "mangum==0.17.0",
]

[tool.black]
line-length = 100
target-version = ['py312']

[tool.isort]
profile = "black"
line_length = 100
EOF

# Commit và push
git add pyproject.toml
git commit -m "Recreate pyproject.toml with mangum 0.17.0"
git push
```

### Option 2: Chỉ dùng requirements.txt

Nếu vẫn lỗi, có thể xóa `pyproject.toml` và chỉ dùng `requirements.txt`:

```bash
# Xóa pyproject.toml
rm pyproject.toml

# Commit và push
git add .
git commit -m "Remove pyproject.toml, use requirements.txt only"
git push
```

Vercel sẽ tự động detect `requirements.txt` nếu không có `pyproject.toml`.

---

## 📋 Checklist:

- [ ] Files local đã đúng (`mangum==0.17.0`)
- [ ] Đã commit code mới
- [ ] Đã push lên GitHub
- [ ] Đã clear build cache trên Vercel
- [ ] Đã redeploy
- [ ] Build logs không còn lỗi `mangum==0.18.1`

---

**Lưu ý**: Phải **clear build cache** trên Vercel để build lại từ đầu!

