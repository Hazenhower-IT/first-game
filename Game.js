import * as THREE from "three"
import {RGBELoader} from "three/examples/jsm/loaders/RGBELoader"
import {LoadingBar} from "./libs/LoadingBar"
import {Plane} from "./scripts/Plane"
import { Obstacles } from "./scripts/Obstacles"
import {SFX} from "./scripts/SFX"

class Game{
  constructor(){
    const container = document.createElement("div")
    document.body.appendChild(container)

    this.loadingBar = new LoadingBar()
    this.loadingBar.visible = false

    this.clock = new THREE.Clock()

    this.assetsPath = "/assets/"

    this.camera = new THREE.PerspectiveCamera(70, innerWidth/ innerHeight, 0.1, 100)
    this.camera.position.set(-4.37, 0, -4.75)
    this.camera.lookAt(0, 0, 6)

    this.cameraController = new THREE.Object3D()
    this.cameraController.add(this.camera)
    this.cameraTarget = new THREE.Vector3(0, 0, 6)

    this.scene = new THREE.Scene()
    this.scene.add(this.cameraController)

    const ambient = new THREE.AmbientLight(0xffffff, 0xbbbbff, 1)
    ambient.position.set(0.5, 1, 0.25)
    this.scene.add(ambient)

    this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true})
    this.renderer.setPixelRatio( Math.min(2, window.devicePixelRatio))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    container.appendChild(this.renderer.domElement)
    
    this.setEnvironment()

    this.active = false
    this.load()

    window.addEventListener("resize", this.resize.bind(this))

    document.addEventListener("keydown", this.keyDown.bind(this))
    document.addEventListener("keyup", this.keyUp.bind(this))

    document.addEventListener("touchstart", this.mouseDown.bind(this))
    document.addEventListener("touchend", this.mouseUp.bind(this))

    document.addEventListener("mousedown", this.mouseDown.bind(this))
    document.addEventListener("mouseup", this.mouseUp.bind(this))


    this.spaceKey = false;
    
    const btn = document.getElementById("playBtn")
    btn.addEventListener("click", this.startGame.bind(this))
  
  }

  startGame(){
    const gameOver = document.getElementById("gameover")
    const instructions = document.getElementById("instructions")
    const btn = document.getElementById("playBtn")

    gameOver.style.display = "none"
    instructions.style.display = "none"
    btn.style.display = "none"

    this.score = 0
    this.bonusScore = 0
    this.lives = 3

    let elm = document.getElementById("score")
    elm.innerHTML = this.score

    elm = document.getElementById("lives")
    elm.innerHTML = this.lives

    this.plane.reset()
    this.obstacles.reset()

    this.active = true

    this.sfx.play("engine")
  }

  mouseDown(e){
    this.spaceKey = true
  }

  mouseUp(e){
    this.spaceKey = false
  }

  keyDown(e){
    switch(e.keyCode){

      case 32: 
        this.spaceKey = true
        break;
    }
  }
  keyUp(e){
    switch(e.keyCode){

      case 32: 
        this.spaceKey = false
        break;
    }
  }

  resize(){
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  setEnvironment(){
    const loader = new RGBELoader().setPath(this.assetsPath)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer)
    pmremGenerator.compileEquirectangularShader()

    const self = this

    loader.load("hdr/venice_sunset_1k.hdr", (texture)=>{
      const envMap = pmremGenerator.fromEquirectangular(texture).texture
      pmremGenerator.dispose()

      self.scene.environment = envMap
    }, undefined, (err)=>{
      console.error(err.message)
    })
  }

  load(){

    this.loadSkybox()
    this.loading = true
    this.loadingBar.visible = true

    
    this.plane = new Plane(this)
    this.obstacles = new Obstacles(this)

    this.loadSFX()
  }

  loadSFX(){
    this.sfx = new SFX(this.camera, this.assetsPath + "plane/")

    this.sfx.load("explosion")
    this.sfx.load("engine", true, 1)
    this.sfx.load("gliss")
    this.sfx.load("gameover")
    this.sfx.load("bonus")
  }

  loadSkybox(){
    this.scene.background = new THREE.CubeTextureLoader()
      .setPath(`${this.assetsPath}plane/paintedsky/`)
      .load([
        "px.jpg",
        "nx.jpg",
        "py.jpg",
        "ny.jpg",
        "pz.jpg",
        "nz.jpg"
      ], ()=>{
        this.renderer.setAnimationLoop(this.render.bind(this))
      })
  }

  gameOver(){
    this.active = false

    const gameOver = document.getElementById("gameover")
    const btn = document.getElementById("playBtn")

    gameOver.style.display = "block"
    btn.style.display ="block"

    this.plane.visible = false

    this.sfx.stopAll()
    this.sfx.play("gameover")
    
  }

  incScore(){
    this.score++

    const elm = document.getElementById("score")
    
    if(this.score % 3 == 0){
      this.bonusScore += 3
      this.sfx.play("bonus")
    }

    this.sfx.play("gliss")

    elm.innerHTML = this.score + this.bonusScore
  }

  decLives(){
    this.lives--

    const elm = document.getElementById("lives")
    elm.innerHTML = this.lives

    if(this.lives == 0){
      this.gameOver()
    }

    this.sfx.play("explosion")
  }

  updateCamera(){

    this.cameraController.position.copy(this.plane.position)
    this.cameraController.position.y = 0

    this.cameraTarget.copy(this.plane.position)
    this.cameraTarget.z += 6

    this.camera.lookAt(this.cameraTarget)

  }

  render(){

    if(this.loading){
      if(this.plane.ready && this.obstacles.ready){
        this.loading = false
        this.loadingBar.visible = false
      }
      else{
        return
      }
    }

    const time = this.clock.getElapsedTime()

    if(this.active){
      this.obstacles.update(this.plane.position)
    }

    this.plane.update(time)
    
    this.updateCamera()

    this.renderer.render(this.scene, this.camera)

  }
}

export {Game}