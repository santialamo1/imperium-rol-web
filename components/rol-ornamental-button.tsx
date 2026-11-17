
"use client";

import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

type Size = "compact" | "regular" | "wide";

type BaseProps = {
  children: ReactNode;
  size?: Size;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  className?: string;
  ariaLabel?: string;
  title?: string;
};

type Props = BaseProps &
  (
    | {
        href: string;
        onClick?: never;
        disabled?: never;
        type?: never;
      }
    | {
        href?: never;
        onClick?: MouseEventHandler<HTMLButtonElement>;
        disabled?: boolean;
        type?: "button" | "submit" | "reset";
      }
  );

const sizeClasses: Record<Size, string> = {
  compact: "w-[190px] text-[10px] sm:w-[225px] sm:text-[11px]",
  regular: "w-[240px] text-[11px] sm:w-[275px] sm:text-[12px]",
  wide: "w-[310px] text-[10px] sm:w-[350px] sm:text-[12px]",
};

export function RolOrnamentalButton(props: Props) {
  const {
    children,
    size = "regular",
    icon,
    iconPosition = "right",
    className = "",
    ariaLabel,
    title,
  } = props;

  const classes = `
    group relative inline-flex
    aspect-[1050/354] max-w-full shrink-0
    items-center justify-center gap-2
    bg-[url('/rol/ui/button-reader-nav.png')]
    bg-center bg-no-repeat bg-size-[100%_100%]
    px-6 sm:px-8
    text-center
    font-(family-name:--font-rol-display)
    font-semibold uppercase leading-[1.2]
    tracking-[0.045em] text-[#f0d5a4]
    [text-shadow:0_2px_3px_#160b06]
    transition-[transform,filter,opacity]
    duration-200
    hover:-translate-y-px
    hover:brightness-125
    focus-visible:outline-2
    focus-visible:outline-offset-2
    focus-visible:outline-[#efc488]
    disabled:cursor-not-allowed
    disabled:opacity-35
    disabled:hover:translate-y-0
    disabled:hover:brightness-100
    ${sizeClasses[size]}
    ${className}
  `;

  const iconNode = icon ? (
    <span
      aria-hidden="true"
      className="
        inline-flex shrink-0
        items-center justify-center
        text-[#eac68f]
        [&_svg]:size-4
      "
    >
      {icon}
    </span>
  ) : null;

  const content = (
    <>
      {iconPosition === "left" && iconNode}

      <span className="min-w-0 whitespace-nowrap">
        {children}
      </span>

      {iconPosition === "right" && iconNode}
    </>
  );

  if (props.href) {
    return (
      <Link
        href={props.href}
        aria-label={ariaLabel}
        title={title}
        className={classes}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      aria-label={ariaLabel}
      title={title}
      className={classes}
    >
      {content}
    </button>
  );
}
