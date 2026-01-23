# 🚀 Hướng dẫn Deploy - Frontend & Backend

Hướng dẫn deploy dự án Green FC lên Vercel (cả Frontend và Backend).

## 📋 Yêu cầu

- Tài khoản [Vercel](https://vercel.com)
- Tài khoản [Firebase](https://firebase.google.com) (cho database)
- Git repository trên GitHub/GitLab/Bitbucket

## 🔧 Bước 1: Chuẩn bị Firebase

### 1.1. Tạo Firebase Project

1. Vào [Firebase Console](https://console.firebase.google.com)
2. Tạo project mới hoặc chọn project có sẵn
3. Bật **Firestore Database** (chế độ Production hoặc Test)

### 1.2. Lấy Firebase Credentials

1. Vào **Project Settings** (biểu tượng bánh răng)
2. Chọn tab **Service accounts**
3. Click **Generate new private key**
4. Download file JSON (ví dụ: `firebase-credentials.json`)

### 1.3. Chuẩn bị Firebase Credentials cho Vercel

Convert file JSON thành string một dòng:

```bash
# Trên macOS/Linux
cat firebase-credentials.json | jq -c

# Hoặc copy toàn bộ nội dung JSON và paste vào Vercel
```

**Lưu ý**: Giữ file `firebase-credentials.json` ở local, không commit lên Git!

## 🚀 Bước 2: Deploy lên Vercel

### 2.1. Kết nối Repository với Vercel

1. Vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New Project**
3. Import Git repository của bạn
4. Chọn repository và click **Import**

### 2.2. Cấu hình Build Settings

Vercel sẽ tự động detect:
- **Framework Preset**: Other
- **Root Directory**: `./` (root)
- **Build Command**: (để trống)
- **Output Directory**: (để trống)

### 2.3. Cấu hình Environment Variables

Vào **Settings** → **Environment Variables**, thêm các biến sau:

| Name | Value | Environments |
|------|-------|--------------|
| `FIREBASE_PROJECT_ID` | ID của Firebase project (tìm trong Firebase Console) | Production, Preview, Development |
| `FIREBASE_CREDENTIALS` | JSON string từ bước 1.3 (một dòng) | Production, Preview, Development |
| `ENVIRONMENT` | `production` | Production, Preview, Development |

**Cách lấy FIREBASE_PROJECT_ID:**
- Vào Firebase Console → Project Settings
- Copy **Project ID**

**Cách set FIREBASE_CREDENTIALS:**
- Copy toàn bộ nội dung file `firebase-credentials.json`
- Paste vào value (Vercel sẽ tự động escape)
- Hoặc dùng: `cat firebase-credentials.json | jq -c` để lấy compact JSON

### 2.4. Deploy

1. Click **Deploy**
2. Đợi build hoàn tất (2-5 phút)
3. Kiểm tra deployment logs nếu có lỗi

## 📁 Bước 3: Cấu trúc Files trên Vercel

Vercel sẽ tự động serve:

- **Frontend**: Files trong thư mục `public/` sẽ được serve từ root
  - `public/index.html` → `/`
  - `public/app.js` → `/app.js`
  - `public/styles.css` → `/styles.css`

- **Backend API**: File `api/index.py` sẽ được deploy như serverless function
  - API endpoints: `/api/teams/`, `/api/players/`, etc.

- **Static Files**: Files trong `static/` sẽ được serve từ `/static/`

## ✅ Bước 4: Kiểm tra sau khi Deploy

### 4.1. Kiểm tra Frontend

1. Mở URL deployment (ví dụ: `https://green-fc.vercel.app`)
2. Kiểm tra frontend load đúng
3. Kiểm tra console không có lỗi

### 4.2. Kiểm tra Backend API

1. Mở: `https://your-app.vercel.app/api/teams/`
2. Nên thấy JSON response (có thể là empty array `[]`)
3. Nếu lỗi, kiểm tra Function Logs trong Vercel Dashboard

### 4.3. Kiểm tra Function Logs

1. Vào Vercel Dashboard → **Deployments**
2. Click vào deployment mới nhất
3. Xem **Function Logs** để debug nếu có lỗi

## 🔄 Bước 5: Update Frontend Files

Khi có thay đổi frontend, cần copy từ `frontend/` sang `public/`:

```bash
# Chạy script copy
./copy_frontend_to_public.sh

# Hoặc copy thủ công
cp frontend/index.html public/
cp frontend/app.js public/
cp frontend/styles.css public/
cp frontend/api.js public/
cp frontend/positions.js public/
```

Sau đó commit và push:

```bash
git add public/
git commit -m "Update frontend files"
git push
```

Vercel sẽ tự động redeploy.

## 🐛 Troubleshooting

### Lỗi: "Firebase credentials not found"

**Nguyên nhân**: Environment variables chưa được set đúng

**Giải pháp**:
1. Kiểm tra lại `FIREBASE_PROJECT_ID` và `FIREBASE_CREDENTIALS` trong Vercel
2. Đảm bảo chọn đúng environments (Production, Preview, Development)
3. Redeploy sau khi sửa

### Lỗi: "Failed to parse FIREBASE_CREDENTIALS"

**Nguyên nhân**: JSON string không đúng format

**Giải pháp**:
1. Dùng `jq -c` để convert JSON thành compact format
2. Hoặc copy toàn bộ JSON và paste trực tiếp (Vercel sẽ tự escape)

### Lỗi: Frontend không load

**Nguyên nhân**: Files trong `public/` chưa được update

**Giải pháp**:
1. Chạy `./copy_frontend_to_public.sh`
2. Commit và push lại

### Lỗi: API trả về 500

**Nguyên nhân**: Backend function crash

**Giải pháp**:
1. Xem Function Logs trong Vercel Dashboard
2. Kiểm tra environment variables
3. Kiểm tra Firebase connection

## 📝 Lưu ý

- ✅ File `public/` là nơi chứa frontend files được deploy
- ✅ File `frontend/` là source code, cần copy sang `public/` trước khi deploy
- ✅ Environment variables phải được set trên Vercel
- ✅ Không commit file `firebase-credentials.json` lên Git
- ✅ Vercel tự động detect Python và install dependencies từ `requirements.txt`

## 🔗 Links hữu ích

- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com)

