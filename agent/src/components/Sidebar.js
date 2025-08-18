import { Users, Gauge, BarChart2 } from "lucide-react";

function Sidebar({ activeTab, setActiveTab, tabs }) {
    // Default tabs if not provided
    const defaultTabs = [
        { name: "Dashboard", key: "dashboard", icon: <Gauge /> },
        { name: "Contacts", key: "contacts", icon: <Users /> },
        { name: "Analytics", key: "analytics", icon: <BarChart2 /> },
    ];
    const sidebarTabs = tabs
        ? tabs.map(tabKey => {
            if (tabKey === "dashboard") return { name: "Dashboard", key: "dashboard", icon: <Gauge /> };
            if (tabKey === "contacts") return { name: "Contacts", key: "contacts", icon: <Users /> };
            if (tabKey === "analytics") return { name: "Analytics", key: "analytics", icon: <BarChart2 /> };
            return { name: tabKey, key: tabKey, icon: null };
        })
        : defaultTabs;

    return (
        <aside className="w-64 shadow-xl border-r flex flex-col min-h-screen bg-white">
            <div className="flex-1 px-4 space-y-2 mt-4">
                {sidebarTabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={`flex items-center gap-3 w-full text-base font-semibold px-4 py-3 rounded-lg transition-all duration-150
                            ${activeTab === tab.key
                                ? "bg-indigo-50 text-indigo-700 shadow border border-indigo-200"
                                : "text-gray-700 hover:bg-indigo-600 hover:text-white"
                            }`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.icon && <span className="text-xl">{tab.icon}</span>}
                        {tab.name}
                    </button>
                ))}
            </div>
        </aside>
    );
}

export default Sidebar;