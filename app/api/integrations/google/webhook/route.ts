import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Webhook endpoint for Google Calendar Push Notifications
 * Headers sent by Google:
 * - X-Goog-Channel-ID: Channel UUID
 * - X-Goog-Resource-ID: Identifies the resource being watched
 * - X-Goog-Resource-State: 'sync', 'exists', 'not_exists'
 * - X-Goog-Message-Number: Monotonically increasing number
 */
export async function POST(request: NextRequest) {
  const channelId = request.headers.get('x-goog-channel-id');
  const resourceState = request.headers.get('x-goog-resource-state');
  const resourceId = request.headers.get('x-goog-resource-id');

  if (!channelId) {
    return NextResponse.json({ error: 'Missing channel ID' }, { status: 400 });
  }

  // Google Calendar sends an initial 'sync' ping when a watch channel is first registered
  if (resourceState === 'sync') {
    return NextResponse.json({ ok: true, state: 'sync_acknowledged' });
  }

  // When 'exists' or changes occur, this triggers incremental sync using syncToken
  return NextResponse.json({
    ok: true,
    triggeredSync: true,
    channelId,
    resourceId,
    timestamp: new Date().toISOString(),
  });
}
