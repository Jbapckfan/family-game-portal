/** Accurate display wording over immutable published group records. */
const labels: Record<string,string> = {
  'Swimming strokes': 'Swimming terms',
  Dinosaurs: 'Prehistoric animal nicknames',
  Clouds: 'Cloud names & prefixes',
  Knots: 'Words in knot names',
  'Yoga poses': 'Words in yoga pose names',
  'Chess pieces': 'Chess pieces & nicknames',
  'Tea types': 'Words in tea names',
  Cakes: 'Words in cake names',
  'Wine varieties': 'Words in wine names',
}
export const quartetLabel = (label: string): string => labels[label] ?? label
