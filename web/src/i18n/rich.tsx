import { Fragment, type ReactNode } from 'react';

/**
 * A translated sentence with parts that are elements, not text: `rich(t('key'), { title: <strong>..</strong> })`
 * puts the element where {title} sits in that language's sentence. Other {placeholders} stay as written.
 */
export function rich(text: string, parts: Record<string, ReactNode>): ReactNode {
  const pieces = text.split(/(\{[a-zA-Z0-9_]+\})/);
  return pieces.map((piece, i) => {
    const name = /^\{([a-zA-Z0-9_]+)\}$/.exec(piece)?.[1];
    return <Fragment key={i}>{name && name in parts ? parts[name] : piece}</Fragment>;
  });
}
