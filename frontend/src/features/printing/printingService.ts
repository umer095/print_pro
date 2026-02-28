
// const PYTHON_API_URL = "http://127.0.0.1:8000"; // Ideally move this to import.meta.env.VITE_PYTHON_API_URL



// export const printingService = {
//   // 1. Arrange Artwork (Uploads files and settings)
//   arrangeArtwork: async (formData: FormData): Promise<any> => {
//     const response = await fetch(`${PYTHON_API_URL}/arrange`, {
//       method: "POST",
//       body: formData,
//     });

//     if (!response.ok) {
//       const error = await response.json();
//       throw new Error(error.detail || "Failed to arrange artwork");
//     }

//     return await response.json();
//   },

//   // 2. Download a generated sheet
//   downloadSheet: async (
//     downloadUrl: string,
//     fileName: string
//   ): Promise<boolean> => {
//     try {
//       const response = await fetch(`${PYTHON_API_URL}${downloadUrl}`);

//       if (!response.ok) {
//         throw new Error(`Failed to download ${fileName}`);
//       }

//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = fileName;
//       document.body.appendChild(a);
//       a.click();

//       // Cleanup
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(a);

//       return true;
//     } catch (error) {
//       console.error("Download error:", error);
//       return false;
//     }
//   },
// };
// printingService.ts - Updated for new Python backend

const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

const API_BASE_URL = "http://localhost:3000";
const PYTHON_API_URL = "http://127.0.0.1:8000"; // Direct Python FastAPI connection

// Available jersey templates
export const JERSEY_TEMPLATES = [
  { id: 'default', name: 'Classic Jersey', preview: '/templates/default.png' },
  { id: 'blue_splash', name: 'Blue Splash', preview: '/templates/blue_splash.png' },
  { id: 'red_triangle', name: 'Red Triangle', preview: '/templates/red_triangle.png' }
];

export interface FontOption {
  id: string;
  name: string;
  family: string;
  type: 'google' | 'local';
  source?: string;
  preview?: string;
}

export const AVAILABLE_FONTS: FontOption[] = [
  { id: 'Roboto', name: 'Roboto', family: 'Roboto', type: 'google' },
  { id: 'Open Sans', name: 'Open Sans', family: 'Open Sans', type: 'google' },
  { id: 'Lato', name: 'Lato', family: 'Lato', type: 'google' },
  { id: 'Montserrat', name: 'Montserrat', family: 'Montserrat', type: 'google' },
  { id: 'Oswald', name: 'Oswald', family: 'Oswald', type: 'google' },
  { id: 'Poppins', name: 'Poppins', family: 'Poppins', type: 'google' },
  { id: 'Raleway', name: 'Raleway', family: 'Raleway', type: 'google' },
  { id: 'Ubuntu', name: 'Ubuntu', family: 'Ubuntu', type: 'google' },
  { id: 'Bebas Neue', name: 'Bebas Neue', family: 'Bebas Neue', type: 'google' },
  { id: 'Anton', name: 'Anton', family: 'Anton', type: 'google' },
  { id: 'Russo One', name: 'Russo One', family: 'Russo One', type: 'google' },
  { id: 'Teko', name: 'Teko', family: 'Teko', type: 'google' },
  { id: 'Exo 2', name: 'Exo 2', family: 'Exo 2', type: 'google' },
  { id: 'Quantico', name: 'Quantico', family: 'Quantico', type: 'google' },
  { id: 'Chakra Petch', name: 'Chakra Petch', family: 'Chakra Petch', type: 'google' },
  { id: 'Fjalla One', name: 'Fjalla One', family: 'Fjalla One', type: 'google' },
  { id: 'Righteous', name: 'Righteous', family: 'Righteous', type: 'google' },
  { id: 'Permanent Marker', name: 'Permanent Marker', family: 'Permanent Marker', type: 'google' },
  { id: 'Luckiest Guy', name: 'Luckiest Guy', family: 'Luckiest Guy', type: 'google' },
  { id: 'Monoton', name: 'Monoton', family: 'Monoton', type: 'google' },
  { id: 'Michroma', name: 'Michroma', family: 'Michroma', type: 'google' },
  { id: 'Black Ops One', name: 'Black Ops One', family: 'Black Ops One', type: 'google' },
  { id: 'Bungee', name: 'Bungee', family: 'Bungee', type: 'google' },
  { id: 'Abril Fatface', name: 'Abril Fatface', family: 'Abril Fatface', type: 'google' },
  { id: 'Inter', name: 'Inter', family: 'Inter', type: 'google' },
  { id: 'BebasNeue.ttf', name: 'Bebas Neue (Local)', family: 'Bebas Neue', type: 'local', source: '/fonts/BebasNeue.ttf' },
  { id: 'Orbitron.ttf', name: 'Orbitron (Local)', family: 'Orbitron', type: 'local', source: '/fonts/Orbitron.ttf' },
  { id: 'Anton.ttf', name: 'Anton (Local)', family: 'Anton', type: 'local', source: '/fonts/Anton.ttf' },
  { id: 'RussoOne.ttf', name: 'Russo One (Local)', family: 'Russo One', type: 'local', source: '/fonts/RussoOne.ttf' }
];

