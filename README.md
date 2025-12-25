# 📚 BookLens - Book Scanner App

A modern web application that uses your device's camera and OCR (Optical Character Recognition) to scan book covers and spines, then searches the Open Library database for book information, ratings, and more.

## 🌐 Live Demo

**[Try BookLens →](https://YOUR_USERNAME.github.io/book-scanner/)**

![BookLens Screenshot](./docs/screenshot.png)

## ✨ Features

- **📷 Camera Scanning** - Use your device camera to capture book covers or spines
- **🔍 OCR Text Recognition** - Powered by Tesseract.js for accurate text extraction
- **📖 Open Library Integration** - Search millions of books with ratings and metadata
- **📚 Personal Library** - Save books to your personal collection (persisted locally)
- **⚙️ Customizable Settings** - Multiple OCR languages, camera preferences, and more
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

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

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
├── src/
│   ├── components/       # React components
│   │   ├── BookCard.jsx
│   │   ├── BookDetail.jsx
│   │   ├── CameraView.jsx
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
│   │   └── openLibrary.js # Open Library API
│   ├── styles/
│   │   └── index.css     # Tailwind CSS styles
│   ├── App.jsx           # Main application component
│   ├── main.jsx          # Entry point
│   └── store.js          # Zustand state management
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management
- **TanStack Query** - Data fetching and caching
- **Tesseract.js** - OCR engine (WebAssembly)
- **Lucide React** - Icon library

## 📡 APIs Used

### Open Library API

- **Search**: `https://openlibrary.org/search.json`
- **Book Details**: `https://openlibrary.org/works/{id}.json`
- **Covers**: `https://covers.openlibrary.org/b/id/{id}-{size}.jpg`
- **Ratings**: `https://openlibrary.org/works/{id}/ratings.json`

[Open Library API Documentation](https://openlibrary.org/developers/api)

### Tesseract.js

Client-side OCR using WebAssembly. Supports 100+ languages.

[Tesseract.js Documentation](https://github.com/naptha/tesseract.js)

## ⚙️ Configuration

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

- [Open Library](https://openlibrary.org/) for providing free book data
- [Tesseract.js](https://github.com/naptha/tesseract.js) for the amazing OCR library
- [Lucide](https://lucide.dev/) for beautiful icons

## 🐛 Known Issues

- OCR accuracy varies with image quality and lighting
- Vertical text (book spines) may require manual rotation
- Some older books may not have cover images in Open Library

## 📞 Support

If you encounter any issues or have questions, please [open an issue](https://github.com/yourusername/book-scanner/issues).

---

Made with ❤️ using React and Open Library
