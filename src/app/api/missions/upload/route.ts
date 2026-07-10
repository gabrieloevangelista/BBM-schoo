import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define limits: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // Size validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'O arquivo excede o limite máximo de 100MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create target directory
    const uploadDir = path.join(process.cwd(), 'public', 'mock-storage', 'missions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Format safe name
    const timestamp = Date.now();
    const safeName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
    const filePath = path.join(uploadDir, safeName);

    // Write file to disk
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/mock-storage/missions/${safeName}`;

    return NextResponse.json({ 
      success: true, 
      file_url: publicUrl,
      file_name: file.name
    });

  } catch (error) {
    console.error('File Upload error:', error);
    return NextResponse.json({ error: 'Erro interno ao realizar o upload.' }, { status: 500 });
  }
}
