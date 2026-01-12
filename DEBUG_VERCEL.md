# 🐛 Debug Vercel Build Issues

## Nếu build vẫn lỗi, hãy kiểm tra:

### 1. Xem Full Build Logs
Trong Vercel Dashboard:
- Vào **Deployments** → Click vào deployment mới nhất
- Scroll xuống xem **Build Logs** đầy đủ
- Copy toàn bộ error message

### 2. Các lỗi thường gặp:

#### A. Python Runtime Error
**Lỗi**: `ModuleNotFoundError` hoặc `ImportError`
**Fix**: Đảm bảo tất cả dependencies trong `requirements.txt`

#### B. Database Connection Error
**Lỗi**: `Connection refused` hoặc `timeout`
**Fix**: 
- Kiểm tra `DATABASE_URL` trong Environment Variables
- Đảm bảo database accessible từ internet
- Test connection string

#### C. Path/Import Error
**Lỗi**: `No module named 'app'` hoặc `cannot find module`
**Fix**: Kiểm tra `api/index.py` có đúng path không

#### D. Static Files Error
**Lỗi**: `404` cho static files
**Fix**: Kiểm tra `vercel.json` rewrites

### 3. Kiểm tra Files:

```bash
# Đảm bảo các files này tồn tại:
- requirements.txt ✅
- api/index.py ✅
- vercel.json ✅
- app/main.py ✅
- .python-version ✅ (Python 3.11)
```

### 4. Test Local Build:

```bash
# Test import
python3 -c "from app.main import app; print('✅ Import OK')"

# Test requirements
pip install -r requirements.txt
```

### 5. Vercel Settings:

Trong Vercel Dashboard → Settings → General:
- **Framework Preset**: Other
- **Root Directory**: (để trống)
- **Build Command**: (để trống - Vercel tự detect)
- **Output Directory**: (để trống)
- **Install Command**: (để trống - Vercel tự detect)

### 6. Environment Variables:

Đảm bảo có:
- `DATABASE_URL` = `postgresql://...`
- `ENVIRONMENT` = `production`

### 7. Nếu vẫn lỗi:

1. **Clear Build Cache**:
   - Vercel Dashboard → Settings → General
   - Click "Clear Build Cache"

2. **Redeploy**:
   - Vào Deployments
   - Click "Redeploy"

3. **Check Function Logs**:
   - Vercel Dashboard → Functions tab
   - Xem runtime errors

## 📋 Checklist:

- [ ] `requirements.txt` có đầy đủ dependencies
- [ ] `api/index.py` import đúng
- [ ] `vercel.json` có `functions` config
- [ ] `.python-version` = `3.11`
- [ ] Environment variables đã set
- [ ] Database accessible
- [ ] Không có `pyproject.toml` (đã xóa)

## 🔍 Common Solutions:

### Solution 1: Force Python 3.11
Đã thêm vào `vercel.json`:
```json
"functions": {
  "api/index.py": {
    "runtime": "python3.11"
  }
}
```

### Solution 2: Check Import Path
Trong `api/index.py`:
```python
sys.path.insert(0, str(Path(__file__).parent.parent))
```

### Solution 3: Verify Dependencies
```bash
pip install -r requirements.txt
python3 -c "import fastapi, mangum, sqlalchemy; print('OK')"
```

---

**Nếu vẫn lỗi, vui lòng cung cấp:**
1. Full error message từ Build Logs
2. Screenshot của error (nếu có)
3. Environment variables đã set (ẩn password)

