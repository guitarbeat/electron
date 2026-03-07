import React from 'react';
import { Movie } from '@/types';

interface FixMatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  message?: string;
  className?: string;
  movie?: Movie;
}

const FixMatchDialog: React.FC<FixMatchDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Fix Match",
  message = "Are you sure you want to fix this match?",
  className = ""
}) => {
  if (!isOpen) return null;

  return (
    <div className={`fix-match-dialog-overlay ${className}`}>
      <div className="fix-match-dialog">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          {onConfirm && (
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Confirm
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixMatchDialog;
