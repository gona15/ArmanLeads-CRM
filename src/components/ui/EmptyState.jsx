import React from "react";

export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-[#F5F3EC] flex items-center justify-center mb-3">
          <Icon size={20} className="text-[#B8B2A0]" />
        </div>
      )}
      <p className="text-sm font-medium text-[#6B6355]">{title}</p>
      {message && <p className="text-[13px] text-[#B8B2A0] mt-1 max-w-xs">{message}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
