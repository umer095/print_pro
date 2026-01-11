// import React, { useState, useEffect, useCallback } from "react";
// import {
//   FileText,
//   AlertCircle,
//   CheckCircle,
//   Download,
//   Loader2,
//   ChevronLeft,
//   ChevronRight,
//   Users,
//   User,
// } from "lucide-react";
// import JerseyCanvas from "../components/JerseyCanvas";
// import ControlPanel from "../components/ControlPanel";
// import ExcelUploader from "../components/ExcelUploader";
// import { printingService, generateLogoId } from "../printingService";

// interface GenerateResponse {
//   status: string;
//   message: string;
//   file_url: string;
//   filename: string;
// }

// interface PlayerData {
//   name: string;
//   number: string;
//   size: string;
// }

// // Multiple logo configuration for frontend state
// interface MultipleLogoConfig {
//   id: string;
//   url: string | null;
//   xRatio: number;
//   yRatio: number;
//   size: number;
//   name?: string;
// }

// // Mode selection types
// type DataMode = 'bulk' | 'individual' | null;

// const PrintingJobCreation: React.FC = () => {
//   // Data mode selection (initial screen)
//   const [dataMode, setDataMode] = useState<DataMode>(null);

//   // File state
//   const [file, setFile] = useState<File | null>(null);
//   const [previewData, setPreviewData] = useState<PlayerData[]>([]);
//   const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);

//   // Individual mode manual inputs
//   const [manualName, setManualName] = useState<string>('PLAYER');
//   const [manualNumber, setManualNumber] = useState<string>('10');
//   const [manualSize, setManualSize] = useState<string>('L');

//   // Template & Font settings
//   const [templateId, setTemplateId] = useState<string>("default");
//   const [fontFile, setFontFile] = useState<string>("BebasNeue.ttf");
//   const [fonts, setFonts] = useState<string[]>([]);

//   // Font mode
//   const [mode, setMode] = useState<'normal' | 'separate'>('normal');

//   // Font sizes
//   const [nameFontSize, setNameFontSize] = useState<number>(48);
//   const [numberFontSize, setNumberFontSize] = useState<number>(120);

//   // Colors
//   const [textColor, setTextColor] = useState<string>("#FFFFFF");
//   const [numberColor, setNumberColor] = useState<string>("#FFFFFF");
//   const [outlineColor, setOutlineColor] = useState<string>("#000000");

//   // Position ratios
//   const [nameXRatio, setNameXRatio] = useState<number>(0.5);
//   const [nameYRatio, setNameYRatio] = useState<number>(0.25);
//   const [numberXRatio, setNumberXRatio] = useState<number>(0.5);
//   const [numberYRatio, setNumberYRatio] = useState<number>(0.55);

//   // Spacing
//   const [spacing, setSpacing] = useState<number>(0);

//   // Sample data for preview
//   const [sampleName, setSampleName] = useState<string>("JOHN");
//   const [sampleNumber, setSampleNumber] = useState<string>("10");

//   // Custom template state
//   const [customTemplateFile, setCustomTemplateFile] = useState<File | null>(null);
//   const [customTemplateUrl, setCustomTemplateUrl] = useState<string | null>(null);

//   // Multiple logos state
//   const [logos, setLogos] = useState<MultipleLogoConfig[]>([]);
//   const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);

//   // UI state
//   const [loading, setLoading] = useState<boolean>(false);
//   const [result, setResult] = useState<GenerateResponse | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [activeTab, setActiveTab] = useState<"upload" | "design">("upload");

//   // Load available fonts on mount
//   useEffect(() => {
//     const loadFonts = async () => {
//       const availableFonts = await printingService.getAvailableFonts();
//       setFonts(availableFonts);
//       if (availableFonts.length > 0 && !availableFonts.includes(fontFile)) {
//         setFontFile(availableFonts[0]);
//       }
//     };
//     loadFonts();
//   }, []);

