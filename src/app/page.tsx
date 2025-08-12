"use client";

import React, { useState, useEffect, useCallback } from "react";
import Loader from "../components/Loader";
import LayerList from "../components/LayerList";
import TextLayerControls from "../components/TextLayerControls";
import CanvasEditor from "../components/CanvasEditor";
import UndoRedoControls from "../components/UndoRedoControls";

interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  fill: string;
  opacity: number;
  alignment: "left" | "center" | "right";
  locked?: boolean;
  backgroundColor?: string;
  width: number;
  height: number;
}

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [undoStack, setUndoStack] = useState<TextLayer[][]>([]);
  const [redoStack, setRedoStack] = useState<TextLayer[][]>([]);
  const [googleFonts, setGoogleFonts] = useState<string[]>([
    "Arial",
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Oswald",
    "Raleway",
  ]); // Hardcoded fonts as per previous discussion
  const [fontsLoading, setFontsLoading] = useState(false);

  useEffect(() => {
    document.title = "Image Text Composer - Custom Text on PNG";
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setImageObj(null);
      setDimensions({ width: 0, height: 0 });
      setTextLayers([]);
      setSelectedId(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const maxContainerWidth = 800;
      const maxContainerHeight = 700;
      const minContainerWidth = 400;
      const minContainerHeight = 300;

      let w = img.width;
      let h = img.height;

      const widthScaleDown = maxContainerWidth / w;
      const heightScaleDown = maxContainerHeight / h;
      const scaleDown = Math.min(widthScaleDown, heightScaleDown, 1);

      w = w * scaleDown;
      h = h * scaleDown;

      const widthScaleUp = minContainerWidth / w;
      const heightScaleUp = minContainerHeight / h;
      const scaleUp = Math.max(widthScaleUp, heightScaleUp, 1);

      w = w * scaleUp;
      h = h * scaleUp;

      setDimensions({ width: w, height: h });
      setImageObj(img);
      setTextLayers([]);
      setSelectedId(null);
    };
    img.src = URL.createObjectURL(imageFile);
  }, [imageFile]);

  // Undo/Redo helpers
  const pushToUndo = useCallback(() => {
    setUndoStack((stack) => {
      const newStack = [...stack];
      newStack.push(textLayers.map((l) => ({ ...l })));
      if (newStack.length > 20) newStack.shift();
      return newStack;
    });
    setRedoStack([]);
  }, [textLayers]);

  const undo = () => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack;
      const last = stack[stack.length - 1];
      setRedoStack((redo) => [textLayers.map((l) => ({ ...l })), ...redo]);
      setTextLayers(last);
      setSelectedId(null);
      return stack.slice(0, -1);
    });
  };

  const redo = () => {
    setRedoStack((stack) => {
      if (stack.length === 0) return stack;
      const next = stack[0];
      setUndoStack((undo) => [...undo, textLayers.map((l) => ({ ...l }))]);
      setTextLayers(next);
      setSelectedId(null);
      return stack.slice(1);
    });
  };

  const updateTextLayer = (id: string, attrs: Partial<TextLayer>) => {
    pushToUndo();
    setTextLayers((layers) =>
      layers.map((l) => (l.id === id ? { ...l, ...attrs } : l))
    );
  };

  const addTextLayer = () => {
    pushToUndo();
    const newLayer: TextLayer = {
      id: crypto.randomUUID(),
      text: "New Text",
      x: dimensions.width / 4,
      y: dimensions.height / 4,
      fontSize: 24,
      fontFamily: googleFonts.length > 0 ? googleFonts[0] : "Arial",
      fontWeight: 400,
      fill: "#000000",
      opacity: 1,
      alignment: "left",
      width: 200,
      height: 50,
    };
    setTextLayers((layers) => [...layers, newLayer]);
    setSelectedId(newLayer.id);
  };

  const deleteLayer = (id: string) => {
    pushToUndo();
    setTextLayers((layers) => layers.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const toggleLockLayer = (id: string) => {
    pushToUndo();
    setTextLayers((layers) =>
      layers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l))
    );
  };

  const duplicateLayer = (id: string) => {
    const layer = textLayers.find((l) => l.id === id);
    if (!layer) return;
    pushToUndo();
    const newLayer = {
      ...layer,
      id: crypto.randomUUID(),
      x: layer.x + 20,
      y: layer.y + 20,
    };
    setTextLayers((layers) => [...layers, newLayer]);
    setSelectedId(newLayer.id);
  };

  // New reorder function
  const reorderLayer = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= textLayers.length) return;
    pushToUndo();
    setTextLayers((layers) => {
      const newLayers = [...layers];
      const [moved] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, moved);
      return newLayers;
    });
  };

  const exportImage = () => {
    if (!imageObj) return;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = imageObj.naturalWidth;
    exportCanvas.height = imageObj.naturalHeight;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(imageObj, 0, 0, exportCanvas.width, exportCanvas.height);

    textLayers.forEach((layer) => {
      ctx.save();

      if (layer.backgroundColor) {
        ctx.fillStyle = layer.backgroundColor;
        ctx.globalAlpha = layer.opacity * 0.6;
        ctx.fillRect(
          (layer.x / dimensions.width) * exportCanvas.width,
          ((layer.y - layer.fontSize * 0.8) / dimensions.height) * exportCanvas.height,
          (layer.width / dimensions.width) * exportCanvas.width,
          (layer.height / dimensions.height) * exportCanvas.height
        );
      }

      ctx.globalAlpha = layer.opacity;
      ctx.font = `${layer.fontWeight} ${(layer.fontSize * exportCanvas.width) / dimensions.width
        }px ${layer.fontFamily}`;
      ctx.fillStyle = layer.fill;
      ctx.textAlign = layer.alignment;
      ctx.textBaseline = "top";

      const lines = layer.text.split("\n");
      const lineHeight = (layer.fontSize * 1.2 * exportCanvas.height) / dimensions.height;
      let startX = (layer.x / dimensions.width) * exportCanvas.width;

      if (layer.alignment === "center") startX += (layer.width / 2 / dimensions.width) * exportCanvas.width;
      else if (layer.alignment === "right") startX += (layer.width / dimensions.width) * exportCanvas.width;

      lines.forEach((line, i) => {
        ctx.fillText(line, startX, ((layer.y / dimensions.height) * exportCanvas.height) + i * lineHeight);
      });

      ctx.restore();
    });

    exportCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "image-text-composer.png";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const resetEditor = () => {
    setImageFile(null);
    setImageObj(null);
    setDimensions({ width: 0, height: 0 });
    setTextLayers([]);
    setSelectedId(null);
    setUndoStack([]);
    setRedoStack([]);
    localStorage.removeItem("imageTextComposerState"); // Clear saved state too (autosave step)
  };

  // Autosave implementation (to be done in next step)

  return (
    <main className="min-h-screen bg-gradient-to-tr from-indigo-50 to-white flex flex-col items-center p-6 font-sans text-gray-900">
      <h1 className="text-4xl font-extrabold mb-6 text-indigo-700 select-none">
        Image Text Composer
      </h1>

      {!imageObj && (
        <>
          <label
            htmlFor="upload-image"
            className="cursor-pointer rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 shadow-lg transition duration-300 select-none"
          >
            Upload PNG Image
            <input
              id="upload-image"
              type="file"
              accept="image/png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setImageFile(file);
              }}
            />
          </label>
          <p className="mt-3 text-gray-600 text-sm max-w-md text-center">
            Upload a PNG image to start composing your custom text overlays.
          </p>
        </>
      )}

      {loading && <Loader />}

      {imageObj && (
        <div
          className="w-full max-w-7xl flex flex-col md:flex-row gap-8 mt-6"
          style={{ maxWidth: 1200 }}
        >
          <div
            className="flex flex-col"
            style={{
              position: "relative",
              width: dimensions.width,
              height: dimensions.height,
              margin: "0 auto",
            }}
          >
            <CanvasEditor
              imageObj={imageObj}
              dimensions={dimensions}
              textLayers={textLayers}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              updateTextLayer={updateTextLayer}
            />

            <div className="flex justify-between mt-4 gap-3 flex-wrap">
              <button
                onClick={addTextLayer}
                className="rounded-md bg-green-600 hover:bg-green-700 text-white px-5 py-2 font-semibold shadow transition duration-300"
              >
                Add Text Layer
              </button>
              <div>
                <button
                  onClick={exportImage}
                  disabled={textLayers.length === 0}
                  className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 mx-2 font-semibold shadow transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export PNG
                </button>
                <button
                  onClick={resetEditor}
                  className="rounded-md bg-red-600 hover:bg-red-700 text-white px-5 py-2 font-semibold shadow transition duration-300"
                >
                  Reset
                </button>
              </div>
            </div>

            <UndoRedoControls
              canUndo={undoStack.length > 0}
              canRedo={redoStack.length > 0}
              onUndo={undo}
              onRedo={redo}
            />
          </div>

          <aside className="md:w-96 bg-white p-5 rounded-lg shadow-lg overflow-auto max-h-[700px]">
            <LayerList
              textLayers={textLayers}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDelete={deleteLayer}
              onLockToggle={toggleLockLayer}
              onDuplicate={duplicateLayer}
              onReorder={reorderLayer}
            />

            {selectedId && (
              <TextLayerControls
                layer={textLayers.find((l) => l.id === selectedId)!}
                googleFonts={googleFonts}
                fontsLoading={fontsLoading}
                updateLayer={updateTextLayer}
              />
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
