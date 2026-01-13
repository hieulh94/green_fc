# 🔧 Fix Permission Denied Error

## ⚠️ Lỗi
```
zsh: permission denied: ./test_db_connection.sh
```

## ✅ Fix nhanh:

### Cách 1: Thêm quyền execute
```bash
chmod +x test_db_connection.sh
./test_db_connection.sh
```

### Cách 2: Chạy trực tiếp với bash
```bash
bash test_db_connection.sh
```

### Cách 3: Chạy với sh
```bash
sh test_db_connection.sh
```

## 🔍 Kiểm tra quyền:

```bash
ls -la test_db_connection.sh
# Phải thấy: -rwxr-xr-x (có x = execute permission)
```

## 📋 Sau khi fix permission:

Chạy lại:
```bash
./test_db_connection.sh
```

---

**Sau khi thêm quyền, script sẽ chạy được!** ✅

