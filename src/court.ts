import { Game } from './game';

export class Court {
  private game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const canvas = this.game.getCanvas();

    // True POV perspective - from player's eye level looking forward
    const courtY = 300; // Start much lower (horizon line)
    const courtHeight = canvas.height - 500; // Court extends to near bottom

    // Dramatic perspective narrowing (near end much wider)
    const nearWidth = 650; // Very wide at bottom (close to player)
    const farWidth = 180; // Very narrow at top (far away)

    // Draw dark background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw foliage background (dark green surrounding area)
    this.drawSurroundingFoliage(ctx, courtY, farWidth, courtHeight, farWidth, nearWidth);

    // Draw court with dramatic perspective (trapezoid shape)
    const centerX = canvas.width / 2;
    const farLeft = centerX - farWidth / 2;
    const farRight = centerX + farWidth / 2;
    const nearLeft = centerX - nearWidth / 2;
    const nearRight = centerX + nearWidth / 2;

    ctx.fillStyle = '#4a7c0e'; // Darker green for back of court
    ctx.beginPath();
    ctx.moveTo(farLeft, courtY); // Top left (far)
    ctx.lineTo(farRight, courtY); // Top right (far)
    ctx.lineTo(nearRight, courtY + courtHeight); // Bottom right (near)
    ctx.lineTo(nearLeft, courtY + courtHeight); // Bottom left (near)
    ctx.closePath();
    ctx.fill();

    // Main court surface (lighter green)
    const courtGreen = '#5a9216';
    ctx.fillStyle = courtGreen;
    ctx.beginPath();
    ctx.moveTo(farLeft, courtY);
    ctx.lineTo(farRight, courtY);
    ctx.lineTo(nearRight, courtY + courtHeight);
    ctx.lineTo(nearLeft, courtY + courtHeight);
    ctx.closePath();
    ctx.fill();

    // Add horizontal stripe texture for depth
    ctx.fillStyle = 'rgba(70, 120, 20, 0.15)';
    for (let i = 0; i < courtHeight; i += 10) {
      const yPos = courtY + i;
      const progress = i / courtHeight;
      const leftX = farLeft + (nearLeft - farLeft) * progress;
      const rightX = farRight + (nearRight - farRight) * progress;
      ctx.fillRect(leftX, yPos, rightX - leftX, 5);
    }

    // Draw court border (white outline with perspective and glow)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(farLeft, courtY);
    ctx.lineTo(farRight, courtY);
    ctx.lineTo(nearRight, courtY + courtHeight);
    ctx.lineTo(nearLeft, courtY + courtHeight);
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw net (horizontal across the middle with perspective)
    const netY = courtY + courtHeight / 2;
    const netProgress = 0.5;
    const netLeft = farLeft + (nearLeft - farLeft) * netProgress;
    const netRight = farRight + (nearRight - farRight) * netProgress;
    this.drawNet(ctx, netLeft, netRight, netY);

    // Draw horizontal baseline lines with glow
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#FFFFFF';

    // Far baseline (top)
    const farBaselineY = courtY + 30;
    const farBaselineProgress = (farBaselineY - courtY) / courtHeight;
    const farBaselineLeft = farLeft + (nearLeft - farLeft) * farBaselineProgress;
    const farBaselineRight = farRight + (nearRight - farRight) * farBaselineProgress;
    ctx.beginPath();
    ctx.moveTo(farBaselineLeft, farBaselineY);
    ctx.lineTo(farBaselineRight, farBaselineY);
    ctx.stroke();

    // Near baseline (bottom)
    const nearBaselineY = courtY + courtHeight - 30;
    const nearBaselineProgress = (nearBaselineY - courtY) / courtHeight;
    const nearBaselineLeft = farLeft + (nearLeft - farLeft) * nearBaselineProgress;
    const nearBaselineRight = farRight + (nearRight - farRight) * nearBaselineProgress;
    ctx.beginPath();
    ctx.moveTo(nearBaselineLeft, nearBaselineY);
    ctx.lineTo(nearBaselineRight, nearBaselineY);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Non-volley zone (kitchen) lines with glow
    const kitchenDepth = courtHeight * 0.15;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#FFFFFF';

    // Top kitchen line (above net, on far side)
    const topKitchenY = netY - kitchenDepth;
    const topKitchenProgress = (topKitchenY - courtY) / courtHeight;
    const topKitchenLeft = farLeft + (nearLeft - farLeft) * topKitchenProgress;
    const topKitchenRight = farRight + (nearRight - farRight) * topKitchenProgress;
    ctx.beginPath();
    ctx.moveTo(topKitchenLeft, topKitchenY);
    ctx.lineTo(topKitchenRight, topKitchenY);
    ctx.stroke();

    // Bottom kitchen line (below net, on near side)
    const bottomKitchenY = netY + kitchenDepth;
    const bottomKitchenProgress = (bottomKitchenY - courtY) / courtHeight;
    const bottomKitchenLeft = farLeft + (nearLeft - farLeft) * bottomKitchenProgress;
    const bottomKitchenRight = farRight + (nearRight - farRight) * bottomKitchenProgress;
    ctx.beginPath();
    ctx.moveTo(bottomKitchenLeft, bottomKitchenY);
    ctx.lineTo(bottomKitchenRight, bottomKitchenY);
    ctx.stroke();

