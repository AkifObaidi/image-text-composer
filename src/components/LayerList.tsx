import React from "react";

interface TextLayer {
  id: string;
  text: string;
  locked?: boolean;
}

interface LayerListProps {
  textLayers: TextLayer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onLockToggle: (id: string) => void;
  onDuplicate: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export default function LayerList({
  textLayers,
  selectedId,
  onSelect,
  onDelete,
  onLockToggle,
  onDuplicate,
  onReorder,
}: LayerListProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Layers</h2>
      {textLayers.length === 0 && <p>No text layers added yet.</p>}
      <ul className="space-y-2 max-h-[300px] overflow-auto">
        {textLayers.map((layer, index) => (
          <li
            key={layer.id}
            className={`p-2 border rounded cursor-pointer flex items-center justify-between ${selectedId === layer.id ? "bg-indigo-100" : "bg-white"
              }`}
            onClick={() => onSelect(layer.id)}
          >
            <div className="flex items-center gap-2 truncate">
              <span
                className={`font-medium truncate ${layer.locked ? "line-through text-gray-400" : ""
                  }`}
              >
                {layer.text || "(empty)"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {/* Reorder Up */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReorder(index, index - 1);
                }}
                disabled={index === 0}
                title="Move Up"
                className="text-sm px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-40"
              >
                ↑
              </button>

              {/* Reorder Down */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReorder(index, index + 1);
                }}
                disabled={index === textLayers.length - 1}
                title="Move Down"
                className="text-sm px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-40"
              >
                ↓
              </button>

              {/* Lock/Unlock */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLockToggle(layer.id);
                }}
                title={layer.locked ? "Unlock Layer" : "Lock Layer"}
                className="text-sm px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
              >
                {layer.locked ? "🔒" : "🔓"}
              </button>

              {/* Duplicate */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(layer.id);
                }}
                title="Duplicate Layer"
                className="text-sm px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
              >
                📄
              </button>

              {/* Delete */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(layer.id);
                }}
                title="Delete Layer"
                className="text-sm px-2 py-1 rounded bg-red-400 hover:bg-red-600 text-white"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
