import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

/**
 * A mobile-first action sheet / bottom drawer that replaces native <select>
 * elements. Renders a select-like trigger button; tapping opens a bottom
 * sheet overlay with the options. Uses Framer Motion for the slide-up.
 */
export default function ActionSheet({ value, onChange, options, placeholder = 'Select…', className = '', id }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const label = selected ? selected.label : placeholder;

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        id={id}
        onClick={() => setOpen(true)}
        className={`flex items-center justify-between w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-left select-none ${className}`}
      >
        <span className={selected ? 'text-foreground truncate' : 'text-muted-foreground truncate'}>{label}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-[100]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-[100] bg-card rounded-t-2xl border-t border-border shadow-2xl"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            >
              <div className="flex justify-center pt-2.5 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              <div className="px-3 pb-4 pt-1 max-h-[55vh] overflow-y-auto overscroll-contain">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className="flex items-center justify-between w-full min-h-[44px] px-3 py-2.5 rounded-lg text-sm text-left hover:bg-accent transition-colors select-none"
                  >
                    <span className="text-foreground">{opt.label}</span>
                    {opt.value === value && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}