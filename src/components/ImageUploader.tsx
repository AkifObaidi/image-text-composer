"use client";

import React from "react";

interface ImageUploaderProps {
  onImageUpload: (imgSrc: string, width: number, height: number) => void;
}

export default function ImageUploader({ onImageUpload }: ImageUploaderProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/png") {
      alert("Please upload a PNG image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result as string;
      img.onload = () => {
        onImageUpload(img.src, img.width, img.height);
      };
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center space-y-4 border-2 border-dashed border-gray-400 p-10 rounded-md bg-white max-w-lg w-full">
      <p className="text-gray-600 mb-2 text-center">
        Upload a PNG image to start editing.
      </p>
      <input type="file" accept="image/png" onChange={handleFileChange} />
    </div>
  );
}

