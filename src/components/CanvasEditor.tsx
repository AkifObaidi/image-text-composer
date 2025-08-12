"use client";

import React, { useRef, useEffect, useState } from "react";

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
  width: number;
  height: number;
  alignment: "left" | "center" | "right";
  locked?: boolean;
  backgroundColor?: string;
}

interface CanvasEditorProps {
  imageObj: HTMLImageElement;
  dimensions: { width: number; height: number };
  textLayers: TextLayer[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  updateTextLayer: (id: string, attrs: Partial<TextLayer>) => void;
}

type ResizeCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export default function CanvasEditor({
  imageObj,
  dimensions,
  textLayers,
  selectedId,
  setSelectedId,
  updateTextLayer,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State for drag and resize
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resizeCorner, setResizeCorner] = useState<ResizeCorner | null>(null);
  const [initialRect, setInitialRect] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const [cursor, setCursor] = useState<string>("default");

  // Draw canvas contents
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw background image
    ctx.drawImage(imageObj, 0, 0, dimensions.width, dimensions.height);

    // Draw text layers
    textLayers.forEach((layer) => {
      ctx.save();

      // Background behind text for readability
      if (layer.backgroundColor) {
        ctx.fillStyle = layer.backgroundColor;
        ctx.globalAlpha = layer.opacity * 0.6;
        ctx.fillRect(layer.x, layer.y - layer.fontSize * 0.8, layer.width, layer.height);
      }

      ctx.globalAlpha = layer.opacity;
      ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
      ctx.fillStyle = layer.fill;
      ctx.textAlign = layer.alignment;
      ctx.textBaseline = "top";

      // Multi-line text
      const lines = layer.text.split("\n");
      const lineHeight = layer.fontSize * 1.2;

      // Calculate startX based on alignment
      let startX = layer.x;
      if (layer.alignment === "center") startX += layer.width / 2;
      else if (layer.alignment === "right") startX += layer.width;

      lines.forEach((line, i) => {
        ctx.fillText(line, startX, layer.y + i * lineHeight);
      });

      // Draw selection border and handles if selected
      if (layer.id === selectedId) {
        ctx.strokeStyle = "rgba(59, 130, 246, 0.9)";
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);

        // Draw 4 resize handles (small squares on corners)
        const handleSize = 12;
        const corners: { x: number; y: number }[] = [
          { x: layer.x, y: layer.y }, // top-left
          { x: layer.x + layer.width - handleSize, y: layer.y }, // top-right
          { x: layer.x, y: layer.y + layer.height - handleSize }, // bottom-left
          { x: layer.x + layer.width - handleSize, y: layer.y + layer.height - handleSize }, // bottom-right
        ];

        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(59, 130, 246, 0.9)";
        corners.forEach(({ x, y }) => {
          ctx.fillRect(x, y, handleSize, handleSize);
        });
      }

      ctx.restore();
    });
  }, [imageObj, dimensions, textLayers, selectedId]);

  // Get mouse position relative to canvas
  const getMousePos = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Check if point is inside rect with optional padding
  const isPointInRect = (
    x: number,
    y: number,
    rectX: number,
    rectY: number,
    width: number,
    height: number,
    padding = 0
  ) => {
    return (
      x >= rectX - padding &&
      x <= rectX + width + padding &&
      y >= rectY - padding &&
      y <= rectY + height + padding
    );
  };

  // Check which resize handle corner is hovered, if any
  const getHoveredResizeCorner = (
    x: number,
    y: number,
    layer: TextLayer,
    handleSize = 12
  ): ResizeCorner | null => {
    const corners = {
      "top-left": { x: layer.x, y: layer.y },
      "top-right": { x: layer.x + layer.width - handleSize, y: layer.y },
      "bottom-left": { x: layer.x, y: layer.y + layer.height - handleSize },
      "bottom-right": { x: layer.x + layer.width - handleSize, y: layer.y + layer.height - handleSize },
    };

    for (const corner in corners) {
      const cx = corners[corner as ResizeCorner].x;
      const cy = corners[corner as ResizeCorner].y;
      if (x >= cx && x <= cx + handleSize && y >= cy && y <= cy + handleSize) {
        return corner as ResizeCorner;
      }
    }
    return null;
  };

  // Update cursor style on hover
  const onMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getMousePos(e);

    if (draggingId || resizingId) {
      // during drag/resize cursor stays default to prevent flicker
      return;
    }

    // Hover on resize handle?
    if (selectedId) {
      const selectedLayer = textLayers.find((l) => l.id === selectedId);
      if (selectedLayer) {
        const corner = getHoveredResizeCorner(x, y, selectedLayer);
        if (corner) {
          switch (corner) {
            case "top-left":
            case "bottom-right":
              setCursor("nwse-resize");
              return;
            case "top-right":
            case "bottom-left":
              setCursor("nesw-resize");
              return;
          }
        }
      }
    }

    // Hover on text layer area (with 50px padding)
    let hoverMove = false;
    for (const layer of textLayers) {
      if (
        isPointInRect(x, y, layer.x, layer.y, layer.width, layer.height, 50) &&
        !layer.locked
      ) {
        hoverMove = true;
        break;
      }
    }

    setCursor(hoverMove ? "move" : "default");
  };

  // Handle mouse down for drag or resize start
  const onMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getMousePos(e);

    // If resize handle hovered, start resize
    if (selectedId) {
      const selectedLayer = textLayers.find((l) => l.id === selectedId);
      if (selectedLayer) {
        const corner = getHoveredResizeCorner(x, y, selectedLayer);
        if (corner) {
          setResizingId(selectedId);
          setResizeCorner(corner);
          setResizeStart({ x, y });
          setInitialRect({
            x: selectedLayer.x,
            y: selectedLayer.y,
            width: selectedLayer.width,
            height: selectedLayer.height,
          });
          return;
        }
      }
    }

    // Otherwise check if clicked inside any text layer with 50px padding (from top to bottom)
    for (let i = textLayers.length - 1; i >= 0; i--) {
      const layer = textLayers[i];
      if (isPointInRect(x, y, layer.x, layer.y, layer.width, layer.height, 50)) {
        if (!layer.locked) {
          setSelectedId(layer.id);
          setDraggingId(layer.id);
          setDragOffset({ x: x - layer.x, y: y - layer.y });
        }
        return;
      }
    }

    // Clicked outside any layer
    setSelectedId(null);
  };

  // Mouse up ends drag or resize
  const onMouseUp = () => {
    setDraggingId(null);
    setResizingId(null);
    setResizeCorner(null);
  };

  // Handle dragging and resizing on mouse move with left mouse down
  useEffect(() => {
    if (!canvasRef.current) return;

    const onMouseMoveDocument = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (draggingId) {
        // Dragging layer
        const newX = x - dragOffset.x;
        const newY = y - dragOffset.y;

        // Snap to center with threshold
        const snapMargin = 8;
        const dims = { width: dimensions.width, height: dimensions.height };
        let snappedX = newX;
        let snappedY = newY;

        const layer = textLayers.find((l) => l.id === draggingId);
        if (layer) {
          if (Math.abs(newX + layer.width / 2 - dims.width / 2) < snapMargin) {
            snappedX = dims.width / 2 - layer.width / 2;
          }
          if (Math.abs(newY + layer.height / 2 - dims.height / 2) < snapMargin) {
            snappedY = dims.height / 2 - layer.height / 2;
          }
        }

        updateTextLayer(draggingId, { x: snappedX, y: snappedY });
      } else if (resizingId && resizeCorner) {
        // Resizing based on corner

        const { x: startX, y: startY, width: startW, height: startH } = initialRect;
        let newX = startX;
        let newY = startY;
        let newWidth = startW;
        let newHeight = startH;

        const minWidth = 30;
        const minHeight = 20;

        const dx = x - resizeStart.x;
        const dy = y - resizeStart.y;

        switch (resizeCorner) {
          case "top-left":
            newX = startX + dx;
            newY = startY + dy;
            newWidth = startW - dx;
            newHeight = startH - dy;
            break;
          case "top-right":
            newY = startY + dy;
            newWidth = startW + dx;
            newHeight = startH - dy;
            break;
          case "bottom-left":
            newX = startX + dx;
            newWidth = startW - dx;
            newHeight = startH + dy;
            break;
          case "bottom-right":
            newWidth = startW + dx;
            newHeight = startH + dy;
            break;
        }

        // Clamp sizes and positions
        if (newWidth < minWidth) {
          newWidth = minWidth;
          if (resizeCorner === "top-left" || resizeCorner === "bottom-left") {
            newX = startX + (startW - minWidth);
          }
        }
        if (newHeight < minHeight) {
          newHeight = minHeight;
          if (resizeCorner === "top-left" || resizeCorner === "top-right") {
            newY = startY + (startH - minHeight);
          }
        }

        // Keep inside canvas bounds
        if (newX < 0) {
          if (resizeCorner === "top-left" || resizeCorner === "bottom-left") {
            newWidth += newX;
            newX = 0;
          }
        }
        if (newY < 0) {
          if (resizeCorner === "top-left" || resizeCorner === "top-right") {
            newHeight += newY;
            newY = 0;
          }
        }
        if (newX + newWidth > dimensions.width) {
          if (resizeCorner === "top-right" || resizeCorner === "bottom-right") {
            newWidth = dimensions.width - newX;
          }
        }
        if (newY + newHeight > dimensions.height) {
          if (resizeCorner === "bottom-left" || resizeCorner === "bottom-right") {
            newHeight = dimensions.height - newY;
          }
        }

        updateTextLayer(resizingId, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      }
    };

    const onMouseUpDocument = () => {
      setDraggingId(null);
      setResizingId(null);
      setResizeCorner(null);
    };

    document.addEventListener("mousemove", onMouseMoveDocument);
    document.addEventListener("mouseup", onMouseUpDocument);

    return () => {
      document.removeEventListener("mousemove", onMouseMoveDocument);
      document.removeEventListener("mouseup", onMouseUpDocument);
    };
  }, [
    draggingId,
    dragOffset,
    resizingId,
    resizeCorner,
    resizeStart,
    initialRect,
    updateTextLayer,
    textLayers,
    dimensions.width,
    dimensions.height,
  ]);

  return (
    <div
      style={{ cursor }}
      className="border border-gray-300 rounded-lg bg-white select-none touch-none"
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        tabIndex={0}
      />
    </div>
  );
}
