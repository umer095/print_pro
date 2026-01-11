import React from "react";
import {
  Users,
  ShoppingCart,
  TrendingUp,
  Star,
  ArrowUpRight,
  FileText,
  Phone,
  FileText as GstIcon,
  CreditCard,
  PackageCheck,
  ChevronRight,
} from "lucide-react";

/* ---------------- STAT CARD ---------------- */

const StatCard = ({
  title,
  value,
  bg,
  icon: Icon,
}: {
  title: string;
  value: string;
  bg: string;
  icon: React.ElementType;
}) => (
  <div
    className={`relative rounded-2xl p-6 text-white ${bg}
     transition-all duration-300 ease-out
     hover:-translate-y-1 hover:shadow-xl cursor-pointer`}
  >
    <ArrowUpRight className="absolute top-4 right-4 w-5 h-5 opacity-80" />

    <div className="mb-6">
      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>
    </div>

    <div className="text-3xl font-bold">{value}</div>
    <div className="mt-2 text-base opacity-90">{title}</div>
  </div>
);

/* ---------------- VENDOR CARD ---------------- */

const VendorCard = ({
  name,
  code,
  rating,
  gst,
  phone,
  creditDays,
  totalOrders,
  headerBg,
}: any) => (
  <div
    className="
        rounded-2xl overflow-hidden bg-white border
        transition-all duration-300 ease-out
        hover:-translate-y-1 hover:shadow-2xl
      "
  >
    {/* Header */}
    <div className={`p-4 ${headerBg}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-600">{code}</p>
        </div>

        <div className="flex items-center gap-1 bg-white/70 px-2 py-1 rounded-lg">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-medium">{rating}</span>
        </div>
      </div>
    </div>

    {/* Body */}
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <GstIcon size={16} /> GST Number
          </div>
          <div className="mt-1 font-medium text-gray-800">{gst}</div>
        </div>

        <div className="bg-blue-50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-blue-600 text-sm">
            <Phone size={16} /> Contact
          </div>
          <div className="mt-1 font-medium text-gray-800">{phone}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-yellow-50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-orange-500 text-sm">
            <CreditCard size={16} /> Credit Days
          </div>
          <div className="mt-1 font-semibold text-gray-800">
            {creditDays} days
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <PackageCheck size={16} /> Total Orders
          </div>
          <div className="mt-1 font-semibold text-gray-800">
            {totalOrders}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl flex items-center justify-center gap-1">
          View Details <ChevronRight size={16} />
        </button>

        <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl flex items-center justify-center gap-1">
          <TrendingUp size={16} /> Performance
        </button>
      </div>
    </div>
  </div>
);

/* ---------------- MAIN PAGE ---------------- */

const Vendors = () => {
  return (
    <div className="p-6 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1E40AF] tracking-tight">
            Vendor Management
          </h1>

          <p className="mt-2 text-lg md:text-xl text-gray-600">
            Manage vendor information and performance
          </p>
        </div>

        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium">
          + Add Vendor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Vendors"
          value="24"
          bg="bg-[#2E4A8A]"
          icon={Users}
        />
        <StatCard
          title="Active Orders"
          value="156"
          bg="bg-[#3B82F6]"
          icon={ShoppingCart}
        />
        <StatCard
          title="This Month"
          value="₹8.4L"
          bg="bg-[#1FA2A6]"
          icon={TrendingUp}
        />
        <StatCard
          title="Avg Rating"
          value="4.4"
          bg="bg-[#F7931E]"
          icon={Star}
        />
      </div>

      {/* Vendor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <VendorCard
          name="Fabric Hub Ltd."
          code="V-001"
          rating="4.5"
          gst="27AAAA1234A1Z5"
          phone="+91 98765 43210"
          creditDays={30}
          totalOrders={45}
          headerBg="bg-purple-100"
        />
        <VendorCard
          name="Accessory World"
          code="V-002"
          rating="4.2"
          gst="27BBBB5678B2Y4"
          phone="+91 98765 43210"
          creditDays={45}
          totalOrders={32}
          headerBg="bg-blue-100"
        />
        <VendorCard
          name="Thread Masters"
          code="V-003"
          rating="4.8"
          gst="27CCCC9012C3X3"
          phone="+91 98765 43210"
          creditDays={60}
          totalOrders={58}
          headerBg="bg-green-100"
        />
        <VendorCard
          name="Printing Pro"
          code="V-004"
          rating="4.0"
          gst="27DDDD3456D4W2"
          phone="+91 98765 43210"
          creditDays={30}
          totalOrders={21}
          headerBg="bg-orange-100"
        />
      </div>

      {/* Quick Actions */}
      <div
        className="
            bg-gradient-to-r from-[#3556D8] to-[#3B82F6]
            rounded-2xl p-8
            transition-all duration-300
            hover:shadow-2xl hover:-translate-y-1
            flex flex-col md:flex-row justify-between items-center gap-6
         "
      >
        <div>
          <h3 className="text-2xl font-bold text-white">Quick Actions</h3>
          <p className="text-lg text-white/90">
            Manage your vendor operations efficiently
          </p>
        </div>

        <div className="flex gap-4">
          <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2">
            <FileText size={18} /> Export Report
          </button>
          <button className="bg-white/20 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2">
            <TrendingUp size={18} /> View Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default Vendors;