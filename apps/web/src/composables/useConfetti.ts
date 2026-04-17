import confetti from 'canvas-confetti';

export function useConfetti() {
  function fireCartConfetti(originEl?: HTMLElement) {
    const origin = originEl
      ? {
          x: (originEl.getBoundingClientRect().left + originEl.offsetWidth / 2) / window.innerWidth,
          y: (originEl.getBoundingClientRect().top + originEl.offsetHeight / 2) / window.innerHeight,
        }
      : { x: 0.5, y: 0.6 };

    const colors = ['#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#ffffff'];

    confetti({ particleCount: 60, spread: 80, origin, colors, startVelocity: 35, gravity: 0.9, scalar: 0.9 });

    setTimeout(() => {
      confetti({ particleCount: 30, spread: 50, origin, colors, startVelocity: 20, gravity: 1.1, scalar: 0.7 });
    }, 120);
  }

  function fireSideCannons() {
    const colors = ['#a786ff', '#fd8bbc', '#fbbf24', '#34d399'];
    const end = Date.now() + 1800;

    const frame = () => {
      if (Date.now() > end) return;
      confetti({ particleCount: 3, angle: 60, spread: 55, startVelocity: 55, origin: { x: 0, y: 0.6 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, startVelocity: 55, origin: { x: 1, y: 0.6 }, colors });
      requestAnimationFrame(frame);
    };
    frame();
  }

  return { fireCartConfetti, fireSideCannons };
}
