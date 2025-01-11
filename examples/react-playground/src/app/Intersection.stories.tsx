import type { Meta } from '@storybook/react';
import { intersection } from '@infinite-list/intersection';

const meta: Meta = {
  render: (props) => {
    console.log('intersection ', intersection);
    return <div></div>;
  },
  title: 'Intersection',
};
export default meta;

export const SimpleControlledList = {
  args: {},
};
