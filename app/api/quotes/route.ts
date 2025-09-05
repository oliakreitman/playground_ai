import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'daily';
    const category = searchParams.get('category') || 'general';

    let prompt = '';
    
    switch (type) {
      case 'daily':
        prompt = `Generate a short, uplifting motivational quote for today. The quote should be:
- Positive and inspiring
- No more than 20 words
- Focus on ${category === 'general' ? 'personal growth, success, or happiness' : category}
- Original and meaningful
- Easy to remember

Format: Just return the quote in quotes, followed by "- Personal Playground" as the attribution.`;
        break;
        
      case 'morning':
        prompt = `Generate a motivational morning quote to start the day. The quote should be:
- Energizing and positive
- About new beginnings or fresh starts
- No more than 25 words
- Focus on productivity and optimism

Format: Just return the quote in quotes, followed by "- Personal Playground" as the attribution.`;
        break;
        
      case 'achievement':
        prompt = `Generate a motivational quote about achieving goals and success. The quote should be:
- Inspiring and empowering
- About perseverance and accomplishment
- No more than 20 words
- Professional yet uplifting

Format: Just return the quote in quotes, followed by "- Personal Playground" as the attribution.`;
        break;
        
      default:
        prompt = `Generate a short, positive motivational quote. Keep it under 20 words and make it inspiring.

Format: Just return the quote in quotes, followed by "- Personal Playground" as the attribution.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a motivational quote generator. Create original, inspiring quotes that are positive, uplifting, and meaningful. Always format responses exactly as requested."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.8,
    });

    const quote = completion.choices[0]?.message?.content?.trim();
    
    if (!quote) {
      throw new Error('No quote generated');
    }

    // Parse the quote and attribution
    const quoteParts = quote.split(' - ');
    const quoteText = quoteParts[0].replace(/^"|"$/g, ''); // Remove surrounding quotes
    const attribution = quoteParts[1] || 'Personal Playground';

    return NextResponse.json({
      quote: quoteText,
      attribution: attribution,
      type: type,
      category: category,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fallback quotes in case of API failure
    const fallbackQuotes = [
      {
        quote: "Today is a new opportunity to grow and shine.",
        attribution: "Personal Playground",
        type: "daily",
        category: "general"
      },
      {
        quote: "Your potential is limitless when you believe in yourself.",
        attribution: "Personal Playground", 
        type: "daily",
        category: "general"
      },
      {
        quote: "Small steps lead to big achievements.",
        attribution: "Personal Playground",
        type: "daily", 
        category: "general"
      },
      {
        quote: "Every moment is a fresh beginning.",
        attribution: "Personal Playground",
        type: "morning",
        category: "general"
      },
      {
        quote: "Success starts with a single step forward.",
        attribution: "Personal Playground",
        type: "achievement",
        category: "general"
      }
    ];

    const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    
    return NextResponse.json({
      ...randomQuote,
      timestamp: new Date().toISOString(),
      fallback: true,
    });
  }
}

