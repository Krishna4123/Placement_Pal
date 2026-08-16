import React, { useEffect, useRef } from 'react';
import {
  Vector3 as ThreeVector3,
  MeshPhysicalMaterial as ThreeMeshPhysicalMaterial,
  InstancedMesh as ThreeInstancedMesh,
  Timer as ThreeTimer,
  AmbientLight as ThreeAmbientLight,
  SphereGeometry as ThreeSphereGeometry,
  ShaderChunk as ThreeShaderChunk,
  Scene as ThreeScene,
  Color as ThreeColor,
  Object3D as ThreeObject3D,
  SRGBColorSpace as ThreeSRGBColorSpace,
  MathUtils as ThreeMathUtils,
  PMREMGenerator as ThreePMREMGenerator,
  Vector2 as ThreeVector2,
  WebGLRenderer as ThreeWebGLRenderer,
  PerspectiveCamera as ThreePerspectiveCamera,
  PointLight as ThreePointLight,
  ACESFilmicToneMapping as ThreeACESFilmicToneMapping,
  Plane as ThreePlane,
  Raycaster as ThreeRaycaster
} from 'three';
import { RoomEnvironment as ThreeRoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

class x {
  #e: any;
  canvas!: HTMLCanvasElement;
  camera!: ThreePerspectiveCamera;
  cameraMinAspect?: number;
  cameraMaxAspect?: number;
  cameraFov?: number;
  maxPixelRatio?: number;
  minPixelRatio?: number;
  scene!: ThreeScene;
  renderer!: ThreeWebGLRenderer;
  #t: any;
  size = { width: 0, height: 0, wWidth: 0, wHeight: 0, ratio: 0, pixelRatio: 0 };
  render = this.#i;
  onBeforeRender: (h: any) => void = () => {};
  onAfterRender: (h: any) => void = () => {};
  onAfterResize: (size: any) => void = () => {};
  #s = false;
  #n = false;
  #boundResize = this.#f.bind(this);
  #boundVisibilityChange = this.#v.bind(this);
  isDisposed = false;
  #o?: IntersectionObserver;
  #r?: ResizeObserver;
  #a: any;
  #c = new ThreeTimer();
  #h = { elapsed: 0, delta: 0 };
  #l: any;

  constructor(options: any) {
    this.#e = { ...options };
    this.#m();
    this.#d();
    this.#p();
    this.resize();
    this.#g();
  }
  #m() {
    this.camera = new ThreePerspectiveCamera();
    this.cameraFov = this.camera.fov;
  }
  #d() {
    this.scene = new ThreeScene();
  }
  #p() {
    if (this.#e.canvas) {
      this.canvas = this.#e.canvas;
    } else if (this.#e.id) {
      this.canvas = document.getElementById(this.#e.id) as HTMLCanvasElement;
    } else {
      console.error('Three: Missing canvas or id parameter');
    }
    this.canvas.style.display = 'block';
    const rendererOptions = {
      canvas: this.canvas,
      powerPreference: 'high-performance',
      ...(this.#e.rendererOptions ?? {})
    };
    this.renderer = new ThreeWebGLRenderer(rendererOptions);
    this.renderer.outputColorSpace = ThreeSRGBColorSpace;
  }
  #g() {
    if (!(this.#e.size instanceof Object)) {
      window.addEventListener('resize', this.#boundResize);
      if (this.#e.size === 'parent' && this.canvas.parentNode) {
        this.#r = new ResizeObserver(this.#f.bind(this));
        this.#r.observe(this.canvas.parentNode as Element);
      }
    }
    this.#o = new IntersectionObserver(this.#u.bind(this), {
      root: null,
      rootMargin: '0px',
      threshold: 0
    });
    this.#o.observe(this.canvas);
    document.addEventListener('visibilitychange', this.#boundVisibilityChange);
  }
  #y() {
    window.removeEventListener('resize', this.#boundResize);
    this.#r?.disconnect();
    this.#o?.disconnect();
    document.removeEventListener('visibilitychange', this.#boundVisibilityChange);
  }
  #u(entries: IntersectionObserverEntry[]) {
    this.#s = entries[0].isIntersecting;
    this.#s ? this.#w() : this.#z();
  }
  #v() {
    if (this.#s) {
      document.hidden ? this.#z() : this.#w();
    }
  }
  #f() {
    if (this.#a) clearTimeout(this.#a);
    this.#a = setTimeout(this.resize.bind(this), 100);
  }
  resize() {
    let wVal: number, hVal: number;
    if (this.#e.size instanceof Object) {
      wVal = this.#e.size.width;
      hVal = this.#e.size.height;
    } else if (this.#e.size === 'parent' && this.canvas.parentNode) {
      wVal = (this.canvas.parentNode as HTMLElement).offsetWidth;
      hVal = (this.canvas.parentNode as HTMLElement).offsetHeight;
    } else {
      wVal = window.innerWidth;
      hVal = window.innerHeight;
    }
    this.size.width = wVal;
    this.size.height = hVal;
    this.size.ratio = wVal / hVal;
    this.#x();
    this.#b();
    this.onAfterResize(this.size);
  }
  #x() {
    this.camera.aspect = this.size.width / this.size.height;
    if (this.camera.isPerspectiveCamera && this.cameraFov) {
      if (this.cameraMinAspect && this.camera.aspect < this.cameraMinAspect) {
        this.#A(this.cameraMinAspect);
      } else if (this.cameraMaxAspect && this.camera.aspect > this.cameraMaxAspect) {
        this.#A(this.cameraMaxAspect);
      } else {
        this.camera.fov = this.cameraFov;
      }
    }
    this.camera.updateProjectionMatrix();
    this.updateWorldSize();
  }
  #A(aspectVal: number) {
    const t = Math.tan(ThreeMathUtils.degToRad(this.cameraFov! / 2)) / (this.camera.aspect / aspectVal);
    this.camera.fov = 2 * ThreeMathUtils.radToDeg(Math.atan(t));
  }
  updateWorldSize() {
    if (this.camera.isPerspectiveCamera) {
      const fovRad = (this.camera.fov * Math.PI) / 180;
      this.size.wHeight = 2 * Math.tan(fovRad / 2) * this.camera.position.length();
      this.size.wWidth = this.size.wHeight * this.camera.aspect;
    } else if ((this.camera as any).isOrthographicCamera) {
      const cam = this.camera as any;
      this.size.wHeight = cam.top - cam.bottom;
      this.size.wWidth = cam.right - cam.left;
    }
  }
  #b() {
    this.renderer.setSize(this.size.width, this.size.height);
    this.#t?.setSize(this.size.width, this.size.height);
    let ratio = window.devicePixelRatio;
    if (this.maxPixelRatio && ratio > this.maxPixelRatio) {
      ratio = this.maxPixelRatio;
    } else if (this.minPixelRatio && ratio < this.minPixelRatio) {
      ratio = this.minPixelRatio;
    }
    this.renderer.setPixelRatio(ratio);
    this.size.pixelRatio = ratio;
  }
  get postprocessing() {
    return this.#t;
  }
  set postprocessing(val: any) {
    this.#t = val;
    this.render = val.render.bind(val);
  }
  #w() {
    if (this.#n) return;
    const animate = () => {
      this.#l = requestAnimationFrame(animate);
      this.#c.update();
      this.#h.delta = (this.#c as any).getDelta ? (this.#c as any).getDelta() : 0.016;
      this.#h.elapsed += this.#h.delta;
      this.onBeforeRender(this.#h);
      this.render();
      this.onAfterRender(this.#h);
    };
    this.#n = true;
    (this.#c as any).reset?.();
    animate();
  }
  #z() {
    if (this.#n) {
      cancelAnimationFrame(this.#l);
      this.#n = false;
    }
  }
  #i() {
    this.renderer.render(this.scene, this.camera);
  }
  clear() {
    this.scene.traverse((elem: any) => {
      if (elem.isMesh && typeof elem.material === 'object' && elem.material !== null) {
        Object.keys(elem.material).forEach(k => {
          const matItem = elem.material[k];
          if (matItem !== null && typeof matItem === 'object' && typeof matItem.dispose === 'function') {
            matItem.dispose();
          }
        });
        elem.material.dispose();
        elem.geometry.dispose();
      }
    });
    this.scene.clear();
  }
  dispose() {
    this.#y();
    this.#z();
    (this.#c as any).dispose?.();
    this.clear();
    this.#t?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.isDisposed = true;
  }
}

const interactionRegistry = new Map<HTMLElement, any>();
const currentPointerPos = new ThreeVector2();
let interactionListenersAttached = false;

function setupInteraction(options: { domElement: HTMLElement; [key: string]: any }) {
  const handlerObj: any = {
    position: new ThreeVector2(),
    nPosition: new ThreeVector2(),
    hover: false,
    touching: false,
    onEnter() {},
    onMove() {},
    onClick() {},
    onLeave() {},
    ...options
  };

  (function (elem: HTMLElement, hObj: any) {
    if (!interactionRegistry.has(elem)) {
      interactionRegistry.set(elem, hObj);
      if (!interactionListenersAttached) {
        document.body.addEventListener('pointermove', onPointerMove);
        document.body.addEventListener('pointerleave', onPointerLeave);
        document.body.addEventListener('click', onPointerClick);

        document.body.addEventListener('touchstart', onTouchStart, { passive: false });
        document.body.addEventListener('touchmove', onTouchMove, { passive: false });
        document.body.addEventListener('touchend', onTouchEnd, { passive: false });
        document.body.addEventListener('touchcancel', onTouchEnd, { passive: false });

        interactionListenersAttached = true;
      }
    }
  })(options.domElement, handlerObj);

  handlerObj.dispose = () => {
    const elem = options.domElement;
    interactionRegistry.delete(elem);
    if (interactionRegistry.size === 0) {
      document.body.removeEventListener('pointermove', onPointerMove);
      document.body.removeEventListener('pointerleave', onPointerLeave);
      document.body.removeEventListener('click', onPointerClick);

      document.body.removeEventListener('touchstart', onTouchStart);
      document.body.removeEventListener('touchmove', onTouchMove);
      document.body.removeEventListener('touchend', onTouchEnd);
      document.body.removeEventListener('touchcancel', onTouchEnd);

      interactionListenersAttached = false;
    }
  };
  return handlerObj;
}

function onPointerMove(e: PointerEvent) {
  currentPointerPos.x = e.clientX;
  currentPointerPos.y = e.clientY;
  processInteraction();
}

function processInteraction() {
  for (const [elem, tHandler] of interactionRegistry) {
    const rect = elem.getBoundingClientRect();
    if (isInsideRect(rect)) {
      updateNormalizedPos(tHandler, rect);
      if (!tHandler.hover) {
        tHandler.hover = true;
        tHandler.onEnter(tHandler);
      }
      tHandler.onMove(tHandler);
    } else if (tHandler.hover && !tHandler.touching) {
      tHandler.hover = false;
      tHandler.onLeave(tHandler);
    }
  }
}

function onPointerClick(e: MouseEvent) {
  currentPointerPos.x = e.clientX;
  currentPointerPos.y = e.clientY;
  for (const [elem, tHandler] of interactionRegistry) {
    const rect = elem.getBoundingClientRect();
    updateNormalizedPos(tHandler, rect);
    if (isInsideRect(rect)) tHandler.onClick(tHandler);
  }
}

function onPointerLeave() {
  for (const tHandler of interactionRegistry.values()) {
    if (tHandler.hover) {
      tHandler.hover = false;
      tHandler.onLeave(tHandler);
    }
  }
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length > 0) {
    e.preventDefault();
    currentPointerPos.x = e.touches[0].clientX;
    currentPointerPos.y = e.touches[0].clientY;

    for (const [elem, tHandler] of interactionRegistry) {
      const rect = elem.getBoundingClientRect();
      if (isInsideRect(rect)) {
        tHandler.touching = true;
        updateNormalizedPos(tHandler, rect);
        if (!tHandler.hover) {
          tHandler.hover = true;
          tHandler.onEnter(tHandler);
        }
        tHandler.onMove(tHandler);
      }
    }
  }
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length > 0) {
    e.preventDefault();
    currentPointerPos.x = e.touches[0].clientX;
    currentPointerPos.y = e.touches[0].clientY;

    for (const [elem, tHandler] of interactionRegistry) {
      const rect = elem.getBoundingClientRect();
      updateNormalizedPos(tHandler, rect);

      if (isInsideRect(rect)) {
        if (!tHandler.hover) {
          tHandler.hover = true;
          tHandler.touching = true;
          tHandler.onEnter(tHandler);
        }
        tHandler.onMove(tHandler);
      } else if (tHandler.hover && tHandler.touching) {
        tHandler.onMove(tHandler);
      }
    }
  }
}

