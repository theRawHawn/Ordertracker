import confetti from 'canvas-confetti';

/**
 * Triggers a festive birthday burst / celebration confetti animation
 * when order status changes to "Order Placed" or "Delivered".
 */
export function triggerBirthdayBurst() {
  // Center burst
  confetti({
    particleCount: 90,
    spread: 80,
    origin: { y: 0.6 },
    colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444'],
  });

  // Left & Right cannon burst for extra celebration feel
  setTimeout(() => {
    confetti({
      particleCount: 45,
      angle: 60,
      spread: 60,
      origin: { x: 0.1, y: 0.7 },
      colors: ['#f59e0b', '#10b981', '#ec4899', '#8b5cf6'],
    });
    confetti({
      particleCount: 45,
      angle: 120,
      spread: 60,
      origin: { x: 0.9, y: 0.7 },
      colors: ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'],
    });
  }, 150);
}
