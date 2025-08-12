"use client";

export default function Loader() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
            <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-indigo-600 border-solid"></div>
        </div>
    );
}
