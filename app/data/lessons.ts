export type Lesson = {
  id: string;
  title: string;
  content: string;
};

export const lessons: Lesson[] = [
  {
    id: "photosynthesis",
    title: "🌱 Photosynthesis",
    content: `Photosynthesis is the process by which plants use sunlight, 
    water and carbon dioxide to produce oxygen and glucose. 
    This happens in the chloroplasts using chlorophyll pigment.
    The equation is: 6CO2 + 6H2O + light → C6H12O6 + 6O2`,
  },
  {
    id: "newton-laws",
    title: "⚡ Newton's Laws",
    content: `Newton's Three Laws of Motion:
    1. An object at rest stays at rest unless acted upon by a force.
    2. Force equals mass times acceleration (F = ma).
    3. For every action there is an equal and opposite reaction.`,
  },
  {
    id: "water-cycle",
    title: "💧 Water Cycle",
    content: `The water cycle describes how water evaporates from 
    the surface, rises into the atmosphere, cools and condenses 
    into clouds, and falls back as precipitation. 
    Key stages: Evaporation, Condensation, Precipitation, Collection.`,
  },
  {
    id: "cell-biology",
    title: "🔬 Cell Biology",
    content: `Cells are the basic unit of life. 
    Animal cells have: nucleus, mitochondria, cell membrane, cytoplasm.
    Plant cells additionally have: cell wall, chloroplasts, vacuole.
    Mitochondria produce energy (ATP) through cellular respiration.`,
  },
];
