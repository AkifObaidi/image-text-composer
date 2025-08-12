"use client";

interface UndoRedoControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export default function UndoRedoControls({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: UndoRedoControlsProps) {
  return (
    <div className="flex gap-3 my-3 justify-center">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`px-4 py-2 rounded border ${canUndo
            ? "border-indigo-600 text-indigo-600 hover:bg-indigo-100"
            : "text-gray-400 border-gray-300 cursor-not-allowed"
          }`}
      >
        Undo
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`px-4 py-2 rounded border ${canRedo
            ? "border-indigo-600 text-indigo-600 hover:bg-indigo-100"
            : "text-gray-400 border-gray-300 cursor-not-allowed"
          }`}
      >
        Redo
      </button>
    </div>
  );
}
