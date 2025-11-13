# Dossier - Modern Bookmark Manager

A sleek, modern web application for managing and organizing your favorite web pages.

## 🎨 Features

- **Save Bookmarks**: Easily save web URLs with titles and descriptions
- **Real-time Status**: Track processing status (Queued, In Progress, Complete, Failed)
- **Search & Filter**: Quickly find bookmarks with search and status filters
- **Beautiful UI**: Clean, modern interface with a warm beige color theme
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

## 🚀 Quick Start

### Option 1: Using Python's Built-in Server (Recommended)

1. Make sure your backend is running on `http://localhost:8000`

2. Open Terminal and navigate to the `src` folder:
   ```bash
   cd /Users/krishna.gogineni@cohesity.com/Library/CloudStorage/OneDrive-Cohesity/Desktop/Projects/dossier/src
   ```

3. Start a simple HTTP server:
   ```bash
   python3 -m http.server 3000
   ```

4. Open your browser and visit:
   ```
   http://localhost:3000
   ```

### Option 2: Using Node.js (if you prefer)

1. Install a simple HTTP server globally:
   ```bash
   npm install -g http-server
   ```

2. Navigate to the src folder and run:
   ```bash
   cd src
   http-server -p 3000
   ```

3. Open your browser and visit:
   ```
   http://localhost:3000
   ```

### Option 3: Direct File Open

You can also simply open the `index.html` file directly in your browser, but you may encounter CORS issues when connecting to the backend. The HTTP server options above are recommended.

## 🔧 Configuration

The app is pre-configured to work with your backend at `http://localhost:8000`.

If you need to change the backend URL or user ID, edit the configuration in `app.js`:

```javascript
const API_BASE_URL = 'http://localhost:8000';
const USER_ID = 'user123';
```

## 📱 Using the App

### Adding a Bookmark

1. Enter the URL in the "URL" field (required)
2. Optionally add a title and description
3. Click "Save Bookmark"
4. The bookmark will appear in your collection below

### Managing Bookmarks

- **Open URL**: Click the external link icon to open the bookmark in a new tab
- **Delete**: Click the trash icon to delete a bookmark
- **Search**: Use the search bar to find bookmarks by title, URL, or description
- **Filter**: Click status buttons to filter bookmarks by processing status

### Processing Status

- **Queued**: Bookmark is waiting to be processed
- **In Progress**: Bookmark is currently being processed
- **Complete**: Bookmark has been fully processed
- **Failed**: Processing encountered an error

The app automatically refreshes every 30 seconds to check for status updates.

## 🎨 Design Features

- **Beige Color Theme**: Warm, elegant color palette
- **Modern UI**: Clean, minimalist design with smooth animations
- **Responsive**: Adapts to any screen size
- **Accessibility**: Keyboard navigation and screen reader friendly
- **Toast Notifications**: Success and error messages
- **Loading States**: Clear feedback during operations

## 🛠️ Technical Stack

- **Pure JavaScript**: No frameworks, just vanilla JS
- **Modern CSS**: CSS Grid, Flexbox, CSS Variables
- **RESTful API**: Integrates with FastAPI backend
- **Responsive Design**: Mobile-first approach

## 📝 File Structure

```
src/
├── index.html    # Main HTML structure
├── styles.css    # All styling and animations
├── app.js        # Application logic and API calls
└── README.md     # This file
```

## 🔍 Troubleshooting

### Backend Connection Issues

If you see "Failed to load bookmarks" error:
1. Verify your backend is running at `http://localhost:8000`
2. Test the backend by visiting `http://localhost:8000/` in your browser
3. Check browser console (F12) for detailed error messages

### CORS Errors

If you see CORS errors in the console:
1. Make sure you're using one of the HTTP server options (not opening the file directly)
2. Verify your backend has CORS enabled for `http://localhost:3000`

### Bookmarks Not Appearing

1. Check that the `user_id` in `app.js` matches your backend data
2. Verify the backend API is returning data correctly
3. Check the browser console for error messages

## 🚀 Future Enhancements

- Automatic categorization of bookmarks
- Category tiles for better organization
- Content recommendations based on interests
- Tags and labels
- Export/Import functionality
- Dark mode toggle

## 📞 Support

For issues or questions, check the browser console (F12) for error messages and verify your backend is running correctly.

Enjoy organizing your bookmarks! 📚✨

