import * as PIXI from 'pixi.js';

type ScoreColor = 'Red' | 'Blue' | 'Green' | 'Yellow';

export class WinScreen {
  private victoryText: PIXI.Text;
  private scoreContainer: PIXI.Container;
  // We'll only store scores for the colors we use.
  private scores: Partial<Record<ScoreColor, number>> = {};
  // We'll build this object based on how many scores we need.
  private scoreTexts: Partial<Record<ScoreColor, PIXI.Text>> = {};
  private gameOver: boolean = false;
  // Store the final order of colors used
  private scoreOrder: ScoreColor[];

  /**
   * @param app PIXI.Application instance.
   * @param numPlayers Number of players in the game.
   *                   If numPlayers is 2, only first 2 colors will be used,
   *                   if 3, first 3; if 4 or more, all 4.
   */
  constructor(app: PIXI.Application, numPlayers: number = 2) {
    // Define full order.
    const fullScoreOrder: ScoreColor[] = ['Blue', 'Red', 'Green', 'Yellow'];
    // Ensure at least 2 scores.
    const desiredCount = Math.max(2, Math.min(numPlayers, fullScoreOrder.length));
    // Use only the first desiredCount colors.
    this.scoreOrder = fullScoreOrder.slice(0, desiredCount);

    // Initialize scores for only these colors.
    this.scoreOrder.forEach((color) => {
      this.scores[color] = 0;
    });

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

    // Score Container
    this.scoreContainer = new PIXI.Container();
    // Center the container horizontally.
    this.scoreContainer.x = app.screen.width / 2;
    this.scoreContainer.y = app.screen.height / 2 + 80;
    this.scoreContainer.zIndex = 20;
    app.stage.addChild(this.scoreContainer);

    // Define style mappings for our fixed colors.
    const scoreStyleMapping: Record<ScoreColor, PIXI.TextStyle> = {
      Blue: new PIXI.TextStyle({ fontSize: 48, fill: 0x0000ff, align: 'center' }),
      Red: new PIXI.TextStyle({ fontSize: 48, fill: 0xff0000, align: 'center' }),
      Green: new PIXI.TextStyle({ fontSize: 48, fill: 0x00ff00, align: 'center' }),
      Yellow: new PIXI.TextStyle({ fontSize: 48, fill: 0xffff00, align: 'center' }),
    };
    const dashStyle = new PIXI.TextStyle({ fontSize: 48, fill: 0xffffff, align: 'center' });

    // Build an array of elements (score texts and dashes) so we can center them together.
    const elements: PIXI.Text[] = [];
    for (let i = 0; i < this.scoreOrder.length; i++) {
      const color = this.scoreOrder[i];
      // Create a score text (initially "0")
      const scoreText = new PIXI.Text('00', scoreStyleMapping[color]);
      scoreText.anchor.set(0.5);
      this.scoreTexts[color] = scoreText;
      elements.push(scoreText);

      // Insert a dash if not the last element.
      if (i < this.scoreOrder.length - 1) {
        const dashText = new PIXI.Text(' - ', dashStyle);
        dashText.anchor.set(0.5);
        elements.push(dashText);
      }
    }

    // Position the elements in a row and center the container.
    let totalWidth = 0;
    // Temporarily add to container to measure.
    elements.forEach(el => {
      this.scoreContainer.addChild(el);
      totalWidth += el.width;
    });
    // Remove them to reposition.
    this.scoreContainer.removeChildren();

    // Calculate starting x so that the entire row is centered.
    let offsetX = -totalWidth / 2;
    elements.forEach(el => {
      el.x = offsetX + el.width / 2; // center each element
      el.y = 0;
      offsetX += el.width;
      this.scoreContainer.addChild(el);
    });

    // Reset Instructions Text (positioned below the score row)
    const resetText = new PIXI.Text("Press 'B' to reset", {
      fontSize: 48,
      fill: 0xffffff,
      align: 'center',
    });
    resetText.anchor.set(0.5);
    resetText.x = 0;
    resetText.y = 80;
    this.scoreContainer.addChild(resetText);

    this.scoreContainer.visible = false;
  }

  declareWinner(winner: ScoreColor | 'Draw') {
    if (this.gameOver) return;
    this.gameOver = true;

    if (winner === 'Draw') {
      this.victoryText.text = 'Draw!';
      this.victoryText.style.fill = 0xffffff;
    } else {
      // Increment the score for the winning color.
      this.scores[winner] = (this.scores[winner] || 0) + 1;
      this.victoryText.text = `${winner} Wins!`;
      const colorMapping: Record<ScoreColor, number> = {
        Red: 0xff0000,
        Blue: 0x0000ff,
        Green: 0x00ff00,
        Yellow: 0xffff00,
      };
      this.victoryText.style.fill = colorMapping[winner] || 0xffffff;
    }

    // Update only the displayed scores.
    this.scoreOrder.forEach((color) => {
      if (this.scoreTexts[color]) {
        this.scoreTexts[color].text = String(this.scores[color]);
      }
    });
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
