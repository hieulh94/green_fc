# 🔧 Fix Multiple Head Revisions Error

## ⚠️ Lỗi
```
ERROR: Multiple head revisions are present for given argument 'head'
```

## 🎯 Nguyên nhân
Có nhiều migration branches (nhiều head revisions) trong Alembic. Cần merge hoặc upgrade tất cả heads.

## ✅ Cách fix:

### Cách 1: Upgrade tất cả heads (Khuyến nghị - Nhanh nhất)

```bash
# Thay vì: alembic upgrade head
# Dùng: alembic upgrade heads (có chữ s)
python3 -m alembic upgrade heads
```

**Lệnh này sẽ upgrade tất cả head revisions**, không chỉ một.

### Cách 2: Tạo merge migration (Nếu cần merge branches)

```bash
# Tạo merge migration
python3 -m alembic merge -m "merge branches" heads

# Sau đó upgrade
python3 -m alembic upgrade head
```

## 🚀 Quick Fix:

```bash
# Set DATABASE_URL (nếu chưa set)
export DATABASE_URL="postgresql://postgres.btbadzadbfjjdstmrrmb:mMoJUH93lEI0djB0@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# Upgrade tất cả heads
python3 -m alembic upgrade heads
```

## ✅ Sau khi chạy thành công:

Sẽ thấy:
```
INFO  [alembic.runtime.migration] Running upgrade ... -> add_match_participants
INFO  [alembic.runtime.migration] Running upgrade ... -> add_rating_review
```

## 🔍 Kiểm tra heads:

```bash
# Xem tất cả heads
python3 -m alembic heads

# Xem current revision
python3 -m alembic current
```

## 📋 Checklist:

- [ ] Đã set DATABASE_URL
- [ ] Đã chạy `python3 -m alembic upgrade heads` (có chữ s)
- [ ] Migrations đã chạy thành công
- [ ] Đã kiểm tra tables trên Supabase

---

**Sau khi chạy `alembic upgrade heads`, migrations sẽ hoàn tất!** ✅

