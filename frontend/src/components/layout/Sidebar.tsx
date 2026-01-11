import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Home,
  ShoppingCart,
  Package,
  Store,
  Printer,
  Send,
  Shirt,
  Truck,
  Calculator,
  TrendingUp,
  Users,
  ChevronDown,
  Boxes as InventoryIcon,
} from "lucide-react";

// Define the menu structure
const menuItems = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  
  
  // --- Resolved Purchase Section ---
  {
    path: "/purchase",
    label: "Purchase",
    icon: ShoppingCart,
    children: [
      { path: "/purchase/requisition", label: "Purchase Requisition" },
      { path: "/purchase/purchase-orders", label: "Purchase Orders" },
      // Used /purchase/Grn to match the Route definition
      { path: "/purchase/Grn", label: "GRN" }, 
      // Used /purchase/vendors to match the Route definition
      { path: "/purchase/vendors", label: "Vendors" },
      { path: "/purchase/report", label: "Report" },
    ],
  },
  // -------------------------------

  { path: "/raw-material-store", label: "Raw Material Store", icon: Package },
  { path: "/ready-good-store", label: "Ready Good Store", icon: Store },
  {
    path: "/inhouse-printing",
    label: "InHouse Printing",
    icon: Printer,
    children: [
      {
        path: "/inhouse-printing/printing-job-creation",
        label: "Printing Job Creation",
      },
      { path: "/inhouse-printing/art-work-upload", label: "Art Work Upload" },
      { path: "/inhouse-printing/art-work-gallery", label:"Art Work Gallery"},
      { path: "/inhouse-printing/version-control", label: "Version Control" },
      {
        path: "/inhouse-printing/printed-vs-rejected",
        label: "Printed vs Rejected Quantity Tracking",
      },
      {
        path: "/inhouse-printing/daily-printing-output",
        label: "Reports Daily Printing Output",
      },
      {
        path: "/inhouse-printing/pending-printing-jobs",
        label: "Pending Printing Jobs",
      },
      { path: "/inhouse-printing/rejection-report", label: "Rejection Report" },
    ],
  },
  { path: "/outsourcing", label: "Outsourcing", icon: Send },
  { path: "/garment-production", label: "Garment Production", icon: Shirt },
  { path: "/dispatch", label: "Dispatch", icon: Truck },
  { path: "/accounting", label: "Accounting", icon: Calculator },
  { path: "/sales", label: "Sales", icon: TrendingUp },
  { path: "/inventory", label: "Inventory", icon: InventoryIcon },
  { path: "/hrm", label: "HRM", icon: Users },
];

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
}) => {
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set());
  const location = useLocation();

  const toggleSubmenu = (path: string) => {
    setOpenSubmenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  return (
    <div
      className={`bg-gray-800 text-white transition-all duration-300 ${
        sidebarOpen ? "w-64" : "w-20"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {sidebarOpen && (
          <h1 className="text-xl font-bold">
            AV <span className="text-purple-800">Clothing ERP</span>
          </h1>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-700 rounded"
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav className="mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.children
            ? location.pathname.startsWith(item.path)
            : location.pathname === item.path;

          if (item.children) {
            return (
              <div key={item.path} className="relative group">
                <button
                  onClick={() => toggleSubmenu(item.path)}
                  className={`flex items-center justify-between w-full px-4 py-3 hover:bg-gray-700 transition-colors ${
                    isActive ? "bg-gray-700 border-l-4 border-blue-500" : ""
                  }`}
                  title={!sidebarOpen ? item.label : ""}
                >
                  <div className="flex items-center">
                    <Icon size={20} className="min-w-[20px]" />
                    {sidebarOpen && <span className="ml-4">{item.label}</span>}
                  </div>
                  {sidebarOpen && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${
                        openSubmenus.has(item.path) ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>

                {/* Tooltip for collapsed sidebar */}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {item.label}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}

                {/* Submenu Items */}
                {openSubmenus.has(item.path) && sidebarOpen && (
                  <div className="ml-8 mb-2 overflow-hidden transition-all duration-300">
                    {item.children.map((child) => {
                      const childActive = location.pathname === child.path;
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={`flex items-center px-4 py-2 hover:bg-gray-700 transition-colors block text-sm ${
                            childActive
                              ? "bg-gray-600 border-l-2 border-blue-400"
                              : ""
                          }`}
                        >
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 hover:bg-gray-700 transition-colors relative group ${
                isActive ? "bg-gray-700 border-l-4 border-blue-500" : ""
              }`}
              title={!sidebarOpen ? item.label : ""}
            >
              <Icon size={20} className="min-w-[20px]" />
              {sidebarOpen && <span className="ml-4">{item.label}</span>}

              {/* Tooltip for collapsed sidebar */}
              {!sidebarOpen && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {item.label}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );

};
