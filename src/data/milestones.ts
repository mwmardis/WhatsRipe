export interface FeedingMilestone {
  ageMonths: number;
  title: string;
  description: string;
  newFoods: string[];
  tips: string[];
}

export const feedingMilestones: FeedingMilestone[] = [
  {
    ageMonths: 6,
    title: "Starting Solids",
    description: "Your baby is ready for their first foods!",
    newFoods: ["iron-fortified cereal", "pureed sweet potato", "pureed banana", "pureed avocado", "pureed peas"],
    tips: ["Start with single-ingredient purees", "Wait 3-5 days between new foods to watch for reactions", "Breast milk or formula is still the primary nutrition source"],
  },
  {
    ageMonths: 7,
    title: "Expanding Flavors",
    description: "Time to introduce more fruits, vegetables, and proteins.",
    newFoods: ["pureed chicken", "pureed lentils", "pureed apples", "pureed carrots", "yogurt"],
    tips: ["Mix new foods with familiar ones", "Offer a variety of colors and textures", "Let baby set the pace"],
  },
  {
    ageMonths: 8,
    title: "Soft Finger Foods",
    description: "Baby can start practicing with soft, mashable pieces.",
    newFoods: ["soft scrambled eggs", "ripe banana pieces", "soft cooked pasta", "cheese cubes", "tofu pieces"],
    tips: ["Cut food into small, manageable pieces", "Supervise closely during meals", "Let baby self-feed to build motor skills"],
  },
  {
    ageMonths: 9,
    title: "More Textures",
    description: "Moving beyond purees to mashed and minced foods.",
    newFoods: ["minced meat", "small soft fruit pieces", "cooked beans", "soft bread pieces", "cottage cheese"],
    tips: ["Offer foods with more texture", "Include iron-rich foods at most meals", "Start offering water in a sippy cup"],
  },
  {
    ageMonths: 10,
    title: "Self-Feeding Practice",
    description: "Encouraging independent eating with finger foods.",
    newFoods: ["small pasta shapes", "soft cooked vegetables in pieces", "shredded chicken", "rice", "pancake strips"],
    tips: ["Encourage pincer grasp with small foods", "Offer a spoon for practice", "Join family meals when possible"],
  },
  {
    ageMonths: 12,
    title: "First Birthday Milestones",
    description: "Whole milk and honey are now safe! Most table foods are fair game.",
    newFoods: ["whole cow's milk", "honey", "citrus fruits", "whole eggs", "nut butters (thin spread)"],
    tips: ["Transition from formula to whole milk", "Offer 3 meals plus 2 snacks daily", "Most family foods can be adapted with minor modifications"],
  },
  {
    ageMonths: 15,
    title: "Toddler Independence",
    description: "Your toddler wants to eat what the family eats.",
    newFoods: ["raw soft fruits", "sandwiches cut small", "mild curries", "soup", "quesadillas"],
    tips: ["Expect messy meals - it's part of learning", "Offer choices between 2-3 options", "Don't force eating - trust appetite cues"],
  },
  {
    ageMonths: 18,
    title: "Picky Phase Begins",
    description: "Food preferences start becoming strong - this is normal!",
    newFoods: ["raw vegetables with dip", "trail mix (age-appropriate pieces)", "wraps", "smoothies", "mini muffins"],
    tips: ["Keep offering rejected foods - it can take 10-15 exposures", "Make food fun with shapes and colors", "Eat together as a family as much as possible"],
  },
  {
    ageMonths: 24,
    title: "Eating With the Family",
    description: "Your child can eat most family meals with minimal modifications.",
    newFoods: ["nuts (chopped)", "popcorn", "raw carrots (thin sticks)", "sushi (cooked)", "spicier foods"],
    tips: ["Continue offering variety", "Involve them in simple meal prep", "Be a role model by eating diverse foods"],
  },
];

export function getMilestonesForAge(ageMonths: number): { current: FeedingMilestone | null; upcoming: FeedingMilestone | null; past: FeedingMilestone[] } {
  const sortedMilestones = [...feedingMilestones].sort((a, b) => a.ageMonths - b.ageMonths);

  let current: FeedingMilestone | null = null;
  let upcoming: FeedingMilestone | null = null;
  const past: FeedingMilestone[] = [];

  for (const milestone of sortedMilestones) {
    if (milestone.ageMonths <= ageMonths) {
      if (current) past.push(current);
      current = milestone;
    } else if (!upcoming) {
      upcoming = milestone;
    }
  }

  return { current, upcoming, past };
}
