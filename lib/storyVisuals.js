export async function processStoryForVisuals(storyText) {
  const text = (storyText || '').toString();

  // Naive extraction of a main character: first proper name-like token
  const nameMatch = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  const mainCharacterName = nameMatch ? nameMatch[1] : 'the main character';

  const mainCharacterDescription = `${mainCharacterName}, a friendly child, consistent outfit and appearance across scenes`;

  // Extract other capitalized names as other characters (distinct from main)
  const allNames = Array.from(text.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g)).map(m => m[1]);
  const uniqueNames = Array.from(new Set(allNames));
  const otherCharacters = uniqueNames.filter(n => n !== mainCharacterName).slice(0, 5);

  // Split scenes by double newlines or sentence boundaries
  const rawScenes = text
    .split(/\n\n+/)
    .flatMap(chunk => chunk.split(/(?<=[.!?])\s+(?=[A-Z])/))
    .map(s => s.trim())
    .filter(Boolean);

  const scenes = rawScenes.map((sceneText, index) => ({
    sceneNumber: index + 1,
    sceneText,
  })).slice(0, 12); // cap to a reasonable number

  return {
    mainCharacterDescription,
    otherCharacters,
    scenes,
  };
}


