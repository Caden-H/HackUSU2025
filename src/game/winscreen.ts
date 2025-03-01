import * as PIXI from 'pixi.js';

export class WinScreen {
  private victoryText: PIXI.Text;
  private redScoreText: PIXI.Text;
  private blueScoreText: PIXI.Text;
  private redScore: number = 0;
  private blueScore: number = 0;
  private gameOver: boolean = false;
  private scoreContainer: PIXI.Container;

  constructor(app: PIXI.Application) {
    // Victory Text
    this.victoryText = new PIXI.Text('', {
      fontSize: 64,
      fill: 0xffffff,
      align: 'center',
    });
    this.victoryText.anchor.set(0.5);
    this.victoryText.x = app.screen.width / 2;
    this.victoryText.y = app.screen.height / 2;
    this.victoryText.visible = false;
    this.victoryText.zIndex = 20;
    app.stage.addChild(this.victoryText);

    // Create a container for score texts (for easier positioning)
    this.scoreContainer = new PIXI.Container();
    this.scoreContainer.x = app.screen.width / 2;
    this.scoreContainer.y = app.screen.height / 2 + 80;
    this.scoreContainer.zIndex = 20;
    app.stage.addChild(this.scoreContainer);

    // Red Score Text
    this.redScoreText = new PIXI.Text('0', {
      fontSize: 48,
      fill: 0xff0000,
      align: 'center',
    });
    this.redScoreText.anchor.set(0.5);

    // Blue Score Text
    this.blueScoreText = new PIXI.Text('0', {
      fontSize: 48,
      fill: 0x0000ff,
      align: 'center',
    });
    this.blueScoreText.anchor.set(0.5);

    // Dash/Text Separator
    const dashText = new PIXI.Text('-', {
      fontSize: 48,
      fill: 0xffffff,
      align: 'center',
    });
    dashText.anchor.set(0.5);

    // Reset Instructions
    const resetText = new PIXI.Text('Press \'B\' to reset', {
        fontSize: 48,
        fill: 0xffffff,
        align: 'center',
      });
      resetText.anchor.set(0.5);

    // Position elements within the container
    // Adjust these x offsets as needed for proper spacing
    this.redScoreText.x = -60;
    dashText.x = 0;
    this.blueScoreText.x = 60;
    resetText.x = 0;
    resetText.y = 80;

    // Add texts to the container
    this.scoreContainer.addChild(this.redScoreText, dashText, this.blueScoreText, resetText);
    this.scoreContainer.visible = false;
  }

  declareWinner(winner: 'Red' | 'Blue' | 'Draw') {
    if (this.gameOver) return;
    this.gameOver = true;

    if (winner === 'Red') {
      this.redScore++;
      this.victoryText.text = 'Red Wins!';
      this.victoryText.style.fill = 0xff0000;
    } else if (winner === 'Blue') {
      this.blueScore++;
      this.victoryText.text = 'Blue Wins!';
      this.victoryText.style.fill = 0x0000ff;
    } else {
      this.victoryText.text = 'Draw!';
      this.victoryText.style.fill = 0xffffff;
    }

    // Update individual score texts
    this.redScoreText.text = String(this.redScore);
    this.blueScoreText.text = String(this.blueScore);
    this.victoryText.visible = true;
    this.scoreContainer.visible = true;
  }

  reset() {
    this.victoryText.visible = false;
    this.scoreContainer.visible = false;
    this.gameOver = false;
  }

  isGameOver(): boolean {
    return this.gameOver;
  }
}
