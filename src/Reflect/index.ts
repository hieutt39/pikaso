import Konva from 'konva'

import {ShapeModel} from '../shape/ShapeModel'
import {ImageModel} from '../shape/models/ImageModel'

export interface ReflectConfig {
  isReflect: boolean
  opacity: number
  offset: number
  reflectHeight: number
}

export class Reflect {
  config: ReflectConfig
  shape: ShapeModel
  reflectImage: ImageModel
  reflectHeight: ShapeModel

  constructor(shape: ShapeModel) {
    this.config = {
      isReflect: false,
      opacity: 0.8,
      offset: 1,
      reflectHeight: 0.6,
      ...shape.node.attrs.reflection
    }
    shape.node.attrs = {
      reflection: this.config,
      ...shape.node.attrs
    }
    this.shape = shape
  }

  public setImageToReflect(image: ImageModel) {
    this.reflectImage = image
    this._init()
    this.hide()
  }

  public show() {
    this.config.isReflect = true
    this.shape.node.attrs.reflection.isReflect = true
    this.reflectImage.show()
  }

  public hide() {
    this.config.isReflect = false
    this.shape.node.attrs.reflection.isReflect = false
    this.reflectImage.hide()
  }

  /**
   * Draw image and reflection and position
   */
  private _init(isReload: boolean = false) {
    const theta = this.shape.node.rotation()
    this.shape.rotate(0)
    this.shape.node.toImage().then(img => {
      if (!isReload) {
        this.reflectImage.node.setAttrs({
          x: this.shape.node.x(),
          y: this.shape.node.y()
        })
      }
      this.reflectImage.node.setAttrs({
        width: this.shape.node.width(),
        height: this.shape.node.height(),
        scaleX: 1,
        scaleY: 1
        // scaleX: this.shape.node.scaleX(),
        // scaleY: this.shape.node.scaleY(),
        // skewX: this.shape.node.skewX(),
        // skewY: this.shape.node.skewY()
      })
      this.reflectImage.node.clearCache()
      this.reflectImage.node.setAttr('image', img)
      this.configChange()
    })
    this.shape.rotate(theta)
  }

  /**
   * Re-Draw for new image exclude position
   */
  public reload() {
    this._init(true)
    if (this.config.isReflect) {
      this.show()
    } else {
      this.hide()
    }
  }

  /**
   * redraw Reflection for image data
   * @param ctx
   * @param shape
   */
  public reflectionImage(ctx: Konva.Context, shape: Konva.Image) {
    let reflectionHeight = shape.height() * this.config.reflectHeight
    const img = shape.getAttr('image')
    ctx.save()
    ctx.translate(0, shape.height() + reflectionHeight + this.config.offset)
    ctx.scale(1, -1)
    ctx.globalAlpha = this.config.opacity
    ctx.drawImage(img, 0, 0, shape.width(), reflectionHeight)
    ctx.globalAlpha = 1
    let gradient = ctx.createLinearGradient(0, 0, 0, reflectionHeight)
    // Opaque white in the top
    gradient.addColorStop(0, 'rgb(255,255,255, 1)')
    // Transparent white at the bottom
    gradient.addColorStop(1, 'rgb(255,255,255, 0)')
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = gradient

    ctx.fillRect(0, 0, shape.width(), reflectionHeight)
    ctx.restore()
  }

  /**
   * only apply Reflection when Change configuration
   */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public configChange() {
    this.reflectImage.node.sceneFunc((ctx, shape) => {
      this.reflectionImage(ctx, shape)
    })
  }

  /**
   * return height of image after Reflection
   */
  public getReflectHeight() {
    let reflectionHeight = this.shape.height() * this.config.reflectHeight
    return reflectionHeight + this.config.offset
  }
}
