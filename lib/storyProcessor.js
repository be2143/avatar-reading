// lib/storyProcessor.js
export function splitStoryIntoParagraphs(storyText) {
  // A very basic split: just by double newline. You might need more sophisticated parsing.
  return storyText.split(/\n\s*\n/).filter(p => p.trim() !== '');
}