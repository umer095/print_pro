import React, { useState, useEffect } from "react";
import { Search, X, Filter, Download, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

// 1. Import Auth Context to get the Token
import { useAuth } from "../../../context/AuthContext";

// 2. Import the Service we just created
import { inventoryService } from "../inventoryService";

// Interfaces
interface InventoryItem {
  id: number;
  product_name: string;
  sku: string;
  hsn_no: string;
  item_gst: number;
  quantity: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse {
  message: string;
  data: InventoryItem[];
  pagination: PaginationData;
}

const Inventory: React.FC = () => {
  // Get token from Auth Context
  const { token } = useAuth();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [formData, setFormData] = useState({
    product_name: "",
    sku: "",
    hsn_no: "",
    item_gst: "",
    quantity: "",
    unit_price: "",
  });

  // --- Fetch Data ---
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: "created_at",
        sortOrder: "DESC",
        ...(searchQuery && { search: searchQuery }),
      });

      // Use Service
      const result: ApiResponse = await inventoryService.getAll(
        token,
        queryParams
      );

      setInventory(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when search/pagination changes
  useEffect(() => {
    if (token) {
      fetchInventory();
    }
  }, [pagination.page, pagination.limit, searchQuery, token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- Create / Update ---
  const handleSubmit = async () => {
    if (
      !formData.product_name ||
      !formData.sku ||
      !formData.quantity ||
      !formData.unit_price
    ) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        product_name: formData.product_name,
        sku: formData.sku,
        hsn_no: formData.hsn_no || null,
        item_gst: parseFloat(formData.item_gst) || 0,
        quantity: parseInt(formData.quantity),
        unit_price: parseFloat(formData.unit_price),
      };

      let result;
      if (editingItem) {
        // Use Service Update
        result = await inventoryService.update(token, editingItem.id, payload);
      } else {
        // Use Service Create
        result = await inventoryService.create(token, payload);
      }

      alert(result.message);
      await fetchInventory();
      handleCloseModal();
    } catch (error: any) {
      console.error("Error saving inventory:", error);
      alert(error.message || "Failed to save inventory item");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      product_name: item.product_name,
      sku: item.sku,
      hsn_no: item.hsn_no || "",
      item_gst: item.item_gst.toString(),
      quantity: item.quantity.toString(),
      unit_price: item.unit_price.toString(),
    });
    setShowAddModal(true);
  };

  // --- Delete ---
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      setLoading(true);
      // Use Service Delete
      const result = await inventoryService.delete(token, id);

      alert(result.message);
      await fetchInventory();
    } catch (error) {
      console.error("Error deleting inventory:", error);
      alert("Failed to delete inventory item");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
    setFormData({
      product_name: "",
      sku: "",
      hsn_no: "",
      item_gst: "",
      quantity: "",
      unit_price: "",
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by customer, order number, items, services, or packages..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="text-blue-600 hover:text-blue-700 font-medium px-4"
              >
                Clear Search
              </button>
            )}
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              disabled={loading}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : inventory.length === 0 ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-gray-500">No inventory items found</div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Sr No
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Product Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        HSN No.
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Item GST
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Created At
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {inventory.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.product_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.sku}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.hsn_no || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.item_gst}%
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          ₹{item.unit_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {new Date(item.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "2-digit",
                              day: "2-digit",
                              year: "numeric",
                            }
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              disabled={loading}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                              disabled={loading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1 || loading}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={
                      pagination.page === pagination.totalPages || loading
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="product_name"
                    value={formData.product_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU *
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading || !!editingItem}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HSN No.
                  </label>
                  <input
                    type="text"
                    name="hsn_no"
                    value={formData.hsn_no}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item GST (%)
                  </label>
                  <input
                    type="number"
                    name="item_gst"
                    value={formData.item_gst}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="unit_price"
                    value={formData.unit_price}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? "Saving..." : editingItem ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
