class Particles {
  private config: any;
  private entry: HTMLElement;
  private canvas: HTMLCanvasElement;
  private particles: Array<any>;
  private itv: any;

  public constructor(entry: HTMLElement) {
    this.config = {
      isSwitch: false,
      fps: 60,
      text: "Hello, World",
      resizeText: true,
      textSize: 180,
      offset: 0,
      baseRadius: 1,
      ppi: 0.1,
      zIndex: 0
    };
    this.entry = entry;
    this.canvas = document.createElement('canvas');
    this.canvas.innerHTML = "Please use Chrome/Safari/Firefox to visit this page";
    this.canvas.style.position = "absolute";
    this.canvas.style.zIndex = this.config.zIndex;
    this.canvas.style.left = "0";
    this.canvas.style.top = "0";
    this.particles = [];
    this.itv = null;

    entry.appendChild(this.canvas);
  }
  public setText(str: string): void {
    this.config.text = str;
  }
  private cal(img: any, imgData: ImageData): void {
    const cols: number = Math.round(img.w * this.config.ppi);
    const rows: number = Math.round(img.h * this.config.ppi);
    const data: Uint8ClampedArray = imgData.data;
    const perX: number = Math.round(img.w / cols);
    const perY: number = Math.round(img.h / rows);
    for (let i: number = 0; i < rows; i++) {
      for (let j: number = 0; j < cols; j++) {
        let pos: number = (i * perX * img.w + j * perY) * 4;
        if (data[pos + 1] > 0) {
          const particle: any = {
            x: img.x + j * perX + (Math.random() - 0.5) * this.config.offset,
            y: img.y + i * perY + (Math.random() - 0.5) * this.config.offset,
            color: {
              r: 80 + Math.round(175 * Math.random()),
              g: 80 + Math.round(175 * Math.random()),
              b: 80 + Math.round(175 * Math.random()),
              a: Math.round(100 * Math.random()) / 100
            },
            radiusParam: Math.round(Math.random() * 360)
          }
          this.particles.push(particle);
        } else {
          ;
        }
      }
    }
  }
  private draw(): void {
    const ctx: CanvasRenderingContext2D = this.canvas.getContext('2d');
    ctx.clearRect(-this.canvas.width / 2, -this.canvas.height / 2, this.canvas.width, this.canvas.height);
    for (let i: number = 0; i < this.particles.length; i++) {
      ctx.fillStyle = "rgba(" + this.particles[i].color.r + "," + this.particles[i].color.g + "," + this.particles[i].color.b + "," + this.particles[i].color.a + ")";
      ctx.beginPath();
      ctx.arc(this.particles[i].x, this.particles[i].y, this.config.baseRadius + (1 + Math.sin(this.particles[i].radiusParam * Math.PI / 180)) * this.config.floatRadius, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fill();
    }
  }
  public render(): void {
    const ctx: CanvasRenderingContext2D = this.canvas.getContext('2d');
    this.canvas.width = parseInt(window.getComputedStyle(this.entry, null).width);
    this.canvas.height = parseInt(window.getComputedStyle(this.entry, null).height);

    if (this.itv) {
      clearInterval(this.itv);
      this.particles.length = 0;
    }
    if (this.config.resizeText) {
      this.config.textSize = this.canvas.width / this.config.text.length * 2;
      if (this.config.textSize > 500) {
        this.config.textSize = 500;
      }
    }

    if (this.canvas.width <= 600) {
      this.config.floatRadius = this.canvas.width / 300;
    } else {
      this.config.floatRadius = 2;
    }

    ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    ctx.font = this.config.textSize + "px Arial";
    ctx.fillStyle = "#006eff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.config.text, 0, 0);
    const imgData: ImageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const img: any = { x: -this.canvas.width / 2, y: -this.canvas.height / 2, w: this.canvas.width, h: this.canvas.height };
    this.cal(img, imgData);
    this.draw();

    this.itv = setInterval(() => {
      for (let i in this.particles) {
        this.particles[i].radiusParam += 10;
        if (this.config.isSwitch && this.particles[i].radiusParam % 360 <= 10) {
          this.particles[i].color = {
            r: 80 + Math.round(175 * Math.random()),
            g: 80 + Math.round(175 * Math.random()),
            b: 80 + Math.round(175 * Math.random()),
            a: Math.round(100 * Math.random()) / 100
          };
        }
      }
      this.draw();
    }, 1000 / this.config.fps)
  }
}

// export default Particles
