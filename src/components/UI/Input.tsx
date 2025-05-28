"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { FieldError } from "react-hook-form";
import clsx from "clsx";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: FieldError;
}

const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, ...rest }, ref) => (
    <div>
      <label className="block font-medium mb-1">{label}</label>
      <input
        ref={ref}
        {...rest}
        className={clsx(
          "w-full px-3 py-2 border rounded outline-none",
          "border-blue-400 focus:ring-2 focus:ring-blue-300",
          { "border-red-500": error }
        )}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
    </div>
  )
);

Input.displayName = "Input";
export default Input;
