import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../components/ui/input-otp";
import {
  Scale,
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  Mail,
  Shield,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

export const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showFeeSecurityKey, setShowFeeSecurityKey] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    feeSecurityKey: "",
    firmName: "",
    phoneNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [timeZoneOffset, setTimeZoneOffset] = useState(0);

  useEffect(() => {
    const offset = new Date().getTimezoneOffset() / -60;
    setTimeZoneOffset(offset);
  }, []);

  const validateStep = () => {
    const newErrors: { [key: string]: string } = {};

    if (step === 1) {
      if (!formData.firstName.trim())
        newErrors.firstName = "First name is required";
      else if (formData.firstName.length > 50)
        newErrors.firstName = "First name too long";
      if (!formData.lastName.trim())
        newErrors.lastName = "Last name is required";
      else if (formData.lastName.length > 50)
        newErrors.lastName = "Last name too long";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email address";
      } else if (formData.email.length > 100)
        newErrors.email = "Email too long";
      if (!formData.firmName.trim())
        newErrors.firmName = "Firm name is required";
      else if (formData.firmName.length > 100)
        newErrors.firmName = "Firm name too long";
      if (!formData.phoneNumber.trim())
        newErrors.phoneNumber = "Phone number is required";
      else if (!/^\+?92[0-9]{10}$|^0[3][0-9]{9}$/.test(formData.phoneNumber)) {
        newErrors.phoneNumber =
          "Invalid phone number. Use format like 03335759985 or +923335759985";
      }
    } else if (step === 2) {
      if (!formData.password) newErrors.password = "Password is required";
      else if (
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
          formData.password
        )
      ) {
        newErrors.password =
          "Password must be at least 8 characters long with uppercase, lowercase, number, and special character";
      }
      if (!formData.confirmPassword)
        newErrors.confirmPassword = "Confirm password is required";
      else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
      if (!formData.feeSecurityKey)
        newErrors.feeSecurityKey = "Fee security key is required";
      else if (!/^\d{4}$/.test(formData.feeSecurityKey)) {
        newErrors.feeSecurityKey = "Fee security key must be a 4-digit number";
      }
    } else if (step === 3) {
      if (!verificationCode || verificationCode.length !== 6) {
        newErrors.verificationCode = "Please enter a 6-digit verification code";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (step === 1) {
        if (!validateStep()) {
          throw new Error("Please correct the form errors");
        }
        setStep(2);
      } else if (step === 2) {
        if (!validateStep()) {
          throw new Error("Please correct the form errors");
        }
        const response = await axios.post(
          "http://localhost:5000/lawyers/signup",
          formData
        );
        toast.success(response.data.message);
        setStep(3);
      } else if (step === 3) {
        if (!validateStep()) {
          throw new Error("Please enter a valid verification code");
        }
        const response = await axios.post(
          "http://localhost:5000/lawyers/verify-email",
          {
            email: formData.email,
            verificationCode,
          },
          { timeout: 10000 } // 10-second timeout
        );
        toast.success(response.data.message);
        setStep(4);
      } else if (step === 4) {
        const response = await axios.post(
          "http://localhost:5000/lawyers/complete-subscription",
          {
            email: formData.email,
            paymentDetails: { mock: true },
          },
          { timeout: 10000 }
        );
        toast.success(response.data.message);
        navigate("/login");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        error.message ||
        "An unexpected error occurred";
      if (error.response?.status === 400) {
        setErrors({ verificationCode: errorMsg });
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setLoading(true);
      console.log("Attempting to resend code for email:", formData.email); // Debug log
      const response = await axios.post(
        "http://localhost:5000/lawyers/resend-verification",
        {
          email: formData.email,
        },
        { timeout: 20000 } // Increased to 20 seconds
      );
      toast.success(response.data.message);
      console.log("Resend successful:", response.data.message); // Debug log
    } catch (error) {
      console.error("Resend error:", error); // Debug log
      toast.error(
        error.response?.data?.error || "Failed to resend verification code"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let sanitizedValue = value.trim();
    if (name === "feeSecurityKey") {
      sanitizedValue = value.replace(/[^0-9]/g, "").slice(0, 4);
    } else if (name === "phoneNumber") {
      sanitizedValue = value.replace(/[^0-9+]/g, "").slice(0, 15);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  maxLength={50}
                  className={errors.firstName ? "border-destructive" : ""}
                />
                {errors.firstName && (
                  <p className="text-xs text-destructive">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  maxLength={50}
                  className={errors.lastName ? "border-destructive" : ""}
                />
                {errors.lastName && (
                  <p className="text-xs text-destructive">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john.doe@lawfirm.com"
                value={formData.email}
                onChange={handleChange}
                required
                maxLength={100}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="firmName">Law Firm Name</Label>
              <Input
                id="firmName"
                name="firmName"
                placeholder="Doe & Associates"
                value={formData.firmName}
                onChange={handleChange}
                required
                maxLength={100}
                className={errors.firmName ? "border-destructive" : ""}
              />
              {errors.firmName && (
                <p className="text-xs text-destructive">{errors.firmName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="e.g., 03335759985 or +923335759985"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                maxLength={15}
                className={errors.phoneNumber ? "border-destructive" : ""}
              />
              {errors.phoneNumber && (
                <p className="text-xs text-destructive">{errors.phoneNumber}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className={errors.password ? "border-destructive" : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                maxLength={100}
                className={errors.confirmPassword ? "border-destructive" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="feeSecurityKey">Fee Security Key</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="feeSecurityKey"
                  name="feeSecurityKey"
                  type={showFeeSecurityKey ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter 4-digit security key"
                  value={formData.feeSecurityKey}
                  onChange={handleChange}
                  maxLength={4}
                  className={`pl-10 ${
                    errors.feeSecurityKey ? "border-destructive" : ""
                  }`}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowFeeSecurityKey(!showFeeSecurityKey)}
                >
                  {showFeeSecurityKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.feeSecurityKey && (
                <p className="text-xs text-destructive">
                  {errors.feeSecurityKey}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                This 4-digit key will be required for fee transactions and
                sensitive operations.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Password Requirements:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• At least 8 characters long</li>
                <li>• Contains uppercase and lowercase letters</li>
                <li>• Contains at least one number</li>
                <li>• Contains at least one special character</li>
              </ul>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Verify Your Email</h3>
              <p className="text-muted-foreground mb-4">
                We've sent a 6-digit verification code to{" "}
                <strong>{formData.email}</strong>. It expires at{" "}
                {new Date(
                  Date.now() +
                    48 * 60 * 60 * 1000 +
                    timeZoneOffset * 60 * 60 * 1000
                ).toLocaleString()}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">
                  Enter Verification Code
                </Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={verificationCode}
                    onChange={(value) => setVerificationCode(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {errors.verificationCode && (
                  <p className="text-xs text-destructive text-center">
                    {errors.verificationCode}
                  </p>
                )}
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Didn't receive the code? Check your spam folder or
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendCode}
                  disabled={loading}
                >
                  Resend Code
                </Button>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                Complete Your Subscription
              </h3>
              <p className="text-muted-foreground">
                Ready to activate your Lawyer's Case Diary account
              </p>
            </div>

            <Card className="border-primary">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <h4 className="text-xl font-semibold">Professional Plan</h4>
                  <div className="flex items-baseline justify-center mt-2">
                    <span className="text-3xl font-bold">$99</span>
                    <span className="text-muted-foreground ml-1">/month</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
                  {[
                    "Complete Case Management",
                    "Smart Calendar & Scheduling",
                    "Secure Document Storage",
                    "Client Portal & Communication",
                    "Fee & Billing Management",
                    "Time Tracking & Invoicing",
                    "Smart Notifications",
                    "Analytics & Reporting",
                    "Custom Workflows",
                    "Bank-Level Security",
                    "Priority Support",
                    "Training & Onboarding",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="w-3 h-3 text-primary mr-2 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Order Summary:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Plan:</span>
                      <span className="font-medium">Professional</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-medium">$99/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="font-medium">{formData.email}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Processing..." : "Proceed to Payment"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <p className="text-sm text-muted-foreground mt-4 mb-4">
                You will be redirected to our secure payment processor to
                complete your subscription.
              </p>
              <p className="text-xs text-muted-foreground">
                Your free trial starts immediately. You won't be charged until
                the trial period ends.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Basic Information";
      case 2:
        return "Security Setup";
      case 3:
        return "Email Verification";
      case 4:
        return "Complete Subscription";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <Scale className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">
              Lawyer's Case Diary
            </span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <CardDescription>
              Step {step} of 4: {getStepTitle()}
            </CardDescription>
            <div className="flex justify-center mt-4">
              <div className="flex space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i <= step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {renderStep()}

              <div className="flex justify-between mt-6">
                {step > 1 && step < 4 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                )}
                {step < 4 && (
                  <Button
                    type="submit"
                    className={step === 1 ? "w-full" : "ml-auto"}
                    disabled={loading}
                  >
                    {loading
                      ? "Processing..."
                      : step === 3
                      ? "Verify"
                      : "Continue"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </form>

            {step === 1 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};