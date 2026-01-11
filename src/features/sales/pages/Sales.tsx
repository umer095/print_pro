import React, { useState } from 'react'
import { Search, Plus, Edit, Filter } from 'lucide-react'

const Sales = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Mock sales data
  const allSalesData = [
    { id: 'ORD-001', customer: 'John Doe', product: 'Business Cards', quantity: 500, amount: 125, status: 'Completed', date: '2024-12-10' },
    { id: 'ORD-002', customer: 'Sarah Smith', product: 'Flyers', quantity: 1000, amount: 280, status: 'Processing', date: '2024-12-10' },
    { id: 'ORD-003', customer: 'Mike Johnson', product: 'Banners', quantity: 2, amount: 450, status: 'Completed', date: '2024-12-09' },
    { id: 'ORD-004', customer: 'Emily Brown', product: 'Brochures', quantity: 300, amount: 195, status: 'Pending', date: '2024-12-09' },
    { id: 'ORD-005', customer: 'David Wilson', product: 'Posters', quantity: 50, amount: 175, status: 'Completed', date: '2024-12-08' },
    { id: 'ORD-006', customer: 'Lisa Anderson', product: 'Business Cards', quantity: 1000, amount: 250, status: 'Processing', date: '2024-12-08' },
    { id: 'ORD-007', customer: 'Tom Harris', product: 'Catalogs', quantity: 100, amount: 320, status: 'Completed', date: '2024-12-07' },
    { id: 'ORD-008', customer: 'Jennifer Lee', product: 'Stickers', quantity: 2000, amount: 180, status: 'Pending', date: '2024-12-07' },
  ]

  // Filter and search logic
  const filteredData = allSalesData.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status:any) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Processing': return 'bg-blue-100 text-blue-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleAdd = () => {
    alert('Add new order functionality')
  }

  const handleEdit = (orderId : any) => {
    alert(`Edit order: ${orderId}`)
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow">
        {/* Header with Add Button */}
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Sales Orders</h2>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Order
          </button>
        </div>

        {/* Search and Filter */}
        <div className="p-6 border-b flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by order ID, customer, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Processing">Processing</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length > 0 ? (
                filteredData.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.customer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.product}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${order.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(order.id)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No orders found matching your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Results count */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing {filteredData.length} of {allSalesData.length} orders
          </p>
        </div>
      </div>
    </div>
  )
}

export default Sales