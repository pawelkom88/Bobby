'use client';

import Image from 'next/image';
import React from 'react';

interface AnimatedImageWrapperProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export default function AnimatedImageWrapper({
  src,
  alt,
  width,
  height,
  className = '',
}: AnimatedImageWrapperProps) {
  return (
    <div className="animated-image-container">
      {/* Hearts */}
      <div className="heart heart1" aria-hidden="true"></div>
      <div className="heart heart2" aria-hidden="true"></div>

      {/* Stars */}
      <div className="star star1" aria-hidden="true"></div>
      <div className="star star2" aria-hidden="true"></div>
      <div className="star star3" aria-hidden="true"></div>

      {/* Center Image */}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`animated-image ${className}`}
        priority
      />
    </div>
  );
}