function onTouchEnd() {
  for (const [, tHandler] of interactionRegistry) {
    if (tHandler.touching) {
      tHandler.touching = false;
      if (tHandler.hover) {
        tHandler.hover = false;
        tHandler.onLeave(tHandler);
      }
    }
  }
}

function updateNormalizedPos(hObj: any, rect: DOMRect) {
  const { position: iPos, nPosition: sPos } = hObj;
  iPos.x = currentPointerPos.x - rect.left;
  iPos.y = currentPointerPos.y - rect.top;
  sPos.x = (iPos.x / rect.width) * 2 - 1;
  sPos.y = (-iPos.y / rect.height) * 2 + 1;
}

function isInsideRect(rect: DOMRect) {
  const { x: px, y: py } = currentPointerPos;
  const { left: l, top: t, width: w, height: h } = rect;
  return px >= l && px <= l + w && py >= t && py <= t + h;
}

const { randFloat: randF, randFloatSpread: randSpread } = ThreeMathUtils;
const vecF = new ThreeVector3();
const vecI = new ThreeVector3();
const vecO = new ThreeVector3();
const vecV = new ThreeVector3();
const vecB = new ThreeVector3();
const vecN = new ThreeVector3();
const vecUnderscore = new ThreeVector3();
const vecJ = new ThreeVector3();
const vecH = new ThreeVector3();
const vecT = new ThreeVector3();

