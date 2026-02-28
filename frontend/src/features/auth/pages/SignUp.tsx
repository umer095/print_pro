import React, { useState } from "react";
import {
  Building2,
  MapPin,
  User,
  Mail,
  Phone,
  Users,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

interface FormData {
  companyName: string;
  address: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  teamSize: string;
  password: string;
}

interface FormErrors {
  companyName?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
}

interface ApiResponse {
  message: string;
  tenant?: {
    id: number;
    companyName: string;
  };
  user?: {
    id: number;
    fullName: string;
    email: string;
  };
  token?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

const SignUp: React.FC = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string>("");

  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    address: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    teamSize: "10",
    password: "",
  });

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
    setApiError("");
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.companyName || formData.companyName.length < 2) {
      newErrors.companyName = "Company name must be at least 2 characters";
    }

    if (!formData.fullName || formData.fullName.length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (): Promise<void> => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      const response = await fetch(
        "http://localhost:3000/api/tenants/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            companyName: formData.companyName,
            address: formData.address,
            fullName: formData.fullName,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
            password: formData.password,
          }),
        }
      );

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setApiError("Email already in use. Please use a different email.");
        } else if (response.status === 400 && data.errors) {
          // Handle validation errors from backend
          const backendErrors: FormErrors = {};
          data.errors.forEach((err) => {
            backendErrors[err.field as keyof FormErrors] = err.message;
          });
          setErrors(backendErrors);
        } else {
          setApiError(data.message || "Registration failed. Please try again.");
        }
        return;
      }

      // Store the token in localStorage
      if (data.token && data.user && data.tenant) {
        login(data.token, data.user, data.tenant);
      }

      // Navigate to dashboard on success
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      setApiError("Unable to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Purple Design */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-purple-600 to-purple-700 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 transform -rotate-12 -translate-x-32 -translate-y-32"></div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full text-white px-12">
          <h1 className="text-5xl font-bold mb-4">Join Us!</h1>
          <p className="text-xl text-purple-100">
            Create your account to get started.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-2">
              Create Account
            </h2>
            <p className="text-gray-500">Let's get you set up!</p>
          </div>

          {/* API Error Message */}
          {apiError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {apiError}
            </div>
          )}

          <div className="space-y-4">
            {/* Company Name */}
            <div>
              <div
                className={`flex items-center bg-white border ${
                  errors.companyName ? "border-red-500" : "border-gray-200"
                } rounded-lg p-4 focus-within:border-purple-500 transition-colors`}
              >
                <div className="bg-purple-600 p-2 rounded-lg mr-4">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <input
                  type="text"
                  name="companyName"
                  placeholder="Company Name"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
              {errors.companyName && (
                <p className="text-red-500 text-sm mt-1 ml-1">
                  {errors.companyName}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-4 focus-within:border-purple-500 transition-colors">
              <div className="bg-purple-600 p-2 rounded-lg mr-4">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <input
                type="text"
                name="address"
                placeholder="Address (Optional)"
                value={formData.address}
                onChange={handleChange}
                className="flex-1 outline-none text-gray-700 placeholder-gray-400"
              />
            </div>

            {/* Full Name */}
            <div>
              <div
                className={`flex items-center bg-white border ${
                  errors.fullName ? "border-red-500" : "border-gray-200"
                } rounded-lg p-4 focus-within:border-purple-500 transition-colors`}
              >
                <div className="bg-purple-600 p-2 rounded-lg mr-4">
                  <User className="w-5 h-5 text-white" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Your Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1 ml-1">
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <div
                className={`flex items-center bg-white border ${
                  errors.email ? "border-red-500" : "border-gray-200"
                } rounded-lg p-4 focus-within:border-purple-500 transition-colors`}
              >
                <div className="bg-purple-600 p-2 rounded-lg mr-4">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Your Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 ml-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <div
                className={`flex items-center bg-white border ${
                  errors.phoneNumber ? "border-red-500" : "border-gray-200"
                } rounded-lg p-4 focus-within:border-purple-500 transition-colors`}
              >
                <div className="bg-purple-600 p-2 rounded-lg mr-4">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="Your Phone Number (Optional)"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1 ml-1">
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* Team Size - Hidden field, not sent to backend */}
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-4 focus-within:border-purple-500 transition-colors">
              <div className="bg-purple-600 p-2 rounded-lg mr-4">
                <Users className="w-5 h-5 text-white" />
              </div>
              <input
                type="text"
                name="teamSize"
                placeholder="10"
                value={formData.teamSize}
                onChange={handleChange}
                className="flex-1 outline-none text-gray-700 placeholder-gray-400"
              />
            </div>

            {/* Password */}
            <div>
              <div
                className={`flex items-center bg-white border ${
                  errors.password ? "border-red-500" : "border-gray-200"
                } rounded-lg p-4 focus-within:border-purple-500 transition-colors`}
              >
                <div className="bg-purple-600 p-2 rounded-lg mr-4">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1 ml-1">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-4 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={loading}
              >
                BACK
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-purple-600 text-white font-semibold py-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed"
              >
                {loading ? "CREATING..." : "CREATE ACCOUNT"}
              </button>
            </div>

            {/* Footer Links */}
            <div className="text-center mt-6 space-y-2">
              <p className="text-gray-600">
                Already have an account?{" "}
                <a
                  href="/signin"
                  className="text-purple-600 font-semibold hover:underline"
                >
                  Sign In
                </a>
              </p>
              <a href="#" className="text-purple-600 text-sm hover:underline">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
