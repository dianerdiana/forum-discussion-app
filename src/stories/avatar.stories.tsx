import type { Meta, StoryObj } from '@storybook/react';
import { Check } from 'lucide-react';

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '../components/ui/avatar';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
  },
  args: {
    size: 'default',
  },
};

export default meta;

type Story = StoryObj<typeof Avatar>;

/**
 * Default (With Image)
 */
export const WithImage: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage src='https://i.pravatar.cc/300' alt='User' />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
};

/**
 * Fallback Only
 */
export const FallbackOnly: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarFallback>ER</AvatarFallback>
    </Avatar>
  ),
};

/**
 * Sizes Showcase
 */
export const Sizes: Story = {
  render: () => (
    <div className='flex items-center gap-4'>
      <Avatar size='sm'>
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>

      <Avatar size='default'>
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>

      <Avatar size='lg'>
        <AvatarFallback>LG</AvatarFallback>
      </Avatar>
    </div>
  ),
};

/**
 * With Badge
 */
export const WithBadge: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage src='https://i.pravatar.cc/300' />
      <AvatarFallback>JD</AvatarFallback>
      <AvatarBadge>
        <Check />
      </AvatarBadge>
    </Avatar>
  ),
};

/**
 * Avatar Group
 */
export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar>
        <AvatarImage src='https://i.pravatar.cc/301' />
        <AvatarFallback>A</AvatarFallback>
      </Avatar>

      <Avatar>
        <AvatarImage src='https://i.pravatar.cc/302' />
        <AvatarFallback>B</AvatarFallback>
      </Avatar>

      <Avatar>
        <AvatarImage src='https://i.pravatar.cc/303' />
        <AvatarFallback>C</AvatarFallback>
      </Avatar>

      <AvatarGroupCount>+2</AvatarGroupCount>
    </AvatarGroup>
  ),
};

/**
 * Group With Different Sizes
 */
export const GroupSizes: Story = {
  render: () => (
    <div className='flex flex-col gap-6'>
      <AvatarGroup>
        <Avatar size='sm'>
          <AvatarFallback>SM</AvatarFallback>
        </Avatar>
        <Avatar size='sm'>
          <AvatarFallback>SM</AvatarFallback>
        </Avatar>
      </AvatarGroup>

      <AvatarGroup>
        <Avatar size='default'>
          <AvatarFallback>MD</AvatarFallback>
        </Avatar>
        <Avatar size='default'>
          <AvatarFallback>MD</AvatarFallback>
        </Avatar>
      </AvatarGroup>

      <AvatarGroup>
        <Avatar size='lg'>
          <AvatarFallback>LG</AvatarFallback>
        </Avatar>
        <Avatar size='lg'>
          <AvatarFallback>LG</AvatarFallback>
        </Avatar>
      </AvatarGroup>
    </div>
  ),
};