class PhysicsEngine {
  config: any;
  positionData: Float32Array;
  velocityData: Float32Array;
  sizeData: Float32Array;
  center: ThreeVector3;

  constructor(cfg: any) {
    this.config = cfg;
    this.positionData = new Float32Array(3 * cfg.count).fill(0);
    this.velocityData = new Float32Array(3 * cfg.count).fill(0);
    this.sizeData = new Float32Array(cfg.count).fill(1);
    this.center = new ThreeVector3();
    this.#initPositions();
    this.setSizes();
  }

  #initPositions() {
    const { config: cfg, positionData: pos } = this;
    this.center.toArray(pos, 0);
    for (let i = 1; i < cfg.count; i++) {
      const idx = 3 * i;
      pos[idx] = randSpread(2 * cfg.maxX);
      pos[idx + 1] = randSpread(2 * cfg.maxY);
      pos[idx + 2] = randSpread(2 * cfg.maxZ);
    }
  }

  setSizes() {
    const { config: cfg, sizeData: sz } = this;
    sz[0] = cfg.size0;
    for (let i = 1; i < cfg.count; i++) {
      sz[i] = randF(cfg.minSize, cfg.maxSize);
    }
  }

  update(ev: any) {
    const { config: cfg, center: cntr, positionData: pos, sizeData: sz, velocityData: vel } = this;
    let startIdx = 0;
    if (cfg.controlSphere0) {
      startIdx = 1;
      vecF.fromArray(pos, 0);
      vecF.lerp(cntr, 0.1).toArray(pos, 0);
      vecV.set(0, 0, 0).toArray(vel, 0);
    }
    for (let idx = startIdx; idx < cfg.count; idx++) {
      const base = 3 * idx;
      vecI.fromArray(pos, base);
      vecB.fromArray(vel, base);
      vecB.y -= ev.delta * cfg.gravity * sz[idx];
      vecB.multiplyScalar(cfg.friction);
      vecB.clampLength(0, cfg.maxVelocity);
      vecI.add(vecB);
      vecI.toArray(pos, base);
      vecB.toArray(vel, base);
    }
    for (let idx = startIdx; idx < cfg.count; idx++) {
      const base = 3 * idx;
      vecI.fromArray(pos, base);
      vecB.fromArray(vel, base);
      const radius = sz[idx];
      for (let jdx = idx + 1; jdx < cfg.count; jdx++) {
        const otherBase = 3 * jdx;
        vecO.fromArray(pos, otherBase);
        vecN.fromArray(vel, otherBase);
        const otherRadius = sz[jdx];
        vecUnderscore.copy(vecO).sub(vecI);
        const dist = vecUnderscore.length();
        const sumRadius = radius + otherRadius;
        if (dist < sumRadius) {
          const overlap = sumRadius - dist;
          vecJ.copy(vecUnderscore)
            .normalize()
            .multiplyScalar(0.5 * overlap);
          vecH.copy(vecJ).multiplyScalar(Math.max(vecB.length(), 1));
          vecT.copy(vecJ).multiplyScalar(Math.max(vecN.length(), 1));
          vecI.sub(vecJ);
          vecB.sub(vecH);
          vecI.toArray(pos, base);
          vecB.toArray(vel, base);
          vecO.add(vecJ);
          vecN.add(vecT);
          vecO.toArray(pos, otherBase);
          vecN.toArray(vel, otherBase);
        }
      }
      if (cfg.controlSphere0) {
        vecUnderscore.copy(vecF).sub(vecI);
        const dist = vecUnderscore.length();
        const sumRadius0 = radius + sz[0];
        if (dist < sumRadius0) {
          const diff = sumRadius0 - dist;
          vecJ.copy(vecUnderscore.normalize()).multiplyScalar(diff);
          vecH.copy(vecJ).multiplyScalar(Math.max(vecB.length(), 2));
          vecI.sub(vecJ);
          vecB.sub(vecH);
        }
      }
      if (Math.abs(vecI.x) + radius > cfg.maxX) {
        vecI.x = Math.sign(vecI.x) * (cfg.maxX - radius);
        vecB.x = -vecB.x * cfg.wallBounce;
      }
      if (cfg.gravity === 0) {
        if (Math.abs(vecI.y) + radius > cfg.maxY) {
          vecI.y = Math.sign(vecI.y) * (cfg.maxY - radius);
          vecB.y = -vecB.y * cfg.wallBounce;
        }
      } else if (vecI.y - radius < -cfg.maxY) {
        vecI.y = -cfg.maxY + radius;
        vecB.y = -vecB.y * cfg.wallBounce;
      }
      const maxBoundary = Math.max(cfg.maxZ, cfg.maxSize);
      if (Math.abs(vecI.z) + radius > maxBoundary) {
        vecI.z = Math.sign(vecI.z) * (cfg.maxZ - radius);
        vecB.z = -vecB.z * cfg.wallBounce;
      }
      vecI.toArray(pos, base);
      vecB.toArray(vel, base);
    }
  }
}

