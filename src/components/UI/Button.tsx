"use client";

import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

export default function Button({
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={clsx(
        "w-full py-2 px-4 rounded bg-blue-500 text-white hover:bg-blue-600 transition",
        className
      )}
    >
      {children}
    </button>
  );
}
