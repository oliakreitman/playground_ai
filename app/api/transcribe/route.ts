import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB for OpenAI Whisper)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size is 25MB.' },
        { status: 400 }
      );
    }

    console.log('Transcribing audio file:', audioFile.name, 'Size:', audioFile.size);

    // Convert File to buffer and then create a new File for OpenAI
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create a temporary file-like object for OpenAI
    const audioFileForOpenAI = new File([buffer], 'audio.webm', {
      type: audioFile.type || 'audio/webm',
    });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFileForOpenAI,
      model: 'whisper-1',
      language: 'en', // You can make this dynamic or auto-detect
      response_format: 'text',
      temperature: 0.0,
    });

    console.log('Transcription completed successfully');

    return NextResponse.json({
      success: true,
      transcript: transcription,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('OpenAI Transcription error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('rate_limit_exceeded')) {
        return NextResponse.json(
          { 
            error: 'Too many transcription requests. Please wait a moment.',
            type: 'rate_limit'
          },
          { status: 429 }
        );
      }
      
      if (error.message.includes('insufficient_quota')) {
        return NextResponse.json(
          { 
            error: 'API quota exceeded. Please check your OpenAI account.',
            type: 'quota'
          },
          { status: 403 }
        );
      }

      if (error.message.includes('invalid_request_error')) {
        return NextResponse.json(
          { 
            error: 'Invalid audio format. Please try again with a different recording.',
            type: 'invalid_format'
          },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to transcribe audio. Please try again.',
        type: 'general'
      },
      { status: 500 }
    );
  }
}
