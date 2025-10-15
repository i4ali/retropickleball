import { Game } from './game';

export class Court {
  private game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const canvas = this.game.getCanvas();

    // Top-down/isometric perspective view
    const courtX = 120;
    const courtY = 200;
    const courtWidth = canvas.width - 240;
    const courtHeight = canvas.height - 350;

    // Draw dark background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw foliage background (dark green surrounding area)
    this.drawSurroundingFoliage(ctx, courtX, courtY, courtWidth, courtHeight);

    // Draw court with perspective - slightly wider at bottom (closer to camera)
    const perspectiveAmount = 100; // How much wider the bottom is
    ctx.fillStyle = '#4a7c0e'; // Darker green for back of court
    ctx.beginPath();
    ctx.moveTo(courtX - perspectiveAmount / 2, courtY);
    ctx.lineTo(courtX + courtWidth + perspectiveAmount / 2, courtY);
    ctx.lineTo(courtX + courtWidth + perspectiveAmount, courtY + courtHeight);
    ctx.lineTo(courtX - perspectiveAmount, courtY + courtHeight);
    ctx.closePath();
    ctx.fill();

    // Main court surface (lighter green)
    const courtGreen = '#5a9216';
    ctx.fillStyle = courtGreen;
    ctx.beginPath();
    ctx.moveTo(courtX - perspectiveAmount / 2, courtY);
    ctx.lineTo(courtX + courtWidth + perspectiveAmount / 2, courtY);
    ctx.lineTo(courtX + courtWidth + perspectiveAmount, courtY + courtHeight);
    ctx.lineTo(courtX - perspectiveAmount, courtY + courtHeight);
    ctx.closePath();
    ctx.fill();

    // Add horizontal stripe texture for depth
    ctx.fillStyle = 'rgba(70, 120, 20, 0.15)';
    for (let i = 0; i < courtHeight; i += 10) {
      const yPos = courtY + i;
      const progress = i / courtHeight;
      const leftX = courtX - perspectiveAmount / 2 - (perspectiveAmount / 2) * progress;
      const rightX = courtX + courtWidth + perspectiveAmount / 2 + (perspectiveAmount / 2) * progress;
      ctx.fillRect(leftX, yPos, rightX - leftX, 5);
    }

    // Draw court border (white outline with perspective)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(courtX - perspectiveAmount / 2, courtY);
    ctx.lineTo(courtX + courtWidth + perspectiveAmount / 2, courtY);
    ctx.lineTo(courtX + courtWidth + perspectiveAmount, courtY + courtHeight);
    ctx.lineTo(courtX - perspectiveAmount, courtY + courtHeight);
    ctx.closePath();
    ctx.stroke();

    // Draw net (horizontal across the middle with perspective)
    const netY = courtY + courtHeight / 2;
    this.drawNet(ctx, courtX, netY, courtWidth, perspectiveAmount);

    // Draw horizontal lines
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    // Top horizontal line
    const topY = courtY + 50;
    const topProgress = (topY - courtY) / courtHeight;
    const topLeftX = courtX - perspectiveAmount / 2 - (perspectiveAmount / 2) * topProgress;
    const topRightX = courtX + courtWidth + perspectiveAmount / 2 + (perspectiveAmount / 2) * topProgress;
    ctx.beginPath();
    ctx.moveTo(topLeftX, topY);
    ctx.lineTo(topRightX, topY);
    ctx.stroke();

    // Bottom horizontal line
    const bottomY = courtY + courtHeight - 50;
    const bottomProgress = (bottomY - courtY) / courtHeight;
    const bottomLeftX = courtX - perspectiveAmount / 2 - (perspectiveAmount / 2) * bottomProgress;
    const bottomRightX = courtX + courtWidth + perspectiveAmount / 2 + (perspectiveAmount / 2) * bottomProgress;
    ctx.beginPath();
    ctx.moveTo(bottomLeftX, bottomY);
    ctx.lineTo(bottomRightX, bottomY);
    ctx.stroke();

    // Non-volley zone (kitchen) lines
    const kitchenDepth = courtHeight * 0.175; // 7/44 ≈ 0.159, adjusted for visual balance

