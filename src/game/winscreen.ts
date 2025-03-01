import * as PIXI from 'pixi.js';

type ScoreColor = 'Red' | 'Blue' | 'Green' | 'Yellow';

export class WinScreen {
  private victoryText: PIXI.Text;
  private scoreContainer: PIXI.Container;
  private scores: Record<ScoreColor, number> = {
    Red: 0,
    Blue: 0,
    Green: 0,
    Yellow: 0,
  };
  // Store only the score texts so we can update them later.
  private scoreTexts: Partial<Record<ScoreColor, PIXI.Text>> = {};
  private gameOver: boolean = false;

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

    // Score Container
    this.scoreContainer = new PIXI.Container();
    // We'll center this container later after adding the texts.
    this.scoreContainer.y = app.screen.height / 2 + 80;
    this.scoreContainer.x = app.screen.width / 2;
    this.scoreContainer.zIndex = 20;
    app.stage.addChild(this.scoreContainer);

    // Define the fixed order and styles for the scores.
    const scoreOrder: ScoreColor[] = ['Blue', 'Red', 'Green', 'Yellow'];
    const scoreStyleMapping: Record<ScoreColor, PIXI.TextStyle> = {
      Blue: new PIXI.TextStyle({ fontSize: 48, fill: 0x0000ff, align: 'center' }),
      Red: new PIXI.TextStyle({ fontSize: 48, fill: 0xff0000, align: 'center' }),
      Green: new PIXI.TextStyle({ fontSize: 48, fill: 0x00ff00, align: 'center' }),
      Yellow: new PIXI.TextStyle({ fontSize: 48, fill: 0xffff00, align: 'center' }),
    };
    const dashStyle = new PIXI.TextStyle({ fontSize: 48, fill: 0xffffff, align: 'center' });

    // We'll build an array of elements (score texts and dash texts) so that we can center them together.
    const elements: PIXI.Text[] = [];
    for (let i = 0; i < scoreOrder.length; i++) {
      const color = scoreOrder[i];
      // Create a score text (just the number, starting at "0")
      const scoreText = new PIXI.Text('0', scoreStyleMapping[color]);
      scoreText.anchor.set(0.5);
      this.scoreTexts[color] = scoreText;
      elements.push(scoreText);

      // Insert a dash if not the last element.
      if (i < scoreOrder.length - 1) {
        const dashText = new PIXI.Text('-', dashStyle);
        dashText.anchor.set(0.5);
        elements.push(dashText);
      }
    }

    // Position the elements in a row and center the container.
    let totalWidth = 0;
    // First, force a measurement by temporarily adding them to the container.
    elements.forEach(el => {
      this.scoreContainer.addChild(el);
      totalWidth += el.width;
    });
    // Remove them so we can reposition.
    this.scoreContainer.removeChildren();

    // Compute starting x so that the entire row is centered.
    let offsetX = -totalWidth / 2;
    elements.forEach(el => {
      el.x = offsetX + el.width / 2; // center each element at its own width/2 offset
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

  declareWinner(winner: 'Red' | 'Blue' | 'Green' | 'Yellow' | 'Draw') {
    if (this.gameOver) return;
    this.gameOver = true;

    if (winner === 'Draw') {
      this.victoryText.text = 'Draw!';
      this.victoryText.style.fill = 0xffffff;
    } else {
      // Increment the score for the winning color.
      this.scores[winner]++;
      this.victoryText.text = `${winner} Wins!`;
      const colorMapping: Record<ScoreColor, number> = {
        Red: 0xff0000,
        Blue: 0x0000ff,
        Green: 0x00ff00,
        Yellow: 0xffff00,
      };
      this.victoryText.style.fill = colorMapping[winner] || 0xffffff;
    }

    // Update each score display (only update the numbers).
    (Object.keys(this.scores) as ScoreColor[]).forEach((key) => {
      if (this.scoreTexts[key]) {
        this.scoreTexts[key].text = String(this.scores[key]);
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
