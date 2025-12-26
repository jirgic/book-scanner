# 📚 BookLens - Book Scanner App

A modern web application that uses your device's camera and OCR (Optical Character Recognition) to scan book covers and spines, then searches multiple book databases for information, ratings, and more.

## 🌐 Live Demo

**[Try BookLens →](https://book-scanner.vercel.app)**

![BookLens Screenshot](./docs/screenshot.png)

## ✨ Features

- **📷 Camera Scanning** - Use your device camera to capture book covers or spines
- **🔍 OCR Text Recognition** - Powered by Tesseract.js for accurate text extraction
- **📖 Multi-Source Search** - Combines Google Books, Open Library, and optional Goodreads API
- **⭐ Ratings & Reviews** - See ratings from multiple sources
- **📚 Personal Library** - Save books to your personal collection (persisted locally)
- **⚙️ Customizable Settings** - Multiple OCR languages, camera preferences, and more
- **📱 Mobile-First Design** - Responsive UI optimized for mobile devices
- **🌙 Dark Theme** - Beautiful dark mode interface
- **⚡ Serverless Backend** - API routes on Vercel Edge Functions

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ 
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

3. (Optional) Configure Goodreads API:

If you want to use the Goodreads API as a search source, you'll need to get an API key from RapidAPI:

- Sign up at [RapidAPI](https://rapidapi.com)
- Subscribe to the [Goodreads API (Latest & Updated)](https://rapidapi.com/puresoft-labs-ou-puresoft-labs-ou-default/api/goodreads-api-latest-updated)
- Copy your RapidAPI key
- Create a `.env` file in the project root:

```bash
RAPIDAPI_KEY=your_rapidapi_key_here
```

**Note**: The Goodreads API is optional. The app works without it using Google Books and Open Library.

4. Start the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:3000`

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

## 📡 Book Data Sources

### Google Books API
- Primary search source for most queries
- Rich metadata and cover images
- No API key required

### Open Library API
- Fallback and supplementary search source
- Community-driven book database
- No API key required

[Open Library API Documentation](https://openlibrary.org/developers/api)

### Goodreads API (Optional)
- Premium book data via RapidAPI
- Comprehensive ratings and reviews
- Requires RapidAPI subscription

[Goodreads API on RapidAPI](https://rapidapi.com/puresoft-labs-ou-puresoft-labs-ou-default/api/goodreads-api-latest-updated)

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

## 🚀 Deploying to Vercel

This project is configured for one-click deployment to Vercel.

### Option 1: Deploy Button (Easiest)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/book-scanner)

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 3: GitHub Integration

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. (Optional) Add environment variables:
   - If using Goodreads API, add `RAPIDAPI_KEY` in Vercel dashboard under Settings → Environment Variables
5. Click Deploy

Your site will be available at: `https://your-project.vercel.app`

**Environment Variables for Vercel**:
- `RAPIDAPI_KEY` - Your RapidAPI key for Goodreads API (optional)

### API Endpoints

The backend API routes are automatically deployed:

| Endpoint | Description |
|----------|-------------|
| `/api/search?q=query&source=combined` | Search books (Google Books + Open Library) |
| `/api/search?q=query&source=goodreads` | Search books using Goodreads API |
| `/api/isbn/9780451524935` | Look up book by ISBN |
| `/api/book/google/abc123` | Get Google Books details |
| `/api/book/works/OL123W` | Get Open Library details |

**Search Source Options**:
- `google` - Google Books only
- `openlibrary` - Open Library only
- `goodreads` - Goodreads API (requires RapidAPI key)
- `combined` (default) - Google Books + Open Library

## 📡 APIs Used

### Google Books API
- Primary search source
- Better cover images
- Ratings and reviews
- 1,000 requests/day free
- No API key required

### Open Library API
- Fallback search source
- More editions and metadata
- Community ratings
- Unlimited requests
- No API key required

### Goodreads API (Optional)
- Access to Goodreads extensive book database
- High-quality ratings and reviews
- Detailed book information
- Requires RapidAPI subscription
- [API Documentation](https://rapidapi.com/puresoft-labs-ou-puresoft-labs-ou-default/api/goodreads-api-latest-updated)

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
