import profBussinessMgr from '../assets/Professions/bussiness_mgr 1.png';
import profDoctor from '../assets/Professions/doctor 1.png';
import profEngineer from '../assets/Professions/engineer 1.png';
import profJanitor from '../assets/Professions/janitor 2.png';
import profLawyer from '../assets/Professions/lawyer 1.png';
import profMechanic from '../assets/Professions/mechanic 1.png';
import profNurse from '../assets/Professions/nurse 1.png';
import profPilot from '../assets/Professions/pilot 1.png';
import profPolice from '../assets/Professions/police 1.png';
import profSecretary from '../assets/Professions/secretary 1.png';
import profTeacher from '../assets/Professions/teacher 1.png';
import profTruckDriver from '../assets/Professions/truck_driver 1.png';

const PROFESSION_IMAGES = {
	business_manager: profBussinessMgr,
	doctor: profDoctor,
	engineer: profEngineer,
	janitor: profJanitor,
	lawyer: profLawyer,
	mechanic: profMechanic,
	nurse: profNurse,
	pilot: profPilot,
	police_officer: profPolice,
	secretary: profSecretary,
	teacher: profTeacher,
	truck_driver: profTruckDriver,
	doctor__md_: profDoctor,
	teacher__k_12_: profTeacher,
	airline_pilot: profPilot,
};

export function getProfessionImage(professionId) {
	if (!professionId) return null;
	const key = professionId.toLowerCase().replace(/[^a-z0-9]/g, '_');
	if (PROFESSION_IMAGES[key]) return PROFESSION_IMAGES[key];
	const baseKey = key.replace(/_+/g, '_').replace(/^_|_$/g, '');
	if (PROFESSION_IMAGES[baseKey]) return PROFESSION_IMAGES[baseKey];
	return PROFESSION_IMAGES[baseKey.split('_')[0]] || null;
}
