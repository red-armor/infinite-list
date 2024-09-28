// import { ListDimensions } from "@infinite-list/data-model";
import { sum } from '@infinite-list/data-model';
import { useEffect } from 'react';

export const Button = () => {
  useEffect(() => {
    sum(3);
  }, []);

  return <div>button</div>;
};
