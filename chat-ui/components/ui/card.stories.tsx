import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Button } from './button';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the card content area.</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Confirm Action</CardTitle>
        <CardDescription>Are you sure you want to proceed?</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This action cannot be undone.</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Confirm</Button>
      </CardFooter>
    </Card>
  ),
};

export const AgentCard: Story = {
  render: () => (
    <Card className="w-[350px] cursor-pointer transition-all hover:shadow-md ring-2 ring-primary bg-primary/5">
      <CardContent className="p-3">
        <div className="flex items-start space-x-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm">
            🤖
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="font-medium text-sm truncate">Claude Agent</div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 border border-purple-200 flex-shrink-0">
                  Multi
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground line-clamp-1">
              A helpful AI assistant for various tasks
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const SessionCard: Story = {
  render: () => (
    <Card className="cursor-pointer transition-all hover:shadow-md ring-2 ring-primary bg-primary/5">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm truncate">
              Discussion about Docker Cagent
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString()}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary text-white">
              Active
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const ToolResultCard: Story = {
  render: () => (
    <Card className="bg-blue-50 border-blue-200 max-w-2xl">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-blue-700">
            search execution result
          </span>
        </div>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-blue-900">
          Found 3 results for "Docker Cagent"
        </pre>
        <div className="text-xs opacity-70 mt-2 text-blue-600 flex items-center gap-2">
          <span>{new Date().toLocaleTimeString()}</span>
          <span>• Input: 150 | Output: 320</span>
        </div>
      </CardContent>
    </Card>
  ),
};

export const MessageCard: Story = {
  render: () => (
    <Card className="max-w-2xl">
      <CardContent className="p-3">
        <div className="prose prose-sm max-w-none">
          <p>This is a message from the assistant. It can contain markdown formatted text.</p>
        </div>
        <div className="text-xs opacity-70 mt-2 flex items-center gap-2">
          <span>{new Date().toLocaleTimeString()}</span>
          <span className="text-muted-foreground">• Input: 200 | Output: 450</span>
        </div>
      </CardContent>
    </Card>
  ),
};
