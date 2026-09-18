export default function SettingsSection({ icon: Icon, title, description, children, action }) {
  return (
    <div className="elegant-card p-6">
      <div className="flex items-start gap-3 mb-4">
        {Icon && (
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-accent-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="serif-heading text-lg text-foreground leading-tight">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}