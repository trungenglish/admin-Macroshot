import { describe, expect, it } from 'vitest';

describe('test environment', () => {
  it('provides a DOM', () => {
    expect(document.createElement('div')).toBeInstanceOf(HTMLDivElement);
  });
});
