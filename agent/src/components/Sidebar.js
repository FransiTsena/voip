import { FaUserFriends, FaTachometerAlt, FaChartBar } from "react-icons/fa";

function Sidebar({ activeTab, setActiveTab, tabs }) {
    // Default tabs if not provided
    const defaultTabs = [
        { name: "Dashboard", key: "dashboard", icon: <FaTachometerAlt /> },
        { name: "Contacts", key: "contacts", icon: <FaUserFriends /> },
        { name: "Analytics", key: "analytics", icon: <FaChartBar /> },
    ];
    const sidebarTabs = tabs
        ? tabs.map(tabKey => {
            if (tabKey === "dashboard") return { name: "Dashboard", key: "dashboard", icon: <FaTachometerAlt /> };
            if (tabKey === "contacts") return { name: "Contacts", key: "contacts", icon: <FaUserFriends /> };
            if (tabKey === "analytics") return { name: "Analytics", key: "analytics", icon: <FaChartBar /> };
            return { name: tabKey, key: tabKey, icon: null };
        })
        : defaultTabs;

    return (
        <aside className="w-64 shadow-xl border-r flex flex-col min-h-screen">
            <div className="p-6">
                <h2 className="text-black text-xl font-bold mb-2 tracking-wide">Call Center</h2>
            </div>
            <div className="flex-1 px-4 space-y-2">
                {sidebarTabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={`flex items-center gap-3 w-full text-base font-semibold px-4 py-3 rounded-lg transition 
                            ${activeTab === tab.key
                                ? "bg-white text-blue shadow"
                                : "text-black hover:bg-indigo-700 hover:text-white"
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