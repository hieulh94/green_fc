# 🎨 Frontend Setup Guide

## ✅ Đã hoàn thành:

1. ✅ Frontend đã được tạo trong thư mục `frontend/`
2. ✅ CORS đã được cấu hình trong backend
3. ✅ UI hiện đại với HTML/CSS/JavaScript
4. ✅ Đầy đủ chức năng CRUD cho Teams và Players

## 🚀 Cách chạy Frontend:

### Bước 1: Đảm bảo Backend đang chạy

Backend phải chạy tại: **http://localhost:8000**

Kiểm tra:
```bash
curl http://localhost:8000/
```

Nếu backend chưa chạy:
```bash
cd /Users/mac/Desktop/green_fc
python3 -m uvicorn app.main:app --reload
```

### Bước 2: Chạy Frontend Server

Có nhiều cách để chạy frontend:

#### Cách 1: Dùng script có sẵn (Khuyến nghị)
```bash
cd frontend
./start.sh
```

#### Cách 2: Dùng Python HTTP Server
```bash
cd frontend
python3 -m http.server 3000
```

#### Cách 3: Dùng Node.js http-server (nếu đã cài)
```bash
cd frontend
npx http-server -p 3000
```

#### Cách 4: Dùng VS Code Live Server
1. Mở thư mục `frontend` trong VS Code
2. Cài extension "Live Server"
3. Click "Go Live" hoặc chuột phải vào `index.html` > "Open with Live Server"

### Bước 3: Truy cập Frontend

Mở trình duyệt và vào: **http://localhost:3000**

## 📋 Tính năng Frontend:

### Teams Tab:
- ✅ Xem danh sách tất cả teams
- ✅ Tạo team mới
- ✅ Chỉnh sửa team
- ✅ Xóa team

### Players Tab:
- ✅ Xem danh sách tất cả players
- ✅ Lọc players theo team
- ✅ Tạo player mới
- ✅ Chỉnh sửa player
- ✅ Xóa player

## 🎨 UI Features:

- 🎨 Modern gradient design
- 📱 Responsive (hoạt động trên mobile và desktop)
- ⚡ Fast và lightweight
- 🎯 Intuitive user interface
- ✨ Smooth animations

## 📁 Cấu trúc Frontend:

```
frontend/
├── index.html      # Main HTML file
├── styles.css      # Styling và layout
├── api.js          # API communication functions
├── app.js          # Application logic và event handlers
├── start.sh        # Script để chạy server
└── README.md       # Documentation
```

## 🔧 Cấu hình:

Nếu backend chạy trên port khác, sửa trong `frontend/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:8000'; // Thay đổi port nếu cần
```

## 🐛 Troubleshooting:

### Lỗi CORS:
- Đảm bảo backend đang chạy
- Kiểm tra CORS đã được cấu hình trong `app/main.py`
- Restart backend sau khi thay đổi CORS config

### Không kết nối được API:
- Kiểm tra backend có đang chạy tại http://localhost:8000
- Kiểm tra console trong browser (F12) để xem lỗi
- Đảm bảo frontend server và backend đều đang chạy

### Frontend không load:
- Kiểm tra đã chạy HTTP server trong thư mục `frontend`
- Không mở file `index.html` trực tiếp (phải dùng HTTP server)
- Kiểm tra port 3000 có bị chiếm không

## 📝 Test Frontend:

1. Tạo một vài teams
2. Tạo players và assign vào teams
3. Thử filter players theo team
4. Test edit và delete
5. Kiểm tra responsive trên mobile/tablet

