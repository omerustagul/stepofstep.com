export const triggerConfetti = () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

    for (let i = 0; i < 100; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.top = '-10px';
        particle.style.width = '10px';
        particle.style.height = '10px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '9999';

        // Random transition
        const duration = Math.random() * 3 + 2 + 's';
        particle.style.transition = `transform ${duration} linear, opacity ${duration} ease-in`;

        document.body.appendChild(particle);

        // Animate
        setTimeout(() => {
            particle.style.transform = `translate(${Math.random() * 100 - 50}px, 100vh) rotate(${Math.random() * 360}deg)`;
            particle.style.opacity = '0';
        }, 100);

        // Cleanup
        setTimeout(() => {
            particle.remove();
        }, 5000);
    }
};
