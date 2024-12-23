import type { Meta, StoryObj } from '@storybook/react';
import { NxWelcome } from './nx-welcome';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

const meta: Meta<typeof NxWelcome> = {
  component: NxWelcome,
  title: 'NxWelcome',
};
export default meta;
type Story = StoryObj<typeof NxWelcome>;

export const Primary = {
  args: {
    title: '',
  },
};

export const Heading: Story = {
  args: {
    title: '',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/Welcome to NxWelcome!/gi)).toBeTruthy();
  },
};
