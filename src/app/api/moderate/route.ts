import { NextResponse } from 'next/server';

// Lista simples de palavras bloqueadas para moderação de texto (fallback/exemplo)
const BAD_WORDS = ['palavrao1', 'ofensa', 'violencia_extrema', 'nudez_explicita'];

export async function POST(req: Request) {
  try {
    const { text, mediaUrl, type } = await req.json();

    let isSafe = true;
    let reason = '';

    // 1. Moderação de Texto (Simples)
    if (text) {
      const lowerText = text.toLowerCase();
      const hasBadWords = BAD_WORDS.some(word => lowerText.includes(word));
      if (hasBadWords) {
        isSafe = false;
        reason = 'Conteúdo de texto contém palavras não permitidas pelas diretrizes da comunidade.';
      }
    }

    // 2. Moderação de Imagem/Vídeo com Inteligência Artificial (Sightengine)
    if (isSafe && mediaUrl) {
      const apiUser = process.env.SIGHTENGINE_USER;
      const apiSecret = process.env.SIGHTENGINE_SECRET;

      if (apiUser && apiSecret) {
        // Decide se é imagem ou vídeo pela extensão
        const isVideo = mediaUrl.match(/\.(mp4|mov|webm)$/i);
        
        const endpoint = isVideo 
          ? 'https://api.sightengine.com/1.0/video/sync.json' 
          : 'https://api.sightengine.com/1.0/check.json';
        
        const params = new URLSearchParams({
          models: 'nudity-2.0,wad,offensive',
          api_user: apiUser,
          api_secret: apiSecret,
          url: mediaUrl
        });

        const urlWithParams = `${endpoint}?${params.toString()}`;

        const aiResponse = await fetch(urlWithParams);
        const aiData = await aiResponse.json();

        if (aiData.status === 'success') {
          // Analisando retorno da IA
          if (isVideo) {
            // Lógica simples para vídeo: checa os frames principais
            if (aiData.data && aiData.data.frames) {
              for (const frame of aiData.data.frames) {
                if (
                  (frame.nudity && frame.nudity.none < 0.8) || 
                  frame.weapon > 0.8 || 
                  frame.offensive?.prob > 0.8
                ) {
                  isSafe = false;
                  reason = 'Nossa IA identificou conteúdo visual impróprio (nudez, roupas de banho/lingerie, armas ou ofensivo) neste vídeo.';
                  break;
                }
              }
            }
          } else {
            // Lógica para imagem
            if (
              (aiData.nudity && aiData.nudity.none < 0.8) || 
              aiData.weapon > 0.8 || 
              aiData.offensive?.prob > 0.8
            ) {
              isSafe = false;
              reason = 'Nossa IA identificou conteúdo visual impróprio (nudez, roupas de banho/lingerie, armas ou ofensivo) nesta imagem.';
            }
          }
        } else {
          console.error('Sightengine API Error:', aiData);
        }
      } else {
        console.warn('SIGHTENGINE_USER e SIGHTENGINE_SECRET não configurados. Filtro de IA visual ignorado.');
      }
    }

    return NextResponse.json({ 
      safe: isSafe, 
      reason: reason 
    });

  } catch (error: any) {
    console.error('Moderation API Error:', error);
    // Em caso de erro na API de moderação, por segurança permitimos o post ou bloqueamos dependendo da política
    // Aqui vamos permitir para não travar o app se a API cair.
    return NextResponse.json({ safe: true, reason: 'Error checking content' });
  }
}
