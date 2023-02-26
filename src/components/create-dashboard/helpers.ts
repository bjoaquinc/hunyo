export const capsFirstLetters = (words: string) => {
  return words
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
