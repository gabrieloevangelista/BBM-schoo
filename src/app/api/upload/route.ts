import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import sharp from 'sharp';

// Limit file size to 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // Size check
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'O arquivo excede o limite máximo de 100MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);
    let finalMimeType = file.type;
    let finalFileName = file.name;

    // Image compression to AVIF
    const isImage = file.type.startsWith('image/');
    const isGifOrSvg = file.type.includes('gif') || file.type.includes('svg');

    if (isImage && !isGifOrSvg) {
      try {
        console.log(`Compressing image ${file.name} to AVIF...`);
        buffer = await sharp(buffer)
          .avif({ quality: 65, effort: 4 })
          .toBuffer();
        
        finalMimeType = 'image/avif';
        
        // Replace extension with .avif
        const extIndex = file.name.lastIndexOf('.');
        const baseName = extIndex !== -1 ? file.name.substring(0, extIndex) : file.name;
        finalFileName = `${baseName}.avif`;
        console.log(`Image successfully compressed. New name: ${finalFileName}`);
      } catch (sharpError) {
        console.error('Failed to compress image to AVIF, uploading original:', sharpError);
      }
    } else if (file.type.startsWith('video/')) {
      console.log(`Processing video file: ${file.name}`);
      // Video files are kept as is (standard H.264/AAC compression is typically used by browser inputs)
    }

    const timestamp = Date.now();
    const safeName = `${timestamp}-${finalFileName.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;

    // Upload to Supabase Storage
    console.log(`Uploading ${safeName} to Supabase Storage bucket 'uploads'...`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(safeName, buffer, {
        contentType: finalMimeType,
        cacheControl: '31536000',
        upsert: true
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      
      // If bucket is not found, provide a clear instruction in the error message
      if (uploadError.message?.toLowerCase().includes('not found') || uploadError.message?.toLowerCase().includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Bucket "uploads" não encontrado no Supabase Storage. Crie um bucket público chamado "uploads" no painel do seu Supabase para permitir uploads de mídia.' 
        }, { status: 404 });
      }
      
      return NextResponse.json({ error: `Erro no upload para o Supabase Storage: ${uploadError.message}` }, { status: 500 });
    }

    // Get Public URL
    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(safeName);
    const publicUrl = urlData.publicUrl;
    console.log(`File uploaded successfully. Public URL: ${publicUrl}`);

    return NextResponse.json({ 
      success: true, 
      file_url: publicUrl,
      file_name: finalFileName
    });

  } catch (error) {
    console.error('General File Upload error:', error);
    return NextResponse.json({ error: 'Erro interno ao realizar o upload.' }, { status: 500 });
  }
}
