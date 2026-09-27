import { NextRequest, NextResponse } from 'next/server';
import Mux from '@mux/mux-node';

function getMuxClient() {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    throw new Error('Credenciais de integração de vídeo não configuradas no servidor.');
  }

  return new Mux({ tokenId, tokenSecret });
}

// POST: Cria URL de upload direto seguro
export async function POST(req: NextRequest) {
  try {
    const mux = getMuxClient();

    const upload = await mux.video.uploads.create({
      cors_origin: '*',
      new_asset_settings: {
        playback_policy: ['public'],
        encoding_tier: 'baseline',
      },
    });

    return NextResponse.json({
      uploadUrl: upload.url,
      uploadId: upload.id,
    });
  } catch (error: any) {
    console.error('Erro ao gerar upload de vídeo:', error);
    return NextResponse.json(
      { error: error.message || 'Falha ao inicializar o upload de vídeo.' },
      { status: 500 }
    );
  }
}

// GET: Consulta status do processamento do vídeo
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uploadId = searchParams.get('uploadId');

    if (!uploadId) {
      return NextResponse.json({ error: 'uploadId é obrigatório' }, { status: 400 });
    }

    const mux = getMuxClient();
    const upload = await mux.video.uploads.retrieve(uploadId);

    if (upload.status === 'asset_created' && upload.asset_id) {
      const asset = await mux.video.assets.retrieve(upload.asset_id);
      const playbackId = asset.playback_ids?.[0]?.id;

      // Formatar duração aproximada (ex: "12:34" ou "1h 15m")
      let formattedDuration = '';
      if (asset.duration) {
        const totalSeconds = Math.round(asset.duration);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0) {
          formattedDuration = `${hours}h ${minutes.toString().padStart(2, '0')}m`;
        } else {
          formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
      }

      return NextResponse.json({
        status: 'ready',
        assetId: asset.id,
        playbackId,
        streamUrl: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null,
        thumbnailUrl: playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg` : null,
        durationSeconds: asset.duration,
        durationFormatted: formattedDuration,
        aspectRatio: asset.aspect_ratio,
      });
    }

    if (upload.status === 'errored') {
      return NextResponse.json({
        status: 'errored',
        error: upload.error?.message || 'Erro durante o processamento do arquivo de vídeo.',
      });
    }

    return NextResponse.json({
      status: upload.status || 'waiting',
    });
  } catch (error: any) {
    console.error('Erro ao consultar status do vídeo:', error);
    return NextResponse.json(
      { error: error.message || 'Falha ao consultar processamento.' },
      { status: 500 }
    );
  }
}
