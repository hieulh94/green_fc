# 🎉 Project đã chạy thành công!

## ✅ Đã hoàn thành:

1. ✅ Database `green_fc` đã được tạo
2. ✅ Dependencies đã được cài đặt
3. ✅ Migration đã được tạo và chạy
4. ✅ Tables đã được tạo trong database:
   - `teams`
   - `players`
   - `alembic_version`

## 🚀 Server đang chạy

Server FastAPI đang chạy tại: **http://localhost:8000**

### Truy cập API:

- **API Documentation (Swagger UI)**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc
- **API Root**: http://localhost:8000/

### Các endpoints có sẵn:

#### Teams:
- `GET /teams/` - Lấy danh sách teams
- `GET /teams/{team_id}` - Lấy team theo ID
- `POST /teams/` - Tạo team mới
- `PUT /teams/{team_id}` - Cập nhật team
- `DELETE /teams/{team_id}` - Xóa team

#### Players:
- `GET /players/` - Lấy danh sách players (có thể filter theo `team_id`)
- `GET /players/{player_id}` - Lấy player theo ID
- `POST /players/` - Tạo player mới
- `PUT /players/{player_id}` - Cập nhật player
- `DELETE /players/{player_id}` - Xóa player

## 🔧 Để dừng server:

Nhấn `Ctrl+C` trong terminal đang chạy server, hoặc:

```bash
pkill -f "uvicorn app.main:app"
```

## 🔄 Để chạy lại server:

```bash
python3 -m uvicorn app.main:app --reload
```

hoặc

```bash
./run.sh
```

## 📝 Test API:

Bạn có thể test API bằng cách mở trình duyệt và vào:
- http://localhost:8000/docs - Swagger UI để test trực tiếp
- http://localhost:8000/redoc - ReDoc để xem documentation

Hoặc dùng curl:

```bash
# Test root endpoint
curl http://localhost:8000/

# Lấy danh sách teams
curl http://localhost:8000/teams/

# Tạo team mới
curl -X POST http://localhost:8000/teams/ \
  -H "Content-Type: application/json" \
  -d '{"name": "Manchester United", "country": "England", "founded_year": 1878}'
```

