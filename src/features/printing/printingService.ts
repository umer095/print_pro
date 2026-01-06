const PYTHON_API_URL = "http://127.0.0.1:8000"; // Ideally move this to import.meta.env.VITE_PYTHON_API_URL

export const printingService = {
  // 1. Arrange Artwork (Uploads files and settings)
  arrangeArtwork: async (formData: FormData): Promise<any> => {
    const response = await fetch(`${PYTHON_API_URL}/arrange`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to arrange artwork");
    }

    return await response.json();
  },

  // 2. Download a generated sheet
  downloadSheet: async (
    downloadUrl: string,
    fileName: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(`${PYTHON_API_URL}${downloadUrl}`);

      if (!response.ok) {
        throw new Error(`Failed to download ${fileName}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return true;
    } catch (error) {
      console.error("Download error:", error);
      return false;
    }
  },
};
