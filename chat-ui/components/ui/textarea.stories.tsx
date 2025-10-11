import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './textarea';

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    placeholder: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your message...',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'This textarea is disabled',
    disabled: true,
  },
};

export const WithValue: Story = {
  args: {
    value: 'This is a pre-filled message.\nYou can have multiple lines.',
  },
};

export const ChatInput: Story = {
  render: () => (
    <div className="w-[600px] space-y-2">
      <Textarea
        placeholder="Send a message to the agent..."
        className="min-h-[60px] resize-none"
      />
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <div>Shift + Enter for new line</div>
      </div>
    </div>
  ),
};

export const MultilineExample: Story = {
  args: {
    placeholder: 'Enter multiple lines of text...',
    rows: 6,
  },
};
