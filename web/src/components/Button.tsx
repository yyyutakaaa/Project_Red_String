import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import styles from './Button.module.css';
import { sfx } from '../audio/audio.ts';

export type ButtonVariant = 'default' | 'primary' | 'lamp' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

function classes(variant: ButtonVariant, size: ButtonSize, block: boolean, extra?: string): string {
  return [
    styles.btn,
    variant !== 'default' ? styles[variant] : '',
    size !== 'medium' ? styles[size] : '',
    block ? styles.block : '',
    extra ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'default',
  size = 'medium',
  block = false,
  className,
  onClick,
  type = 'button',
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={classes(variant, size, block, className)}
      onClick={(e) => {
        sfx('click');
        onClick?.(e);
      }}
      {...rest}
    />
  );
}

export function ButtonLink({
  variant = 'default',
  size = 'medium',
  block = false,
  className,
  onClick,
  ...rest
}: CommonProps & LinkProps) {
  return (
    <Link
      className={classes(variant, size, block, className)}
      onClick={(e) => {
        sfx('click');
        onClick?.(e);
      }}
      {...rest}
    />
  );
}
