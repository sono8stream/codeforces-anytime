import { calculateMyRating } from '../utils/calculateMyRating';

export default test('Validate rating change', () => {
  return calculateMyRating({
    contestID: 1320,
    handle: 'hoge',
    rank: 162,
    rating: 2394,
  }).then(({ nextRating }) => {
    expect(nextRating).toBe(2415);
  });
});
