export const playSpinSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(50, audioContext.currentTime + 10);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 10);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 10);
  } catch (e) {
    console.log('Sound not supported');
  }
};

export const playWinSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime);
    oscillator2.frequency.setValueAtTime(659.25, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator1.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 1);
    oscillator2.start(audioContext.currentTime);
    oscillator2.stop(audioContext.currentTime + 1);
  } catch (e) {
    console.log('Sound not supported');
  }
};
