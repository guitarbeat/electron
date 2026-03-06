import React from 'react';

interface UserSelectionProps {
  className?: string;
}

const UserSelection: React.FC<UserSelectionProps> = ({ className = "" }) => {
  return (
    <div className={`user-selection ${className}`}>
      <div className="text-sm text-gray-600">
        User Selection Component
      </div>
    </div>
  );
};

export default UserSelection;
