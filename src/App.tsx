import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MainLayout } from "./components/layout/MainLayout";

// --- Feature Page Imports ---

// Auth
import SignUp from "./features/auth/pages/SignUp";
import SignIn from "./features/auth/pages/SignIn";

// Dashboard
import Dashboard from "./features/dashboard/pages/Dashboard";

// Inventory & Stores
import Inventory from "./features/inventory/pages/Inventory";
import RawMaterialStore from "./features/inventory/pages/RawMaterialStore";
import ReadyGoodStore from "./features/inventory/pages/ReadyGoodStore";

// Purchase & Vendors
import PurchaseOrders from "./features/purchase/pages/PurchaseOrders";
import Vendors from "./features/purchase/pages/Vendors";

// Printing
import ArtWorkUpload from "./features/printing/pages/ArtWorkUpload";
import PrintingJobCreation from "./features/printing/pages/PrintingJobCreation";
import VersionControl from "./features/printing/pages/VersionControl";
import PrintedVsRejected from "./features/printing/pages/PrintedVsRejected";
import ReportsPrintingOutput from "./features/printing/pages/ReportsPrintingOutput";
import PendingPrintingJobs from "./features/printing/pages/PendingPrintingJobs";
import RejectionReport from "./features/printing/pages/RejectionReport";

// Production
import GarmentProduction from "./features/production/pages/GarmentProduction";

// Other Modules
import Outsourcing from "./features/outsourcing/pages/Outsourcing";
import Dispatch from "./features/dispatch/pages/Dispatch";
import Accounting from "./features/accounting/pages/Accounting";
import Sales from "./features/sales/pages/Sales";
import HRM from "./features/hrm/pages/HRM";

// --- Routes ---

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/signin" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <>{children}</>
  );
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/signin"} replace />
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <SignUp />
          </PublicRoute>
        }
      />
      <Route
        path="/signin"
        element={
          <PublicRoute>
            <SignIn />
          </PublicRoute>
        }
      />

      {/* Main App Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Inventory & Stores */}
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Inventory />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/raw-material-store"
        element={
          <ProtectedRoute>
            <MainLayout>
              <RawMaterialStore />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ready-good-store"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ReadyGoodStore />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Purchase */}
      {/* Purchase */}
<Route
  path="/purchase/purchase-orders"
  element={
    <ProtectedRoute>
      <MainLayout>
        <PurchaseOrders />
      </MainLayout>
    </ProtectedRoute>
  }
/>
      <Route
        path="/vendors"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Vendors />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Printing */}
      <Route
        path="/inhouse-printing/printing-job-creation"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PrintingJobCreation />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inhouse-printing/art-work-upload"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ArtWorkUpload />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inhouse-printing/version-control"
        element={
          <ProtectedRoute>
            <MainLayout>
              <VersionControl />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inhouse-printing/printed-vs-rejected"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PrintedVsRejected />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inhouse-printing/daily-printing-output"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ReportsPrintingOutput />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inhouse-printing/pending-printing-jobs"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PendingPrintingJobs />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inhouse-printing/rejection-report"
        element={
          <ProtectedRoute>
            <MainLayout>
              <RejectionReport />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Production & Outsourcing */}
      <Route
        path="/outsourcing"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Outsourcing />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/garment-production"
        element={
          <ProtectedRoute>
            <MainLayout>
              <GarmentProduction />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Operations */}
      <Route
        path="/dispatch"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dispatch />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounting"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Accounting />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Sales />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hrm"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HRM />
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
