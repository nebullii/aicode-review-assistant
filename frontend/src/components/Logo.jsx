const Logo = ({ variant = 'light', className = '', showText = true }) => {
  const textColor = variant === 'dark' ? 'text-white' : 'text-slate-900'
  const hoverClass = variant === 'light' ? 'group-hover:text-blue-600' : ''

  return (
    <div className={`group flex items-center gap-2 ${className}`}>
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      {showText && (
        <span className={`text-xl font-bold transition-colors ${textColor} ${hoverClass}`}>
          CodeSentry
        </span>
      )}
    </div>
  )
}

export default Logo