//   // Get current preview data based on mode
//   const getCurrentPreviewData = useCallback((): { name: string; number: string } => {
//     if (dataMode === 'bulk' && previewData.length > 0 && currentPlayerIndex >= 0 && currentPlayerIndex < previewData.length) {
//       const player = previewData[currentPlayerIndex];
//       return { name: player.name, number: player.number };
//     }
//     if (dataMode === 'individual') {
//       return { name: manualName, number: manualNumber };
//     }
//     return { name: sampleName, number: sampleNumber };
//   }, [dataMode, previewData, currentPlayerIndex, manualName, manualNumber, sampleName, sampleNumber]);

//   // Update sample data when inputs change
//   useEffect(() => {
//     const data = getCurrentPreviewData();
//     setSampleName(data.name);
//     setSampleNumber(data.number);
//   }, [currentPlayerIndex, previewData, manualName, manualNumber, dataMode, getCurrentPreviewData]);

//   const handleFileChange = (selectedFile: File | null) => {
//     setFile(selectedFile);
//     setError(null);
//     setResult(null);
//     setPreviewData([]);
//     setCurrentPlayerIndex(0);
//   };

//   const handleDataPreview = (data: PlayerData[]) => {
//     setPreviewData(data);
//     setCurrentPlayerIndex(0);
//     if (data.length > 0) {
//       setActiveTab("design");
//     }
//   };

//   const handlePlayerSelect = (index: number) => {
//     setCurrentPlayerIndex(index);
//   };

//   const handlePreviousPlayer = () => {
//     if (currentPlayerIndex > 0) {
//       setCurrentPlayerIndex(currentPlayerIndex - 1);
//     }
//   };

//   const handleNextPlayer = () => {
//     if (previewData.length > 0 && currentPlayerIndex < previewData.length - 1) {
//       setCurrentPlayerIndex(currentPlayerIndex + 1);
//     }
//   };

//   const handleManualNameChange = (name: string) => {
//     setManualName(name);
//   };

//   const handleManualNumberChange = (number: string) => {
//     setManualNumber(number);
//   };

//   // Handle position changes from drag
//   const handleNamePositionChange = (x: number, y: number) => {
//     setNameXRatio(x);
//     setNameYRatio(y);
//   };

//   const handleNumberPositionChange = (x: number, y: number) => {
//     setNumberXRatio(x);
//     setNumberYRatio(y);
//   };

//   // Multiple logo handlers
//   const handleLogoAdd = (file: File) => {
//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const url = event.target?.result as string;
//       const newLogo: MultipleLogoConfig = {
//         id: generateLogoId(),
//         url: url,
//         xRatio: 0.5,
//         yRatio: logos.length === 0 ? 0.85 : 0.1 + (logos.length * 0.15),
//         size: 50,
//         name: `Logo ${logos.length + 1}`
//       };
//       setLogos(prev => [...prev, newLogo]);
//       setSelectedLogoId(newLogo.id);
//     };
//     reader.readAsDataURL(file);
//   };

//   const handleLogoRemove = (id: string) => {
//     setLogos(prev => prev.filter(logo => logo.id !== id));
//     if (selectedLogoId === id) {
//       setSelectedLogoId(null);
//     }
//   };

//   const handleLogoPositionChange = (id: string, x: number, y: number) => {
//     setLogos(prev => prev.map(logo => 
//       logo.id === id ? { ...logo, xRatio: x, yRatio: y } : logo
//     ));
//   };

//   const handleLogoSizeChange = (id: string, size: number) => {
//     setLogos(prev => prev.map(logo => 
//       logo.id === id ? { ...logo, size } : logo
//     ));
//   };

//   const handleLogoUrlChange = (id: string, url: string) => {
//     setLogos(prev => prev.map(logo => 
//       logo.id === id ? { ...logo, url } : logo
//     ));
//   };

//   const handleResetPositions = (): void => {
//     setNameXRatio(0.5);
//     setNameYRatio(0.25);
//     setNumberXRatio(0.5);
//     setNumberYRatio(0.55);
//   };