    // Center service line (vertical, only in service areas - NOT in kitchen)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#FFFFFF';

    // Center line from far baseline to far kitchen line (top half)
    ctx.beginPath();
    ctx.moveTo(centerX, farBaselineY);
    ctx.lineTo(centerX, topKitchenY);
    ctx.stroke();

    // Center line from near kitchen line to near baseline (bottom half)
    ctx.beginPath();
    ctx.moveTo(centerX, bottomKitchenY);
    ctx.lineTo(centerX, nearBaselineY);
    ctx.stroke();

    // Draw sidelines for doubles (vertical lines on sides)
    const doublesInset = 0.2; // Inset as proportion of width

    // Left sideline
    const leftSideFar = farLeft + farWidth * doublesInset;
    const leftSideNear = nearLeft + nearWidth * doublesInset;
    ctx.beginPath();
    ctx.moveTo(leftSideFar, courtY);
    ctx.lineTo(leftSideNear, courtY + courtHeight);
    ctx.stroke();

    // Right sideline
    const rightSideFar = farRight - farWidth * doublesInset;
    const rightSideNear = nearRight - nearWidth * doublesInset;
    ctx.beginPath();
    ctx.moveTo(rightSideFar, courtY);
    ctx.lineTo(rightSideNear, courtY + courtHeight);
    ctx.stroke();

    ctx.shadowBlur = 0;

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

  private drawNet(ctx: CanvasRenderingContext2D, leftX: number, rightX: number, netY: number): void {
    // Draw net posts with 3D effect
    const postColor = '#654321';
    const postWidth = 8;
    const postHeight = 30;

    // Left post (3D)
    ctx.fillStyle = '#4a3219'; // Darker side
    ctx.fillRect(leftX - postWidth / 2 - 2, netY - postHeight, postWidth, postHeight);
    ctx.fillStyle = postColor; // Front face
    ctx.fillRect(leftX - postWidth / 2, netY - postHeight, postWidth, postHeight);

    // Right post (3D)
    ctx.fillStyle = '#4a3219';
    ctx.fillRect(rightX - postWidth / 2 - 2, netY - postHeight, postWidth, postHeight);
    ctx.fillStyle = postColor;
    ctx.fillRect(rightX - postWidth / 2, netY - postHeight, postWidth, postHeight);

    // Draw net shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(leftX, netY + 2, rightX - leftX, 4);

    // Draw net (dark mesh pattern with perspective and glow)
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.9;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#888888';

    // Main net line
    ctx.beginPath();
    ctx.moveTo(leftX, netY);
    ctx.lineTo(rightX, netY);
    ctx.stroke();

    // Net top edge
    ctx.beginPath();
    ctx.moveTo(leftX, netY - postHeight + 5);
    ctx.lineTo(rightX, netY - postHeight + 5);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Net mesh details
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#666666';
    ctx.globalAlpha = 0.5;

    // Vertical mesh lines
    const numMeshLines = 15;
    for (let i = 0; i <= numMeshLines; i++) {
      const progress = i / numMeshLines;
      const x = leftX + (rightX - leftX) * progress;
      ctx.beginPath();
      ctx.moveTo(x, netY - postHeight + 5);
      ctx.lineTo(x, netY);
      ctx.stroke();
    }

    // Horizontal mesh lines
    for (let y = netY - postHeight + 5; y <= netY; y += 6) {
      ctx.beginPath();
      ctx.moveTo(leftX, y);
      ctx.lineTo(rightX, y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
  }

  private drawSurroundingFoliage(ctx: CanvasRenderingContext2D, courtY: number, farWidth: number, courtHeight: number, _farWidth: number, nearWidth: number): void {
    // Draw dark green foliage around the court
    const foliageColor1 = '#1a4d0a';
    const canvas = this.game.getCanvas();
    const centerX = canvas.width / 2;

    // Calculate court edges
    const farLeft = centerX - farWidth / 2;
    const farRight = centerX + farWidth / 2;
    const nearLeft = centerX - nearWidth / 2;
    const nearRight = centerX + nearWidth / 2;

    // Top foliage (above far end of court)
    ctx.fillStyle = foliageColor1;
    ctx.fillRect(0, 0, canvas.width, courtY);

    // Bottom foliage (below near end of court)
    ctx.fillStyle = foliageColor1;
    ctx.fillRect(0, courtY + courtHeight, canvas.width, canvas.height - (courtY + courtHeight));

    // Left side foliage (trapezoid shape)
    ctx.fillStyle = foliageColor1;
    ctx.beginPath();
    ctx.moveTo(0, courtY);
    ctx.lineTo(farLeft, courtY);
    ctx.lineTo(nearLeft, courtY + courtHeight);
    ctx.lineTo(0, courtY + courtHeight);
    ctx.closePath();
    ctx.fill();

    // Right side foliage (trapezoid shape)
    ctx.fillStyle = foliageColor1;
    ctx.beginPath();
    ctx.moveTo(farRight, courtY);
    ctx.lineTo(canvas.width, courtY);
    ctx.lineTo(canvas.width, courtY + courtHeight);
    ctx.lineTo(nearRight, courtY + courtHeight);
    ctx.closePath();
    ctx.fill();
  }
}
