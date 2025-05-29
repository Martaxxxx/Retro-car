import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      className={`px-4 py-2 rounded-md bg-[#FFBD59] text-white font-semibold hover:bg-yellow-500 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
