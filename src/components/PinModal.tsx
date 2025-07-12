
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PinModal = ({ isOpen, onClose, onSuccess }: PinModalProps) => {
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock PIN validation (replace with actual validation)
    if (pin === '1234') {
      onSuccess();
      setPin('');
      setAttempts(0);
      toast.success('PIN verified successfully');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 5) {
        setIsLocked(true);
        toast.error('Too many attempts. Locked for 10 minutes.');
        setTimeout(() => {
          setIsLocked(false);
          setAttempts(0);
        }, 600000); // 10 minutes
      } else {
        toast.error(`Incorrect PIN. ${5 - newAttempts} attempts remaining.`);
      }
      setPin('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Enter Fee Management PIN
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isLocked ? (
            <div className="flex items-center gap-2 p-4 bg-red-50 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>Access locked. Try again in 10 minutes.</span>
            </div>
          ) : (
            <>
              <Input
                type="password"
                placeholder="Enter 4-6 digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={6}
                className="text-center text-lg tracking-widest"
                disabled={isLocked}
              />
              
              {attempts > 0 && (
                <p className="text-sm text-red-600 text-center">
                  {5 - attempts} attempts remaining
                </p>
              )}
              
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLocked || pin.length < 4} className="flex-1">
                  Unlock
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
