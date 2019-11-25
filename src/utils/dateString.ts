export const dateStringFromSeconds = (timeSeconds: number): string => {
  const date = new Date(timeSeconds * 1000);
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  const hour = date.getHours();
  const minute = ('0' + date.getMinutes()).slice(-2);
  const second = ('0' + date.getSeconds()).slice(-2);
  return (
    year + '/' + month + '/' + day + ' ' + hour + ':' + minute + ':' + second
  );
};

export const monthStringFromTime = (time: number): string => {
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const date = new Date(time * 1000);
  return monthNames[date.getMonth()] + ' ' + date.getFullYear();
};
