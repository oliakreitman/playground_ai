import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid' } = await request.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate prompt length (OpenAI has a 4000 character limit)
    if (prompt.length > 4000) {
      return NextResponse.json(
        { error: 'Prompt is too long. Maximum 4000 characters allowed.' },
        { status: 400 }
      );
    }

    // Validate size parameter
    const validSizes = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'];
    if (!validSizes.includes(size)) {
      return NextResponse.json(
        { error: 'Invalid size. Must be one of: ' + validSizes.join(', ') },
        { status: 400 }
      );
    }

    // Validate quality parameter
    const validQualities = ['standard', 'hd'];
    if (!validQualities.includes(quality)) {
      return NextResponse.json(
        { error: 'Invalid quality. Must be either "standard" or "hd"' },
        { status: 400 }
      );
    }

    // Validate style parameter
    const validStyles = ['vivid', 'natural'];
    if (!validStyles.includes(style)) {
      return NextResponse.json(
        { error: 'Invalid style. Must be either "vivid" or "natural"' },
        { status: 400 }
      );
    }

    console.log('Generating image with prompt:', prompt.substring(0, 100) + '...');

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt.trim(),
      n: 1,
      size: size as "1024x1024" | "1792x1024" | "1024x1792",
      quality: quality as "standard" | "hd",
      style: style as "vivid" | "natural",
    });

    const imageUrl = response.data?.[0]?.url;
    const revisedPrompt = response.data?.[0]?.revised_prompt;

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    console.log('Image generated successfully');

    return NextResponse.json({
      success: true,
      imageUrl,
      revisedPrompt,
      originalPrompt: prompt,
      settings: {
        size,
        quality,
        style,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('OpenAI Image Generation error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('content_policy_violation')) {
        return NextResponse.json(
          { 
            error: 'Content policy violation. Please modify your prompt to comply with OpenAI\'s usage policies.',
            type: 'content_policy'
          },
          { status: 400 }
        );
      }
      
      if (error.message.includes('rate_limit_exceeded')) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded. Please wait a moment before generating another image.',
            type: 'rate_limit'
          },
          { status: 429 }
        );
      }
      
      if (error.message.includes('insufficient_quota')) {
        return NextResponse.json(
          { 
            error: 'Insufficient API quota. Please check your OpenAI account.',
            type: 'quota'
          },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate image. Please try again later.',
        type: 'general'
      },
      { status: 500 }
    );
  }
}
