class SoundFX {
	constructor() {
		this.ctx = null;
		this.enabled = true;
	}

	init() {
		if (!this.ctx && window.AudioContext) {
			this.ctx = new (window.AudioContext || window.webkitAudioContext)();
		}
	}

	playDiceRoll() {
		if (!this.enabled) return;
		this.init();
		if (!this.ctx) return;
		
		const createClick = (delay) => {
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();
			
			osc.type = 'triangle';
			osc.frequency.setValueAtTime(600 + Math.random() * 400, this.ctx.currentTime + delay);
			osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + delay + 0.05);
			
			gain.gain.setValueAtTime(0, this.ctx.currentTime + delay);
			gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + delay + 0.01);
			gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + delay + 0.05);

			osc.connect(gain);
			gain.connect(this.ctx.destination);
			
			osc.start(this.ctx.currentTime + delay);
			osc.stop(this.ctx.currentTime + delay + 0.05);
		};

		// Play 3 short clicks simulating bouncing dice
		createClick(0);
		createClick(0.08);
		createClick(0.18);
	}

	playPayday() {
		if (!this.enabled) return;
		this.init();
		if (!this.ctx) return;

		const createTing = (delay, freq) => {
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();

			osc.type = 'sine';
			osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);

			gain.gain.setValueAtTime(0, this.ctx.currentTime + delay);
			gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + delay + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + delay + 0.8);

			osc.connect(gain);
			gain.connect(this.ctx.destination);

			osc.start(this.ctx.currentTime + delay);
			osc.stop(this.ctx.currentTime + delay + 0.8);
		};

		// "Ting Ting"
		createTing(0, 1200);   // E6
		createTing(0.15, 1568); // G6
	}

	playWin() {
		if (!this.enabled) return;
		this.init();
		if (!this.ctx) return;

		const createNote = (delay, freq, duration) => {
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();

			osc.type = 'square';
			osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);

			gain.gain.setValueAtTime(0, this.ctx.currentTime + delay);
			gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + delay + 0.05);
			gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + delay + duration);

			osc.connect(gain);
			gain.connect(this.ctx.destination);

			osc.start(this.ctx.currentTime + delay);
			osc.stop(this.ctx.currentTime + delay + duration);
		};

		// C Major Arpeggio fanfare
		createNote(0.0, 523.25, 0.2); // C5
		createNote(0.2, 659.25, 0.2); // E5
		createNote(0.4, 783.99, 0.2); // G5
		createNote(0.6, 1046.50, 0.6); // C6
	}
}

export const soundFX = new SoundFX();
