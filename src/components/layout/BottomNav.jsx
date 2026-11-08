import { NavLink } from "react-router-dom";
import Icon from "../global/Icon";

const items = [
  { to: "/home", icon: "home", label: "Beranda" },
  { to: "/route", icon: "map", label: "Rute" },
  { to: "/mood", icon: "mood", label: "Mood" },
];

export default function BottomNav({ fixed = true }) {
  return (
    <nav
      className={`${fixed ? "fixed bottom-0 inset-x-0" : "shrink-0"} z-30 bg-white/90 backdrop-blur border-t border-canopy-800/10 pb-[env(safe-area-inset-bottom)]`}
      aria-label="Navigasi utama"
    >
      <ul className="mx-auto max-w-md grid grid-cols-3">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[0.68rem] font-medium transition-colors ${
                  isActive ? "text-canopy-800" : "text-ink-500"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon name={item.icon} size={21} strokeWidth={isActive ? 2 : 1.6} />
                  {item.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
