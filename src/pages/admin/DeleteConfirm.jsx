// DeleteConfirm.jsx
import { Icon } from "@iconify/react";

export default function DeleteConfirm({ isOpen, onClose, onConfirm, title, message, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Icon icon="lucide:alert-triangle" width={32} className="text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2 transition"
          >
            {loading && <Icon icon="lucide:loader-2" width={16} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}