//   const handleReset = (): void => {
//     setDataMode(null);
//     setFile(null);
//     setPreviewData([]);
//     setCurrentPlayerIndex(0);
//     setManualName('PLAYER');
//     setManualNumber('10');
//     setManualSize('L');
//     setTemplateId("default");
//     setFontFile("BebasNeue.ttf");
//     setMode('normal');
//     setNameFontSize(48);
//     setNumberFontSize(120);
//     setTextColor("#FFFFFF");
//     setNumberColor("#FFFFFF");
//     setOutlineColor("#000000");
//     setNameXRatio(0.5);
//     setNameYRatio(0.25);
//     setNumberXRatio(0.5);
//     setNumberYRatio(0.55);
//     setSpacing(0);
//     setSampleName("JOHN");
//     setSampleNumber("10");
//     setCustomTemplateFile(null);
//     setCustomTemplateUrl(null);
//     setLogos([]);
//     setSelectedLogoId(null);
//     setResult(null);
//     setError(null);
//     setActiveTab("upload");
//   };

//   // Get current player info for display
//   const getCurrentPlayerInfo = (): string => {
//     if (dataMode === 'bulk' && previewData.length > 0) {
//       const player = previewData[currentPlayerIndex];
//       return `${player.name} (#${player.number}) - ${player.size}`;
//     }
//     if (dataMode === 'individual') {
//       return `${manualName} (#${manualNumber}) - ${manualSize}`;
//     }
//     return `${sampleName} (#${sampleNumber})`;
//   };

//   // Convert logos to LogoData format for API
//   const getLogosData = () => {
//     if (logos.length === 0) return undefined;
    
//     return logos.map(logo => ({
//       id: logo.id,
//       enabled: true,
//       logoUrl: logo.url || undefined,
//       name: logo.name,
//       position: 'custom' as const,
//       x_ratio: logo.xRatio,
//       y_ratio: logo.yRatio,
//       width_ratio: logo.size / 300,
//       opacity: 1.0,
//       rotation: 0
//     }));
//   };

//   const handleSubmit = async (): Promise<void> => {
//     setLoading(true);
//     setError(null);
//     setResult(null);

//     const logosData = getLogosData();

//     try {
//       let response: GenerateResponse;

//       if (dataMode === 'individual') {
//         // Individual mode - generate single jersey
//         response = await printingService.generateIndividualJersey({
//           template_id: templateId,
//           font_file: fontFile,
//           name_font_size: nameFontSize,
//           number_font_size: numberFontSize,
//           text_color: textColor,
//           number_color: numberColor,
//           outline_color: outlineColor,
//           name_x_ratio: nameXRatio,
//           name_y_ratio: nameYRatio,
//           number_x_ratio: numberXRatio,
//           number_y_ratio: numberYRatio,
//           spacing: spacing,
//           manual_name: manualName,
//           manual_number: manualNumber,
//           manual_size: manualSize,
//           customTemplateFile: customTemplateFile,
//           logos: logosData,
//         });
//       } else {
//         // Bulk mode - generate from Excel
//         if (!file) {
//           throw new Error("Please select a CSV or Excel file for bulk mode");
//         }
//         response = await printingService.generateJerseyJob(file, {
//           template_id: templateId,
//           font_file: fontFile,
//           name_font_size: nameFontSize,
//           number_font_size: numberFontSize,
//           text_color: textColor,
//           number_color: numberColor,
//           outline_color: outlineColor,
//           name_x_ratio: nameXRatio,
//           name_y_ratio: nameYRatio,
//           number_x_ratio: numberXRatio,
//           number_y_ratio: numberYRatio,
//           spacing: spacing,
//           customTemplateFile: customTemplateFile,
//           logos: logosData,
//         });
//       }

