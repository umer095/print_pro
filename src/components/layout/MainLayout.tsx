import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../../context/AuthContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();

  const userName = user?.fullName || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Component */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white shadow-md z-10">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Spacer for centering logic if needed */}
            <div className="w-48"></div>

            {/* Central Title */}
            <h2 className="text-2xl font-bold text-gray-800">AV CLOTHING</h2>

            {/* Right Side - User Profile & Logout */}
            <div className="flex items-center space-x-4 w-48 justify-end">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>

              <div className="relative group">
                <div className="flex items-center space-x-2 cursor-pointer">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {userInitial}
                  </div>
                  <span className="text-sm font-medium">{userName}</span>
                </div>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};




// // import componenet statement 


// import React, {
//   createContext,
//   useContext,
//   useState,
// } from "react";
// import type { ReactNode } from "react";
// import { Sidebar } from "./Sidebar";
// import { useAuth } from "../../context/AuthContext";

// /* ================= CONTEXT ================= */

// interface LayoutContextProps {
//   sidebarOpen: boolean;
//   setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
// }

// const LayoutContext = createContext<LayoutContextProps | null>(null);

// const useLayout = () => {
//   const context = useContext(LayoutContext);
//   if (!context) {
//     throw new Error("MainLayout components must be used within MainLayout");
//   }
//   return context;
// };

// /* ================= ROOT ================= */

// interface MainLayoutProps {
//   children: ReactNode;
// }

// const MainLayoutRoot: React.FC<MainLayoutProps> = ({ children }) => {
//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   return (
//     <LayoutContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
//       <div className="flex h-screen bg-gray-100">
//         {/* Sidebar */}
//         <Sidebar
//           sidebarOpen={sidebarOpen}
//           setSidebarOpen={setSidebarOpen}
//         />

//         {/* Main Area */}
//         <div className="flex-1 flex flex-col overflow-hidden">
//           <MainLayoutHeader />
//           <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
//             {children}
//           </main>
//         </div>
//       </div>
//     </LayoutContext.Provider>
//   );
// };

// /* ================= HEADER ================= */

// const MainLayoutHeader: React.FC = () => {
//   const { user, logout } = useAuth();

//   const userName = user?.fullName || "User";
//   const userInitial = userName.charAt(0).toUpperCase();

//   return (
//     <header className="bg-white shadow-md z-10">
//       <div className="flex items-center justify-between px-6 py-4">
//         <div className="w-48"></div>

//         <h2 className="text-2xl font-bold text-gray-800">
//           AV CLOTHING
//         </h2>

//         <div className="flex items-center space-x-4 w-48 justify-end">
//           <div className="relative group">
//             <div className="flex items-center space-x-2 cursor-pointer">
//               <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
//                 {userInitial}
//               </div>
//               <span className="text-sm font-medium">
//                 {userName}
//               </span>
//             </div>

//             <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
//               <button
//                 onClick={logout}
//                 className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//               >
//                 Logout
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// };

// /* ================= EXPORT ================= */

// export const MainLayout = MainLayoutRoot;
