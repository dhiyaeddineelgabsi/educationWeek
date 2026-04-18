/* ─── replies.js ─────────────────────────────────────────────────── */
/* Base de connaissances du bot.
   Clé : mot-clé à détecter dans le message utilisateur (toLowerCase).
   Valeur : réponse formatée (supporte **gras** et \n pour sauts de ligne).
   ----------------------------------------------------------------
   Pour connecter le vrai RAG n8n, remplace getBotReply() dans chat.js
   par un appel fetch vers ton webhook Azure.                          */

const BOT_REPLIES = {
  "photosynthèse": `La **photosynthèse** est le processus par lequel les plantes transforment la lumière solaire, l'eau (H₂O) et le CO₂ en glucose et en oxygène.\n\nFormule simplifiée :\n6CO₂ + 6H₂O + lumière → C₆H₁₂O₆ + 6O₂\n\nC'est la base de toute la chaîne alimentaire !`,

  "équation": `Pour résoudre **ax² + bx + c = 0**, calcule le discriminant **Δ = b² − 4ac** :\n\n• Δ > 0 → deux solutions réelles : x = (−b ± √Δ) / 2a\n• Δ = 0 → une solution double : x = −b / 2a\n• Δ < 0 → pas de solution réelle`,

  "intelligence artificielle": `L'**IA** est un domaine de l'informatique qui crée des systèmes capables de réaliser des tâches requérant normalement de l'intelligence humaine : reconnaissance d'images, compréhension du langage, apprentissage à partir de données, etc.\n\nSes grandes branches : apprentissage automatique, réseaux de neurones, NLP…`,

  "ohm": `La **loi d'Ohm** relie tension, résistance et courant :\n\n**U = R × I**\n\n• U : tension en volts (V)\n• R : résistance en ohms (Ω)\n• I : courant en ampères (A)\n\nElle s'applique aux conducteurs ohmiques dans des conditions normales.`,

  "dissertation": `Structure d'une bonne dissertation :\n\n1. **Introduction** : accroche, contextualisation, problématique, annonce du plan.\n2. **Développement** : 2 ou 3 parties équilibrées avec arguments et exemples.\n3. **Conclusion** : bilan, réponse à la problématique, ouverture vers un sujet plus large.`,

  "ram": `La **RAM** (Random Access Memory) est la mémoire vive de ton ordinateur.\n\nElle stocke temporairement les données utilisées par le processeur. Plus tu as de RAM, plus ton PC peut gérer de programmes simultanément sans ralentir.\n\nContrairement au disque dur, son contenu est effacé à l'extinction.`,

  "pythagore": `Dans un triangle rectangle, le **théorème de Pythagore** affirme que :\n\n**a² + b² = c²**\n\noù **c** est l'hypoténuse (côté opposé à l'angle droit), et a, b les deux autres côtés.\n\nExemple : si a = 3 et b = 4, alors c = 5.`,

  "algorithme": `Un **algorithme** est une suite d'instructions précises et ordonnées permettant de résoudre un problème.\n\nC'est comme une recette de cuisine : on suit les étapes dans l'ordre pour obtenir le résultat voulu.\n\nExemple : l'algorithme de tri à bulles compare des éléments deux à deux et les échange si nécessaire.`,

  "révolution française": `La **Révolution française** (1789–1799) a renversé la monarchie absolue, proclamé les droits de l'homme et instauré la République.\n\nÉvénements clés :\n• 1789 : prise de la Bastille\n• 1791 : Constitution\n• 1793 : Terreur sous Robespierre\n• 1799 : coup d'état de Napoléon\n\nSes idéaux de **Liberté, Égalité, Fraternité** ont influencé le monde entier.`
};

/**
 * Retourne la réponse du bot en fonction du message utilisateur.
 * Recherche par correspondance de mot-clé (insensible à la casse).
 *
 * @param {string} text - Message de l'utilisateur
 * @returns {string} Réponse du bot
 *
 * TODO : remplacer par un appel fetch vers le webhook n8n :
 *   const res = await fetch('https://n8n-dhiya.azurewebsites.net/webhook/chatbot', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ message: text })
 *   });
 *   const data = await res.json();
 *   return data.reply;
 */
function getBotReply(text) {
  const lower = text.toLowerCase();
  for (const [keyword, reply] of Object.entries(BOT_REPLIES)) {
    if (lower.includes(keyword)) return reply;
  }
  return `Très bonne question ! Notre système RAG va bientôt chercher la réponse dans la base de connaissances IEEE.\n\nEn attendant l'intégration n8n complète, je note ta question : _"${text}"_. Continue à explorer !`;
}