class CustomPhysicalMaterial extends ThreeMeshPhysicalMaterial {
  uniforms: any;
  onBeforeCompile2?: (e: any) => void;
  constructor(materialOptions: any) {
    super(materialOptions);
    if (!this.defines) this.defines = {};
    this.uniforms = {
      thicknessDistortion: { value: 0.1 },
      thicknessAmbient: { value: 0 },
      thicknessAttenuation: { value: 0.1 },
      thicknessPower: { value: 2 },
      thicknessScale: { value: 10 }
    };
    this.defines.USE_UV = '';
    this.onBeforeCompile = (shader: any) => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.fragmentShader =
        '\n        uniform float thicknessPower;\n        uniform float thicknessScale;\n        uniform float thicknessDistortion;\n        uniform float thicknessAmbient;\n        uniform float thicknessAttenuation;\n      ' +
        shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        '\n        void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, inout ReflectedLight reflectedLight) {\n          vec3 scatteringHalf = normalize(directLight.direction + (geometryNormal * thicknessDistortion));\n          float scatteringDot = pow(saturate(dot(geometryViewDir, -scatteringHalf)), thicknessPower) * thicknessScale;\n          #ifdef USE_COLOR\n            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * vColor.rgb;\n          #else\n            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * diffuse;\n          #endif\n          reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation * directLight.color;\n        }\n\n        void main() {\n      '
      );
      const tStr = ThreeShaderChunk.lights_fragment_begin.split(
        'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );'
      ).join(
        '\n          RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n          RE_Direct_Scattering(directLight, vUv, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, reflectedLight);\n        '
      );
      shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>', tStr);
      if (this.onBeforeCompile2) this.onBeforeCompile2(shader);
    };
  }
}

