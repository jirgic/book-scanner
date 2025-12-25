# 📚 BookLens - Book Scanner App

A modern web application that uses your device's camera and OCR (Optical Character Recognition) to scan book covers and spines, then searches the Google Books API for book information, ratings, and more. Features a caching backend to minimize API calls and improve performance.

## 🌐 Live Demo

**[Try BookLens →](https://jirgic.github.io/book-scanner/)**

![BookLens Screenshot](./docs/screenshot.png)

## ✨ Features

- **📷 Camera Scanning** - Use your device camera to capture book covers or spines
- **📊 Barcode Scanner** - Scan ISBN barcodes (EAN-13, UPC) for instant book lookup
- **🔍 OCR Text Recognition** - Powered by Tesseract.js for accurate text extraction
- **📖 Google Books Integration** - Search millions of books with ratings and metadata
- **💾 Smart Caching** - Backend database caches all API results for 30 days
- **⚡ Fast Lookups** - Cache-first approach minimizes API calls and improves speed
- **📚 Personal Library** - Save books to your personal collection (persisted locally)
- **⚙️ Customizable Settings** - Multiple OCR languages, camera preferences, scan modes, and more
- **📱 Mobile-First Design** - Responsive UI optimized for mobile devices
- **🌙 Dark Theme** - Beautiful dark mode interface

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/book-scanner.git
cd book-scanner
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend server dependencies:
```bash
npm run server:install
```

4. Start the backend server (in one terminal):
```bash
npm run server:dev
```

5. Start the frontend development server (in another terminal):
```bash
npm run dev
```

6. Open your browser to `http://localhost:5173`

The backend server runs on port 3001 and handles Google Books API calls with caching.

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🏗️ Project Structure

```
book-scanner/
├── public/
│   └── favicon.svg
├── server/               # Backend API server
│   ├── services/
│   │   └── googleBooks.js # Google Books API client
│   ├── routes/
│   │   └── books.js      # API routes
│   ├── database.js       # SQLite database layer
│   ├── index.js          # Server entry point
│   ├── package.json
│   └── README.md         # Server documentation
├── src/
│   ├── components/       # React components
│   │   ├── BookCard.jsx
│   │   ├── BookDetail.jsx
│   │   ├── CameraView.jsx
│   │   ├── BarcodeView.jsx
│   │   ├── Header.jsx
│   │   ├── Icons.jsx
│   │   ├── LibraryView.jsx
│   │   ├── Screens.jsx
│   │   ├── SearchBar.jsx
│   │   ├── SettingsView.jsx
│   │   └── index.js
│   ├── hooks/            # Custom React hooks
│   │   └── index.js
│   ├── services/         # API and service modules
│   │   ├── ocr.js        # Tesseract.js OCR service
│   │   ├── barcode.js    # Barcode scanning service
│   │   ├── googleBooks.js # Google Books API client
│   │   └── openLibrary.js # Open Library API (legacy)
│   ├── styles/
│   │   └── index.css     # Tailwind CSS styles
│   ├── App.jsx           # Main application component
│   ├── main.jsx          # Entry point
│   └── store.js          # Zustand state management
├── .env.example          # Environment variables template
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management
- **TanStack Query** - Data fetching and caching
- **Tesseract.js** - OCR engine (WebAssembly)
- **html5-qrcode** - Barcode and QR code scanner
- **Lucide React** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **better-sqlite3** - Fast SQLite database
- **Google Books API** - Book data source

## 📡 APIs Used

### Google Books API

The backend server integrates with Google Books API with intelligent caching:

- **Search**: Search books by text query
- **ISBN Lookup**: Find books by ISBN-10 or ISBN-13
- **Book Details**: Get comprehensive book information

**Caching Strategy:**
- All API responses are cached in SQLite for 30 days
- Cache-first approach: database is checked before making API calls
- Reduces API usage and improves response times

[Google Books API Documentation](https://developers.google.com/books)

### Backend API Endpoints

Your app communicates with the local backend:

- `GET /api/books/search?q=query` - Search books
- `GET /api/books/isbn/:isbn` - Lookup by ISBN
- `GET /api/books/:id` - Get book details

See `server/README.md` for complete API documentation.

### Tesseract.js

Client-side OCR using WebAssembly. Supports 100+ languages.

[Tesseract.js Documentation](https://github.com/naptha/tesseract.js)

## ⚙️ Configuration

### Scan Mode

Switch between two scanning methods in Settings:

- **OCR Mode** (default) - Scan book covers and spines using text recognition
- **Barcode Mode** - Scan ISBN barcodes for instant book lookup

The barcode scanner supports:
- ISBN-13 (EAN-13) - Standard book barcodes
- ISBN-10
- UPC codes
- QR codes

### OCR Languages

The app supports multiple OCR languages. Change the language in Settings:

- English (default)
- German, French, Spanish, Italian, Portuguese
- Russian, Japanese, Chinese (Simplified/Traditional)
- Korean, Arabic
- And many more...

### Camera Settings

- **Preferred Camera**: Choose between front and back cameras
- **Auto-search**: Automatically search after OCR completes

## 📱 Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 13.1+
- Chrome for Android
- Safari iOS 13.4+

**Note**: Camera access requires HTTPS in production.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🚀 Deploying to GitHub Pages

This project is configured for automatic deployment to GitHub Pages.

### Automatic Deployment (Recommended)

1. Push your code to the `main` branch
2. Go to your repository Settings → Pages
3. Under "Build and deployment", select **GitHub Actions**
4. The workflow will automatically build and deploy on every push

### Manual Deployment

```bash
# Install gh-pages if not already installed
npm install -D gh-pages

# Build and deploy
npm run deploy
```

### Configuration

Before deploying, update these files with your GitHub username:

1. **`vite.config.js`** - Change `base: '/book-scanner/'` if your repo has a different name
2. **`package.json`** - Update the `homepage` field
3. **`README.md`** - Update the demo link

Your site will be available at: `https://YOUR_USERNAME.github.io/book-scanner/`

## 🙏 Acknowledgments

- [Google Books](https://books.google.com/) for providing comprehensive book data
- [Tesseract.js](https://github.com/naptha/tesseract.js) for the amazing OCR library
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) for the barcode scanning library
- [Lucide](https://lucide.dev/) for beautiful icons

## 🐛 Known Issues

- OCR accuracy varies with image quality and lighting
- Vertical text (book spines) may require manual rotation
- Backend server required for book search functionality

## 📞 Support

If you encounter any issues or have questions, please [open an issue](https://github.com/yourusername/book-scanner/issues).

---

Made with ❤️ using React, Node.js, and Google Books API
