const adjectives = [
  'Happy', 'Clever', 'Bright', 'Swift', 'Bold', 'Calm', 'Brave', 'Clear',
  'Cool', 'Deep', 'Fair', 'Fast', 'Fine', 'Free', 'Good', 'Kind',
  'Live', 'Nice', 'Pure', 'Rich', 'Safe', 'Sure', 'True', 'Warm',
  'Wise', 'Young', 'Active', 'Amber', 'Cosmic', 'Digital', 'Electric',
  'Golden', 'Lunar', 'Magic', 'Noble', 'Ocean', 'Quick', 'Royal',
  'Silver', 'Stellar', 'Turbo', 'Ultra', 'Vibrant', 'Wonder'
];

const nouns = [
  'Cat', 'Dog', 'Bird', 'Fish', 'Bear', 'Lion', 'Wolf', 'Fox',
  'Owl', 'Bee', 'Tree', 'Star', 'Moon', 'Sun', 'Wave', 'Fire',
  'Wind', 'Rock', 'Peak', 'Lake', 'River', 'Cloud', 'Rain', 'Snow',
  'Storm', 'Thunder', 'Light', 'Shadow', 'Dream', 'Hope', 'Joy',
  'Peace', 'Quest', 'Road', 'Bridge', 'Castle', 'Tower', 'Garden',
  'Forest', 'Mountain', 'Valley', 'Island', 'Ocean', 'Desert'
];

export function generateName(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);
  
  return `${adjective}${noun}${number}`;
}