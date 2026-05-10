// Modal.jsx
import { Icon } from "@iconify/react";

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 animate-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition"
          >
            <Icon icon="lucide:x" width={20} />
          </button>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}