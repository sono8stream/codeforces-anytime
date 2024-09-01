interface ColorStyle {
  color: string;
}

export const ratingColors = [
  '#FF0000',
  '#FF8C00',
  '#AA00AA',
  '#0000FF',
  '#03A89E',
  '#008000',
  '#808080',
];

const getRatingColorStyle: (rating: number) => { color: string } = (
  rating: number
) => {
  if (rating >= 2400) {
    return { color: '#FF0000' };
  }
  if (rating >= 2100) {
    return { color: '#FF8C00' };
  }
  if (rating >= 1900) {
    return { color: '#AA00AA' };
  }
  if (rating >= 1600) {
    return { color: '#0000FF' };
  }
  if (rating >= 1400) {
    return { color: '#03A89E' };
  }
  if (rating >= 1200) {
    return { color: '#008000' };
  }
  return { color: '#808080' };
};

export default getRatingColorStyle;
