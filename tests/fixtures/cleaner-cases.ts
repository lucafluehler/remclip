export interface CleanerCase {
  name: string;
  input: string;
  expected: string;
}

export const cleanerCases: CleanerCase[] = [
  {
    name: 'removes tags and closes the whitespace gap',
    input: 'Topic #[[Analysis II]] details',
    expected: 'Topic details',
  },
  {
    name: 'normalizes a one-way card marker',
    input: 'Question ;;< Answer',
    expected: 'Question ;; Answer',
  },
  {
    name: 'unwraps numbered and unnumbered clozes',
    input: '{{plain}} and {{c12::numbered}}',
    expected: 'plain and numbered',
  },
  {
    name: 'removes images including their alt text',
    input: 'Before ![diagram](https://example.com/image.png) after',
    expected: 'Before after',
  },
  {
    name: 'keeps link labels and removes destinations',
    input: 'Read [the source](https://example.com) now',
    expected: 'Read the source now',
  },
  {
    name: 'collapses multiline block math',
    input: '$$\n  n_1 \\sin \\theta_1\n  = n_2 \\sin \\theta_2\n$$',
    expected: '$$n_1 \\sin \\theta_1 = n_2 \\sin \\theta_2$$',
  },
  {
    name: 'joins physical continuation lines and removes empty lines',
    input: 'first line\n\n  continuation\nlast line',
    expected: 'first line continuation last line',
  },
  {
    name: 'applies interacting transformations in a stable order',
    input:
      'See {{c1::[Snell\'s law](https://example.com)}} #[[Optics]]\n![](image.png)\n$$\n x = y\n$$',
    expected: "See Snell's law $$x = y$$",
  },
];
