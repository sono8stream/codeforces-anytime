export const calculateTimeTick = (beginTime: number, lastTime: number) => {
  const beginDate = new Date(beginTime * 1000);
  const beginYear = beginDate.getFullYear();
  const beginMonth = beginDate.getMonth();

  const lastDate = new Date(lastTime * 1000);
  const lastYear = lastDate.getFullYear();
  const lastMonth = lastDate.getMonth();

  const months = lastYear * 12 + lastMonth - (beginYear * 12 + beginMonth) + 1;
  const interval = Math.floor((months + 9) / 10);

  let nowYear = beginYear;
  let nowMonth = beginMonth;
  const tick = [];
  while (
    nowYear < lastYear ||
    (nowYear === lastYear && nowMonth <= lastMonth)
  ) {
    nowMonth += interval;
    if (nowMonth >= 12) {
      nowMonth %= 12;
      nowYear++;
    }
    tick.push(Math.floor(new Date(nowYear, nowMonth).getTime() / 1000));
  }
  return tick;
};

export const calculateRatingTick = (min: number, max: number) => {};
