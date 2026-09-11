export default function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground mb-2">{eyebrow}</p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="serif-heading text-3xl sm:text-4xl text-foreground leading-tight">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2 max-w-xl">{subtitle}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
      <div className="soft-divider mt-6" />
    </div>
  );
}