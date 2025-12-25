import {
  Camera,
  Upload,
  Search,
  X,
  ArrowLeft,
  Star,
  BookOpen,
  Library,
  Settings,
  RefreshCw,
  ExternalLink,
  Plus,
  Check,
  Trash2,
  ChevronRight,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  SwitchCamera,
  Scan,
  BookMarked,
  Calendar,
  Building,
  Hash,
  Globe,
  Heart,
  Share2,
} from 'lucide-react';

export {
  Camera,
  Upload,
  Search,
  X,
  ArrowLeft,
  Star,
  BookOpen,
  Library,
  Settings,
  RefreshCw,
  ExternalLink,
  Plus,
  Check,
  Trash2,
  ChevronRight,
  Loader2,
  AlertCircle,
  ImageIcon,
  SwitchCamera,
  Scan,
  BookMarked,
  Calendar,
  Building,
  Hash,
  Globe,
  Heart,
  Share2,
};

// Custom spinner component
export function Spinner({ className = '', size = 24 }) {
  return (
    <Loader2
      className={`animate-spin ${className}`}
      size={size}
    />
  );
}

// Star rating component
export function StarRating({ rating, maxStars = 5, size = 16, className = '' }) {
  if (!rating && rating !== 0) return null;

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[...Array(maxStars)].map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < fullStars || (i === fullStars && hasHalfStar)
              ? 'fill-amber-400 text-amber-400'
              : 'text-dark-600'
          }
        />
      ))}
    </div>
  );
}
