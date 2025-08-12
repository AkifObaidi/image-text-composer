"use client";

import React, { useEffect } from "react";

interface TextLayer {
  id: string;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  fill: string;
  opacity: number;
  alignment: "left" | "center" | "right";
  width: number;
  height: number;
}

interface Props {
  layer: TextLayer;
  googleFonts: string[];
  fontsLoading: boolean;
  updateLayer: (id: string, attrs: Partial<TextLayer>) => void;
}

const popularFonts = [
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Oswald",
  "Source Sans Pro",
  "Poppins",
  "Raleway",
  "Merriweather",
  "Arial",
  "Courier New",
  "Georgia",
  "Times New Roman",
  "Verdana",
];

export default function TextLayerControls({
  layer,
  googleFonts,
  fontsLoading,
  updateLayer,
}: Props) {
  // Dynamically load font stylesheet when fontFamily changes
  useEffect(() => {
    if (!layer.fontFamily) return;

    const id = "google-font-" + layer.fontFamily.replace(/\s+/g, "-");
    if (document.getElementById(id)) return; // already loaded

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      layer.fontFamily
    )}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
    document.head.appendChild(link);

    // No cleanup to keep font loaded
  }, [layer.fontFamily]);

  // Use manual font list or googleFonts if available
  const fonts = googleFonts.length > 0 ? googleFonts : popularFonts;

  return (
    <div className="mt-6 space-y-4">
      <label className="block font-semibold text-gray-700">Text</label>
      <textarea
        className="w-full rounded border border-gray-300 p-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
        value={layer.text}
        onChange={(e) => updateLayer(layer.id, { text: e.target.value })}
        style={{
          fontFamily: layer.fontFamily,
          fontSize: layer.fontSize,
          minHeight: 80,
          lineHeight: 1.3,
          color: layer.fill,
        }}
      />

      <div className="grid grid-cols-2 gap-4">
        <label className="block font-semibold text-gray-700">Font Family</label>
        <select
          className="w-full rounded border border-gray-300 p-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={layer.fontFamily}
          disabled={fontsLoading}
          onChange={(e) => updateLayer(layer.id, { fontFamily: e.target.value })}
        >
          {fonts.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>

        <label className="block font-semibold text-gray-700">Font Size (px)</label>
        <input
          type="number"
          min={6}
          max={200}
          className="w-full rounded border border-gray-300 p-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={layer.fontSize}
          onChange={(e) =>
            updateLayer(layer.id, { fontSize: parseInt(e.target.value) || 24 })
          }
        />

        <label className="block font-semibold text-gray-700">Font Weight</label>
        <select
          className="w-full rounded border border-gray-300 p-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={layer.fontWeight}
          onChange={(e) => updateLayer(layer.id, { fontWeight: parseInt(e.target.value) })}
        >
          {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((weight) => (
            <option key={weight} value={weight}>
              {weight}
            </option>
          ))}
        </select>

        <label className="block font-semibold text-gray-700">Color</label>
        <input
          type="color"
          className="w-full h-10 rounded border border-gray-300 p-0 cursor-pointer"
          value={layer.fill}
          onChange={(e) => updateLayer(layer.id, { fill: e.target.value })}
        />

        <label className="block font-semibold text-gray-700">Opacity</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          className="w-full"
          value={layer.opacity}
          onChange={(e) => updateLayer(layer.id, { opacity: parseFloat(e.target.value) })}
        />

        <label className="block font-semibold text-gray-700">Alignment</label>
        <select
          className="w-full rounded border border-gray-300 p-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={layer.alignment}
          onChange={(e) =>
            updateLayer(
              layer.id,
              { alignment: e.target.value as "left" | "center" | "right" }
            )
          }
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
    </div>
  );
}
