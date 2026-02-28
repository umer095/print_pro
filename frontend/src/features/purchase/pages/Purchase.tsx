import { NavLink, Outlet } from "react-router-dom";

export default function Purchase() {
  return (
    <div className="flex">
      {/* RIGHT CONTENT */}
      <div className="flex-1 p-6">
        <Outlet />
      </div>
    </div>
  );
}