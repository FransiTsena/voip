import { NavLink, useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { Home, Users, ListOrdered, LineChart, LogOut, BarChart3, Menu, ChevronLeft, ChevronDown } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const Sidebar = () => {
  const { logout } = useContext(AuthContext) ?? {};
  const navigate = useNavigate();
  // Persist collapsed state across sessions
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("sidebar:collapsed") === "1";
    } catch {
      return false;
    }
  });
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("sidebar:collapsed", collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);
  const navItems = [
    { path: "/dashboard", name: "Dashboard", icon: <Home /> },
    {
      name: "Reports",
      icon: <LineChart />,
      submenus: [
        { path: "/report", name: "Metrics", icon: <BarChart3 /> },
        { path: "/call-history", name: "Call History", icon: <ListOrdered /> },
      ],
    },
    {
      name: "Queue",
      icon: <ListOrdered />,
      submenus: [
        { path: "/queues", name: "Queues", icon: <ListOrdered /> },
        { path: "/queue-statistics", name: "Queue Statistics", icon: <BarChart3 /> },
      ],
    },
    {
      path: "/agents",
      name: "Agents",
      icon: <Users />,
    },
    // // Misc Applications as a submenu
    // {
    //   name: "Misc App",
    //   icon: <FaUsers />, // You might want a different icon for misc applications
    //   submenus: [
    //     { path: "/new-misc-application", name: "Creat New", icon: <FaListAlt /> },
    //     { path: "/misc-applications" , name: "Misc Applications", icon: <FaPlus /> },
    //   ],
    // },

    // IVR Menus and System Recordings as submenus
    // {
    //   name: "IVR",
    //   icon: <FaListOl />,
    //   submenus: [
    //     { path: "/ivr-menu", name: "IVR Menus", icon: <FaListAlt /> },
    //     { path: "/new-ivr", name: "New IVR", icon: <FaPlus /> },
    //     { path: "/system-recordings", name: "Recordings", icon: <FaUsers /> },
    //     { path: "/system-recordings-upload", name: "Upload Recording", icon: <FaHome /> },
    //   ],
    // },
  ];

  return (
    <aside
      className={`${collapsed ? "w-20" : "w-64"} h-screen bg-gradient-to-b from-white to-surfaceVariant/30 text-onSurface shadow-lg border-r border-outlineVariant font-sans transition-[width] duration-300 ease-in-out`}
      style={{ boxShadow: "2px 0 8px 0 rgba(0,0,0,0.07)" }}
      aria-label="Sidebar navigation"
    >
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-outlineVariant/30">
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-2">


          </div>
          <button
            type="button"
            onClick={() => setCollapsed((v: boolean) => !v)}
            aria-pressed={collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-onSurface/70 hover:text-onSurface/90 hover:bg-surfaceVariant/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {collapsed ? <Menu /> : <ChevronLeft />}
          </button>
        </div>
      </div>
      <nav
        role="navigation"
        className="relative mt-2 flex flex-col gap-1 px-2 py-3 overflow-y-auto"
      >
        {/* subtle top and bottom fade for scroll affordance */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-white to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white to-transparent" />
        {navItems.map((item) =>
          item.submenus ? (
            // Only render submenu logic for items that still have submenus (e.g., Queue)
            <div
              key={item.name}
              className="flex flex-col relative"
              onMouseEnter={() => collapsed && setOpenDropdown(item.name)}
              onMouseLeave={() => collapsed && setOpenDropdown(null)}
            >
              <button
                type="button"
                className={`group relative flex items-center gap-3 ${collapsed ? "px-2 justify-center" : "px-4"} py-3 rounded-lg font-medium text-onSurface/90 hover:bg-surfaceVariant/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${openDropdown === item.name ? 'bg-surfaceVariant/70' : ''}`}
                onClick={() => !collapsed && setOpenDropdown(openDropdown === item.name ? null : item.name)}
                aria-expanded={openDropdown === item.name}
                aria-haspopup="true"
                title={item.name}
              >
                <span className="text-blue-600">{item.icon}</span>
                <span className={`text-sm font-medium text-onSurface/90 transition-opacity duration-200 ${collapsed ? 'opacity-0 pointer-events-none select-none absolute' : 'opacity-100'}`}>{item.name}</span>
                <ChevronDown
                  className={`ml-auto h-4 w-4 transition-transform duration-200 text-onSurface/60 ${openDropdown === item.name ? 'rotate-180' : ''} ${collapsed ? 'hidden' : ''}`}
                />
              </button>
              {openDropdown === item.name && (
                <div
                  className={`${collapsed
                    ? 'absolute left-full top-0 ml-2 w-56 bg-white rounded-lg shadow-lg border border-outlineVariant/40 p-2 z-50'
                    : 'ml-8'} flex flex-col gap-1 mt-1`}
                >
                  {item.submenus.map((sub) => (
                    <NavLink
                      key={sub.path}
                      to={sub.path}
                      className={({ isActive }: { isActive: boolean }) =>
                        `relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 text-sm ${isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-onSurface/70 hover:bg-surfaceVariant/40 hover:text-onSurface/90"
                        } hover:translate-x-0.5`
                      }
                      onClick={() => sub.name === "Logout" && localStorage.clear()}
                      title={sub.name}
                    >
                      <span className="text-blue-600">{sub.icon}</span>
                      <span>{sub.name}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }: { isActive: boolean }) =>
                `group relative flex items-center gap-3 ${collapsed ? "px-2 justify-center" : "px-4"} py-3 rounded-lg transition-colors duration-200 ${isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-onSurface/80 hover:bg-surfaceVariant/40 hover:text-onSurface/90"
                } hover:translate-x-0.5`
              }
              onClick={() => item.name === "Logout" && localStorage.clear()}
              title={item.name}
            >
              <span className="text-blue-600">{item.icon}</span>
              <span className={`text-sm font-medium transition-opacity duration-200 ${collapsed ? 'opacity-0 pointer-events-none select-none absolute' : 'opacity-100'}`}>{item.name}</span>
              {/* tooltip when collapsed */}
              {collapsed && (
                <span className="absolute left-full ml-2 whitespace-nowrap rounded-md bg-gray-900/90 px-2 py-1 text-xs text-white opacity-0 shadow-lg ring-1 ring-black/10 transition-opacity duration-150 group-hover:opacity-100">
                  {item.name}
                </span>
              )}
            </NavLink>
          )
        )}
      </nav>
      <div className="mt-auto px-2 pb-6">
        <button
          onClick={async () => {
            if (logout) {
              await logout();
              navigate("/login");
            }
          }}
          className={`w-full flex items-center gap-3 ${collapsed ? 'px-2 justify-center' : 'px-4'} py-3 rounded-lg font-medium text-red-600 hover:bg-red-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-300`}
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
          <span className={`text-sm font-medium transition-opacity duration-200 ${collapsed ? 'opacity-0 pointer-events-none select-none absolute' : 'opacity-100'}`}>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
