import React, { useState, useEffect, useRef } from "react";
import { Mail, Lock, Eye, EyeOff, Key } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

interface LoginResponse {
  message: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  };
  tenant: {
    id: number;
    companyName: string;
    address?: string;
    phoneNumber?: string;
  };
  token: string;
}

const SignIn: React.FC = () => {
  const [view, setView] = useState<"login" | "forgot">("login");

  // Login states
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Forgot password states
  const [step, setStep] = useState<"email" | "otp">("email");
  const [forgotEmail, setForgotEmail] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const [forgotError, setForgotError] = useState<string>("");
  const [resetError, setResetError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const timeoutRef = useRef<number | null>(null);

  // Load saved email only on mount
  useEffect(() => {
    const savedRememberMe = localStorage.getItem("rememberMe");
    const savedEmail = localStorage.getItem("savedEmail");

    if (savedRememberMe === "true" && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
        }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError("Invalid email or password");
        } else if (response.status === 400) {
          setError(data.message || "Please provide valid credentials");
        } else {
          setError("Login failed. Please try again.");
        }
        return;
      }

      // Handle "Remember Me"
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("savedEmail", email);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("savedEmail");
      }

      // Store authentication data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("tenant", JSON.stringify(data.tenant));
      login(data.token, data.user, data.tenant);
      navigate("/dashboard");
      setError("");
    } catch (error) {
      console.error("Login error:", error);
      setError("Unable to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotEmailSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    setForgotError("");

    if (!forgotEmail) {
      setForgotError("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotError("Please enter a valid email address");
      return;
    }

    setForgotLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/forgot-password",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: forgotEmail.toLowerCase(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setForgotError(data.message || "Failed to send OTP. Please try again.");
        return;
      }

      setStep("otp");
      setForgotError("");
      setResetError("");
    } catch (error) {
      console.error("Forgot password error:", error);
      setForgotError(
        "Unable to connect to the server. Please try again later."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    setResetError("");

    if (!otp || !newPassword) {
      setResetError("Please enter both OTP and new password");
      return;
    }

    if (otp.length !== 6) {
      setResetError("OTP must be 6 digits");
      return;
    }

    if (newPassword.length < 8) {
      setResetError("New password must be at least 8 characters long");
      return;
    }

    setResetLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/reset-password",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: forgotEmail.toLowerCase(),
            otp,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setResetError(
          data.message || "Failed to reset password. Please try again."
        );
        return;
      }

      setSuccessMessage(
        "Password has been reset successfully! Redirecting to login..."
      );

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        switchToLogin();
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Reset password error:", error);
      setResetError("Unable to connect to the server. Please try again later.");
    } finally {
      setResetLoading(false);
    }
  };

  const switchToForgot = () => {
    setView("forgot");
    setError("");
    setStep("email");
    setForgotError("");
    setResetError("");
    setSuccessMessage("");
    setForgotEmail("");
    setOtp("");
    setNewPassword("");
    setShowNewPassword(false);
  };

  const switchToLogin = () => {
    setView("login");
    setError("");
    setForgotError("");
    setResetError("");
    setSuccessMessage("");
    setStep("email");
    setForgotEmail("");
    setOtp("");
    setNewPassword("");
    setShowPassword(false);
    setShowNewPassword(false);
  };

  const renderLoginForm = () => (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Hello!</h1>
        <p className="text-gray-500">Sign in to your account</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-purple-600 p-2 rounded-lg">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            onKeyPress={(e) => e.key === "Enter" && handleLoginSubmit(e)}
            className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            disabled={loading}
            autoComplete="email"
          />
        </div>

        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-purple-600 p-2 rounded-lg">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            onKeyPress={(e) => e.key === "Enter" && handleLoginSubmit(e)}
            className="w-full pl-16 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            disabled={loading}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 border-2 border-gray-300 rounded cursor-pointer accent-purple-600"
              disabled={loading}
            />
            <span className="text-sm text-gray-600">Remember me</span>
          </label>
          <button
            type="button"
            onClick={switchToForgot}
            className="text-sm text-gray-600 hover:text-purple-600"
            disabled={loading}
          >
            Forgot password?
          </button>
        </div>

        <button
          type="button"
          onClick={handleLoginSubmit}
          disabled={loading}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed"
        >
          {loading ? "SIGNING IN..." : "SIGN IN"}
        </button>

        <div className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <a
            href="/signup"
            className="text-purple-600 hover:underline font-medium"
          >
            Create
          </a>
        </div>

        <div className="text-center">
          <a href="#" className="text-sm text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );

  const renderForgotForm = () => (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {step === "email" ? "Forgot Password?" : "Reset Your Password"}
        </h1>
        <p className="text-gray-500">
          {step === "email"
            ? "Enter your email to receive a reset OTP"
            : "Enter the OTP sent to your email and your new password"}
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
          {successMessage}
        </div>
      )}

      {step === "email" ? (
        <div>
          {forgotError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {forgotError}
            </div>
          )}

          <div className="space-y-6">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-purple-600 p-2 rounded-lg">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <input
                type="email"
                placeholder="E-mail"
                value={forgotEmail}
                onChange={(e) => {
                  setForgotEmail(e.target.value);
                  setForgotError("");
                }}
                onKeyPress={(e) =>
                  e.key === "Enter" && handleForgotEmailSubmit(e)
                }
                className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                disabled={forgotLoading}
                autoComplete="email"
              />
            </div>

            <button
              type="button"
              onClick={handleForgotEmailSubmit}
              disabled={forgotLoading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed"
            >
              {forgotLoading ? "SENDING OTP..." : "SEND RESET OTP"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={switchToLogin}
                className="text-sm text-gray-600 hover:text-purple-600"
                disabled={forgotLoading}
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {resetError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {resetError}
            </div>
          )}

          <div className="space-y-6">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-purple-600 p-2 rounded-lg">
                <Key className="w-5 h-5 text-white" />
              </div>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setResetError("");
                }}
                maxLength={6}
                className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                disabled={resetLoading}
                autoComplete="one-time-code"
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-purple-600 p-2 rounded-lg">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New Password (min. 8 characters)"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setResetError("");
                }}
                onKeyPress={(e) => e.key === "Enter" && handleResetSubmit(e)}
                className="w-full pl-16 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                disabled={resetLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={resetLoading}
              >
                {showNewPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetSubmit}
              disabled={resetLoading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed"
            >
              {resetLoading ? "RESETTING..." : "RESET PASSWORD"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={switchToLogin}
                className="text-sm text-gray-600 hover:text-purple-600"
                disabled={resetLoading}
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full flex">
        <div className="w-full md:w-1/2 p-12">
          {view === "login" ? renderLoginForm() : renderForgotForm()}
        </div>

        <div className="hidden md:block md:w-1/2 bg-white relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <svg
              className="h-full w-full"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <path
                d="M 55 0 C 75 20, 95 40, 95 60 S 75 80, 50 100 L 100 100 L 100 0 Z"
                fill="url(#gradient-wave)"
              />
              <defs>
                <linearGradient
                  id="gradient-wave"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative h-full flex items-center justify-center">
            <div className="text-center px-8">
              <h2 className="text-4xl font-bold text-gray-800 mb-2">
                {view === "login" ? "Welcome Back!" : "Reset Your Password"}
              </h2>
              <p className="text-gray-600 text-lg">Print Pro</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