    // Top kitchen line (above net)
    const topKitchenY = netY - kitchenDepth;
    const topKitchenProgress = (topKitchenY - courtY) / courtHeight;
    const topKitchenLeftX = courtX - perspectiveAmount / 2 - (perspectiveAmount / 2) * topKitchenProgress;
    const topKitchenRightX = courtX + courtWidth + perspectiveAmount / 2 + (perspectiveAmount / 2) * topKitchenProgress;
    ctx.beginPath();
    ctx.moveTo(topKitchenLeftX, topKitchenY);
    ctx.lineTo(topKitchenRightX, topKitchenY);
    ctx.stroke();

    // Bottom kitchen line (below net)
    const bottomKitchenY = netY + kitchenDepth;
    const bottomKitchenProgress = (bottomKitchenY - courtY) / courtHeight;
    const bottomKitchenLeftX = courtX - perspectiveAmount / 2 - (perspectiveAmount / 2) * bottomKitchenProgress;
    const bottomKitchenRightX = courtX + courtWidth + perspectiveAmount / 2 + (perspectiveAmount / 2) * bottomKitchenProgress;
    ctx.beginPath();
    ctx.moveTo(bottomKitchenLeftX, bottomKitchenY);
    ctx.lineTo(bottomKitchenRightX, bottomKitchenY);
    ctx.stroke();

