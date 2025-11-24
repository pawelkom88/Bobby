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
