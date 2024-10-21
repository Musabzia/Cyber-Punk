import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js'
import gsap from 'gsap'

// Scene
const scene = new THREE.Scene()

// Camera
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 4

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("canvas"), antialias: true });
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1


renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();


// HDRI
new RGBELoader()
 .load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr', (texture) => {
    const enMap = pmremGenerator.fromEquirectangular(texture).texture;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    
    scene.environment = enMap;
    texture.dispose();
    pmremGenerator.dispose();
});

let model;
// GLTF Loader
const loader = new GLTFLoader();

loader.load('/gltf/DamagedHelmet.gltf', (gltf) => {
    model = gltf.scene;
    scene.add(model);
},undefined, (error) => {
    console.error('An error happened', error)
    }
);

window.addEventListener('mousemove', (e) => {
    if (model) {
        const rotationX = (e.clientX / window.innerHeight - .4) * (Math.PI * .3);
        const rotationY = (e.clientY / window.innerWidth - .4) * (Math.PI * .3);
        
        gsap.to(model.rotation, {
            x: rotationY,
            y: rotationX,
            duration: 1,
            ease: "power2.out"
        });
    }
});

// Post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.0025;
composer.addPass(rgbShiftPass);

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

function animate() {
    window.requestAnimationFrame(animate)
    composer.render();
}

animate()
