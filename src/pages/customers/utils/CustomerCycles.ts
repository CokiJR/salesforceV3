
export const getCycleDescription = (cycle: string) => {
  switch(cycle) {
    case 'YYYY':
      return 'Every Week';
    case 'YTYT':
      return 'Week 1 & 3';
    case 'TYTY':
      return 'Week 2 & 4';
    default:
      return cycle;
  }
};
