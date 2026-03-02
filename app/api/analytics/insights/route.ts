import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _openai
}

export interface ContentSuggestion {
  hook: string
  caption_idea: string
  platform: string
  format: string
  why_it_will_work: string
  angle: string
}

export interface AnalyticsInsights {
  summary: string
  suggestions: ContentSuggestion[]
}

interface PostSnapshot {
  hook: string | null
  caption: string | null
  platform: string
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  reach: number
  engagement_rate: string
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { posts }: { posts: PostSnapshot[] } = body

    if (!posts || posts.length === 0) {
      return NextResponse.json({ error: 'No posts provided' }, { status: 400 })
    }

    // Take up to the top 5 posts (caller should sort by engagement before sending)
    const topPosts = posts.slice(0, 5)

    const postsBlock = topPosts
      .map((p, i) => {
        const lines = [
          `POST ${i + 1}`,
          `  Platform: ${p.platform}`,
          `  Hook: "${p.hook ?? 'N/A'}"`,
          `  Caption: "${p.caption ?? 'N/A'}"`,
          `  Views: ${p.views.toLocaleString()} | Likes: ${p.likes.toLocaleString()} | Comments: ${p.comments.toLocaleString()} | Shares: ${p.shares.toLocaleString()} | Saves: ${p.saves.toLocaleString()}`,
          `  Reach: ${p.reach.toLocaleString()} | Engagement Rate: ${p.engagement_rate}`,
        ]
        return lines.join('\n')
      })
      .join('\n\n')

    const systemPrompt = `You are an expert social media strategist and viral content director.
You will be given a brand's top-performing posts with their engagement metrics.
Your job is to:
1. Identify exactly what patterns are making these posts succeed (hook style, platform strengths, content angles, emotional triggers)
2. Generate 3 new content suggestions that extrapolate those winning patterns to create content with strong viral potential

Return ONLY valid JSON in this exact shape — no markdown, no preamble:
{
  "summary": "2-3 sentence insight into what is working across these posts and why",
  "suggestions": [
    {
      "hook": "5-10 word attention-grabbing hook",
      "caption_idea": "25-50 word caption concept describing the post angle",
      "platform": "instagram | tiktok | facebook | linkedin | youtube | twitter | pinterest",
      "format": "e.g. Short-form video | Carousel | Static image | Reel | Story",
      "why_it_will_work": "1-2 sentence explanation tied directly to the top performer patterns you identified",
      "angle": "e.g. The Results | The Specialist | The Anti-Category | The Speed | The Simplicity"
    }
  ]
}`

    const userPrompt = `Here are the top-performing posts:

${postsBlock}

Analyze these posts and generate 3 viral content suggestions based on what is working.
Make the hooks punchy, specific, and platform-native.
Tie each suggestion explicitly back to a pattern you observed in the data.`

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.75,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    const parsed: AnalyticsInsights = JSON.parse(content)

    if (!parsed.summary || !Array.isArray(parsed.suggestions)) {
      return NextResponse.json({ error: 'Unexpected AI response shape' }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error('[Analytics Insights] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate insights' },
      { status: 500 }
    )
  }
}
