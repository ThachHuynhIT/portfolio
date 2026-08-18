"use client";

import Icon from "@/components/ui/Icon";

interface AdminHeaderProps {
  title: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
}

export default function AdminHeader({ title, description, icon, action }: AdminHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon name={icon} size={17} className="text-slate-400" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-white leading-tight">{title}</h1>
          {description && (
            <p className="text-slate-500 text-sm mt-0.5 leading-snug">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
