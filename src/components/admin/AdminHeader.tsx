import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { gap, motion, radius, surface, text } from "@/lib/design-tokens";

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
      className={cn("p-2 text-slate-400 hover:text-white", radius.control, "hover:bg-white/10", motion.press, "transition-all focus:outline-none flex items-center justify-center border border-transparent hover:border-white/10")}
      title={closeLabel}
      aria-label={closeLabel}
    >
      <Icon name="close" size={20} />
    </Link>
  ) : onClose ? (
    <button
      type="button"
      onClick={onClose}
      className={cn("p-2 text-slate-400 hover:text-white", radius.control, "hover:bg-white/10", motion.press, "transition-all focus:outline-none flex items-center justify-center border border-transparent hover:border-white/10")}
      title={closeLabel}
      aria-label={closeLabel}
    >
      <Icon name="close" size={20} />
    </button>
  ) : null;

  return (
    <div className={cn("flex flex-col md:flex-row md:items-start justify-between", gap.loose, "mb-8")}>
      <div className={cn("flex items-start", gap.base)}>
        {icon && (
          <div className={cn("w-9 h-9", radius.control, surface.cardDark, "border border-white/8 flex items-center justify-center flex-shrink-0 mt-0.5")}>
            <Icon name={icon} size={17} className="text-slate-400" />
          </div>
        )}
        <div>
          <h1 className={cn("text-xl font-bold", text.primaryDark, "leading-tight")}>{title}</h1>
          {description && (
            <p className="text-slate-500 text-sm mt-0.5 leading-snug">{description}</p>
          )}
        </div>
      </div>
      {(action || closeButton) && (
        <div className={cn("flex items-center", gap.base, "flex-shrink-0")}>
          {action}
          {closeButton}
        </div>
      )}
    </div>
  );
}

