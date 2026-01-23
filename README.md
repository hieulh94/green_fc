# ⚽ Green FC - Football Team Management System

Hệ thống quản lý đội bóng với Frontend và Backend tích hợp.

## 📋 Tính năng

### Frontend
- ✅ Quản lý đội bóng và cầu thủ
- ✅ Lịch thi đấu (sắp tới và đã hoàn thành)
- ✅ Thống kê bàn thắng và tham gia
- ✅ Quản lý đối thủ
- ✅ UI hiện đại, responsive

### Backend
- ✅ FastAPI REST API
- ✅ Firebase Firestore database
- ✅ Quản lý teams, players, matches, opponents
- ✅ Upload và quản lý hình ảnh
- ✅ Authentication và authorization

## 🏗️ Cấu trúc dự án

```
green_fc/
├── api/
│   └── index.py              # Vercel serverless function entry point
├── app/                       # Backend application
│   ├── main.py               # FastAPI app
│   ├── config.py             # Configuration
│   ├── database.py           # Firebase connection
│   ├── models/               # Data models
│   ├── schemas/              # Pydantic schemas
│   ├── repositories/         # Data access layer
│   ├── services/             # Business logic
│   └── routers/             # API endpoints
├── frontend/                 # Frontend source code
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── api.js
│   └── positions.js
├── public/                   # Frontend files for deployment
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── api.js
│   └── positions.js
├── static/                   # Static files (uploads)
│   └── uploads/
├── requirements.txt          # Python dependencies
├── vercel.json              # Vercel configuration
└── README.md
```

## 🚀 Cài đặt và chạy dự án

### Yêu cầu

- Python 3.11+
- Node.js (tùy chọn, để chạy HTTP server)
- Firebase project và credentials

### Bước 1: Clone repository

```bash
git clone <repository-url>
cd green_fc
```

### Bước 2: Cài đặt Python dependencies

```bash
# Tạo virtual environment (khuyến nghị)
python3 -m venv venv
source venv/bin/activate  # Trên macOS/Linux
# hoặc: venv\Scripts\activate  # Trên Windows

# Cài đặt dependencies
pip install -r requirements.txt
```

### Bước 3: Cấu hình Firebase

