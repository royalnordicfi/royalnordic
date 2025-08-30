import React, { useState, useEffect } from 'react';

interface ImageSlideshowProps {
  images: string[];
  alt: string;
  className?: string;
  interval?: number;
  showCounter?: boolean;
}

const ImageSlideshow: React.FC<ImageSlideshowProps> = ({ 
  images, 
  alt, 
  className = "", 
  interval = 3000,
  showCounter = true
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  if (images.length === 0) return null;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {images.map((image, index) => (
        <img
          key={image}
          src={image}
          alt={`${alt} ${index + 1}`}
          loading={index === 0 ? "eager" : "lazy"}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
    </div>
  );
};

export default ImageSlideshow;
