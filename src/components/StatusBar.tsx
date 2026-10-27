/**
 * Device status bar as drawn in the Figma prototype.
 * Two variants exist in the source file:
 *   - "mono"  : "9:41" + ▮▮▮ Wi-Fi ▰   (white screens)
 *   - "amber" : "9:41" + LTE Wi-Fi 100%  (cream screens)
 */
export function StatusBar({ variant = 'mono' }: { variant?: 'mono' | 'amber' }) {
  return (
    <div
      className="flex shrink-0 items-center justify-between px-5 pt-3 pb-1 text-[12px] font-medium select-none"
      aria-hidden
      data-variant={variant}
    >
      <span>9:41</span>
      {variant === 'mono' ? (
        <span className="flex items-center gap-1.5 tracking-tight">
          <span className="font-bold">▮▮▮</span>
          <span>Wi-Fi</span>
          <span className="font-bold">▰</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <span>LTE</span>
          <span>Wi-Fi</span>
          <span>100%</span>
        </span>
      )}
    </div>
  )
}
