import type { SaveState } from '@shared/types'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

export interface SaveStateMetadata {
  gameId: string
  consoleId: string
  slotNumber: number
  screenshotPath?: string
}

export class SaveStateManager {
  // Save a game state to local storage and optionally sync to cloud
  async saveSaveState(
    metadata: SaveStateMetadata,
    fileData: ArrayBuffer,
    screenshotPath?: string
  ): Promise<SaveState | null> {
    try {
      const saveState: SaveState = {
        id: `${metadata.consoleId}_${metadata.gameId}_${metadata.slotNumber}`,
        slotNumber: metadata.slotNumber,
        createdAt: new Date().toISOString(),
        fileSize: fileData.byteLength,
        screenshotPath,
      }

      // Try to sync to cloud if user is authenticated
      const session = (await supabase.auth.getSession()).data.session
      if (session) {
        await this.uploadToCloud(
          metadata.gameId,
          metadata.consoleId,
          metadata.slotNumber,
          fileData,
          screenshotPath
        )
        saveState.cloudSynced = true
      }

      return saveState
    } catch (error) {
      console.error('Error saving state:', error)
      return null
    }
  }

  // Load a save state from cloud
  async loadSaveState(
    gameId: string,
    consoleId: string,
    slotNumber: number
  ): Promise<ArrayBuffer | null> {
    try {
      const session = (await supabase.auth.getSession()).data.session
      if (!session) return null

      const { data, error } = await supabase
        .from('save_states')
        .select('file_data')
        .eq('game_id', gameId)
        .eq('console_id', consoleId)
        .eq('slot_number', slotNumber)
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (error || !data) return null

      if (typeof data.file_data === 'string') {
        // Decode from base64
        const binary = atob(data.file_data)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i)
        }
        return bytes.buffer
      }

      return data.file_data as ArrayBuffer
    } catch (error) {
      console.error('Error loading save state:', error)
      return null
    }
  }

  // Get all save states for a game
  async getSaveStatesForGame(gameId: string, consoleId: string): Promise<SaveState[]> {
    try {
      const session = (await supabase.auth.getSession()).data.session
      if (!session) return []

      const { data, error } = await supabase
        .from('save_states')
        .select('*')
        .eq('game_id', gameId)
        .eq('console_id', consoleId)
        .eq('user_id', session.user.id)
        .order('slot_number', { ascending: true })

      if (error || !data) return []

      return data.map((row: any) => ({
        id: row.id,
        slotNumber: row.slot_number,
        createdAt: row.created_at,
        fileSize: row.file_size,
        screenshotPath: row.screenshot_path,
        cloudSynced: row.cloud_synced,
      }))
    } catch (error) {
      console.error('Error fetching save states:', error)
      return []
    }
  }

  // Delete a save state
  async deleteSaveState(
    gameId: string,
    consoleId: string,
    slotNumber: number
  ): Promise<boolean> {
    try {
      const session = (await supabase.auth.getSession()).data.session
      if (!session) return false

      const { error } = await supabase
        .from('save_states')
        .delete()
        .eq('game_id', gameId)
        .eq('console_id', consoleId)
        .eq('slot_number', slotNumber)
        .eq('user_id', session.user.id)

      return !error
    } catch (error) {
      console.error('Error deleting save state:', error)
      return false
    }
  }

  // Private: Upload save state to cloud
  private async uploadToCloud(
    gameId: string,
    consoleId: string,
    slotNumber: number,
    fileData: ArrayBuffer,
    screenshotPath?: string
  ): Promise<void> {
    const session = (await supabase.auth.getSession()).data.session
    if (!session) return

    // Convert ArrayBuffer to base64 for storage
    const binary = String.fromCharCode.apply(null, Array.from(new Uint8Array(fileData)) as any)
    const base64Data = btoa(binary)

    const { error } = await supabase.from('save_states').upsert(
      {
        user_id: session.user.id,
        game_id: gameId,
        console_id: consoleId,
        slot_number: slotNumber,
        file_data: base64Data,
        file_size: fileData.byteLength,
        screenshot_path: screenshotPath,
        cloud_synced: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,game_id,console_id,slot_number',
      }
    )

    if (error) throw error
  }

  // Sync all local saves to cloud
  async syncToCloud(): Promise<number> {
    const session = (await supabase.auth.getSession()).data.session
    if (!session) return 0

    // This would be called periodically to sync local saves
    // Implementation depends on how local saves are stored
    console.log('Syncing to cloud for user:', session.user.id)
    return 0
  }
}

export const saveStateManager = new SaveStateManager()
