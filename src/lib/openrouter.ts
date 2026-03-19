import { aiApi } from './api'

export async function chatCompletion(
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const data = await aiApi.chat(systemPrompt, userMessage)
  return data.content
}