//       setResult(response);
//     } catch (err) {
//       setError(
//         err instanceof Error
//           ? err.message
//           : "Failed to generate jerseys. Please try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDownload = async (): Promise<void> => {
//     if (!result?.file_url) {
//       setError('No file URL available for download');
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     try {
//       const success = await printingService.downloadJerseyPDF(
//         result.file_url,
//         result.filename
//       );
      
//       if (!success) {
//         setError('Download failed. Please check if the print-engine server is running on port 8000.');
//       }
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : 'Unknown error';
//       setError(`Download failed: ${errorMessage}`);
//       console.error('Download error:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Mode selection screen
//   if (dataMode === null) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
//         <div className="max-w-4xl mx-auto">
//           {/* Header */}
//           <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-6">
//             <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
//               <h1 className="text-2xl font-bold text-white flex items-center gap-2">
//                 <FileText className="w-6 h-6" />
//                 Jersey Printing - Job Creation
//               </h1>
//               <p className="text-blue-100 text-sm mt-1">
//                 Choose how you want to create your jerseys
//               </p>
//             </div>
//           </div>

//           {/* Mode Selection */}
//           <div className="bg-white rounded-lg shadow-xl p-8">
//             <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
//               Select Mode
//             </h2>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {/* Bulk Mode Card */}
//               <button
//                 onClick={() => setDataMode('bulk')}
//                 className="group p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
//               >
//                 <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
//                   <Users className="w-8 h-8 text-blue-600" />
//                 </div>
//                 <h3 className="text-xl font-semibold text-gray-800 mb-2">
//                   Bulk Mode
//                 </h3>
//                 <p className="text-gray-600 text-sm mb-4">
//                   Upload an Excel or CSV file with multiple player names and numbers to generate jerseys in batch.
//                 </p>
//                 <ul className="text-sm text-gray-500 space-y-1">
//                   <li>• Upload Excel/CSV file</li>
//                   <li>• Preview all players</li>
//                   <li>• Generate PDF for all at once</li>
//                 </ul>
//               </button>

//               {/* Individual Mode Card */}
//               <button
//                 onClick={() => setDataMode('individual')}
//                 className="group p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-left"
//               >
//                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
//                   <User className="w-8 h-8 text-green-600" />
//                 </div>
//                 <h3 className="text-xl font-semibold text-gray-800 mb-2">
//                   Individual Mode
//                 </h3>
//                 <p className="text-gray-600 text-sm mb-4">
//                   Enter name and number manually to create a single jersey design.
//                 </p>
//                 <ul className="text-sm text-gray-500 space-y-1">
//                   <li>• Manual name input</li>
//                   <li>• Manual number input</li>
//                   <li>• Generate single jersey</li>
//                 </ul>
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-6">
//           <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
//             <div>
//               <h1 className="text-2xl font-bold text-white flex items-center gap-2">
//                 <FileText className="w-6 h-6" />
//                 Jersey Printing - Job Creation
//               </h1>
//               <p className="text-blue-100 text-sm mt-1">
//                 {dataMode === 'bulk' ? 'Bulk Mode - Upload Excel/CSV' : 'Individual Mode - Manual Entry'}
//               </p>
//             </div>
//             <button
//               onClick={handleReset}
//               className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm"
//             >
//               Change Mode
//             </button>
//           </div>

//           {/* Tabs */}
//           <div className="flex border-b border-gray-200">
//             <button
//               onClick={() => setActiveTab("upload")}
//               className={`px-6 py-3 font-medium text-sm transition-colors ${
//                 activeTab === "upload"
//                   ? "text-blue-600 border-b-2 border-blue-600"
//                   : "text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               1. {dataMode === 'bulk' ? 'Upload Data' : 'Enter Details'}
//             </button>
//             <button
//               onClick={() => setActiveTab("design")}
//               className={`px-6 py-3 font-medium text-sm transition-colors ${
//                 activeTab === "design"
//                   ? "text-blue-600 border-b-2 border-blue-600"
//                   : "text-gray-500 hover:text-gray-700"
//               }`}
//               disabled={dataMode === 'bulk' && !file}
//             >
//               2. Design {dataMode === 'bulk' && !file && "🔒"}
//             </button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Left Panel - Controls & Upload */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* Upload/Details Section */}
//             {activeTab === "upload" && (
//               <div className="bg-white rounded-lg shadow-md p-6">
//                 <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
//                   {dataMode === 'bulk' ? (
//                     <>
//                       <FileText className="w-5 h-5 text-blue-600" />
//                       Upload Player Data
//                     </>
//                   ) : (
//                     <>
//                       <User className="w-5 h-5 text-green-600" />
//                       Jersey Details
//                     </>
//                   )}
//                 </h2>
                
//                 {dataMode === 'bulk' ? (
//                   <ExcelUploader
//                     file={file}
//                     onFileChange={handleFileChange}
//                     onDataPreview={handleDataPreview}
//                   />
//                 ) : (
//                   <div className="space-y-4">
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="text-sm font-medium text-gray-700 block mb-1">Name</label>
//                         <input
//                           type="text"
//                           value={manualName}
//                           onChange={(e) => handleManualNameChange(e.target.value.toUpperCase())}
//                           maxLength={15}
//                           placeholder="PLAYER NAME"
//                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 uppercase"
//                         />
//                       </div>
//                       <div>
//                         <label className="text-sm font-medium text-gray-700 block mb-1">Number</label>
//                         <input
//                           type="text"
//                           value={manualNumber}
//                           onChange={(e) => handleManualNumberChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
//                           maxLength={3}
//                           placeholder="99"
//                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
//                         />
//                       </div>
//                     </div>
//                     <div>
//                       <label className="text-sm font-medium text-gray-700 block mb-1">Size</label>
//                       <select
//                         value={manualSize}
//                         onChange={(e) => setManualSize(e.target.value)}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
//                       >
//                         <option value="XS">XS</option>
//                         <option value="S">S</option>
//                         <option value="M">M</option>
//                         <option value="L">L</option>
//                         <option value="XL">XL</option>
//                         <option value="XXL">XXL</option>
//                         <option value="3XL">3XL</option>
//                         <option value="4XL">4XL</option>
//                       </select>
//                     </div>
//                     <button
//                       onClick={() => setActiveTab("design")}
//                       className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
//                     >
//                       Continue to Design
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}

