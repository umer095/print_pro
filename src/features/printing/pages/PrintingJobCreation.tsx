import React, { useState } from "react";
import type { ChangeEvent } from "react";
import {
  Upload,
  FileText,
  Palette,
  Type,
  AlertCircle,
  CheckCircle,
  Download,
} from "lucide-react";

interface GenerateResponse {
  message: string;
  output_files: string[];
}

const PrintingJobCreation: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [nameFont, setNameFont] = useState<string>("");
  const [numFont, setNumFont] = useState<string>("");
  const [nameColor, setNameColor] = useState<string>("white");
  const [numColor, setNumColor] = useState<string>("white");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (
        selectedFile.type === "text/csv" ||
        selectedFile.name.endsWith(".csv")
      ) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Please select a CSV file");
        setFile(null);
      }
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!file) {
      setError("Please select a CSV file");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    if (nameFont) formData.append("name_font", nameFont);
    if (numFont) formData.append("num_font", numFont);
    formData.append("name_color", nameColor);
    formData.append("num_color", numColor);

    try {
      // Replace with your actual API endpoint
      const response = await fetch("http://localhost:8000/generate/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GenerateResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate jerseys. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = (): void => {
    setFile(null);
    setNameFont("");
    setNumFont("");
    setNameColor("white");
    setNumColor("white");
    setResult(null);
    setError(null);
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-8xl max-h-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Jersey Printing - Job Creation
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              Upload player data and customize jersey designs
            </p>
          </div>

          <div className="p-6">
            {/* File Upload Section */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                CSV File <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="fileInput"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="fileInput"
                  className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">
                    {file ? file.name : "Choose CSV file"}
                  </span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Upload a CSV file with columns: name, number, size
              </p>
            </div>

            {/* Font Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Name Font
                </label>
                <input
                  type="text"
                  value={nameFont}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNameFont(e.target.value)
                  }
                  placeholder="e.g., Sekuya-Regular.ttf"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Font file name for player names
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Number Font
                </label>
                <input
                  type="text"
                  value={numFont}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNumFont(e.target.value)
                  }
                  placeholder="e.g., Sekuya-Regular.ttf"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Font file name for jersey numbers
                </p>
              </div>
            </div>

            {/* Color Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Name Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nameColor}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setNameColor(e.target.value)
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="color"
                    value={
                      nameColor === "white"
                        ? "#ffffff"
                        : nameColor === "black"
                        ? "#000000"
                        : nameColor
                    }
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setNameColor(e.target.value)
                    }
                    className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Number Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={numColor}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setNumColor(e.target.value)
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="color"
                    value={
                      numColor === "white"
                        ? "#ffffff"
                        : numColor === "black"
                        ? "#000000"
                        : numColor
                    }
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setNumColor(e.target.value)
                    }
                    className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={loading || !file}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Generate Jerseys
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="mx-6 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-800">
                    {result.message}
                  </p>
                </div>
              </div>

              {result.output_files && result.output_files.length > 0 && (
                <div className="mt-3 pl-8">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Generated Files:
                  </p>
                  <ul className="space-y-1">
                    {result.output_files.map((file: string, index: number) => (
                      <li
                        key={index}
                        className="text-sm text-gray-600 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4 text-green-600" />
                        {file}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-4">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            CSV Format Requirements
          </h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              • <strong>name:</strong> Player name to display on jersey
            </p>
            <p>
              • <strong>number:</strong> Jersey number
            </p>
            <p>
              • <strong>size:</strong> Jersey size (S, M, L, XL, XXL, 3XL)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintingJobCreation;
