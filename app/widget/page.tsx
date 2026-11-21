import type { Metadata } from 'next';
import { WidgetToday } from '@/components/work/WidgetToday';

export const metadata: Metadata = {
  title: 'Today — CEO OS',
  description: 'Compact view of today: tick tasks off and add new ones.',
};

export default function WidgetPage() {
  return <WidgetToday />;
}