//               {/* Design Section */}
//             {activeTab === "design" && (
//               <div className="bg-white rounded-lg shadow-md p-6">
//                 <ControlPanel
//                   templateId={templateId}
//                   onTemplateChange={setTemplateId}
//                   customTemplateFile={customTemplateFile}
//                   onCustomTemplateUpload={setCustomTemplateFile}
//                   customTemplateUrl={customTemplateUrl}
//                   onCustomTemplateUrlChange={setCustomTemplateUrl}
//                   mode={mode}
//                   onModeChange={setMode}
//                   fontFile={fontFile}
//                   onFontChange={setFontFile}
//                   nameFontSize={nameFontSize}
//                   onNameFontSizeChange={setNameFontSize}
//                   numberFontSize={numberFontSize}
//                   onNumberFontSizeChange={setNumberFontSize}
//                   textColor={textColor}
//                   onTextColorChange={setTextColor}
//                   numberColor={numberColor}
//                   onNumberColorChange={setNumberColor}
//                   outlineColor={outlineColor}
//                   onOutlineColorChange={setOutlineColor}
//                   nameXRatio={nameXRatio}
//                   onNameXRatioChange={setNameXRatio}
//                   nameYRatio={nameYRatio}
//                   onNameYRatioChange={setNameYRatio}
//                   numberXRatio={numberXRatio}
//                   onNumberXRatioChange={setNumberXRatio}
//                   numberYRatio={numberYRatio}
//                   onNumberYRatioChange={setNumberYRatio}
//                   onResetPositions={handleResetPositions}
//                   spacing={spacing}
//                   onSpacingChange={setSpacing}
//                   sampleName={sampleName}
//                   onSampleNameChange={setSampleName}
//                   sampleNumber={sampleNumber}
//                   onSampleNumberChange={setSampleNumber}
//                   players={previewData}
//                   selectedPlayerIndex={currentPlayerIndex}
//                   onPlayerSelect={handlePlayerSelect}
//                   generationMode={dataMode === 'individual' ? 'individual' : 'batch'}
//                   onGenerationModeChange={() => {}}
//                   manualName={manualName}
//                   onManualNameChange={handleManualNameChange}
//                   manualNumber={manualNumber}
//                   onManualNumberChange={handleManualNumberChange}
//                   manualSize={manualSize}
//                   onManualSizeChange={setManualSize}
//                   // Multiple logos props
//                   logos={logos}
//                   selectedLogoId={selectedLogoId}
//                   onLogoAdd={handleLogoAdd}
//                   onLogoRemove={handleLogoRemove}
//                   onLogoSelect={setSelectedLogoId}
//                   onLogoPositionChange={handleLogoPositionChange}
//                   onLogoSizeChange={handleLogoSizeChange}
//                   onLogoUrlChange={handleLogoUrlChange}
//                 />
//               </div>
//             )}