const DEFAULT_BALLPIT_CONFIG = {
  count: 200,
  colors: [0x2563eb, 0x7c3aed, 0x3b82f6],
  ambientColor: 16777215,
  ambientIntensity: 1,
  lightIntensity: 200,
  materialParams: {
    metalness: 0.5,
    roughness: 0.5,
    clearcoat: 1,
    clearcoatRoughness: 0.15
  },
  minSize: 0.5,
  maxSize: 1,
  size0: 1,
  gravity: 0.5,
  friction: 0.9975,
  wallBounce: 0.95,
  maxVelocity: 0.15,
  maxX: 5,
  maxY: 5,
  maxZ: 2,
  controlSphere0: false,
  followCursor: true
};

const dummyObject3D = new ThreeObject3D();

class BallpitSpheresMesh extends ThreeInstancedMesh {
  config: any;
  physics: PhysicsEngine;
  ambientLight!: ThreeAmbientLight;
  light!: ThreePointLight;

  constructor(renderer: ThreeWebGLRenderer, userProps = {}) {
    const mergedConfig = { ...DEFAULT_BALLPIT_CONFIG, ...userProps };
    const roomEnv = new ThreeRoomEnvironment();
    const envTexture = (new (ThreePMREMGenerator as any)(renderer, 0.04)).fromScene(roomEnv).texture;
    const geometry = new ThreeSphereGeometry();
    const material = new CustomPhysicalMaterial({ envMap: envTexture, ...mergedConfig.materialParams });
    (material as any).envMapRotation.x = -Math.PI / 2;
    
    super(geometry, material, mergedConfig.count);

    this.config = mergedConfig;
    this.physics = new PhysicsEngine(mergedConfig);
    this.#setupLights();
    this.setColors(mergedConfig.colors);
  }

