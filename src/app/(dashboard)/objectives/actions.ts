'use server'

import { createClient } from '@/lib/supabase/server'

export async function togglePresented(objectiveId: string, presented: boolean) {
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('adura_objectives')
    .update({ presented, updated_at: new Date().toISOString() })
    .eq('id', objectiveId)

  if (error) throw error
}
