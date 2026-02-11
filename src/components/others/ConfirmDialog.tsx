import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  icon?: LucideIcon;
  confirmClassName?: string;
  isLoading?: boolean;
  loadingText?: string;
}

const ConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  icon: Icon,
  confirmClassName = "bg-blue-500 hover:bg-blue-600 text-white",
  isLoading = false,
  loadingText,
}: ConfirmDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-lg p-6 rounded-xl">
      <DialogHeader className="p-0">
        <DialogTitle className="flex items-center gap-2 text-gray-900 text-lg font-medium">
          {Icon && <Icon className="w-5 h-5 text-gray-500" />}
          {title}
        </DialogTitle>
        <DialogDescription className="text-gray-500 text-sm leading-relaxed mt-2">
          {description}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="flex gap-3 sm:gap-3 mt-4">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
          className="flex-1 border-gray-200 bg-white text-gray-900 hover:bg-gray-50 transition-all duration-200 rounded-lg"
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          className={`flex-1 transition-all duration-200 rounded-lg ${confirmClassName}`}
        >
          {isLoading && loadingText ? loadingText : confirmText}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default ConfirmDialog;
