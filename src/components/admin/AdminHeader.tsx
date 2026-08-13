"use client";

interface AdminHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function AdminHeader({ title, description, action }: AdminHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-800">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{title}</h1>
        {description && <p className="text-gray-400 text-sm">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
