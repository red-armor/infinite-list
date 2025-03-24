let scrollViewCounter = 0;
export const resolveScrollViewKey = (horizontal: boolean) => {
  const key = `scrollView_${
    horizontal ? 'horizontal' : 'vertical'
  }_${scrollViewCounter}`;
  scrollViewCounter += 1;
  return key;
};
