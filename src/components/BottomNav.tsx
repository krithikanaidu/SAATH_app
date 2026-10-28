import { NavLink, useLocation } from 'react-router-dom'
import { IconGroups, IconHome, IconProfile, IconSafety, IconTrain } from './icons'

/**
 * Bottom tab bar — Figma "Nav/Bottom".
 * Tabs map to the documented navigation reference:
 *   HOME/S05 · PLAN(S07, shown as "Trains")/S07 · GROUPS/S09 · SAFETY/S11 · ME/S12
 */

const TABS = [
  { to: '/home', label: 'Home', Icon: IconHome, match: ['/home', '/train', '/smart-window', '/queue'] },
  { to: '/smart-window', label: 'Trains', Icon: IconTrain, match: ['/smart-window'] },
  { to: '/groups', label: 'Groups', Icon: IconGroups, match: ['/groups'] },
  { to: '/sos', label: 'Safety', Icon: IconSafety, match: ['/sos'] },
  { to: '/profile', label: 'Profile', Icon: IconProfile, match: ['/profile'] },
]

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      className="nav-safe shrink-0 border-t border-[#DDDDDD] bg-white"
      aria-label="Primary"
      data-testid="bottom-nav"
    >
      <ul className="flex">
        {TABS.map(({ to, label, Icon, match }) => {
          const active = match.some(p => pathname === p || pathname.startsWith(p + '/'))
          return (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 px-1 pt-2.5 pb-1 text-[11px] leading-[13px] ${
                  active ? 'bg-[#F2F2F2] font-bold text-black' : 'font-medium text-[#202020]'
                }`}
              >
                <Icon size={24} />
                {label}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
