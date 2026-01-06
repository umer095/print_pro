import { Search, FileText, Clock, TrendingUp, CheckCircle, DollarSign } from "lucide-react";
import { Calendar } from "lucide-react";
export type StatusType = "Approved" | "Pending Approval";


const stats = [
  {
    title: "Total Purchase",
    value: "248",
    icon: FileText,
    color: "bg-blue-500",
  },
  {
    title: "Pending Approval",
    value: "12",
    icon: Clock,
    color: "bg-orange-500",
  },
  {
    title: "Open Orders",
    value: "64",
    icon: TrendingUp,
    color: "bg-purple-500",
  },
  {
    title: "Completed Orders",
    value: "172",
    icon: CheckCircle,
    color: "bg-green-500",
  },
  {
    title: "Total PO Value",
    value: "₹18.4M",
    icon: DollarSign,
    color: "bg-teal-500",
  },
];

// 1️⃣ Status type (exact values jo UI + data me use ho rahi hain)


// 2️⃣ Status → Tailwind class mapping
export const statusStyles: Record<StatusType, string> = {
  Approved: "bg-green-100 text-green-700",
  "Pending Approval": "bg-[#FFEDD4] text-orange-700",
};

// 3️⃣ Purchase Order type
export type PurchaseOrder = {
  pr: string;
  date: string;
  vendor: string;
  amount: string;
  status: StatusType;
};

// 4️⃣ Data (ab fully typed hai ✔️)
export const data: PurchaseOrder[] = [
  {
    pr: "PR-2024-001",
    date: "2024-12-15",
    vendor: "Textile Mills Ltd.",
    amount: "₹125,000",
    status: "Pending Approval",
  },
  {
    pr: "PR-2024-002",
    date: "2024-12-18",
    vendor: "Global Trims Co.",
    amount: "₹45,000",
    status: "Approved",
  },
  {
    pr: "PR-2024-003",
    date: "2024-12-10",
    vendor: "Premium Denim Supply",
    amount: "₹320,000",
    status: "Approved",
  },
  {
    pr: "PR-2024-004",
    date: "2024-12-20",
    vendor: "Fashion Accessories Inc.",
    amount: "₹37,500",
    status: "Pending Approval",
  },
  {
    pr: "PR-2024-005",
    date: "2024-12-05",
    vendor: "Silk Threads Ltd.",
    amount: "₹96,000",
    status: "Approved",
  },
  {
    pr: "PR-2024-006",
    date: "2024-11-28",
    vendor: "Eco Fabrics Co.",
    amount: "₹180,000",
    status: "Pending Approval",
  },
];


export default function PurchaseOrders() {
  return (
    <div className=" space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-semibold text-teal-600">
          Purchase Orders
        </h1>

        <button className="self-start md:self-auto rounded-xl bg-blue-600 px-6 py-2.5 text-white font-medium shadow-lg hover:bg-blue-700 transition">
          + New PR
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search PO no / Vendor / Style..."
          className="w-full rounded-xl border border-gray-200  bg-dark py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      {/* Stats Cards */}
     <div className="grid grid-cols-1 gap-6  sm:grid-cols-2 lg:grid-cols-5 text-center">
  {stats.map((item, index) => (
    <div
      key={index}
      className="flex flex-col items-center rounded-2xl border border-[rgba(158,172,190,1)] bg-white p-6 h-[182px] shadow-sm transition hover:shadow-[6px_6px_16px_rgba(0,0,0,0.3)]"
    >
      <div
  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${item.color} shadow-[2px_20px_27px_rgba(0,0,0,0.19)]`} >

        <item.icon className="h-6 w-6 text-white" />
      </div>

      <h2 className="text-3xl font-semibold text-gray-900">
        {item.value}
      </h2>
      <p className="mt-1  text-lg text-gray-700 text-center">
        {item.title}
      </p>
    </div>
  ))}
</div>
    <div className="contect">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((item, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-300 bg-white p-6  shadow-sm transition hover:shadow-[6px_6px_16px_rgba(0,0,0,0.3)]"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
              <h1 className="text-xl font-semibold text-gray-900">
                  {item.pr}
              </h1>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {item.date}
                </div>
              </div>

<span
  className={`
    inline-flex items-center justify-center
    min-w-[146px] h-[32px]
    px-4 py-[6px]
    rounded-full
    text-[16px] font-normal font-[Arial]
    whitespace-normal break-words text-center
    ${statusStyles[item.status]}
  `}
>
  {item.status}
</span>
            </div>

            {/* Vendor */}
            <div className="mt-5">
              <p className="text-sm text-gray-500">Vendor</p>
              <p className="  text-gray-900">{item.vendor}</p>
            </div>

            {/* Divider */}
            <div className="my-5  h-px bg-gray-100" />

            {/* Footer */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-xl font-semibold text-gray-900">
                  {item.amount}
                </p>
              </div>

              <button className="text-sm font-medium text-blue-600 hover:underline">
                View Details →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}