1. Tạo Firebase project tại [Firebase Console](https://console.firebase.google.com)
2. Bật Firestore Database
3. Download service account credentials:
   - Vào **Project Settings** → **Service accounts**
   - Click **Generate new private key**
   - Lưu file JSON (ví dụ: `firebase-credentials.json`)

4. Tạo file `.env` trong thư mục root:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
ENVIRONMENT=development
```

**Lưu ý**: 
- File `firebase-credentials.json` không được commit lên Git (đã có trong `.gitignore`)
- Thay `your-project-id` bằng Project ID từ Firebase Console

### Bước 4: Chạy Backend

```bash
# Cách 1: Dùng script
./start_backend.sh

# Cách 2: Dùng uvicorn trực tiếp
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend sẽ chạy tại: http://localhost:8000

**API Documentation:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Bước 5: Chạy Frontend

Mở terminal mới và chạy:

```bash
# Cách 1: Dùng script
cd frontend
./start.sh

# Cách 2: Dùng Python HTTP server
cd frontend
python3 -m http.server 3000

# Cách 3: Dùng Node.js (nếu có)
cd frontend
npx http-server -p 3000
```

Frontend sẽ chạy tại: http://localhost:3000

**Lưu ý**: 
- Frontend tự động kết nối với backend tại `http://localhost:8000`
- Đảm bảo backend đang chạy trước khi mở frontend

## 📝 Cập nhật Frontend Files

Khi có thay đổi trong `frontend/`, cần copy sang `public/` để deploy:

```bash
# Chạy script tự động
./copy_frontend_to_public.sh

# Hoặc copy thủ công
cp frontend/index.html public/
cp frontend/app.js public/
cp frontend/styles.css public/
cp frontend/api.js public/
cp frontend/positions.js public/
```

## 🗄️ Database

Dự án sử dụng **Firebase Firestore** làm database.

### Cấu trúc Collections

- `teams` - Thông tin đội bóng
- `players` - Thông tin cầu thủ
- `opponents` - Thông tin đối thủ
- `matches` - Thông tin trận đấu
- `match_goals` - Bàn thắng trong trận đấu
- `match_participants` - Cầu thủ tham gia trận đấu

### Khởi tạo dữ liệu

Dữ liệu sẽ được tạo tự động khi:
- Tạo team đầu tiên qua API hoặc Frontend
- Tạo player, opponent, match qua API hoặc Frontend

## 🔌 API Endpoints

### Teams
- `GET /api/teams/` - Lấy danh sách teams
- `GET /api/teams/{id}` - Lấy team theo ID
- `POST /api/teams/` - Tạo team mới
- `PUT /api/teams/{id}` - Cập nhật team
- `DELETE /api/teams/{id}` - Xóa team

### Players
- `GET /api/players/` - Lấy danh sách players (có thể filter theo team_id)
- `GET /api/players/{id}` - Lấy player theo ID
- `POST /api/players/` - Tạo player mới
- `PUT /api/players/{id}` - Cập nhật player
- `DELETE /api/players/{id}` - Xóa player

### Opponents
- `GET /api/opponents/` - Lấy danh sách opponents
- `GET /api/opponents/{id}` - Lấy opponent theo ID
- `POST /api/opponents/` - Tạo opponent mới
- `PUT /api/opponents/{id}` - Cập nhật opponent
- `DELETE /api/opponents/{id}` - Xóa opponent

### Matches
- `GET /api/matches/` - Lấy danh sách matches (có thể filter theo opponent_id)
- `GET /api/matches/{id}` - Lấy match theo ID
- `POST /api/matches/` - Tạo match mới
- `PUT /api/matches/{id}` - Cập nhật match
- `PUT /api/matches/{id}/result` - Cập nhật kết quả trận đấu
- `DELETE /api/matches/{id}` - Xóa match

### Uploads
- `POST /api/uploads/` - Upload file (hình ảnh)

Xem chi tiết tại: http://localhost:8000/docs

## 🚀 Deploy

Xem hướng dẫn chi tiết trong file [DEPLOY.md](./DEPLOY.md)

Tóm tắt:
1. Setup Firebase project
2. Deploy lên Vercel
3. Cấu hình Environment Variables
4. Kiểm tra deployment

## 🛠️ Development

### Cấu trúc Backend

- **Routers** (`app/routers/`): Xử lý HTTP requests/responses
- **Services** (`app/services/`): Business logic và validation
- **Repositories** (`app/repositories/`): Database operations
- **Models** (`app/models/`): Data models
- **Schemas** (`app/schemas/`): Request/response validation

### Cấu trúc Frontend

- `index.html` - HTML structure
- `app.js` - Main application logic
- `api.js` - API communication layer
- `styles.css` - Styling
- `positions.js` - Position data

## 📦 Dependencies

### Backend
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `firebase-admin` - Firebase SDK
- `pydantic` - Data validation
- `mangum` - ASGI adapter for AWS Lambda/Vercel

### Frontend
- Pure JavaScript (không cần build step)
- Fetch API cho HTTP requests

## 🐛 Troubleshooting

### Backend không chạy

1. Kiểm tra Python version: `python3 --version` (cần 3.11+)
2. Kiểm tra virtual environment đã activate chưa
3. Kiểm tra file `.env` và `firebase-credentials.json` có đúng không
4. Xem logs để biết lỗi cụ thể

### Frontend không kết nối được Backend

1. Đảm bảo backend đang chạy tại `http://localhost:8000`
2. Kiểm tra console browser để xem lỗi
3. Kiểm tra CORS settings trong `app/main.py`

### Lỗi Firebase

1. Kiểm tra `FIREBASE_PROJECT_ID` trong `.env`
2. Kiểm tra file `firebase-credentials.json` có đúng không
3. Kiểm tra Firestore đã được enable trong Firebase Console

## 📄 License

MIT

## 👥 Contributors

Green FC Team