//             {/* Action Buttons */}
//             <div className="bg-white rounded-lg shadow-md p-6">
//               <div className="flex gap-3">
//                 <button
//                   onClick={handleSubmit}
//                   disabled={loading || (dataMode === 'bulk' && !file)}
//                   className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
//                 >
//                   {loading ? (
//                     <>
//                       <Loader2 className="w-5 h-5 animate-spin" />
//                       Processing...
//                     </>
//                   ) : (
//                     <>
//                       <FileText className="w-5 h-5" />
//                       {dataMode === 'individual' ? 'Generate Jersey' : 'Generate All Jerseys'}
//                     </>
//                   )}
//                 </button>

//                 <button
//                   onClick={handleReset}
//                   className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
//                 >
//                   Reset
//                 </button>
//               </div>
//             </div>

//             {/* Error Message */}
//             {error && (
//               <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
//                 <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
//                 <div>
//                   <p className="font-semibold text-red-800">Error</p>
//                   <p className="text-red-600 text-sm">{error}</p>
//                 </div>
//               </div>
//             )}

//             {/* Success Result */}
//             {result && (
//               <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
//                 <div className="flex items-start gap-3 mb-3">
//                   <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
//                   <div>
//                     <p className="font-semibold text-green-800">{result.message}</p>
//                     <p className="text-green-600 text-sm">
//                       File: {result.filename}
//                     </p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={handleDownload}
//                   className="ml-8 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
//                 >
//                   <Download className="w-4 h-4" />
//                   Download PDF
//                 </button>
//               </div>
//             )}
//           </div>

//           {/* Right Panel - Live Preview */}
//           <div className="lg:col-span-1">
//             <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
//               <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
//                 <span className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded"></span>
//                 Live Preview
//               </h2>

//               {/* Player navigation for bulk mode */}
//               {dataMode === 'bulk' && previewData.length > 0 && (
//                 <div className="flex items-center justify-between mb-4 bg-gray-50 rounded-lg p-2">
//                   <button
//                     onClick={handlePreviousPlayer}
//                     disabled={currentPlayerIndex === 0}
//                     className="p-1 text-gray-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
//                   >
//                     <ChevronLeft className="w-5 h-5" />
//                   </button>
//                   <span className="text-sm text-gray-600">
//                     Player {currentPlayerIndex + 1} of {previewData.length}
//                   </span>
//                   <button
//                     onClick={handleNextPlayer}
//                     disabled={currentPlayerIndex >= previewData.length - 1}
//                     className="p-1 text-gray-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
//                   >
//                     <ChevronRight className="w-5 h-5" />
//                   </button>
//                 </div>
//               )}

//               {/* Current player info */}
//               <div className="mb-4 bg-indigo-50 rounded-lg p-2 text-center">
//                 <span className="text-sm font-medium text-indigo-700">
//                   {getCurrentPlayerInfo()}
//                 </span>
//               </div>

