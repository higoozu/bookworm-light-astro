import React, { useState, useEffect } from "react";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface LightboxProps {
  images: {
    src: string;
    alt?: string;
  }[];
}

const Lightbox: React.FC<LightboxProps> = ({ images }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleOpen = (e: CustomEvent) => {
      setCurrentIndex(e.detail.index);
      setIsOpen(true);
      setLoading(true);
      document.body.style.overflow = "hidden";
    };

    window.addEventListener("open-lightbox" as any, handleOpen);
    return () => {
      window.removeEventListener("open-lightbox" as any, handleOpen);
    };
  }, []);

  const closeLightbox = () => {
    setIsOpen(false);
    document.body.style.overflow = "auto";
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLoading(true);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLoading(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, images.length]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm p-4"
      onClick={closeLightbox}
    >
      {/* Close Button - Forced White Color */}
      <button
        className="absolute top-4 right-4 text-white hover:text-gray-300 dark:text-dark z-110 text-3xl transition-colors"
        onClick={closeLightbox}
        aria-label="Close lightbox"
      >
        <FaTimes />
      </button>

      {/* Navigation - Left - Forced White Color */}
      <button
        className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 dark:text-dark z-110 text-4xl p-4 transition-colors hidden md:block"
        onClick={prevImage}
        aria-label="Previous image"
      >
        <FaChevronLeft />
      </button>

      {/* Navigation - Right - Forced White Color */}
      <button
        className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 dark:text-dark z-110 text-4xl p-4 transition-colors hidden md:block"
        onClick={nextImage}
        aria-label="Next image"
      >
        <FaChevronRight />
      </button>

      {/* Image Container */}
      <div
        className="relative flex flex-col items-center justify-center max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
         {loading && (
             <div className="absolute inset-0 flex items-center justify-center text-white/50">
                 Loading...
             </div>
         )}
        <img
          src={images[currentIndex].src}
          alt={images[currentIndex].alt}
          className={`max-w-full max-h-[85vh] object-contain shadow-2xl transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setLoading(false)}
        />
        
         {/* Caption - Pill Shape, Fixed at bottom of container or image */}
         {!loading && images[currentIndex].alt && (
            <div className="mt-4 px-6 py-2 rounded-full border border-border text-white/90 dark:text-text-light/90 text-sm md:text-base text-center pointer-events-none z-110 max-w-[90vw] truncate">
              {images[currentIndex].alt}
            </div>
          )}
      </div>
    </div>
  );
};

export default Lightbox;