  #setupLights() {
    this.ambientLight = new ThreeAmbientLight(this.config.ambientColor, this.config.ambientIntensity);
    this.add(this.ambientLight);
    this.light = new ThreePointLight(this.config.colors[0], this.config.lightIntensity);
    this.add(this.light);
  }

  setColors(colorList: any) {
    if (Array.isArray(colorList) && colorList.length > 1) {
      const gradientHelper = (function (arr: any[]) {
        let cols: any[], colorObjs: ThreeColor[];
        function init(cArray: any[]) {
          cols = cArray;
          colorObjs = [];
          cols.forEach(c => {
            colorObjs.push(new ThreeColor(c));
          });
        }
        init(arr);
        return {
          init,
          getColorAt: function (ratio: number, out = new ThreeColor()) {
            const scaled = Math.max(0, Math.min(1, ratio)) * (cols.length - 1);
            const idx = Math.floor(scaled);
            const start = colorObjs[idx];
            if (idx >= cols.length - 1) return start.clone();
            const alpha = scaled - idx;
            const end = colorObjs[idx + 1];
            out.r = start.r + alpha * (end.r - start.r);
            out.g = start.g + alpha * (end.g - start.g);
            out.b = start.b + alpha * (end.b - start.b);
            return out;
          }
        };
      })(colorList);

      for (let idx = 0; idx < this.count; idx++) {
        this.setColorAt(idx, gradientHelper.getColorAt(idx / this.count));
        if (idx === 0) {
          this.light.color.copy(gradientHelper.getColorAt(idx / this.count));
        }
      }
      if (this.instanceColor) this.instanceColor.needsUpdate = true;
    }
  }

  update(ev: any) {
    this.physics.update(ev);
    for (let idx = 0; idx < this.count; idx++) {
      dummyObject3D.position.fromArray(this.physics.positionData, 3 * idx);
      if (idx === 0 && this.config.followCursor === false) {
        dummyObject3D.scale.setScalar(0);
      } else {
        dummyObject3D.scale.setScalar(this.physics.sizeData[idx]);
      }
      dummyObject3D.updateMatrix();
      this.setMatrixAt(idx, dummyObject3D.matrix);
      if (idx === 0) this.light.position.copy(dummyObject3D.position);
    }
    this.instanceMatrix.needsUpdate = true;
  }
}

