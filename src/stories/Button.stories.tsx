import type { Meta, StoryObj } from '@storybook/react';
import { ChevronRight } from 'lucide-react';

import { Button } from '../components/ui/button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'],
    },
    asChild: {
      control: 'boolean',
    },
  },
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
    asChild: false,
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

/**
 * Default
 */
export const Default: Story = {};

/**
 * Variants Showcase
 */
export const Variants: Story = {
  render: (args) => (
    <div className='flex flex-wrap gap-3'>
      <Button {...args} variant='default'>
        Default
      </Button>
      <Button {...args} variant='outline'>
        Outline
      </Button>
      <Button {...args} variant='secondary'>
        Secondary
      </Button>
      <Button {...args} variant='ghost'>
        Ghost
      </Button>
      <Button {...args} variant='destructive'>
        Destructive
      </Button>
      <Button {...args} variant='link'>
        Link
      </Button>
    </div>
  ),
  parameters: {
    controls: { exclude: ['variant'] },
  },
};

/**
 * Sizes Showcase
 */
export const Sizes: Story = {
  render: (args) => (
    <div className='flex items-center flex-wrap gap-3'>
      <Button {...args} size='xs'>
        XS
      </Button>
      <Button {...args} size='sm'>
        SM
      </Button>
      <Button {...args} size='default'>
        Default
      </Button>
      <Button {...args} size='lg'>
        LG
      </Button>
    </div>
  ),
  parameters: {
    controls: { exclude: ['size'] },
  },
};

/**
 * Icon Buttons
 */
export const IconButtons: Story = {
  render: (args) => (
    <div className='flex items-center gap-3'>
      <Button {...args} size='icon-xs'>
        <ChevronRight />
      </Button>
      <Button {...args} size='icon-sm'>
        <ChevronRight />
      </Button>
      <Button {...args} size='icon'>
        <ChevronRight />
      </Button>
      <Button {...args} size='icon-lg'>
        <ChevronRight />
      </Button>
    </div>
  ),
};

/**
 * With Icon (Inline Start / End)
 */
export const WithIcon: Story = {
  render: (args) => (
    <div className='flex flex-wrap gap-3'>
      <Button {...args}>
        <ChevronRight data-icon='inline-start' />
        Start Icon
      </Button>
      <Button {...args}>
        End Icon
        <ChevronRight data-icon='inline-end' />
      </Button>
    </div>
  ),
};

/**
 * Disabled State
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};
