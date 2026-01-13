# 📦 Hướng dẫn cài đặt Vercel CLI

## 🎯 Vercel CLI là gì?
Vercel CLI là công cụ command-line để quản lý và deploy projects lên Vercel từ terminal.

## 📋 Cách cài đặt:

### Cách 1: Cài qua npm (Khuyến nghị)

#### Bước 1: Kiểm tra Node.js đã cài chưa
```bash
node --version
# Phải hiển thị version (ví dụ: v18.x.x hoặc v20.x.x)

npm --version
# Phải hiển thị version (ví dụ: 9.x.x hoặc 10.x.x)
```

#### Bước 2: Nếu chưa có Node.js, cài đặt:
**Option A: Qua Homebrew (Khuyến nghị cho macOS)**
```bash
# Cài Homebrew nếu chưa có
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Cài Node.js
brew install node
```

**Option B: Download từ website**
- Vào https://nodejs.org/
- Download và cài đặt LTS version

#### Bước 3: Cài Vercel CLI
```bash
npm install -g vercel
```

#### Bước 4: Kiểm tra đã cài thành công
```bash
vercel --version
# Phải hiển thị version (ví dụ: 50.1.6)
```

---

### Cách 2: Cài qua Homebrew (macOS)

```bash
# Cài Homebrew nếu chưa có
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Cài Vercel CLI
brew install vercel-cli
```

---

### Cách 3: Cài qua yarn (Nếu dùng yarn)

```bash
yarn global add vercel
```

---

## 🚀 Sau khi cài đặt:

### 1. Login vào Vercel:
```bash
vercel login
```

Sẽ mở browser để login:
- Chọn "Continue with GitHub" hoặc "Continue with Email"
- Authorize Vercel
- Quay lại terminal, sẽ thấy "Success! Logged in as [your-email]"

### 2. Link với project:
```bash
cd /Users/mac/Desktop/green_fc
vercel link
```

Sẽ hỏi:
- **Set up and deploy?** → Chọn `Y` hoặc `N` (thường chọn `N` vì đã deploy rồi)
- **Which scope?** → Chọn account của bạn
- **Link to existing project?** → Chọn `Y`
- **What's the name of your project?** → Chọn `green-fc` hoặc tên project của bạn

### 3. Pull environment variables:
```bash
vercel env pull .env.local
```

Sẽ tạo file `.env.local` với environment variables từ Vercel.

### 4. Chạy migrations:
```bash
# Set DATABASE_URL từ .env.local
export $(cat .env.local | grep DATABASE_URL | xargs)

# Chạy migrations
alembic upgrade head
```

---

## 🔍 Kiểm tra cài đặt:

### Test các commands:
```bash
# Kiểm tra version
vercel --version

# Xem help
vercel --help

# Xem thông tin account
vercel whoami

# List projects
vercel projects list
```

---

## ⚠️ Troubleshooting:

### Lỗi: "command not found: vercel"
**Nguyên nhân**: Vercel CLI chưa được cài hoặc không có trong PATH

**Fix**:
```bash
# Cài lại
npm install -g vercel

# Hoặc thêm vào PATH (nếu cần)
export PATH="$PATH:$(npm config get prefix)/bin"
```

### Lỗi: "Permission denied"
**Nguyên nhân**: Không có quyền cài global packages

**Fix**:
```bash
# Dùng sudo (không khuyến nghị)
sudo npm install -g vercel

# Hoặc fix npm permissions (khuyến nghị)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
npm install -g vercel
```

### Lỗi: "Node.js not found"
**Nguyên nhân**: Node.js chưa được cài

**Fix**: Cài Node.js như hướng dẫn ở trên

---

## 📝 Quick Commands:

```bash
# Login
vercel login

# Link project
vercel link

# Pull env vars
vercel env pull .env.local

# Deploy
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls
```

---

## ✅ Sau khi cài đặt xong:

1. **Login**: `vercel login`
2. **Link project**: `vercel link`
3. **Pull env vars**: `vercel env pull .env.local`
4. **Chạy migrations**: `alembic upgrade head`

---

**Sau khi cài đặt Vercel CLI, bạn có thể quản lý project và chạy migrations!** ✅

