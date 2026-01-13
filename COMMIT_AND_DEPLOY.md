# 📝 Git Commands để Deploy lên Vercel

## 🎯 Mục đích
Commit và push các thay đổi liên quan đến việc bỏ bắt buộc team khi tạo player.

## 🚀 Cách 1: Dùng script tự động (Khuyến nghị)

```bash
cd /Users/mac/Desktop/green_fc
./GIT_COMMIT_COMMANDS.sh
```

Script sẽ tự động:
1. Sync frontend files sang `public/`
2. Add tất cả thay đổi
3. Commit với message chi tiết
4. Push lên GitHub

## 📋 Cách 2: Chạy từng lệnh thủ công

### Bước 1: Sync frontend files sang public

```bash
cd /Users/mac/Desktop/green_fc

# Tạo public directory và copy files
mkdir -p public
cp frontend/index.html public/
cp frontend/styles.css public/
cp frontend/app.js public/
cp frontend/api.js public/
cp frontend/positions.js public/
```

### Bước 2: Kiểm tra thay đổi

```bash
git status
```

**Phải thấy các files sau:**
- `app/main.py` (thêm root_path)
- `app/models/player.py` (team_id nullable)
- `app/schemas/player.py` (team_id optional)
- `app/services/player_service.py` (bỏ validation)
- `frontend/app.js` (bỏ validation)
- `public/app.js` (bỏ validation)
- `alembic/versions/make_player_team_id_nullable.py` (migration mới)
- Các files khác trong `public/`

### Bước 3: Add tất cả thay đổi

```bash
git add .
```

### Bước 4: Commit

```bash
git commit -m "Fix: Add root_path=/api for Vercel routing and make team_id optional for players

- Add root_path='/api' to FastAPI app for correct Vercel routing
- Make team_id optional when creating players (nullable in database)
- Remove team validation requirement from frontend
- Add migration to make team_id nullable in players table
- Sync frontend files to public/ directory"
```

### Bước 5: Push lên GitHub

```bash
git push origin main
```

## ✅ Sau khi push

1. **Vercel sẽ tự động detect** và bắt đầu deploy (1-2 phút)
2. **Kiểm tra deployment:**
   - Vào Vercel Dashboard → Deployments
   - Xem deployment mới nhất
   - Đảm bảo build thành công

3. **Chạy migration** (QUAN TRỌNG!):
   ```bash
   export DATABASE_URL="postgresql://postgres.btbadzadbfjjdstmrrmb:mMoJUH93lEI0djB0@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
   python3 -m alembic upgrade heads
   ```

4. **Test:**
   - `https://green-fc.vercel.app/api` → API root
   - `https://green-fc.vercel.app/api/players/` → Players API
   - `https://green-fc.vercel.app/` → Frontend
   - Tạo player mới không cần team → Phải thành công

## 📋 Checklist

- [ ] Đã sync frontend files sang `public/`
- [ ] Đã kiểm tra `git status` - thấy đủ files
- [ ] Đã `git add .`
- [ ] Đã `git commit` với message rõ ràng
- [ ] Đã `git push origin main`
- [ ] Vercel đã bắt đầu deploy
- [ ] Đã chạy migration (`alembic upgrade heads`)
- [ ] Đã test API và frontend

## 🔍 Nếu có lỗi

### Lỗi "nothing to commit":
- Kiểm tra `git status` - có files nào chưa được add không?
- Đảm bảo đã sync frontend files sang `public/`

### Lỗi "push rejected":
- Pull trước: `git pull origin main`
- Resolve conflicts nếu có
- Push lại: `git push origin main`

### Lỗi Vercel build:
- Kiểm tra Vercel build logs
- Đảm bảo `DATABASE_URL` đã được set trên Vercel
- Xem file `FIX_404_NOT_FOUND.md` nếu API 404

---

**Sau khi chạy các lệnh trên, Vercel sẽ tự động deploy!** ✅

