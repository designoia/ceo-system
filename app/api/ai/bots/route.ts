import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getAppUserId } from '@/lib/supabase/admin';
import { INITIAL_AI_BOTS } from '@/lib/ai/bot-catalog';
import { AIBot } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = getSupabaseAdmin();

  // If Supabase is not configured, return catalog directly (with system prompts omitted for security)
  if (!admin) {
    const publicBots = INITIAL_AI_BOTS.map(({ systemPrompt, ...rest }) => rest);
    return NextResponse.json({
      configured: false,
      bots: publicBots,
    });
  }

  try {
    const userId = await getAppUserId();
    const { data: remoteBots, error } = await admin
      .from('ai_bots')
      .select('id, name, slug, description, icon, category, welcome_message, conversation_starters, model_provider, model_name, temperature, knowledge_base_enabled, web_search_enabled, tools_enabled, output_actions, capabilities, example_use_cases, is_active, sort_order, created_at, updated_at')
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Could not query ai_bots from Supabase:', error.message);
      const publicBots = INITIAL_AI_BOTS.map(({ systemPrompt, ...rest }) => rest);
      return NextResponse.json({
        configured: true,
        source: 'local_fallback',
        bots: publicBots,
      });
    }

    // If table exists but is empty, seed it with the initial catalog
    if (!remoteBots || remoteBots.length === 0) {
      const toInsert = INITIAL_AI_BOTS.map((bot) => ({
        user_id: userId,
        name: bot.name,
        slug: bot.slug,
        description: bot.description,
        icon: bot.icon,
        category: bot.category,
        system_prompt: bot.systemPrompt || '',
        welcome_message: bot.welcomeMessage,
        conversation_starters: bot.conversationStarters,
        model_provider: bot.modelProvider || 'openrouter',
        model_name: bot.modelName || 'anthropic/claude-3.5-sonnet',
        temperature: bot.temperature ?? 0.7,
        knowledge_base_enabled: bot.knowledgeBaseEnabled ?? false,
        web_search_enabled: bot.webSearchEnabled ?? false,
        tools_enabled: bot.toolsEnabled || [],
        output_actions: bot.outputActions || [],
        capabilities: bot.capabilities || [],
        example_use_cases: bot.exampleUseCases || [],
        is_active: bot.isActive ?? true,
        sort_order: bot.sortOrder ?? 0,
      }));

      await admin.from('ai_bots').upsert(toInsert, { onConflict: 'slug' });
      const publicBots = INITIAL_AI_BOTS.map(({ systemPrompt, ...rest }) => rest);
      return NextResponse.json({
        configured: true,
        source: 'catalog_seeded',
        bots: publicBots,
      });
    }

    // Map remote database records into AIBot format
    const mappedBots: AIBot[] = remoteBots.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      icon: r.icon,
      category: r.category,
      welcomeMessage: r.welcome_message,
      conversationStarters: r.conversation_starters || [],
      modelProvider: r.model_provider,
      modelName: r.model_name,
      temperature: Number(r.temperature),
      knowledgeBaseEnabled: Boolean(r.knowledge_base_enabled),
      webSearchEnabled: Boolean(r.web_search_enabled),
      toolsEnabled: r.tools_enabled || [],
      outputActions: r.output_actions || [],
      capabilities: r.capabilities || [],
      exampleUseCases: r.example_use_cases || [],
      isActive: r.is_active,
      sortOrder: r.sort_order,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json({
      configured: true,
      source: 'supabase',
      bots: mappedBots,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error fetching AI bots:', message);
    const publicBots = INITIAL_AI_BOTS.map(({ systemPrompt, ...rest }) => rest);
    return NextResponse.json({
      configured: true,
      source: 'local_fallback',
      bots: publicBots,
    });
  }
}
