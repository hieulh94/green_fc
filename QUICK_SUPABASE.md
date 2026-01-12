# ⚡ Quick Guide: Sau khi tạo Supabase

## 🎯 3 Bước nhanh

### 1️⃣ Lấy Connection String
```
Supabase Dashboard → Settings → Database → Connection string (URI)
Copy: postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

### 2️⃣ Thêm vào Vercel
```
Vercel Dashboard → Project → Settings → Environment Variables
Thêm:
  - DATABASE_URL = (connection string vừa copy)
  - ENVIRONMENT = production
```

### 3️⃣ Chạy Migration
```bash
# Pull env từ Vercel
vercel env pull .env.local

# Chạy migration
./run_migration.sh
```

---

## ✅ Xong!

Bây giờ bạn có thể:
- Truy cập app: `https://your-project.vercel.app`
- Login: `fcgreen` / `123`
- Bắt đầu sử dụng!

---

## 📚 Chi tiết hơn?

Xem file `SUPABASE_SETUP.md` để biết:
- Cách lấy connection string chi tiết
- Troubleshooting
- Tạo team đầu tiên
- Và nhiều hơn nữa...

