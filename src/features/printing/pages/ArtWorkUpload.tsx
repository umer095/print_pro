import React, { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  Upload,
  Settings,
  AlertCircle,
  CheckCircle2,
  Info,
  Trash2,
} from "lucide-react";
import { printingService } from "../printingService"; // Import the service

interface HeightConfig {
  filename: string;
  height_in: number;
  width_in?: number;
  quantity: number;
}

interface AlertState {
  type: "error" | "success" | "info" | null;
  message: string;
}

const ArtWorkUpload: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [configs, setConfigs] = useState<HeightConfig[]>([]);
  const [sheetWidth, setSheetWidth] = useState<number>(22.5);
  const [spacing, setSpacing] = useState<number>(0);
  const [margin, setMargin] = useState<number>(0);
  const [dpi, setDpi] = useState<number>(300);
  const [maxHeight, setMaxHeight] = useState<number>(80);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [alert, setAlert] = useState<AlertState>({ type: null, message: "" });

  const showAlert = (type: "error" | "success" | "info", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: null, message: "" }), 5000);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const newFiles = Array.from(e.target.files || []);
    const pngFiles = newFiles.filter((file) => file.type === "image/png");

    if (pngFiles.length !== newFiles.length) {
      showAlert("error", "Only PNG files are accepted");
    }

    setFiles([...files, ...pngFiles]);

    // Auto-generate configuration for new files
    if (pngFiles.length > 0) {
      const newConfigs = pngFiles.map((file) => ({
        filename: file.name,
        height_in: 1,
        quantity: 1,
      }));
      setConfigs([...configs, ...newConfigs]);
    }
  };

  const removeFile = (index: number): void => {
    const fileName = files[index].name;
    const newFiles = files.filter((_, i) => i !== index);
    const newConfigs = configs.filter((c) => c.filename !== fileName);
    setFiles(newFiles);
    setConfigs(newConfigs);
  };

  const updateConfig = (
    filename: string,
    field: keyof HeightConfig,
    value: number | undefined
  ): void => {
    setConfigs(
      configs.map((config) =>
        config.filename === filename ? { ...config, [field]: value } : config
      )
    );
  };

  const validateForm = (): boolean => {
    if (files.length === 0) {
      showAlert("error", "Please upload at least one PNG file");
      return false;
    }

    if (configs.length === 0) {
      showAlert("error", "Please configure at least one image");
      return false;
    }

    for (const config of configs) {
      if (!config.height_in || config.height_in <= 0) {
        showAlert("error", `Invalid height for ${config.filename}`);
        return false;
      }
      if (!config.quantity || config.quantity <= 0) {
        showAlert("error", `Invalid quantity for ${config.filename}`);
        return false;
      }
      if (config.width_in !== undefined && config.width_in <= 0) {
        showAlert("error", `Invalid width for ${config.filename}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (
    e: FormEvent<HTMLButtonElement>
  ): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    const formData = new FormData();

    try {
      // Add files in config order and prepare CSV strings
      const heights: string[] = [];
      const quantities: string[] = [];
      const widths: string[] = [];

      configs.forEach((config) => {
        const file = files.find((f) => f.name === config.filename);
        if (file) {
          formData.append("files", file);
          heights.push(config.height_in.toString());
          quantities.push(config.quantity.toString());
          widths.push(config.width_in ? config.width_in.toString() : "");
        }
      });

      // Send as comma-separated strings (backend format)
      formData.append("heights_in", heights.join(","));
      formData.append("quantities", quantities.join(","));
      if (widths.some((w) => w)) {
        formData.append("widths_in", widths.join(","));
      }
    } catch (e) {
      showAlert("error", "Failed to process files");
      setIsLoading(false);
      return;
    }

    formData.append("sheet_width_in", sheetWidth.toString());
    formData.append("spacing_in", spacing.toString());
    formData.append("margin_in", margin.toString());
    formData.append("dpi", dpi.toString());
    formData.append("sheet_max_height_in", maxHeight.toString());

    try {
      // Use the Service to arrange artwork
      const result = await printingService.arrangeArtwork(formData);

      if (
        result.status === "success" &&
        result.results &&
        result.results.length > 0
      ) {
        // Download all generated sheets using the service
        for (let i = 0; i < result.results.length; i++) {
          const sheet = result.results[i];

          const success = await printingService.downloadSheet(
            sheet.download_url,
            sheet.file
          );

          if (!success) {
            showAlert("error", `Failed to download sheet ${sheet.print}`);
          }

          // Small delay between downloads to prevent browser blocking
          if (i < result.results.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }

        // Show success message with summary
        const totalLogos = configs.reduce((sum, c) => sum + c.quantity, 0);
        const avgUtilization =
          result.results.reduce(
            (sum: any, r: any) => sum + r.utilization_percent,
            0
          ) / result.results.length;

        const statsMessage = `Success! Generated ${
          result.total_prints
        } print sheet${
          result.total_prints > 1 ? "s" : ""
        } with ${totalLogos} logos (avg ${avgUtilization.toFixed(
          1
        )}% utilization)${
          result.unplaced_logos > 0
            ? ` - Warning: ${result.unplaced_logos} logos couldn't fit`
            : ""
        }`;

        showAlert(result.unplaced_logos > 0 ? "info" : "success", statsMessage);
      } else {
        showAlert("error", "No print sheets generated");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      showAlert(
        "error",
        error.message || "Network error. Please check your connection."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = (): void => {
    setFiles([]);
    setConfigs([]);
    setSheetWidth(22.5);
    setSpacing(0);
    setMargin(0);
    setDpi(300);
    setMaxHeight(80);
    setAlert({ type: null, message: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Upload size={32} />
              Artwork Arranger
            </h1>
            <p className="text-indigo-100 mt-2">
              Upload and arrange your artwork files with custom settings
            </p>
          </div>

          <div className="p-8">
            {alert.type && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                  alert.type === "error"
                    ? "bg-red-50 text-red-800 border border-red-200"
                    : alert.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-blue-50 text-blue-800 border border-blue-200"
                }`}
              >
                {alert.type === "error" && (
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                )}
                {alert.type === "success" && (
                  <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
                )}
                {alert.type === "info" && (
                  <Info size={20} className="flex-shrink-0 mt-0.5" />
                )}
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
            )}

            {/* File Upload Section */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Step 1: Upload PNG Files <span className="text-red-500">*</span>
              </label>

              <div className="border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors bg-indigo-50/50">
                <input
                  type="file"
                  multiple
                  accept="image/png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-indigo-400 mb-3" />
                  <p className="text-gray-600 font-medium">
                    Click to upload PNG files
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Multiple files supported
                  </p>
                </label>
              </div>
            </div>

            {/* Image Configuration Section */}
            {files.length > 0 && (
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Step 2: Configure Each Image{" "}
                  <span className="text-red-500">*</span>
                </label>

                <div className="space-y-4">
                  {configs.map((config, index) => (
                    <div
                      key={config.filename}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-5"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-indigo-100 text-indigo-700 rounded-lg px-3 py-1 text-sm font-semibold">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {config.filename}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(
                                files.find((f) => f.name === config.filename)
                                  ?.size || 0 / 1024
                              ).toFixed(1)}{" "}
                              KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Remove this file"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Height (inches){" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={config.height_in}
                            onChange={(e) =>
                              updateConfig(
                                config.filename,
                                "height_in",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            placeholder="e.g., 1.5"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Width (inches){" "}
                            <span className="text-gray-400">(optional)</span>
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={config.width_in || ""}
                            onChange={(e) =>
                              updateConfig(
                                config.filename,
                                "width_in",
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            placeholder="Auto"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Quantity (copies){" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={config.quantity}
                            onChange={(e) =>
                              updateConfig(
                                config.filename,
                                "quantity",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            placeholder="e.g., 10"
                            required
                          />
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-2">
                        <strong>Preview:</strong> {config.quantity} copies at{" "}
                        {config.height_in}" height
                        {config.width_in && ` × ${config.width_in}" width`}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-sm text-indigo-800">
                    <strong>Total:</strong>{" "}
                    {configs.reduce((sum, c) => sum + c.quantity, 0)} logos will
                    be arranged
                  </p>
                </div>
              </div>
            )}

            {/* Settings Grid */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="text-indigo-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-800">
                  Step 3: Layout Settings
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sheet Width (inches) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={sheetWidth}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setSheetWidth(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Sheet Height (inches)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={maxHeight}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setMaxHeight(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DPI (Resolution)
                  </label>
                  <input
                    type="number"
                    value={dpi}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setDpi(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spacing Between Images (inches)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={spacing}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setSpacing(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sheet Margin (inches)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={margin}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setMargin(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || files.length === 0}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Arrange & Download"
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtWorkUpload;
