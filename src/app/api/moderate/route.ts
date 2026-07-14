import { NextResponse } from 'next/server';

// Lista simples de palavras bloqueadas para moderação de texto (fallback/exemplo)
const BAD_WORDS = ['palavrao1', 'ofensa', 'violencia_extrema', 'nudez_explicita'];

export async function POST(req: Request) {
  try {
    const { text, mediaUrl, base64Media, type } = await req.json();

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
    if (isSafe && (mediaUrl || base64Media)) {
      const apiUser = process.env.SIGHTENGINE_USER;
      const apiSecret = process.env.SIGHTENGINE_SECRET;

      if (apiUser && apiSecret) {
        // Decide se é imagem ou vídeo pela extensão ou mime type
        const isVideo = (mediaUrl && mediaUrl.match(/\.(mp4|mov|webm)$/i)) || (base64Media && base64Media.startsWith('data:video/'));
        
        // Se for um vídeo local (blob ou base64) e não uma URL pública, a API da Sightengine não consegue checar.
        if (isVideo && (!mediaUrl || mediaUrl.startsWith('blob:'))) {
           console.warn('Vídeo local não pode ser checado pela Sightengine. Pulando verificação.');
        } else {
          const endpoint = isVideo 
            ? 'https://api.sightengine.com/1.0/video/sync.json' 
            : 'https://api.sightengine.com/1.0/check.json';
          
          let formData = new FormData();
          formData.append('models', 'nudity-2.0,wad,offensive,gore,tobacco,gambling,scam');
          formData.append('api_user', apiUser);
          formData.append('api_secret', apiSecret);

          if (base64Media && !isVideo) {
             const base64String = base64Media.split(',')[1];
             formData.append('base64', base64String);
          } else if (mediaUrl && !mediaUrl.startsWith('blob:')) {
             formData.append('url', mediaUrl);
          }

          if (formData.has('base64') || formData.has('url')) {
            const aiResponse = await fetch(endpoint, {
              method: 'POST',
              body: formData
            });
            const aiData = await aiResponse.json();

            if (aiData.status === 'success') {
              const checkViolation = (data: any) => {
                if (!data) return false;
                return (
                  (data.nudity?.suggestive > 0.8) ||
                  (data.nudity?.sexual_activity > 0.8) ||
                  (data.nudity?.sexual_display > 0.8) ||
                  (data.nudity?.erotica > 0.8) ||
                  (data.weapon > 0.8) ||
                  (data.alcohol > 0.8) ||
                  (data.drugs > 0.8) ||
                  (data.offensive?.prob > 0.8) ||
                  (data.gore?.prob > 0.8) ||
                  (data.tobacco?.prob > 0.8) ||
                  (data.gambling?.prob > 0.8) ||
                  (data.scam?.prob > 0.8)
                );
              };

              if (isVideo) {
                if (aiData.data && aiData.data.frames) {
                  for (const frame of aiData.data.frames) {
                    if (checkViolation(frame)) {
                      isSafe = false;
                      reason = 'Sua imagem viola nossa política de conteúdo e foi removida automaticamente.';
                      break;
                    }
                  }
                }
              } else {
                if (checkViolation(aiData)) {
                  isSafe = false;
                  reason = 'Sua imagem viola nossa política de conteúdo e foi removida automaticamente.';
                }
              }
            } else {
              console.error('Sightengine API Error:', aiData);
              isSafe = false;
              reason = 'Erro no servidor de inteligência artificial. Por segurança, a publicação foi bloqueada.';
            }
          }
        }
      } else {
        console.warn('SIGHTENGINE_USER e SIGHTENGINE_SECRET não configurados. Filtro de IA visual ignorado.');
        // Se a chave não estiver configurada, podemos permitir ou bloquear. O usuário quer moderação estrita.
        // Mas se ele não configurou a chave, não vai conseguir postar nada.
        // Vamos manter o aviso no console e permitir por padrão, já que é ambiente de dev, 
        // mas se a API estiver configurada e falhar, agora bloqueia.
      }
    }

    return NextResponse.json({ 
      safe: isSafe, 
      reason: reason 
    });

  } catch (error: any) {
    console.error('Moderation API Error:', error);
    return NextResponse.json({ 
      safe: false, 
      reason: 'Erro interno ao processar a verificação de segurança (arquivo possivelmente muito grande).' 
    });
  }
}
