import type { Metadata } from 'next';
import { TrackerApp } from '@/components/tracker/TrackerApp';

export const metadata: Metadata = {
  title: 'Task Tracker — CEO OS',
  description: 'Dashboard, monthly calendar, kanban board, decision matrix and timeline in one mobile-friendly task tracker.',
};

export default function TrackerPage() {
  return <TrackerApp />;
}
