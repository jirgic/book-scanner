# 📚 BookLens - Book Scanner App

A modern web application that uses your device's camera and OCR (Optical Character Recognition) to scan book covers and spines, then searches multiple book databases for information, ratings, and more.

## 🌐 Live Demo

**[Try BookLens →](https://book-scanner.vercel.app)**

![BookLens Screenshot](./docs/screenshot.png)

## ✨ Features

- **📷 Camera Scanning** - Use your device camera to capture book covers or spines
- **🔍 OCR Text Recognition** - Powered by Tesseract.js for accurate text extraction
- **📖 Multi-Source Search** - Combines Google Books, Hardcover, and Open Library for best results
- **⭐ Ratings & Reviews** - See ratings from multiple sources including community ratings from Hardcover
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
│   │   ├── openLibrary.js # Open Library API
│   │   ├── hardcover.js  # Hardcover GraphQL API
│   │   └── bookApi.js    # Unified book search API
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

### Google Books API

- **Search**: `https://www.googleapis.com/books/v1/volumes`
- Primary search source with excellent cover images
- Includes ratings, reviews, and detailed book information
- 1,000 requests/day free tier

[Google Books API Documentation](https://developers.google.com/books)

### Hardcover API

- **GraphQL Endpoint**: `https://api.hardcover.app/v1/graphql`
- Community-driven book database with social features
- High-quality cover images and metadata
- User ratings and reading statistics
- **⚠️ Requires Authentication**: API key required for all requests
- **Optional**: Set `HARDCOVER_API_KEY` environment variable to enable

[Hardcover API Documentation](https://docs.hardcover.app/api/getting-started/)

**To get an API key:**
1. Create a free account at [hardcover.app](https://hardcover.app)
2. Go to Settings → API
3. Generate your API key
4. Add to Vercel: Environment Variables → `HARDCOVER_API_KEY`

**Note**: Without an API key, Hardcover searches will be skipped and only Google Books and Open Library will be used.

### Open Library API

- **Search**: `https://openlibrary.org/search.json`
- **Book Details**: `https://openlibrary.org/works/{id}.json`
- **Covers**: `https://covers.openlibrary.org/b/id/{id}-{size}.jpg`
- **Ratings**: `https://openlibrary.org/works/{id}/ratings.json`
- Fallback search source with extensive edition metadata
- Unlimited requests

[Open Library API Documentation](https://openlibrary.org/developers/api)

### Tesseract.js

Client-side OCR using WebAssembly. Supports 100+ languages.

[Tesseract.js Documentation](https://github.com/naptha/tesseract.js)

## ⚙️ Configuration

### Environment Variables (Optional)

You can configure the following environment variables:

- `HARDCOVER_API_KEY` - Your Hardcover API key (optional)
  - Get your key from [hardcover.app/settings/api](https://hardcover.app)
  - If not set, Hardcover searches will be skipped

**Setting in Vercel:**
1. Go to your project dashboard
2. Settings → Environment Variables
3. Add `HARDCOVER_API_KEY` with your key value
4. Redeploy for changes to take effect

**Setting locally:**
Create a `.env` file in the root:
```env
HARDCOVER_API_KEY=your_api_key_here
```

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
4. Click Deploy

Your site will be available at: `https://your-project.vercel.app`

### API Endpoints

The backend API routes are automatically deployed:

| Endpoint | Description |
|----------|-------------|
| `/api/search?q=query&source=combined` | Search books (Google Books + Hardcover + Open Library) |
| `/api/search?q=query&source=google` | Search books (Google Books only) |
| `/api/search?q=query&source=hardcover` | Search books (Hardcover only) |
| `/api/search?q=query&source=openlibrary` | Search books (Open Library only) |
| `/api/isbn/9780451524935` | Look up book by ISBN (tries all sources) |
| `/api/book/google/abc123` | Get Google Books details |
| `/api/book/works/OL123W` | Get Open Library details |

## 📡 API Features

### Google Books API
- Primary search source
- Excellent cover images
- Ratings and reviews
- 1,000 requests/day free

### Hardcover API
- Community-driven book database
- High-quality images and metadata
- User reading statistics
- Social features integration

### Open Library API
- Extensive book catalog
- Multiple editions and metadata
- Community ratings
- Unlimited requests

## 🙏 Acknowledgments

- [Google Books](https://books.google.com/) for comprehensive book data and API access
- [Hardcover](https://hardcover.app/) for their excellent GraphQL API and community-driven book database
- [Open Library](https://openlibrary.org/) for providing free and open book data
- [Tesseract.js](https://github.com/naptha/tesseract.js) for the amazing OCR library
- [Lucide](https://lucide.dev/) for beautiful icons

## 🐛 Known Issues

- OCR accuracy varies with image quality and lighting
- Vertical text (book spines) may require manual rotation
- Some older books may not have cover images in Open Library

## 📞 Support

If you encounter any issues or have questions, please [open an issue](https://github.com/yourusername/book-scanner/issues).

---

Made with ❤️ using React, Google Books, Hardcover, and Open Library
