import React, { useId } from 'react';
import { typography } from '@/design-system/tokens';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', style, id: providedId, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;

    return (
      <div className="ui-input">
        {label && (
          <label
            htmlFor={id}
            className="ui-input__label"
            style={{ fontFamily: typography.fontFamily.body.join(', ') }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`ui-input__field ${error ? 'ui-input__field--error' : ''} ${className}`.trim()}
          style={{
            fontFamily: typography.fontFamily.body.join(', '),
            ...style,
          }}
          {...props}
        />
        {error && (
          <div
            id={errorId}
            role="alert"
            className="ui-input__error"
            style={{ fontFamily: typography.fontFamily.body.join(', ') }}
          >
            {error}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
