import React from "react";

/**
 * Renders an image with a WebP <picture> source when the src is a .png or
 * .jpg file path. Falls back to the original src for data URIs and any format
 * that is already WebP or unsupported by the swap logic.
 */
const WebPImg: React.FC<{
  src: string;
  alt: string;
  loading?: "lazy" | "eager";
  style?: React.CSSProperties;
}> = ({ src, alt, loading = "lazy", style }) => {
  const isFilePath = src && !src.startsWith("data:");
  const webpSrc =
    isFilePath && /\.(png|jpe?g)$/i.test(src)
      ? src.replace(/\.(png|jpe?g)$/i, ".webp")
      : null;
  const img = (
    <img src={src} alt={alt} loading={loading} decoding="async" style={style} />
  );
  if (webpSrc) {
    return (
      <picture>
        <source srcSet={webpSrc} type="image/webp" />
        {img}
      </picture>
    );
  }
  return img;
};

export default WebPImg;
