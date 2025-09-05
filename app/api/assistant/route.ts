import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, model = 'gpt-4o-mini' } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Validate message format
    for (const message of messages) {
      if (!message.role || !message.content) {
        return NextResponse.json(
          { error: 'Each message must have role and content' },
          { status: 400 }
        );
      }
      if (!['system', 'user', 'assistant'].includes(message.role)) {
        return NextResponse.json(
          { error: 'Invalid message role. Must be system, user, or assistant' },
          { status: 400 }
        );
      }
    }

    // Add system message if not present
    const systemMessage = {
      role: 'system',
      content: `You are GPT-4o mini, an advanced AI personal assistant for Personal Playground, a comprehensive platform that helps users manage their digital life.

IMPORTANT: You are GPT-4o mini (not GPT-3 or GPT-3.5). You are a more capable and advanced model than previous versions.

The platform includes:
- Data Manager: For storing notes, ideas, and personal information
- File Storage: For uploading and organizing files 
- Video Browser: For watching YouTube videos
- Daily Inspiration: For motivational quotes
- AI Image Generator: For creating images from text (DALL-E 3)
- Profile Management: For account settings

Your capabilities include:
- Advanced reasoning and problem-solving
- Creative writing and brainstorming
- Code assistance and technical help
- Detailed analysis and explanations
- Step-by-step guidance for complex tasks
- Personalized recommendations

LIMITATIONS: You cannot browse the web or access real-time information. Your knowledge has a cutoff date and you cannot visit websites or get current information from the internet.

You should be:
- Friendly, helpful, and professional
- Knowledgeable about productivity and organization
- Able to help with general questions and tasks
- Supportive and encouraging
- Honest about your limitations (especially web browsing)
- Clear about being GPT-4o mini when asked

You can help users with:
- Organizing their digital life
- Productivity tips and strategies
- General questions and advice
- Technical support for the platform
- Creative suggestions for content creation
- Time management and goal setting
- Code review and programming help
- Writing and editing assistance
- Problem-solving and analysis

Always be respectful, maintain a positive helpful tone, and be clear about what you can and cannot do.`
    };

    // Check if system message already exists
    const hasSystemMessage = messages.some(msg => msg.role === 'system');
    const conversationMessages = hasSystemMessage ? messages : [systemMessage, ...messages];

    console.log('Sending chat request to OpenAI...');

    const response = await openai.chat.completions.create({
      model: model,
      messages: conversationMessages,
      max_tokens: 1000,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const assistantMessage = response.choices[0]?.message;

    if (!assistantMessage) {
      throw new Error('No response generated');
    }

    console.log('Chat response generated successfully');

    return NextResponse.json({
      success: true,
      message: {
        role: assistantMessage.role,
        content: assistantMessage.content,
      },
      usage: response.usage,
      model: response.model,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('OpenAI Chat API error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('rate_limit_exceeded')) {
        return NextResponse.json(
          { 
            error: 'Too many requests. Please wait a moment before sending another message.',
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

      if (error.message.includes('content_policy_violation')) {
        return NextResponse.json(
          { 
            error: 'Message violates content policy. Please rephrase your request.',
            type: 'content_policy'
          },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to get response from assistant. Please try again.',
        type: 'general'
      },
      { status: 500 }
    );
  }
}