    // Center service line (vertical, only in service areas - NOT in kitchen)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    // Center line from baseline to kitchen line (top half)
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, courtY);
    ctx.lineTo(canvas.width / 2, topKitchenY);
    ctx.stroke();

    // Center line from kitchen line to baseline (bottom half)
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, bottomKitchenY);
    ctx.lineTo(canvas.width / 2, courtY + courtHeight);
    ctx.stroke();

    // Draw inner vertical lines for doubles
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    const doublesAlleyWidth = 30;

    // Left inner vertical line
    ctx.beginPath();
    ctx.moveTo(courtX - perspectiveAmount / 2 + doublesAlleyWidth, courtY);
    ctx.lineTo(courtX - perspectiveAmount + doublesAlleyWidth, courtY + courtHeight);
    ctx.stroke();

    // Right inner vertical line
    ctx.beginPath();
    ctx.moveTo(courtX + courtWidth + perspectiveAmount / 2 - doublesAlleyWidth, courtY);
    ctx.lineTo(courtX + courtWidth + perspectiveAmount - doublesAlleyWidth, courtY + courtHeight);
    ctx.stroke();

    // --- CRT Monitor Effect ---

    // 1. Scan lines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let y = 0; y < canvas.height; y += 4) {
      ctx.fillRect(0, y, canvas.width, 2);
    }

    // 2. Vignette effect
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, canvas.width / 3,
      canvas.width / 2, canvas.height / 2, canvas.width / 1.5
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Rounded corners overlay
    const cornerRadius = 80;
    ctx.fillStyle = '#000000'; // Color of the area outside the rounded rectangle
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, 0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.lineTo(0, 0);
    ctx.closePath();

    // Create the rounded rectangle path
    ctx.moveTo(cornerRadius, 0);
    ctx.lineTo(canvas.width - cornerRadius, 0);
    ctx.arcTo(canvas.width, 0, canvas.width, cornerRadius, cornerRadius);
    ctx.lineTo(canvas.width, canvas.height - cornerRadius);
    ctx.arcTo(canvas.width, canvas.height, canvas.width - cornerRadius, canvas.height, cornerRadius);
    ctx.lineTo(cornerRadius, canvas.height);
    ctx.arcTo(0, canvas.height, 0, canvas.height - cornerRadius, cornerRadius);
    ctx.lineTo(0, cornerRadius);
    ctx.arcTo(0, 0, cornerRadius, 0, cornerRadius);
    ctx.closePath();

    ctx.fill('evenodd');
  }

  private drawNet(ctx: CanvasRenderingContext2D, courtX: number, netY: number, courtWidth: number, perspectiveAmount: number): void {
    const canvas = this.game.getCanvas();
    const courtY = 100;
    const courtHeight = canvas.height - 200;

    // Calculate perspective for net position
    const netProgress = (netY - courtY) / courtHeight;
    const leftNetX = courtX - perspectiveAmount / 2 - (perspectiveAmount / 2) * netProgress;
    const rightNetX = courtX + courtWidth + perspectiveAmount / 2 + (perspectiveAmount / 2) * netProgress;

    // Draw net posts with 3D effect
    const postColor = '#654321';
    const postWidth = 10;
    const postHeight = 25;

    // Left post (3D)
    ctx.fillStyle = '#4a3219'; // Darker side
    ctx.fillRect(leftNetX - postWidth / 2 - 3, netY - postHeight, postWidth, postHeight);
    ctx.fillStyle = postColor; // Front face
    ctx.fillRect(leftNetX - postWidth / 2, netY - postHeight, postWidth, postHeight);

    // Right post (3D)
    ctx.fillStyle = '#4a3219';
    ctx.fillRect(rightNetX - postWidth / 2 - 3, netY - postHeight, postWidth, postHeight);
    ctx.fillStyle = postColor;
    ctx.fillRect(rightNetX - postWidth / 2, netY - postHeight, postWidth, postHeight);

    // Draw net shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(leftNetX, netY + 2, rightNetX - leftNetX, 6);

    // Draw net (dark mesh pattern with perspective)
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.8;

    // Main net line with perspective
    ctx.beginPath();
    ctx.moveTo(leftNetX, netY);
    ctx.lineTo(rightNetX, netY);
    ctx.stroke();

    // Net top edge
    ctx.beginPath();
    ctx.moveTo(leftNetX, netY - postHeight + 5);
    ctx.lineTo(rightNetX, netY - postHeight + 5);
    ctx.stroke();

    // Net mesh details
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#666666';
    ctx.globalAlpha = 0.5;

    // Vertical mesh lines with perspective
    const numMeshLines = 20;
    for (let i = 0; i <= numMeshLines; i++) {
      const progress = i / numMeshLines;
      const x = leftNetX + (rightNetX - leftNetX) * progress;
      ctx.beginPath();
      ctx.moveTo(x, netY - postHeight + 5);
      ctx.lineTo(x, netY);
      ctx.stroke();
    }

    // Horizontal mesh lines
    for (let y = netY - postHeight + 5; y <= netY; y += 8) {
      ctx.beginPath();
      ctx.moveTo(leftNetX, y);
      ctx.lineTo(rightNetX, y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
  }

  private drawSurroundingFoliage(ctx: CanvasRenderingContext2D, courtX: number, courtY: number, courtWidth: number, courtHeight: number): void {
    // Draw dark green foliage around the court (like the reference image)
    const foliageColor1 = '#1a4d0a';
    const foliageColor2 = '#0d2605';
    const canvas = this.game.getCanvas();

    // Top foliage (above court)
    ctx.fillStyle = foliageColor1;
    for (let x = 0; x < canvas.width; x += 50) {
      const height = 30 + Math.random() * 20;
      ctx.fillRect(x, 0, 40, courtY + height);
    }

    ctx.fillStyle = foliageColor2;
    for (let x = 25; x < canvas.width; x += 50) {
      const height = 20 + Math.random() * 15;
      ctx.fillRect(x, 10, 30, courtY + height - 10);
    }

    // Bottom foliage (below court)
    ctx.fillStyle = foliageColor1;
    for (let x = 0; x < canvas.width; x += 50) {
      const height = 30 + Math.random() * 20;
      ctx.fillRect(x, courtY + courtHeight - height, 40, canvas.height - (courtY + courtHeight) + height);
    }

    ctx.fillStyle = foliageColor2;
    for (let x = 25; x < canvas.width; x += 50) {
      const height = 20 + Math.random() * 15;
      ctx.fillRect(x, courtY + courtHeight - height + 10, 30, canvas.height - (courtY + courtHeight) + height);
    }

    // Left foliage
    ctx.fillStyle = foliageColor1;
    for (let y = 0; y < canvas.height; y += 50) {
      const width = 30 + Math.random() * 15;
      ctx.fillRect(0, y, courtX + width, 40);
    }

    // Right foliage
    ctx.fillStyle = foliageColor1;
    for (let y = 0; y < canvas.height; y += 50) {
      const width = 30 + Math.random() * 15;
      ctx.fillRect(courtX + courtWidth - width, y, canvas.width - (courtX + courtWidth) + width, 40);
    }
  }
}
