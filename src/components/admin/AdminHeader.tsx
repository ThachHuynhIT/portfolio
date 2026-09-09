import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { useTranslation } from "@/context/LanguageContext";

interface AdminHeaderProps {
  title: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
  onClose?: () => void;
  closeHref?: string;
}

export default function AdminHeader({
  title,
  description,
  icon,
  action,
  onClose,
  closeHref,
}: AdminHeaderProps) {
  const { t } = useTranslation();
  const closeLabel = t("admin.common.close", "Close");

  const closeButton = closeHref ? (
    <Link
      href={closeHref}
      className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 active:scale-95 transition-all focus:outline-none flex items-center justify-center border border-transparent hover:border-white/10"
      title={closeLabel}
      aria-label={closeLabel}
    >
      <Icon name="close" size={20} />
    </Link>
  ) : onClose ? (
    <button
      type="button"
      onClick={onClose}
      className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 active:scale-95 transition-all focus:outline-none flex items-center justify-center border border-transparent hover:border-white/10"
      title={closeLabel}
      aria-label={closeLabel}
    >
      <Icon name="close" size={20} />
    </button>
  ) : null;

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
      {(action || closeButton) && (
        <div className="flex items-center gap-3 flex-shrink-0">
          {action}
          {closeButton}
        </div>
      )}
    </div>
  );
}

