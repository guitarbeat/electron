import React, { useState } from "react";

export interface ResilientImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  seed?: string;
  fallbackSrc?: string;
  containerClassName?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt = "",
  fallbackSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-family='sans-serif' font-size='16'%3ENo Image%3C/text%3E%3C/svg%3E",
  containerClassName = "",
  className = "",
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);

  return (
    <div className={`resilient-image-container ${containerClassName}`}>
      <img
        src={imgSrc}
        alt={alt}
        className={className}
        onError={() => {
          if (imgSrc !== fallbackSrc) {
            setImgSrc(fallbackSrc);
          }
        }}
        {...props}
      />
    </div>
  );
};

export default ResilientImage;
