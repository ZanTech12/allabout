// Toast.jsx
import { Icon } from "@iconify/react";

export default function Toast({ message }) {
  if (!message.text) return null;

  return (
    <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium transition-all ${
      message.type === "success" 
        ? "bg-green-500 text-white" 
        : "bg-red-500 text-white"
    }`}>
      <Icon 
        icon={message.type === "success" ? "lucide:check-circle" : "lucide:alert-circle"} 
        width={18} 
      />
      {message.text}
    </div>
  );
}