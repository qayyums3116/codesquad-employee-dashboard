import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showText?: boolean
}

export function CodeSquadLogo({ size = 'md', className, showText = true }: LogoProps) {
  const iconSize = size === 'sm' ? 28 : size === 'md' ? 36 : 48
  const textSizes = {
    sm: { brand: 'text-base', sub: 'text-[10px]' },
    md: { brand: 'text-xl', sub: 'text-[11px]' },
    lg: { brand: 'text-3xl', sub: 'text-sm' },
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {/* CS Icon — SVG replicating the teal-to-blue gradient circular mark */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="cs-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>
        {/* Outer circular arc segments */}
        <path
          d="M24 4C13 4 4 13 4 24C4 29.5 6.2 34.5 9.8 38.2"
          stroke="url(#cs-grad)" strokeWidth="3.5" strokeLinecap="round" fill="none"
        />
        <path
          d="M24 44C35 44 44 35 44 24C44 18.5 41.8 13.5 38.2 9.8"
          stroke="url(#cs-grad)" strokeWidth="3.5" strokeLinecap="round" fill="none"
        />
        {/* C letter */}
        <path
          d="M22 17C18.7 17 16 19.7 16 23C16 26.3 18.7 29 22 29"
          stroke="url(#cs-grad)" strokeWidth="3" strokeLinecap="round" fill="none"
        />
        {/* S letter */}
        <path
          d="M26 17H31C31 17 32.5 19.5 30 21C28 22 26 22.5 26 25C26 27.5 28 29 31 29H26"
          stroke="url(#cs-grad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"
        />
      </svg>

      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={cn('font-bold text-foreground tracking-tight', textSizes[size].brand)}>
            Code<span className="text-foreground">Squad</span>
          </span>
          <span className={cn('text-muted-foreground font-medium tracking-widest uppercase', textSizes[size].sub)}>
            AI Solutions
          </span>
        </div>
      )}
    </div>
  )
}
