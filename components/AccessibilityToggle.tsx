'use client';

import React from 'react';

interface AccessibilityToggleProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
}

/**
 * Accessible toggle switch component with cartoon styling
 * Renders a visually appealing toggle with proper ARIA labels
 */
export default function AccessibilityToggle({
  id,
  label,
  icon,
  checked,
  onChange,
  ariaLabel,
}: AccessibilityToggleProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <div className="accessibility-toggle-item">
      <div className="accessibility-toggle-content">
        <div className="accessibility-toggle-icon">{icon}</div>
        <label className="accessibility-toggle-label" htmlFor={id}>
          {label}
        </label>
      </div>

      <div className="toggle-wrapper">
        <input
          id={id}
          type="checkbox"
          className="toggle-input"
          checked={checked}
          onChange={handleChange}
          aria-label={ariaLabel || label}
          aria-pressed={checked}
        />
        <label htmlFor={id} className="toggle-label">
          <div className="toggle-slider"></div>
        </label>
      </div>
    </div>
  );
}
