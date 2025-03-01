import * as PIXI from 'pixi.js';

type ScoreColor = 'Red' | 'Blue' | 'Green' | 'Yellow' | 'Purple' | 'Cyan' | 'Orange';

export class WinScreen {
  private victoryText: PIXI.Text;
  private victoryBg: PIXI.Graphics;
  private scoreContainer: PIXI.Container;
  private scoreBg: PIXI.Graphics;

  private scores: Partial<Record<ScoreColor, number>> = {};
  private scoreTexts: Partial<Record<ScoreColor, PIXI.Text>> = {};
  private gameOver: boolean = false;
  private scoreOrder: ScoreColor[];

  constructor(app: PIXI.Application, numPlayers: number = 2) {
    const fullScoreOrder: ScoreColor[] = ['Blue', 'Red', 'Green', 'Yellow'];
    const desiredCount = Math.max(2, Math.min(numPlayers, fullScoreOrder.length));
    this.scoreOrder = fullScoreOrder.slice(0, desiredCount);

    this.scoreOrder.forEach((color) => {
      this.scores[color] = 0;
    });

    // Victory Text
    this.victoryText = new PIXI.Text('', {
      fontSize: 64,
      fill: 0xffffff,
      align: 'center',
      fontWeight: 'bold',
      fontFamily: '"Oswald", "Arial Black", "Helvetica Neue", sans-serif',
      // letterSpacing: 3, // Add spacing between letters (value in pixels)
    });
    this.victoryText.anchor.set(0.5);
    this.victoryText.x = app.screen.width / 2;
    this.victoryText.y = app.screen.height / 2;
    this.victoryText.visible = false;
    this.victoryText.zIndex = 20;
    app.stage.addChild(this.victoryText);

    // A semi-transparent rounded rectangle behind victory text
    this.victoryBg = new PIXI.Graphics();
    this.victoryBg.beginFill(0x000000, 0.7);
    // We'll position and size it dynamically in `positionVictoryBg()`
    this.victoryBg.drawRoundedRect(-200, -50, 400, 100, 16);
    this.victoryBg.endFill();
    this.victoryBg.x = this.victoryText.x;
    this.victoryBg.y = this.victoryText.y;
    this.victoryBg.visible = false;
    this.victoryBg.zIndex = 19;
    app.stage.addChild(this.victoryBg);

    // Score Container
    this.scoreContainer = new PIXI.Container();
    this.scoreContainer.zIndex = 20;
    this.scoreContainer.visible = false;
    app.stage.addChild(this.scoreContainer);

    // A semi-transparent rectangle behind the scores
    this.scoreBg = new PIXI.Graphics();
    this.scoreBg.beginFill(0x000000, 0.7);
    // We'll draw and position it after we compute total width
    this.scoreBg.drawRoundedRect(0, 0, 400, 100, 16);
    this.scoreBg.endFill();
    this.scoreContainer.addChild(this.scoreBg);

    // Define style mappings
    const scoreStyleMapping: Record<ScoreColor, PIXI.TextStyle> = {
      Blue: new PIXI.TextStyle({ fontSize: 48, fill: 0x0000ff, align: 'center' }),
      Red: new PIXI.TextStyle({ fontSize: 48, fill: 0xff0000, align: 'center' }),
      Green: new PIXI.TextStyle({ fontSize: 48, fill: 0x00ff00, align: 'center' }),
      Yellow: new PIXI.TextStyle({ fontSize: 48, fill: 0xffff00, align: 'center' }),
      Purple: new PIXI.TextStyle({ fontSize: 48, fill: 0xe523ff, align: 'center' }),
      Cyan: new PIXI.TextStyle({ fontSize: 48, fill: 0x23ffa3, align: 'center' }),
      Orange: new PIXI.TextStyle({ fontSize: 48, fill: 0xffa63f, align: 'center' }),
    };
    const dashStyle = new PIXI.TextStyle({ fontSize: 48, fill: 0xffffff, align: 'center' });

    // Build an array of elements (score texts and dashes) so we can center them
    const elements: PIXI.Text[] = [];
    for (let i = 0; i < this.scoreOrder.length; i++) {
      const color = this.scoreOrder[i];
      const scoreText = new PIXI.Text('00', scoreStyleMapping[color]);
      scoreText.anchor.set(0.5);
      this.scoreTexts[color] = scoreText;
      elements.push(scoreText);

      if (i < this.scoreOrder.length - 1) {
        const dashText = new PIXI.Text(' - ', dashStyle);
        dashText.anchor.set(0.5);
        elements.push(dashText);
      }
    }

    // Measure total width
    let totalWidth = 0;
    elements.forEach(el => {
      this.scoreContainer.addChild(el);
      totalWidth += el.width;
    });
    this.scoreContainer.removeChildren();

    // Center them horizontally
    let offsetX = -totalWidth / 2;
    elements.forEach(el => {
      el.x = offsetX + el.width / 2;
      el.y = 0;
      offsetX += el.width;
      this.scoreContainer.addChild(el);
    });

    // We'll size the background behind them
    const widthPadding = 40;
    const heightPadding = 30;
    const containerWidth = totalWidth + widthPadding;
    const containerHeight = 60 + heightPadding; // 60 for text height, plus padding
    // Redraw the background with correct sizing
    this.scoreBg.clear();
    this.scoreBg.beginFill(0x000000, 0.7);
    this.scoreBg.drawRoundedRect(-containerWidth / 2, -heightPadding / 2, containerWidth, containerHeight, 16);
    this.scoreBg.endFill();

    // Place the container in the lower center
    this.scoreContainer.x = app.screen.width / 2;
    this.scoreContainer.y = app.screen.height / 2 + 120;

    // "Press 'B' to reset" text
    const resetText = new PIXI.Text("Press 'B' to reset", {
      fontSize: 36,
      fill: 0xffffff,
      align: 'center',
    });
    resetText.anchor.set(0.5);
    resetText.x = 0;
    resetText.y = 70; // slightly below the scoreboard row
    this.scoreContainer.addChild(resetText);
  }

  declareWinner(winner: ScoreColor | 'Draw') {
    if (this.gameOver) return;
    this.gameOver = true;

    if (winner === 'Draw') {
      this.victoryText.text = 'DRAW!';
      this.victoryText.style.fill = 0xffffff;
    } else {
      this.scores[winner] = (this.scores[winner] || 0) + 1;
      this.victoryText.text = `${winner.toUpperCase()} WINS!`;

      const colorMapping: Record<ScoreColor, number> = {
        Red: 0xff4827,
        Blue: 0x1180ff,
        Green: 0x2aff23,
        Yellow: 0xfff23b,
        Purple: 0xe523ff,
        Cyan: 0x23ffa3,
        Orange: 0xffa63f,
      };
      this.victoryText.style.fill = colorMapping[winner] || 0xffffff;
    }

    // Update displayed scores
    this.scoreOrder.forEach((color) => {
      if (this.scoreTexts[color]) {
        this.scoreTexts[color].text = String(this.scores[color] || 0);
      }
    });

    // Show the scoreboard and victory text with background
    this.victoryBg.visible = true;
    this.victoryText.visible = true;
    this.scoreContainer.visible = true;
  }

  reset() {
    this.victoryBg.visible = false;
    this.victoryText.visible = false;
    this.scoreContainer.visible = false;
    this.gameOver = false;
  }

  isGameOver(): boolean {
    return this.gameOver;
  }
}
