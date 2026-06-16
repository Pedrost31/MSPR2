import crypto from 'crypto';
import { prisma } from '../config/database';
import { Recommendation } from '../models/Recommendation';
import { AILog } from '../models/AILog';
import { env } from '../config/env';

interface UserProfile {
  name: string;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  gender?: string | null;
  activityLevel?: string | null;
  goal?: string | null;
  dailyCalorieTarget?: number | null;
}

const buildPrompt = (profile: UserProfile, type: string, context?: string): string => {
  const lines = [
    `Nom : ${profile.name}`,
    profile.age            ? `Âge : ${profile.age} ans`               : null,
    profile.weight         ? `Poids : ${profile.weight} kg`            : null,
    profile.height         ? `Taille : ${profile.height} cm`           : null,
    profile.gender         ? `Genre : ${profile.gender}`               : null,
    profile.activityLevel  ? `Niveau d'activité : ${profile.activityLevel}` : null,
    profile.goal           ? `Objectif : ${profile.goal} du poids`    : null,
    profile.dailyCalorieTarget ? `Cible calorique : ${profile.dailyCalorieTarget} kcal/jour` : null,
  ].filter(Boolean).join('\n');

  const typeInstructions: Record<string, string> = {
    nutrition: 'Fournis des conseils nutritionnels personnalisés et un plan alimentaire journalier.',
    activity:  'Fournis un programme d\'activité physique personnalisé pour la semaine.',
    general:   'Fournis des conseils santé et bien-être globaux.',
  };

  return `Tu es HealthAI Coach, un expert en nutrition et santé.

Profil utilisateur :
${lines}
${context ? `\nContexte supplémentaire : ${context}` : ''}

${typeInstructions[type] ?? typeInstructions['general']}
Sois précis, pratique et encourageant. Structure ta réponse avec des sections claires.
Limite ta réponse à 400 mots maximum.`;
};

const mockResponse = (type: string): string => {
  const responses: Record<string, string> = {
    nutrition: `## Conseils nutritionnels\n\n**Répartition calorique recommandée :**\n- Protéines : 30 % (viandes maigres, légumineuses, œufs)\n- Glucides complexes : 40 % (riz complet, avoine, patate douce)\n- Lipides sains : 30 % (avocat, noix, huile d'olive)\n\n**Plan alimentaire type :**\n- Petit-déjeuner : flocons d'avoine + fruits + protéines\n- Déjeuner : protéine maigre + légumes + féculent\n- Dîner : léger, riche en légumes et protéines\n- Collation : fruits ou yaourt grec\n\n**Conseils clés :**\n- Boire 2 L d'eau par jour\n- Éviter les sucres transformés\n- Planifier les repas à l'avance`,
    activity:  `## Programme d'activité\n\n**Planning hebdomadaire :**\n- Lundi : cardio 30 min (course ou vélo)\n- Mercredi : musculation full-body 45 min\n- Vendredi : cardio 30 min + étirements\n- Dimanche : marche active 45 min\n\n**Conseils :**\n- Échauffement 5-10 min avant chaque séance\n- Récupération active entre les séances\n- Augmenter progressivement l'intensité (+10 %/semaine)\n- Dormir 7-9 h pour optimiser la récupération`,
    general:   `## Conseils santé globaux\n\n**Nutrition :** Privilégie les aliments entiers et non transformés. Mange à heures régulières.\n\n**Activité physique :** Vise 150 min d'activité modérée par semaine. La régularité prime sur l'intensité.\n\n**Sommeil :** 7-9 h par nuit sont essentielles à la récupération et au contrôle du poids.\n\n**Stress :** Pratique la respiration profonde ou la méditation 10 min/jour.\n\n**Hydratation :** 2-3 L d'eau quotidiennement, davantage lors de l'effort.`,
  };
  return responses[type] ?? responses['general']!;
};

const callOpenAI = async (prompt: string, type: string): Promise<{ content: string; model: string; tokens?: number }> => {
  if (!env.OPENAI_API_KEY) {
    return { content: mockResponse(type), model: 'mock' };
  }

  try {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 700,
      temperature: 0.7,
    });
    return {
      content: response.choices[0]?.message?.content ?? mockResponse(type),
      model: response.model,
      tokens: response.usage?.total_tokens,
    };
  } catch {
    return { content: mockResponse(type), model: 'mock-fallback' };
  }
};

export const generateRecommendation = async (input: {
  userId: string;
  type: 'nutrition' | 'activity' | 'general';
  context?: string;
}) => {
  const { userId, type, context } = input;
  const requestId = crypto.randomUUID();
  const t0 = Date.now();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, age: true, weight: true, height: true, gender: true, activityLevel: true, goal: true, dailyCalorieTarget: true },
  });
  if (!user) throw new Error('Utilisateur introuvable');

  const prompt = buildPrompt(user, type, context);

  try {
    const result  = await callOpenAI(prompt, type);
    const latency = Date.now() - t0;

    const recommendation = await Recommendation.create({
      userId, type, prompt, content: result.content, aiModel: result.model, tokens: result.tokens,
    });

    await AILog.create({
      userId, requestId, service: 'openai', status: 'success',
      input: { type, context }, output: result.content, latencyMs: latency,
    });

    return recommendation;
  } catch (err) {
    await AILog.create({
      userId, requestId, service: 'openai', status: 'error',
      input: { type, context },
      error: err instanceof Error ? err.message : 'Erreur inconnue',
      latencyMs: Date.now() - t0,
    });
    throw err;
  }
};

export const getRecommendationHistory = async (userId: string, type?: string, limit = 10) => {
  const filter: Record<string, unknown> = { userId };
  if (type) filter['type'] = type;
  return Recommendation.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
};
