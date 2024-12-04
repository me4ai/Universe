import {
  Texture,
  CompressedTexture,
  WebGLRenderer,
  Material,
  MeshStandardMaterial,
  TextureLoader,
  LinearFilter,
  NearestFilter,
  RepeatWrapping,
  ClampToEdgeWrapping,
  Vector2
} from 'three';
import { WEBGL } from 'three/examples/jsm/WebGL';

export interface TextureOptimizationOptions {
  maxSize?: number;
  generateMipmaps?: boolean;
  anisotropy?: number;
  format?: 'RGB' | 'RGBA' | 'LUMINANCE';
  compressionLevel?: 'low' | 'medium' | 'high';
  powerOfTwo?: boolean;
}

export class TextureOptimizer {
  private static instance: TextureOptimizer;
  private textureLoader: TextureLoader;
  private renderer: WebGLRenderer | null = null;
  private supportedCompression: string[] = [];
  private textureCache: Map<string, Texture> = new Map();

  private constructor() {
    this.textureLoader = new TextureLoader();
    this.detectSupportedCompression();
  }

  static getInstance(): TextureOptimizer {
    if (!TextureOptimizer.instance) {
      TextureOptimizer.instance = new TextureOptimizer();
    }
    return TextureOptimizer.instance;
  }

  setRenderer(renderer: WebGLRenderer): void {
    this.renderer = renderer;
    this.detectSupportedCompression();
  }

  private detectSupportedCompression(): void {
    if (!this.renderer) return;

    const gl = this.renderer.getContext();
    const extensions = {
      astc: gl.getExtension('WEBGL_compressed_texture_astc'),
      etc1: gl.getExtension('WEBGL_compressed_texture_etc1'),
      etc2: gl.getExtension('WEBGL_compressed_texture_etc'),
      pvrtc: gl.getExtension('WEBGL_compressed_texture_pvrtc'),
      s3tc: gl.getExtension('WEBGL_compressed_texture_s3tc'),
      bc7: gl.getExtension('EXT_texture_compression_bptc')
    };

    this.supportedCompression = Object.entries(extensions)
      .filter(([_, ext]) => ext !== null)
      .map(([format]) => format);
  }

  async optimizeTexture(
    texture: Texture,
    options: TextureOptimizationOptions = {}
  ): Promise<Texture> {
    const {
      maxSize = 2048,
      generateMipmaps = true,
      anisotropy = 4,
      format = 'RGB',
      compressionLevel = 'medium',
      powerOfTwo = true
    } = options;

    // Check cache
    const cacheKey = this.getCacheKey(texture, options);
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }

    // Create canvas for texture processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Load image data
    const image = texture.image;
    let width = image.width;
    let height = image.height;

    // Resize to power of two if needed
    if (powerOfTwo) {
      width = this.nextPowerOfTwo(Math.min(width, maxSize));
      height = this.nextPowerOfTwo(Math.min(height, maxSize));
    } else {
      width = Math.min(width, maxSize);
      height = Math.min(height, maxSize);
    }

    canvas.width = width;
    canvas.height = height;

    // Draw and resize image
    ctx.drawImage(image, 0, 0, width, height);

    // Apply compression if supported
    let optimizedTexture: Texture;
    if (this.supportedCompression.length > 0) {
      optimizedTexture = this.compressTexture(canvas, format, compressionLevel);
    } else {
      optimizedTexture = new Texture(canvas);
    }

    // Configure texture parameters
    optimizedTexture.generateMipmaps = generateMipmaps;
    optimizedTexture.minFilter = generateMipmaps ? LinearFilter : NearestFilter;
    optimizedTexture.magFilter = LinearFilter;
    optimizedTexture.wrapS = RepeatWrapping;
    optimizedTexture.wrapT = RepeatWrapping;
    
    if (this.renderer) {
      optimizedTexture.anisotropy = Math.min(
        anisotropy,
        this.renderer.capabilities.getMaxAnisotropy()
      );
    }

    optimizedTexture.needsUpdate = true;

    // Cache the optimized texture
    this.textureCache.set(cacheKey, optimizedTexture);

    return optimizedTexture;
  }

  async optimizeMaterial(material: MeshStandardMaterial): Promise<void> {
    const maps = [
      'map',
      'normalMap',
      'roughnessMap',
      'metalnessMap',
      'aoMap',
      'emissiveMap'
    ] as const;

    for (const mapType of maps) {
      const texture = material[mapType];
      if (texture) {
        const optimizedTexture = await this.optimizeTexture(texture, {
          maxSize: 1024,
          generateMipmaps: true,
          anisotropy: 4,
          format: mapType === 'normalMap' ? 'RGB' : 'RGBA',
          compressionLevel: 'medium'
        });
        material[mapType] = optimizedTexture;
      }
    }

    material.needsUpdate = true;
  }

  private compressTexture(
    canvas: HTMLCanvasElement,
    format: 'RGB' | 'RGBA' | 'LUMINANCE',
    compressionLevel: 'low' | 'medium' | 'high'
  ): Texture {
    // Implementation would depend on the supported compression format
    // This is a placeholder that returns a regular texture
    return new Texture(canvas);
  }

  private nextPowerOfTwo(value: number): number {
    return Math.pow(2, Math.ceil(Math.log2(value)));
  }

  private getCacheKey(texture: Texture, options: TextureOptimizationOptions): string {
    return `${texture.uuid}-${JSON.stringify(options)}`;
  }

  clearCache(): void {
    this.textureCache.forEach(texture => texture.dispose());
    this.textureCache.clear();
  }

  dispose(): void {
    this.clearCache();
    this.renderer = null;
  }
}
