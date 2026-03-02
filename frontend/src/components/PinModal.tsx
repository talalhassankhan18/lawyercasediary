import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Lock } from "lucide-react";

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => Promise<boolean>;
}

export const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const navigate = useNavigate();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPin("");
      setError("");
      setLoading(false);
      setAttempts(0);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError("Please enter a valid 4-digit PIN.");
      return;
    }

    if (attempts >= 3) {
      setError("Too many attempts. Please try again later.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const success = await onSuccess(pin);
      if (!success) {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);

        if (nextAttempts >= 3) {
          setError("Security Alert: 3 Failed Attempts. Logging out...");
          setTimeout(() => {
            localStorage.removeItem("authToken");
            sessionStorage.removeItem("feeUnlocked");
            onClose();
            navigate("/login");
          }, 2000);
        } else {
          setError(`Incorrect PIN. ${3 - nextAttempts} attempts remaining.`);
          setPin("");
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !loading) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-yellow-500" />
            Fee Management Access
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <p className="text-sm text-gray-500">
            Enter your 4-digit security PIN to access Fee Management.
          </p>
          <Input
            type="password"
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 4);
              setPin(val);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="● ● ● ●"
            maxLength={4}
            autoFocus
            disabled={loading}
            className="text-center text-lg tracking-widest"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || pin.length !== 4}>
            {loading ? "Verifying..." : "Unlock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};