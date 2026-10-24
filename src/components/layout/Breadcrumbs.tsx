import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="mb-2 flex items-center text-xs font-medium text-[#64748B]">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <div key={index} className="flex items-center">
            {index > 0 && <span className="mx-1.5 text-slate-400">/</span>}
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="transition-colors hover:text-[#192342]"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-[#192342] font-semibold' : ''}>
                {item.label}
              </span>
            )}
          </div>
        )
      })}
    </nav>
  )
}
