import { useEffect, useRef } from 'react';
import { MockupSettings, UploadedImage } from '@/types/mockup';

interface Canvas3DRendererProps {
  settings: MockupSettings;
  image: UploadedImage | null;
  backgroundImage?: string;
  width: number;
  height: number;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export function Canvas3DRenderer({
  settings,
  image,
  backgroundImage,
  width,
  height,
  onCanvasReady,
}: Canvas3DRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) {
      console.log('[Canvas3D] Missing canvas or image', { canvas: !!canvas, image: !!image });
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[Canvas3D] Failed to get 2D context');
      return;
    }

    console.log('[Canvas3D] Starting render...', { width, height, settings });

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onerror = (err) => {
      console.error('[Canvas3D] Image load failed:', err);
    };

    img.onload = () => {
      console.log('[Canvas3D] Image loaded successfully');
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw background
      if (backgroundImage) {
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.onload = () => {
          ctx.drawImage(bgImg, 0, 0, width, height);
          drawTransformedImage();
        };
        bgImg.onerror = () => {
          // Fallback to solid color if image fails
          if (settings.backgroundColor) {
            ctx.fillStyle = settings.backgroundColor;
            ctx.fillRect(0, 0, width, height);
          }
          drawTransformedImage();
        };
        bgImg.src = backgroundImage;
      } else {
        // Solid background color
        if (settings.backgroundColor) {
          ctx.fillStyle = settings.backgroundColor;
          ctx.fillRect(0, 0, width, height);
        }
        drawTransformedImage();
      }

      function drawTransformedImage() {
        ctx.save();

        // Move to center
        ctx.translate(width / 2, height / 2);

        // Apply 3D perspective transforms using matrix math
        const rotateY = (settings.imageRotateY || 0) * Math.PI / 180;
        const rotateX = (settings.imageRotateX || 0) * Math.PI / 180;
        const scale = settings.deviceType === 'browser'
          ? (settings.browserScale || 80) / 100
          : (settings.imageScale || 100) / 100;

        // Apply Y rotation (skew effect)
        const cosY = Math.cos(rotateY);
        const sinY = Math.sin(rotateY);

        // Apply X rotation
        const cosX = Math.cos(rotateX);
        const sinX = Math.sin(rotateX);

        // Perspective factor (simulates depth)
        const perspective = 800;
        const scaleX = cosY;
        const scaleY = cosX;
        const skewY = sinY * 0.5; // Horizontal skew from Y rotation
        const skewX = -sinX * 0.5; // Vertical skew from X rotation

        // Apply transformation matrix
        ctx.transform(scaleX, skewX, skewY, scaleY, 0, 0);
        ctx.scale(scale, scale);

        // Calculate image dimensions
        const imgWidth = img.width;
        const imgHeight = img.height;
        const aspectRatio = imgWidth / imgHeight;

        let drawWidth = width * 0.6;
        let drawHeight = drawWidth / aspectRatio;

        if (drawHeight > height * 0.6) {
          drawHeight = height * 0.6;
          drawWidth = drawHeight * aspectRatio;
        }

        // Apply shadow if needed
        if (settings.shadow) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 50;
          ctx.shadowOffsetX = 20;
          ctx.shadowOffsetY = 20;
        }

        // If browser mode, draw browser frame first
        if (settings.deviceType === 'browser') {
          const frameWidth = drawWidth;
          const frameHeight = drawHeight;
          const borderRadius = 12;
          const titleBarHeight = 32;

          // Draw browser window background
          ctx.fillStyle = '#2a2a2e';
          roundRect(ctx, -frameWidth / 2, -frameHeight / 2 - titleBarHeight, frameWidth, frameHeight + titleBarHeight, borderRadius);
          ctx.fill();

          // Draw title bar buttons
          const buttonY = -frameHeight / 2 - titleBarHeight / 2;
          const buttonX = -frameWidth / 2 + 12;

          ctx.fillStyle = '#ff5f57';
          ctx.beginPath();
          ctx.arc(buttonX, buttonY, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#febc2e';
          ctx.beginPath();
          ctx.arc(buttonX + 16, buttonY, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#28c840';
          ctx.beginPath();
          ctx.arc(buttonX + 32, buttonY, 5, 0, Math.PI * 2);
          ctx.fill();

          // Draw URL bar
          ctx.fillStyle = '#1c1c1e';
          roundRect(ctx, -90, -frameHeight / 2 - titleBarHeight / 2 - 9, 180, 18, 4);
          ctx.fill();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.font = '9px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText('numia.xyz', 0, -frameHeight / 2 - titleBarHeight / 2 - 1);

          // Draw browser content area with image
          ctx.fillStyle = '#1c1c1e';
          roundRect(ctx, -frameWidth / 2, -frameHeight / 2, frameWidth, frameHeight, borderRadius);
          ctx.fill();

          ctx.save();
          ctx.shadowColor = 'transparent'; // No shadow on image inside browser
          ctx.clip(); // Clip to rounded rect
          ctx.drawImage(
            img,
            -frameWidth / 2,
            -frameHeight / 2,
            frameWidth,
            frameHeight
          );
          ctx.restore();
        } else {
          // Draw image centered (none mode)
          ctx.drawImage(
            img,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight
          );
        }

        ctx.restore();

        // Draw branding if needed (outside transforms)
        if (settings.brandingPosition !== 'none') {
          ctx.save();
          ctx.font = 'bold 16px system-ui, sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

          const text = 'NUMIA';
          const metrics = ctx.measureText(text);
          const padding = 16;

          let x = padding;
          let y = padding + 16;

          if (settings.brandingPosition === 'top-right') {
            x = width - metrics.width - padding;
          } else if (settings.brandingPosition === 'bottom-left') {
            y = height - padding;
          } else if (settings.brandingPosition === 'bottom-right') {
            x = width - metrics.width - padding;
            y = height - padding;
          }

          ctx.fillText(text, x, y);
          ctx.restore();
        }

        // Notify parent that canvas is ready
        console.log('[Canvas3D] Rendering complete, notifying parent');
        if (onCanvasReady) {
          onCanvasReady(canvas);
        }
      }

      // Helper function for rounded rectangles
      function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      }
    };

    img.src = image.src;
  }, [settings, image, backgroundImage, width, height, onCanvasReady]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'none' }}
    />
  );
}
