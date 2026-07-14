import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { title, type = 'módulo' } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    if (!openAiKey) {
      return NextResponse.json({ error: 'Chave da OpenAI não configurada.' }, { status: 500 });
    }

    // Prompt otimizado para HUD sci-fi realista
    const shortTitle = title.split(' ').slice(0, 5).join(' ');
    const prompt = `Photorealistic sci-fi HUD interface representing ${shortTitle}. Minimalist design, clean glowing neon green lines on dark elegant background. High tech, corporate, uncluttered. No letters, no typography, no logos.`;
    
    console.log(`Solicitando geração de imagem via OpenAI DALL-E 3 para: ${title}...`);

    let response;
    try {
      response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          model: 'dall-e-2',
          prompt: prompt,
          n: 1,
          size: '1024x1024'
        })
      });
    } catch (fetchError) {
      console.error('Network Error calling OpenAI:', fetchError);
    }

    if (!response || !response.ok) {
      if (response) {
        const errorText = await response.text();
        console.error('OpenAI API Error:', response.status, errorText);
      }
      return NextResponse.json({ error: 'Falha ao gerar imagem.' }, { status: 500 });
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;

    // Baixar a imagem gerada da URL temporária da OpenAI
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      throw new Error(`Failed to download image from OpenAI URL: ${imageRes.status}`);
    }

    // Converter para Buffer e salvar localmente
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const filename = `cover-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, buffer);

    const localImageUrl = `/uploads/${filename}`;

    return NextResponse.json({ url: localImageUrl });
  } catch (error: any) {
    console.error('Erro interno ao gerar capa:', error);
    return NextResponse.json({ error: 'Erro interno do servidor', message: error.message, stack: error.stack }, { status: 500 });
  }
}
