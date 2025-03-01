// Helper function to trigger vibration feedback.
export function vibrateGamepad(
  gamepad: Gamepad,
  duration: number,
  strongMagnitude: number,
  weakMagnitude: number
): void {
  if (
    gamepad?.vibrationActuator &&
    typeof gamepad.vibrationActuator.playEffect === "function"
  ) {
    try {
      gamepad.vibrationActuator
        .playEffect("dual-rumble", {
          duration,
          startDelay: 0,
          strongMagnitude,
          weakMagnitude,
        })
        .catch((err) => {
          console.warn("Vibration error:", err);
        });
    } catch (err) {
      console.warn("Failed to play vibration effect:", err);
    }
  }
}
