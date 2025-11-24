const recentGreetings: Set<number> = new Set();
export const maxRecentGreetings = 8; // Number of recent greetings to track

const hoursLeft = 24 - new Date().getHours();

const greetingsText: string[] = [
  // Therapy-themed messages (majority)
  "Your therapist will see you now... The checkbox. **2705**",
  "Prescription refill: Check all the boxes **1f48a**",
  "Diagnosis: Chronic productivity. Treatment: More tasks! **1f4cb**",
  "Remember: Checking boxes IS self-care **2728**",
  "Warning: May cause uncontrollable satisfaction **26a0-fe0f**",
  "Check yourself before you wreck yourself **2705**",
  "Boxes won't check themselves... or will they? **1f914**",
  "Feeling listless? We've got lists for that! **1f4dd**",
  "Task-tastic day ahead! **1f389**",
  "Let's get checking! **1f680**",
  "Make your to-do list jealous of your done list **1f4af**",
  "One check at a time, you've got this! **1f4aa**",
  "Certified box-checking professional **1f393**",
  "Time for your productivity prescription **231a**",

  // Tonny's messages (3 out of 20+ = 15%)
  "Built by Tonny, powered by your productivity **1f680**",
  "Made with caffeine and determination by Tonny **2615**",
  "Tonny's prescription: More checkboxes! **1f48a**",

  // Time-based messages
  `Happy ${new Date().toLocaleDateString("en", {
    month: "long",
  })}! Peak therapy season! **1f4c5**`,
  `It's ${new Date().toLocaleDateString("en", {
    weekday: "long",
  })} - Time to check those boxes! **1f5d3-fe0f**`,
  hoursLeft > 4
    ? `${hoursLeft} hours left - Make them count! **231a**`
    : `Only ${hoursLeft} hours left - Quick, check those boxes! **23f0**`,
];

/**
 * Returns a random greeting message to inspire productivity.
 * @returns {string} A random greeting message with optional emoji code.
 */
export const getRandomGreeting = (): string => {
  // Function to get a new greeting that hasn't been used recently
  const getUniqueGreeting = (): string => {
    let randomIndex: number;
    do {
      randomIndex = Math.floor(Math.random() * greetingsText.length);
    } while (recentGreetings.has(randomIndex));

    // Update recent greetings
    recentGreetings.add(randomIndex);
    if (recentGreetings.size > maxRecentGreetings) {
      const firstEntry = Array.from(recentGreetings).shift();
      if (firstEntry !== undefined) {
        recentGreetings.delete(firstEntry);
      }
    }

    return greetingsText[randomIndex];
  };

  return getUniqueGreeting();
};
