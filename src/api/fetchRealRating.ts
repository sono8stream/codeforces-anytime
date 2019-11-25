export const fetchRealRating = async (handle: string): Promise<number> => {
  const url = `https://codeforces.com/api/user.info?handles=${handle}`;
  try {
    const response = await fetch(url);
    const json = await response.json();
    if (handle !== json.result[0].handle) {
      return -1;
    }
    return json.result[0].rating;
  } catch (e) {
    return -1;
  }
};
