import { NextRequest, NextResponse } from 'next/server';
import { backgroundIntegrityService } from '@/lib/background-integrity';

export async function GET() {
  try {
    const status = backgroundIntegrityService.getStatus();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get service status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, config } = await request.json();

    switch (action) {
      case 'start':
        await backgroundIntegrityService.start();
        return NextResponse.json({ success: true, message: 'Service started' });

      case 'stop':
        await backgroundIntegrityService.stop();
        return NextResponse.json({ success: true, message: 'Service stopped' });

      case 'config':
        if (config) {
          backgroundIntegrityService.updateConfig(config);
          return NextResponse.json({ success: true, message: 'Config updated' });
        }
        return NextResponse.json({ error: 'Config required' }, { status: 400 });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}