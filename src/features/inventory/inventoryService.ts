// Define Types here so they can be reused if needed,
// or keep them simple if you prefer defining them in the component.
// For a clean structure, we keep the API logic here.

const API_BASE_URL = "http://localhost:5000";

export const inventoryService = {
  // 1. Fetch Inventory
  getAll: async (token: string | null, params: URLSearchParams) => {
    const response = await fetch(`${API_BASE_URL}/inventory?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch inventory");
    }
    return response.json();
  },

  // 2. Create Item
  create: async (token: string | null, data: any) => {
    const response = await fetch(`${API_BASE_URL}/inventory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create inventory item");
    }
    return response.json();
  },

  // 3. Update Item
  update: async (token: string | null, id: number, data: any) => {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update inventory item");
    }
    return response.json();
  },

  // 4. Delete Item
  delete: async (token: string | null, id: number) => {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete inventory item");
    }
    return response.json();
  },
};
