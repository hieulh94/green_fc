# 🔧 Fix Vercel Build Error với uv

## Vấn đề
Vercel đang cố dùng `uv` và tìm `[project]` table trong `pyproject.toml`.

## ✅ Đã sửa

1. **Thêm `[project]` table vào `pyproject.toml`**
   - Chứa tất cả dependencies từ `requirements.txt`

2. **Thêm build commands vào `vercel.json`**
   - `buildCommand`: Force dùng `pip install -r requirements.txt`
   - `installCommand`: Force dùng `pip install -r requirements.txt`

3. **Tạo `.python-version`**
   - Chỉ định Python 3.11

## Nếu vẫn lỗi

### Option 1: Cấu hình trong Vercel Dashboard
1. Vào **Settings** → **General**
2. Tìm **Build & Development Settings**
3. Override:
   - **Install Command**: `pip install -r requirements.txt`
   - **Build Command**: (để trống hoặc `echo "Build complete"`)

### Option 2: Xóa pyproject.toml (nếu không cần)
Nếu không dùng Poetry, có thể xóa `pyproject.toml` và chỉ dùng `requirements.txt`:
```bash
# Chỉ dùng nếu không cần Poetry
rm pyproject.toml
```

### Option 3: Disable uv trong Vercel
Thêm vào `vercel.json`:
```json
{
  "functions": {
    "api/index.py": {
      "runtime": "python3.11"
    }
  }
}
```

## Kiểm tra

Sau khi deploy, kiểm tra:
- Build logs không còn lỗi `uv lock`
- Dependencies được install từ `requirements.txt`
- API endpoints hoạt động

