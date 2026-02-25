export class Ship {
  /**
   * @param {object} config - { width, height, speed, color }
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   */
  constructor(config, canvasWidth, canvasHeight, isMobile = false) {
    this.width = config.width;
    this.height = config.height;
    this.speed = config.speed;
    this.color = config.color;
    this.isMobile = isMobile;
    this._mobileRatio = config.bottomMarginMobileRatio || 0.08;
    this._desktopMargin = config.bottomMargin || 10;
    this.bottomMargin = isMobile
      ? Math.max(60, Math.round(canvasHeight * this._mobileRatio))
      : this._desktopMargin;
    this.x = (canvasWidth - this.width) / 2;
    this.y = canvasHeight - this.height - this.bottomMargin;
    this.movingLeft = false;
    this.movingRight = false;
    this.canvasWidth = canvasWidth;
  }

  update(touchX) {
    if (touchX !== null && touchX !== undefined) {
      // Tactile : le vaisseau suit le doigt
      const target = touchX - this.width / 2;
      const diff = target - this.x;
      this.x += diff * 0.3; // Lissage
    } else {
      if (this.movingLeft) this.x -= this.speed;
      if (this.movingRight) this.x += this.speed;
    }
    this.x = Math.max(0, Math.min(this.canvasWidth - this.width, this.x));
  }

  draw(ctx) {
    const cx = this.x + this.width / 2;
    const { y, width, height } = this;

    // Halo bouclier
    ctx.save();
    const shield = ctx.createRadialGradient(cx, y + height / 2, 10, cx, y + height / 2, width * 0.6);
    shield.addColorStop(0, 'rgba(0, 212, 255, 0)');
    shield.addColorStop(0.8, 'rgba(0, 212, 255, 0)');
    shield.addColorStop(1, 'rgba(0, 212, 255, 0.06)');
    ctx.fillStyle = shield;
    ctx.beginPath();
    ctx.ellipse(cx, y + height / 2, width * 0.6, height * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Aile gauche
    const wingGrad = ctx.createLinearGradient(this.x, y, cx, y + height);
    wingGrad.addColorStop(0, '#005580');
    wingGrad.addColorStop(1, '#003350');
    ctx.fillStyle = wingGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 10, y + 2);
    ctx.lineTo(this.x - 4, y + height + 4);
    ctx.lineTo(this.x + 10, y + height - 1);
    ctx.lineTo(cx - 8, y + height);
    ctx.closePath();
    ctx.fill();

    // Aile droite
    const wingGrad2 = ctx.createLinearGradient(this.x + width, y, cx, y + height);
    wingGrad2.addColorStop(0, '#005580');
    wingGrad2.addColorStop(1, '#003350');
    ctx.fillStyle = wingGrad2;
    ctx.beginPath();
    ctx.moveTo(cx + 10, y + 2);
    ctx.lineTo(this.x + width + 4, y + height + 4);
    ctx.lineTo(this.x + width - 10, y + height - 1);
    ctx.lineTo(cx + 8, y + height);
    ctx.closePath();
    ctx.fill();

    // Corps central (dégradé)
    const bodyGrad = ctx.createLinearGradient(cx - 16, y, cx + 16, y + height);
    bodyGrad.addColorStop(0, '#33ddff');
    bodyGrad.addColorStop(0.4, this.color);
    bodyGrad.addColorStop(1, '#005580');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(cx, y - 6);
    ctx.lineTo(cx + 16, y + height);
    ctx.lineTo(cx - 16, y + height);
    ctx.closePath();
    ctx.fill();

    // Panneaux de coque
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - 6, y + 10);
    ctx.lineTo(cx - 12, y + height - 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 6, y + 10);
    ctx.lineTo(cx + 12, y + height - 2);
    ctx.stroke();

    // Cockpit (dégradé vitré)
    const cockpitGrad = ctx.createRadialGradient(cx, y + 10, 1, cx, y + 12, 7);
    cockpitGrad.addColorStop(0, '#ffffff');
    cockpitGrad.addColorStop(0.3, '#80eaff');
    cockpitGrad.addColorStop(1, '#004466');
    ctx.fillStyle = cockpitGrad;
    ctx.beginPath();
    ctx.ellipse(cx, y + 12, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3 réacteurs (gauche, centre, droite)
    const flicker1 = 5 + Math.random() * 5;
    const flicker2 = 6 + Math.random() * 6;
    const flicker3 = 5 + Math.random() * 5;
    const reactors = [
      { x: cx - 10, w: 5, f: flicker1 },
      { x: cx - 3, w: 6, f: flicker2 },
      { x: cx + 5, w: 5, f: flicker3 },
    ];
    for (const r of reactors) {
      const fGrad = ctx.createLinearGradient(r.x, y + height, r.x, y + height + r.f);
      fGrad.addColorStop(0, '#ffffff');
      fGrad.addColorStop(0.3, '#ff8800');
      fGrad.addColorStop(1, '#0066ff');
      ctx.fillStyle = fGrad;
      ctx.beginPath();
      ctx.moveTo(r.x, y + height);
      ctx.lineTo(r.x + r.w, y + height);
      ctx.lineTo(r.x + r.w / 2, y + height + r.f);
      ctx.closePath();
      ctx.fill();
    }

    // Lumières bout d'ailes (clignotement)
    const blink = Math.sin(Date.now() * 0.005) > 0;
    ctx.fillStyle = blink ? '#ff0040' : '#990020';
    ctx.beginPath();
    ctx.arc(this.x + 2, y + height + 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = blink ? '#00ff80' : '#009940';
    ctx.beginPath();
    ctx.arc(this.x + width - 2, y + height + 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
