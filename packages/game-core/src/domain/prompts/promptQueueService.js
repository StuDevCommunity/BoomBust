import { createTimestamp } from '../events/eventFactory.js';

let fallbackIdSequence = 0;

export function getPromptId(prefix = 'prompt') {
	fallbackIdSequence += 1;
	return `${prefix}-${createTimestamp()}-${fallbackIdSequence}`;
}

export function queuePlayerPrompt(player, prompt) {
	if (!player.pendingPrompts) player.pendingPrompts = [];
	player.pendingPrompts.push({
		...prompt,
		id: prompt.id || getPromptId(prompt.kind || 'prompt'),
		createdAt: createTimestamp(),
	});
}

export function getCurrentPrompt(player) {
	return player?.pendingPrompts?.[0] || null;
}

export function removeCurrentPrompt(player) {
	if (player?.pendingPrompts?.length) {
		player.pendingPrompts.shift();
	}
}
