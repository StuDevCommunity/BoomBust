import { stageDefinitions } from '../../data/boombust/stages.js';

export function getStageDefinition(stageId) {
	return stageDefinitions.find((stage) => stage.id === stageId) || stageDefinitions[0];
}

export function createInitialStageState() {
	const stage = stageDefinitions[0];
	return {
		currentStageId: stage.id,
		seenContextIds: [],
		contextModal: createStageContextModal(stage),
	};
}

export function createStageContextModal(stage) {
	return {
		kind: 'stage',
		title: stage.title,
		subtitle: stage.subtitle,
		description: stage.description,
		mood: stage.mood,
	};
}
