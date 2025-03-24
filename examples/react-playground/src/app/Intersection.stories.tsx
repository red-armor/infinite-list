import type { Meta } from '@storybook/react';
import { intersection } from '@infinite-list/intersection';
import { Intersection } from './intersection/Intersection';

const meta: Meta = {
  render: (props) => {
    console.log('intersection ', intersection);
    return <Intersection />;
  },
  title: 'Intersection',
};
export default meta;

export const SimpleControlledList = {
  args: {},
};
