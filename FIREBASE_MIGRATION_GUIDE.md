# Hướng dẫn Migration từ PostgreSQL sang Firebase Firestore

## Tổng quan

Hướng dẫn này sẽ giúp bạn chuyển đổi từ PostgreSQL/SQLAlchemy sang Firebase Firestore, vẫn giữ được khả năng deploy lên Vercel.

## Bước 1: Setup Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Vào **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key** để tải file JSON credentials
5. Lưu file này với tên `firebase-credentials.json` (KHÔNG commit file này vào git!)

## Bước 2: Cấu hình Environment Variables trên Vercel

Trên Vercel Dashboard, thêm các biến môi trường sau:

1. **FIREBASE_PROJECT_ID**: Project ID của Firebase project
2. **FIREBASE_CREDENTIALS**: Nội dung file JSON credentials (dạng string, escape newlines)
   - Hoặc sử dụng **FIREBASE_CREDENTIALS_PATH** nếu muốn dùng file

### Cách lấy FIREBASE_CREDENTIALS:

```bash
# Trên local, chạy lệnh này để encode credentials
cat firebase-credentials.json | jq -c
```

Sau đó copy output và paste vào Vercel Environment Variable `FIREBASE_CREDENTIALS`

## Bước 3: Cài đặt Dependencies

Các package mới đã được thêm vào `requirements.txt`:
- `firebase-admin`: Firebase Admin SDK
- `google-cloud-firestore`: Firestore client

## Bước 4: Thay đổi trong Code

### Database Layer
- `app/database.py`: Thay thế SQLAlchemy bằng Firebase Admin SDK
- `app/config.py`: Thêm cấu hình Firebase

### Models
- Tất cả models trong `app/models/` đã được chuyển từ SQLAlchemy sang Pydantic
- Firestore sử dụng document IDs (strings) thay vì integer IDs

### Repositories
- Tất cả repositories đã được cập nhật để sử dụng Firestore
- Methods vẫn giữ nguyên interface để không cần thay đổi services/routers

### Services & Routers
- Không cần thay đổi nhiều, chỉ loại bỏ `Session` dependency

## Bước 5: Migration Data (nếu có)

Nếu bạn có data trong PostgreSQL cần migrate:

1. Export data từ PostgreSQL
2. Tạo script migration để import vào Firestore
3. Chạy script migration

## Bước 6: Deploy lên Vercel

1. Commit tất cả thay đổi
2. Push lên GitHub
3. Vercel sẽ tự động deploy
4. Đảm bảo đã set đúng Environment Variables trên Vercel

## Lưu ý quan trọng

### Firestore vs SQLAlchemy khác biệt:

1. **IDs**: Firestore dùng string IDs, không phải auto-increment integers
2. **Relationships**: Firestore không có foreign keys, dùng references (document paths)
3. **Queries**: Firestore queries khác SQL, cần index cho complex queries
4. **Transactions**: Firestore có transactions nhưng syntax khác

### Vercel Deployment:

- Firebase Admin SDK hoạt động tốt trên Vercel serverless functions
- Không cần connection pooling như PostgreSQL
- Credentials được lưu trong Environment Variables (an toàn hơn)

## Troubleshooting

### Lỗi "Firebase Admin not initialized"
- Kiểm tra FIREBASE_CREDENTIALS đã được set trên Vercel
- Kiểm tra format JSON credentials

### Lỗi "Permission denied"
- Kiểm tra Service Account có đủ quyền trong Firebase Console
- Đảm bảo Firestore Database đã được enable

### Lỗi "Collection not found"
- Firestore tự động tạo collections khi write lần đầu
- Không cần tạo collections trước như SQL tables

## Next Steps

1. Test tất cả API endpoints
2. Verify data được lưu đúng trong Firestore Console
3. Setup Firestore Security Rules (quan trọng!)
4. Setup Firestore Indexes nếu cần cho complex queries