export const DEFAULT_FONT_PREVIEW = "Aa Bb Cc";
export const JERSEY_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];

export interface LogoData {
  id: string;
  enabled: boolean;
  logoUrl?: string;
  name?: string;
  position: 'left_chest' | 'right_chest' | 'center' | 'top' | 'bottom' | 'custom';
  x_ratio?: number;
  y_ratio?: number;
  width_ratio?: number;
  opacity?: number;
  rotation?: number;
}

export interface MultipleLogosData {
  logos: LogoData[];
}

export const generateLogoId = (): string => {
  return `logo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const DEFAULT_LOGO_DATA: LogoData = {
  id: generateLogoId(),
  enabled: true,
  position: 'custom',
  x_ratio: 0.5,
  y_ratio: 0.85,
  width_ratio: 0.15,
  opacity: 1.0,
  rotation: 0
};

export const createLogoConfig = (): LogoData => ({
  id: generateLogoId(),
  enabled: true,
  position: 'custom',
  x_ratio: 0.5,
  y_ratio: 0.85,
  width_ratio: 0.15,
  opacity: 1.0,
  rotation: 0
});

export const printingService = {
  // ========================================
  // ARTWORK ARRANGEMENT - Updated for new Python backend
  // ========================================
  
  /**
   * NEW: Direct Python API call for artwork arrangement
   * Uses updated endpoint with widths_in instead of heights_in
   */
  arrangeArtwork: async (formData: FormData) => {
    try {
      const response = await fetch(`${PYTHON_API_URL}/arrange`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to arrange artwork");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Arrangement error:", error);
      throw new Error(error.message || "Failed to process artwork");
    }
  },

  /**
   * Download a generated sheet from Python backend
   * Updated to use /download/{filename} endpoint
   */
  downloadSheet: async (downloadUrl: string) => {
    try {
      // Extract filename from URL (format: /download/abc123.png)
      const filename = downloadUrl.split('/').pop() || 'sheet.png';
      
      const fullUrl = `${PYTHON_API_URL}${downloadUrl}`;
      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download ${filename}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
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

  /**
   * Get user artwork history from Node backend
   */
  getUserHistory: async () => {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/artwork/`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch history");
    }
    return await response.json();
  },

  // ========================================
  // JERSEY GENERATION METHODS
  // ========================================

  generateJerseyJob: async (
    file: File,
    config: {
      template_id: string;
      font_file: string;
      name_font_size: number;
      number_font_size: number;
      text_color: string;
      number_color: string;
      outline_color: string;
      name_x_ratio: number;
      name_y_ratio: number;
      number_x_ratio: number;
      number_y_ratio: number;
      spacing: number;
      customTemplateFile?: File | null;
      logos?: LogoData[] | null;
    }
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('template_id', config.template_id);
    formData.append('font_file', config.font_file);
    formData.append('name_font_size', config.name_font_size.toString());
    formData.append('number_font_size', config.number_font_size.toString());
    formData.append('text_color', config.text_color);
    formData.append('number_color', config.number_color);
    formData.append('outline_color', config.outline_color);
    formData.append('name_x_ratio', config.name_x_ratio.toString());
    formData.append('name_y_ratio', config.name_y_ratio.toString());
    formData.append('number_x_ratio', config.number_x_ratio.toString());
    formData.append('number_y_ratio', config.number_y_ratio.toString());
    formData.append('spacing', config.spacing.toString());
    formData.append('mode', 'batch');

    if (config.customTemplateFile) {
      formData.append('custom_template', config.customTemplateFile);
    }

    if (config.logos && config.logos.length > 0) {
      formData.append('logos_data', JSON.stringify(config.logos));
    }

    const response = await fetch(`${PYTHON_API_URL}/generate`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.message || "Failed to generate jersey PDF");
    }

    return await response.json();
  },

  generateIndividualJersey: async (config: {
    template_id: string;
    font_file: string;
    name_font_size: number;
    number_font_size: number;
    text_color: string;
    number_color: string;
    outline_color: string;
    name_x_ratio: number;
    name_y_ratio: number;
    number_x_ratio: number;
    number_y_ratio: number;
    spacing: number;
    manual_name: string;
    manual_number: string;
    manual_size: string;
    customTemplateFile?: File | null;
    logos?: LogoData[] | null;
  }) => {
    const formData = new FormData();
    formData.append('template_id', config.template_id);
    formData.append('font_file', config.font_file);
    formData.append('name_font_size', config.name_font_size.toString());
    formData.append('number_font_size', config.number_font_size.toString());
    formData.append('text_color', config.text_color);
    formData.append('number_color', config.number_color);
    formData.append('outline_color', config.outline_color);
    formData.append('name_x_ratio', config.name_x_ratio.toString());
    formData.append('name_y_ratio', config.name_y_ratio.toString());
    formData.append('number_x_ratio', config.number_x_ratio.toString());
    formData.append('number_y_ratio', config.number_y_ratio.toString());
    formData.append('spacing', config.spacing.toString());
    formData.append('manual_name', config.manual_name);
    formData.append('manual_number', config.manual_number);
    formData.append('manual_size', config.manual_size);
    formData.append('mode', 'individual');

    if (config.customTemplateFile) {
      formData.append('custom_template', config.customTemplateFile);
    }

    if (config.logos && config.logos.length > 0) {
      formData.append('logos_data', JSON.stringify(config.logos));
    }

    const response = await fetch(`${PYTHON_API_URL}/generate/individual`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.message || "Failed to generate individual jersey PDF");
    }

    return await response.json();
  },

  downloadJerseyPDF: async (fileUrl: string, customFilename?: string): Promise<boolean> => {
    try {
      const urlParts = fileUrl.split('/');
      const filename = urlParts[urlParts.length - 1] || 'jersey_output.pdf';

      const downloadUrl = `${PYTHON_API_URL}/download/${filename}`;

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = customFilename || filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
      }, 100);

      return true;
    } catch (err) {
      console.error("Direct download error:", err);
      
      try {
        const urlParts = fileUrl.split('/');
        const filename = urlParts[urlParts.length - 1] || 'jersey_output.pdf';
        const downloadUrl = `${PYTHON_API_URL}/download/${filename}`;

        const response = await fetch(downloadUrl, {
          method: 'GET',
          mode: 'cors',
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error('Empty PDF file received');
        }

        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = customFilename || filename;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
          document.body.removeChild(a);
        }, 100);

        return true;
      } catch (fallbackError) {
        console.error("Fallback download also failed:", fallbackError);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        alert(`Failed to download PDF: ${errorMessage}\n\nSolutions:\n1. Right-click download button > "Save link as..."\n2. Open directly: ${PYTHON_API_URL}/download/${fileUrl.split('/').pop()}`);
        return false;
      }
    }
  },

  getAvailableFonts: async (): Promise<string[]> => {
    try {
      const response = await fetch(`${PYTHON_API_URL}/`);
      if (!response.ok) throw new Error("Failed to fetch fonts");
      const data = await response.json();
      return data.available_fonts || AVAILABLE_FONTS.map(f => f.id);
    } catch (error) {
      console.error("Error fetching fonts:", error);
      return AVAILABLE_FONTS.map(f => f.id);
    }
  }
};