//               <div className="flex justify-center mb-4">
//                 <JerseyCanvas
//                   templateId={templateId}
//                   customTemplateUrl={customTemplateUrl}
//                   fontFile={fontFile}
//                   nameFontSize={nameFontSize}
//                   numberFontSize={numberFontSize}
//                   textColor={textColor}
//                   numberColor={numberColor}
//                   outlineColor={outlineColor}
//                   nameXRatio={nameXRatio}
//                   nameYRatio={nameYRatio}
//                   numberXRatio={numberXRatio}
//                   numberYRatio={numberYRatio}
//                   spacing={spacing}
//                   mode={mode}
//                   sampleName={sampleName}
//                   sampleNumber={sampleNumber}
//                   onNamePositionChange={handleNamePositionChange}
//                   onNumberPositionChange={handleNumberPositionChange}
//                   // Multiple logos props
//                   logos={logos}
//                   selectedLogoId={selectedLogoId}
//                   onLogoSelect={setSelectedLogoId}
//                   onLogoPositionChange={handleLogoPositionChange}
//                   onLogoSizeChange={handleLogoSizeChange}
//                   onLogoRemove={handleLogoRemove}
//                   onLogoAdd={handleLogoAdd}
//                 />
//               </div>

//               {/* Preview Info */}
//               <div className="bg-gray-50 rounded-lg p-3 text-sm">
//                 <p className="text-gray-600 mb-2">
//                   <span className="font-medium">Font:</span>{" "}
//                   {fontFile.replace(".ttf", "").replace(".ttc", "")}
//                 </p>
//                 <p className="text-gray-600 mb-2">
//                   <span className="font-medium">Mode:</span>{" "}
//                   {mode === 'normal' ? 'Normal' : 'Separate Sizes'}
//                 </p>
//                 <p className="text-gray-600">
//                   <span className="font-medium">Players:</span> {dataMode === 'bulk' ? previewData.length || "1" : "1"}
//                 </p>
//                 <p className="text-gray-600">
//                   <span className="font-medium">Logos:</span> {logos.length}
//                 </p>
//               </div>

//               {/* Preview Sample Data (Bulk mode) */}
//               {dataMode === 'bulk' && previewData.length > 0 && (
//                 <div className="mt-4">
//                   <p className="text-sm font-medium text-gray-700 mb-2">
//                     Sample Players:
//                   </p>
//                   <div className="space-y-1 max-h-32 overflow-auto">
//                     {previewData.slice(0, 5).map((player, idx) => (
//                       <div
//                         key={idx}
//                         className={`flex justify-between text-sm px-2 py-1 rounded cursor-pointer ${
//                           idx === currentPlayerIndex
//                             ? 'bg-blue-100 text-blue-800'
//                             : 'bg-gray-50 text-gray-600'
//                         }`}
//                         onClick={() => handlePlayerSelect(idx)}
//                       >
//                         <span>{player.name}</span>
//                         <span className="text-gray-400">
//                           #{player.number} ({player.size})
//                         </span>
//                       </div>
//                     ))}
//                     {previewData.length > 5 && (
//                       <p className="text-xs text-gray-400 text-center">
//                         ...and {previewData.length - 5} more
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Info Card (only for bulk mode) */}
//         {dataMode === 'bulk' && (
//           <div className="mt-6 bg-white rounded-lg shadow-md p-4">
//             <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
//               <AlertCircle className="w-5 h-5 text-blue-600" />
//               CSV/Excel Format Requirements
//             </h3>
//             <div className="text-sm text-gray-600 space-y-1">
//               <p>
//                 • <strong>name:</strong> Player name to display on jersey
//               </p>
//               <p>
//                 • <strong>number:</strong> Jersey number (1-999)
//               </p>
//               <p>
//                 • <strong>size:</strong> Jersey size (XS, S, M, L, XL, XXL, 3XL, 4XL)
//               </p>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PrintingJobCreation;

