export const parseToIsoString = (value?: string): string => {
  const parsedDate = new Date(value || '');
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString();
  }
  return new Date().toISOString();
};

export const parseToReadableDate = (value?: string): string => {
  const parsedDate = new Date(value || '');
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Seoul',
    });
  }
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
};
