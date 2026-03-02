import React, { useState } from "react";
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
import { Scale, Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { toast } from "sonner";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post("/lawyers/forgot-password", { email: email.trim().toLowerCase() });
            toast.success("Reset link sent! Please check your email.");
            setSubmitted(true);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to send reset link.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
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
                        <CardTitle className="text-2xl">Forgot Password</CardTitle>
                        <CardDescription>
                            {submitted
                                ? "We've sent a recovery link to your email."
                                : "Enter your email to receive a password reset link."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!submitted ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter your registered email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Sending Link..." : "Send Reset Link"}
                                </Button>
                            </form>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-sm text-muted-foreground mb-6">
                                    Didn't receive the email? Check your spam folder or try again.
                                </p>
                                <Button variant="outline" onClick={() => setSubmitted(false)} className="w-full">
                                    Try Again
                                </Button>
                            </div>
                        )}

                        <div className="mt-6 text-center">
                            <Link to="/login" className="text-sm text-primary hover:underline inline-flex items-center">
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back to login
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ForgotPassword;
