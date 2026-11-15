import { describe, expect, it } from 'vitest';

import { withDisallowedChoice } from '@/utils/withDisallowedChoice';

const chewbacca = { label: 'Chewbacca (6)', value: 'chewbacca' };

describe('withDisallowedChoice', () => {
  it('leaves the options alone when the current choice is one of them, or there is none', () => {
    expect(withDisallowedChoice([chewbacca], { label: 'Chewbacca', value: 'chewbacca' })).toEqual([
      chewbacca,
    ]);
    expect(withDisallowedChoice([chewbacca])).toEqual([chewbacca]);
  });

  it('puts a current choice the options leave out first, marked as not allowed', () => {
    expect(withDisallowedChoice([chewbacca], { label: 'R2-D2', value: 'r2d2' })).toEqual([
      { label: 'R2-D2 (not allowed)', value: 'r2d2' },
      chewbacca,
    ]);
  });
});
