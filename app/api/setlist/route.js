import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'setlists.json');
    const fileData = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileData);
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Failed to load setlist' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'setlists.json');
    const data = await request.json();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Failed to save setlist' }, { status: 500 });
  }
}
