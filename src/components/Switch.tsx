import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function Switch({ checked, onChange, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full
        transition-colors duration-200 ease-in-out focus:outline-none border
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
      `}
      style={{
        backgroundColor: checked ? 'var(--color-primary-lemon)' : 'rgba(255, 255, 255, 0.06)',
        borderColor: checked ? 'transparent' : 'rgba(255, 255, 255, 0.12)'
      }}
    >
      <span className="sr-only">Toggle</span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full shadow transition-all duration-200 ease-in-out"
        style={{
          left: checked ? 'calc(100% - 12px - 3.5px)' : '3.5px',
          backgroundColor: checked ? '#010103' : 'rgba(255, 255, 255, 0.6)'
        }}
      />
    </button>
  );
}