function createBallpit(canvasElement: HTMLCanvasElement, props = {}) {
  const threeApp = new x({
    canvas: canvasElement,
    size: 'parent',
    rendererOptions: { antialias: true, alpha: true }
  });
  let spheresMesh: BallpitSpheresMesh;
  threeApp.renderer.toneMapping = ThreeACESFilmicToneMapping;
  threeApp.camera.position.set(0, 0, 20);
  threeApp.camera.lookAt(0, 0, 0);
  threeApp.cameraMaxAspect = 1.5;
  threeApp.resize();
  initialize(props);

  const raycaster = new ThreeRaycaster();
  const plane = new ThreePlane(new ThreeVector3(0, 0, 1), 0);
  const intersectPoint = new ThreeVector3();
  let isPaused = false;

  canvasElement.style.touchAction = 'none';
  canvasElement.style.userSelect = 'none';
  (canvasElement.style as any).webkitUserSelect = 'none';

  const interaction = setupInteraction({
    domElement: canvasElement,
    onMove() {
      raycaster.setFromCamera(interaction.nPosition, threeApp.camera);
      threeApp.camera.getWorldDirection(plane.normal);
      raycaster.ray.intersectPlane(plane, intersectPoint);
      spheresMesh.physics.center.copy(intersectPoint);
      spheresMesh.config.controlSphere0 = true;
    },
    onLeave() {
      spheresMesh.config.controlSphere0 = false;
    }
  });

  function initialize(initProps: any) {
    if (spheresMesh) {
      threeApp.clear();
      threeApp.scene.remove(spheresMesh);
    }
    spheresMesh = new BallpitSpheresMesh(threeApp.renderer, initProps);
    threeApp.scene.add(spheresMesh);
  }

  threeApp.onBeforeRender = (ev: any) => {
    if (!isPaused) spheresMesh.update(ev);
  };
  threeApp.onAfterResize = (sz: any) => {
    spheresMesh.config.maxX = sz.wWidth / 2;
    spheresMesh.config.maxY = sz.wHeight / 2;
  };

  return {
    three: threeApp,
    get spheres() {
      return spheresMesh;
    },
    setCount(cVal: number) {
      initialize({ ...spheresMesh.config, count: cVal });
    },
    updateConfig(newProps: any) {
      if (newProps.count !== undefined && newProps.count !== spheresMesh.config.count) {
        initialize({ ...spheresMesh.config, ...newProps });
      } else {
        Object.assign(spheresMesh.config, newProps);
        if (newProps.colors) {
          spheresMesh.setColors(spheresMesh.config.colors);
        }
        if (newProps.minSize !== undefined || newProps.maxSize !== undefined || newProps.size0 !== undefined) {
          spheresMesh.physics.setSizes();
        }
      }
    },
    togglePause() {
      isPaused = !isPaused;
    },
    dispose() {
      interaction.dispose();
      threeApp.dispose();
    }
  };
}

export interface BallpitProps {
  className?: string;
  followCursor?: boolean;
  count?: number;
  gravity?: number;
  friction?: number;
  wallBounce?: number;
  colors?: (number | string)[];
  ambientColor?: number;
  ambientIntensity?: number;
  lightIntensity?: number;
  minSize?: number;
  maxSize?: number;
  size0?: number;
  maxVelocity?: number;
  maxX?: number;
  maxY?: number;
  maxZ?: number;
  [key: string]: any;
}

export const Ballpit: React.FC<BallpitProps> = ({ className = '', followCursor = true, ...props }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spheresInstanceRef = useRef<any>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    spheresInstanceRef.current = createBallpit(canvas, { followCursor, ...props });

    return () => {
      if (spheresInstanceRef.current) {
        spheresInstanceRef.current.dispose();
        spheresInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (spheresInstanceRef.current) {
      spheresInstanceRef.current.updateConfig({ followCursor, ...props });
    }
  }, [props, followCursor]);

  return <canvas className={className} ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};

export default Ballpit;
