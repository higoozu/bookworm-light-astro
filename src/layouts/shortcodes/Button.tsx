import React from "react";

const Button = ({
  label,
  link,
  style,
  rel,
}: {
  label: string;
  link: string;
  style?: string;
  rel?: string;
}) => {
  return (
    <a
      href={link}
      target="_blank"
      rel={`noopener noreferrer ${
        rel ? (rel === "follow" ? "" : rel) : "nofollow"
      }`}
      className={`btn mb-4 me-4 no-underline ${
        style === "outline" ? "btn-outline-primary text-primary hover:text-white dark:hover:text-dark" : "btn-primary text-white dark:text-dark "
      }`}
    >
      {label}
    </a>
  );
};

export default Button;
