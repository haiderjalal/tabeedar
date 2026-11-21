import { describe, expect, it } from 'vitest';

import { en } from './en';
import { ur } from './ur';

/** Flattens nested translations to `{ 'auth.signIn.title': 'Welcome back', ... }`. */
function flatten(node: unknown, prefix = ''): Record<string, string> {
  if (typeof node === 'string') return { [prefix]: node };
  if (typeof node !== 'object' || node === null) return {};

  return Object.entries(node).reduce<Record<string, string>>(
    (all, [key, value]) => ({ ...all, ...flatten(value, prefix ? `${prefix}.${key}` : key) }),
    {},
  );
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((match) => match[1] ?? '').sort();
}

const english = flatten(en);
const urdu = flatten(ur);

describe('translations', () => {
  it('have the same keys in English and Urdu', () => {
    expect(Object.keys(urdu).sort()).toEqual(Object.keys(english).sort());
  });

  it('have no empty strings', () => {
    for (const [key, value] of [...Object.entries(english), ...Object.entries(urdu)]) {
      expect(value.trim(), key).not.toBe('');
    }
  });

  // The compiler checks that keys match but cannot see inside the strings. A missing {{name}}
  // would show up on screen as literal braces, or silently drop the value.
  it('use the same {{placeholders}} in both languages', () => {
    for (const [key, text] of Object.entries(english)) {
      expect(placeholders(urdu[key] ?? ''), key).toEqual(placeholders(text));
    }
  });
});
