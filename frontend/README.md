# Frontend - Football Team Management
# Update
Simple, modern frontend for the Football Team Management API.

## Features

- ✅ View all teams and players
- ✅ Create, edit, and delete teams
- ✅ Create, edit, and delete players
- ✅ Filter players by team
- ✅ Modern, responsive UI
- ✅ Real-time updates

## Setup

### Option 1: Simple HTTP Server (Recommended for quick testing)

Since this is a static HTML/CSS/JS application, you can use any simple HTTP server:

```bash
# Using Python 3
cd frontend
python3 -m http.server 3000

# Or using Python 2
python -m SimpleHTTPServer 3000

# Or using Node.js (if you have http-server installed)
npx http-server -p 3000
```

Then open: http://localhost:3000

### Option 2: VS Code Live Server

If you're using VS Code, install the "Live Server" extension and click "Go Live".

## Configuration

The API URL is configured in `api.js`. By default, it points to:
```javascript
const API_BASE_URL = 'http://localhost:8000';
```

If your backend runs on a different port, update this value.

## Usage

1. Make sure the backend is running on http://localhost:8000
2. Start a simple HTTP server in the `frontend` directory
3. Open the frontend in your browser
4. Use the tabs to switch between Teams and Players
5. Click "Add" buttons to create new items
6. Click "Edit" or "Delete" to manage existing items

## File Structure

```
frontend/
├── index.html      # Main HTML file
├── styles.css      # Styling
├── api.js          # API communication layer
└── app.js          # Application logic
```

