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

    img.onload = () => {
      console.log('[Canvas3D] Image loaded successfully');
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Scale border radius proportionally to canvas size
      // Preview canvas is ~896px wide (max-w-4xl), export is 3840px
      // Scale factor: 3840 / 896 ≈ 4.29
      const scaleFactor = width / 896;
      const scaledBorderRadius = (settings.borderRadius || 0) * scaleFactor;

      // Draw background with border radius
      ctx.save();
      if (scaledBorderRadius > 0) {
        roundRect(ctx, 0, 0, width, height, scaledBorderRadius);
        ctx.clip();
      }

      if (backgroundImage) {
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.onload = () => {
          // Use object-cover to fill canvas completely (no black bars)
          const bgAspect = bgImg.width / bgImg.height;
          const canvasAspect = width / height;

          let bgWidth, bgHeight, bgX, bgY;

          if (bgAspect > canvasAspect) {
            // Background is wider - fit to height and crop sides
            bgHeight = height;
            bgWidth = height * bgAspect;
            bgX = (width - bgWidth) / 2;
            bgY = 0;
          } else {
            // Background is taller - fit to width and crop top/bottom
            bgWidth = width;
            bgHeight = width / bgAspect;
            bgX = 0;
            bgY = (height - bgHeight) / 2;
          }

          ctx.drawImage(bgImg, bgX, bgY, bgWidth, bgHeight);
          ctx.restore();
          drawTransformedImage();
        };
        bgImg.onerror = () => {
          // Fallback to solid color if image fails
          if (settings.backgroundColor) {
            ctx.fillStyle = settings.backgroundColor;
            ctx.fillRect(0, 0, width, height);
          }
          ctx.restore();
          drawTransformedImage();
        };
        bgImg.src = backgroundImage;
      } else {
        // Solid background color
        if (settings.backgroundColor) {
          ctx.fillStyle = settings.backgroundColor;
          ctx.fillRect(0, 0, width, height);
        }
        ctx.restore();
        drawTransformedImage();
      }

      function drawTransformedImage() {
        // Calculate image dimensions with object-contain behavior
        const imgWidth = img.width;
        const imgHeight = img.height;
        const imgAspect = imgWidth / imgHeight;
        const canvasAspect = width / height;

        // Calculate max size that fits in canvas (with some padding)
        const maxWidth = width * 0.9;
        const maxHeight = height * 0.9;

        let baseWidth: number;
        let baseHeight: number;

        // Object-contain logic: fit image within canvas bounds
        if (imgAspect > canvasAspect) {
          // Image is wider - fit to width
          baseWidth = maxWidth;
          baseHeight = baseWidth / imgAspect;
        } else {
          // Image is taller - fit to height
          baseHeight = maxHeight;
          baseWidth = baseHeight * imgAspect;
        }

        if (settings.deviceType === 'browser') {
          // Browser mode - apply scale directly to base size
          const browserScale = (settings.browserScale || 80) / 100;
          const frameWidth = baseWidth * browserScale;
          const frameHeight = baseHeight * browserScale;

          // Scale all browser chrome elements proportionally to match preview
          // Preview uses 32px title bar on ~896px canvas
          // Browser frame radius is FIXED at 11px (Safari-like), NOT controlled by radius slider
          const browserBorderRadius = 11 * scaleFactor;
          const titleBarHeight = 32 * scaleFactor;
          const buttonRadius = 6 * scaleFactor; // Smaller to match Safari
          const buttonSpacing = 6 * scaleFactor; // Preview uses gap-[6px]
          const buttonOffsetX = 16 * scaleFactor; // Preview uses left-4 (16px)
          const urlBarHeight = 18 * scaleFactor;
          const urlBarWidth = 180 * scaleFactor; // Preview uses w-[180px]
          const urlBarRadius = 6 * scaleFactor; // Scaled from preview
          const fontSize = Math.round(9 * scaleFactor); // Preview uses text-[9px]

          ctx.save();
          ctx.translate(width / 2, height / 2);

          // Apply shadow if needed
          if (settings.shadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 60 * scaleFactor;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 20 * scaleFactor;
          }

          // Draw browser window background
          ctx.fillStyle = '#2a2a2e';
          roundRect(
            ctx,
            -frameWidth / 2,
            -frameHeight / 2 - titleBarHeight,
            frameWidth,
            frameHeight + titleBarHeight,
            browserBorderRadius
          );
          ctx.fill();

          // Reset shadow
          ctx.shadowColor = 'transparent';

          // Draw title bar buttons
          const buttonY = -frameHeight / 2 - titleBarHeight / 2;
          const buttonX = -frameWidth / 2 + buttonOffsetX;

          ctx.fillStyle = '#ff5f57';
          ctx.beginPath();
          ctx.arc(buttonX, buttonY, buttonRadius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#febc2e';
          ctx.beginPath();
          ctx.arc(buttonX + buttonRadius * 2 + buttonSpacing, buttonY, buttonRadius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#28c840';
          ctx.beginPath();
          ctx.arc(buttonX + (buttonRadius * 2 + buttonSpacing) * 2, buttonY, buttonRadius, 0, Math.PI * 2);
          ctx.fill();

          // Draw URL bar
          ctx.fillStyle = '#1c1c1e';
          roundRect(ctx, -urlBarWidth / 2, buttonY - urlBarHeight / 2, urlBarWidth, urlBarHeight, urlBarRadius);
          ctx.fill();

          // URL text
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.font = `${fontSize}px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('numia.xyz', 0, buttonY);

          // Draw browser content area with rounded bottom corners only
          ctx.save();

          // Create a path with rounded bottom corners only
          ctx.beginPath();
          const contentX = -frameWidth / 2;
          const contentY = -frameHeight / 2;

          // Top edge (straight)
          ctx.moveTo(contentX, contentY);
          ctx.lineTo(contentX + frameWidth, contentY);

          // Right edge
          ctx.lineTo(contentX + frameWidth, contentY + frameHeight - browserBorderRadius);

          // Bottom-right corner (rounded)
          ctx.quadraticCurveTo(
            contentX + frameWidth,
            contentY + frameHeight,
            contentX + frameWidth - browserBorderRadius,
            contentY + frameHeight
          );

          // Bottom edge
          ctx.lineTo(contentX + browserBorderRadius, contentY + frameHeight);

          // Bottom-left corner (rounded)
          ctx.quadraticCurveTo(
            contentX,
            contentY + frameHeight,
            contentX,
            contentY + frameHeight - browserBorderRadius
          );

          // Left edge
          ctx.lineTo(contentX, contentY);
          ctx.closePath();
          ctx.clip();

          ctx.fillStyle = '#1c1c1e';
          ctx.fillRect(contentX, contentY, frameWidth, frameHeight);

          ctx.drawImage(
            img,
            contentX,
            contentY,
            frameWidth,
            frameHeight
          );
          ctx.restore();

          ctx.restore();
        } else {
          // None mode: scale the image directly
          const imageScale = (settings.imageScale || 80) / 100;
          const finalWidth = baseWidth * imageScale;
          const finalHeight = baseHeight * imageScale;
          // Scale image radius proportionally
          const scaledImageRadius = (settings.imageRadius || 0) * scaleFactor;

          ctx.save();
          ctx.translate(width / 2, height / 2);

          // Apply shadow if needed
          if (settings.shadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 60;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 20;
          }

          // Draw image with rounded corners
          ctx.save();
          if (scaledImageRadius > 0) {
            roundRect(ctx, -finalWidth / 2, -finalHeight / 2, finalWidth, finalHeight, scaledImageRadius);
            ctx.clip();
          }

          ctx.drawImage(
            img,
            -finalWidth / 2,
            -finalHeight / 2,
            finalWidth,
            finalHeight
          );
          ctx.restore();

          ctx.restore();
        }

        // Draw branding if needed - scaled proportionally to canvas size
        if (settings.brandingPosition !== 'none') {
          ctx.save();
          // Scale font size to match preview proportions
          // Preview uses text-base (16px) on ~896px canvas (max-w-4xl)
          // Ratio: 16/896 ≈ 0.0179, so for 3840px: 3840 * 0.0179 ≈ 69px
          const fontSize = Math.round(width * 0.018); // Proportional to canvas width
          ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

          const text = 'NUMIA';
          const metrics = ctx.measureText(text);
          // Preview uses left-4 (16px) on ~896px canvas
          // Ratio: 16/896 ≈ 0.0179
          const padding = Math.round(width * 0.018); // Proportional padding

          let x = padding;
          let y = padding + fontSize;

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
