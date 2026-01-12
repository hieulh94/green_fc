# 🚀 Project Status

## ✅ Servers Running

### Backend
- **Status**: Running
- **URL**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Frontend
- **Status**: Running
- **URL**: http://localhost:3000

## 📋 Recent Updates

### ✅ Completed Features:
1. ✅ Profile image for players (URL input + File upload)
2. ✅ Multiple positions for players (7-a-side football positions)
3. ✅ Team profile sidebar for editing
4. ✅ Image upload functionality
5. ✅ File upload endpoint (`/uploads/player-image`)

### 📦 Dependencies:
- ✅ All dependencies installed
- ✅ `python-multipart` added for file uploads

## 🎯 Features

### Teams:
- View team information
- Edit team profile (sidebar)

### Players:
- Create/Edit/Delete players
- Upload profile image from computer
- Enter profile image URL
- Select multiple positions (7-a-side positions)
- Filter players by team
- View player cards with images

## 🔧 API Endpoints

### Teams:
- `GET /teams/` - List all teams
- `GET /teams/{id}` - Get team by ID
- `PUT /teams/{id}` - Update team
- `DELETE /teams/{id}` - Delete team

### Players:
- `GET /players/` - List all players (optional `team_id` filter)
- `GET /players/{id}` - Get player by ID
- `POST /players/` - Create player
- `PUT /players/{id}` - Update player
- `DELETE /players/{id}` - Delete player

### Uploads:
- `POST /uploads/player-image` - Upload player profile image
- `GET /uploads/player-image/{filename}` - Get uploaded image

## 🛠️ To Restart Servers:

### Backend:
```bash
cd /Users/mac/Desktop/green_fc
pkill -f "uvicorn app.main:app"
python3 -m uvicorn app.main:app --reload
```

### Frontend:
```bash
cd /Users/mac/Desktop/green_fc/frontend
pkill -f "http.server.*3000"
python3 -m http.server 3000
```

## 📝 Notes

- Backend runs on port 8000
- Frontend runs on port 3000
- Uploaded images are stored in `static/uploads/`
- Maximum file size: 5MB
- Allowed image types: .jpg, .jpeg, .png, .gif, .webp

