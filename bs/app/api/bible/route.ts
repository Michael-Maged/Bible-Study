import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const book = searchParams.get('book')
  const ch = searchParams.get('ch')
  const ver = searchParams.get('ver')

  let url = `https://arabic-bible.onrender.com/api?book=${book}`
  if (ch) url += `&ch=${ch}`
  if (ver) url += `&ver=${ver}`

  try {
    const response = await fetch(url)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { book, chapter, from_verse, to_verse, day, grade, tenant } = body

    const { data, error } = await serviceSupabase
      .from('reading')
      .insert({
        book,
        chapter,
        from_verse,
        to_verse,
        day,
        grade,
        tenant
      })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('POST /api/bible error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
