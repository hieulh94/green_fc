# Quick Setup Firebase cho Vercel Deployment

## Bước 1: Tạo Firebase Project

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" hoặc chọn project có sẵn
3. Enable **Firestore Database** (chọn mode: Production hoặc Test)

## Bước 2: Tạo Service Account

1. Vào **Project Settings** (⚙️) > **Service Accounts**
2. Click **Generate New Private Key**
3. File JSON sẽ được tải xuống - **LƯU FILE NÀY AN TOÀN, KHÔNG COMMIT VÀO GIT!**

## Bước 3: Setup Local Development

1. Đặt file credentials vào thư mục root: `firebase-credentials.json`
2. Tạo file `.env` với nội dung:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
ENVIRONMENT=development
```

3. Cài đặt dependencies:

```bash
pip install -r requirements.txt
```

## Bước 4: Setup Vercel Environment Variables

1. Vào Vercel Dashboard > Project > Settings > Environment Variables
2. Thêm các biến sau:

### FIREBASE_PROJECT_ID
- Value: Project ID của Firebase (tìm trong Firebase Console)

### FIREBASE_CREDENTIALS
- Value: Nội dung file JSON credentials (dạng string)

**Cách lấy:**

```bash
# Trên local, chạy lệnh này:
cat firebase-credentials.json | jq -c
```

Copy toàn bộ output (một dòng JSON) và paste vào Vercel.

**Hoặc** nếu file có newlines, escape chúng:

```bash
cat firebase-credentials.json | jq -c | sed 's/"/\\"/g'
```

## Bước 5: Test Local

```bash
# Chạy server
uvicorn app.main:app --reload

# Test API
curl http://localhost:8000/api/teams
```

## Bước 6: Deploy lên Vercel

1. Commit và push code:
```bash
git add .
git commit -m "Migrate to Firebase"
git push
```

2. Vercel sẽ tự động deploy
3. Kiểm tra logs nếu có lỗi

## Lưu ý quan trọng

⚠️ **KHÔNG BAO GIỜ commit file `firebase-credentials.json` vào git!**

✅ File đã được thêm vào `.gitignore`

✅ Trên Vercel, dùng Environment Variable `FIREBASE_CREDENTIALS` (không dùng file)

## Troubleshooting

### Lỗi "Firebase Admin not initialized"
- Kiểm tra `FIREBASE_CREDENTIALS` trên Vercel đã đúng format JSON
- Kiểm tra `FIREBASE_PROJECT_ID` đã được set

### Lỗi "Permission denied"
- Vào Firebase Console > Firestore Database
- Đảm bảo database đã được tạo
- Kiểm tra Service Account có quyền Editor hoặc Owner

### Lỗi khi query với where + order_by
- Firestore cần composite index cho compound queries
- Vào Firebase Console > Firestore > Indexes
- Click link trong error message để tạo index tự động

## Security Rules (Quan trọng!)

Sau khi deploy, setup Firestore Security Rules:

1. Vào Firebase Console > Firestore Database > Rules
2. Thêm rules để bảo vệ data (chỉ cho phép admin access qua Service Account)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Deny all reads/writes by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Lưu ý:** Rules này chỉ áp dụng cho client SDK. Admin SDK (server-side) bỏ qua rules.

