import Konva from 'konva'

import {convertHtmlToText} from '../../../utils/html-to-text'
import {Board} from '../../../Board'
import {isBrowser, isNode} from '../../../utils/detect-environment'
import {rotateAroundCenter} from '../../../utils/rotate-around-center'
import {ShapeModel} from '../../ShapeModel'
import {LabelModel} from '../LabelModel'
import {DrawType, TextSvgConfig} from '../../../types'
import {Reflect} from '../../../Reflect'
import {ImageModel} from '../ImageModel'

export class TextSvgModel extends ShapeModel<Konva.Group, Konva.GroupConfig> {
  /**
   * add more original text no format
   */
  /**
   * Refer to label to synchonize
   * @private
   */
  private referShape: LabelModel

  /**
   * add more Reflection
   */
  private reflectShape: ShapeModel

  private reflection: Reflect

  constructor(board: Board, node: Konva.Group, config: TextSvgConfig = {}) {
    super(board, node, config)
    this.config = config
    node.on('dblclick', this.inlineEdit.bind(this))
    node.on('transform', this.transform.bind(this))
    node.on('transformend', this.transformend.bind(this))
    node.on('dragend', this.dragend.bind(this))
    node.on('dragmove', this.dragmove.bind(this))
    node.find('TextPath')[0].on('dataChange', this.sync.bind(this))
    node.find('TextPath')[0].on('fontFamilyChange', this.sync.bind(this))
    node.find('TextPath')[0].on('fontSizeChange', this.sync.bind(this))
    node.find('TextPath')[0].on('textChange', this.textChange.bind(this))
    node.find('TextPath')[0].on('letterSpacingChange', this.sync.bind(this))
    node.find('TextPath')[0].on('alignChange', this.sync.bind(this))
    node.find('TextPath')[0].on('fillChange', this.sync.bind(this))
    node.find('Tag')[0].on('fillChange', this.tagFillChange.bind(this))
    this._syncAttrs()
    this.reflection = new Reflect(this)
  }

  /**
   * @inheritdoc
   */
  public get type(): string {
    return 'textSvg'
  }

  /**
   * Returns the text node of the label
   */
  public get textPathNode() {
    return this.node.find('TextPath')[0] as Konva.TextPath
  }

  /**
   * Returns the tag node of the label
   */
  public get tagNode() {
    return this.node.find('Tag')[0] as Konva.Tag
  }

  /**
   * Returns the original content of Text
   */
  public getOrgText() {
    return this.textPathNode.getAttr('orgText')
  }

  /**
   * Set Content to origin text
   * @param orgText
   */
  public setOrgText(orgText: string) {
    this.updateText({orgText: orgText, text: orgText})
  }

  /**
   * @inheritdoc
   * @override
   */
  public rotate(theta: number) {
    rotateAroundCenter(this.node, theta)
    if (this.reflectShape) {
      rotateAroundCenter(this.reflectShape.node, theta)
    }
    this.updateTransformer()

    this.board.events.emit('shape:rotate', {
      shapes: [this]
    })
  }

  /**
   * Enables inline editing of the TextSvg with double clicking on the node
   *
   * @param e The [[MouseEvent | Mouse Event]
   */
  private inlineEdit(e: Konva.KonvaEventObject<MouseEvent>) {
    if (isNode() || this.node.isCached()) {
      return
    }
    this.board.events.emit('textSvg:dblclick', {
      shapes: [this]
    })
    e.cancelBubble = true
    this.board.setActiveDrawing(DrawType.TextPath)

    // const textBeforeEdit = this.textPathNode.getAttr('text')
    // hide node
    // this.node.hide()
    this.textPathNode?.draggable(false)

    // deselect all selected nodes
    this.board.selection.deselectAll()

    const input = document.createElement('span')
    this.board.container
      ?.getElementsByClassName(this.board.settings.containerClassName!)[0]
      ?.append(input)

    if (isBrowser()) {
      this.setInputFocus(input)
    }

    input.setAttribute('contenteditable', '')
    input.setAttribute('role', 'textbox')
    // const box = this.node.getClientRect()
    input.innerText = this.textPathNode.getAttr('text')
    // let left = box.x + (box.width - 188) / 2
    // let bottom = this.board.stage.height() - (box.y - 20)
    let left = (this.board.stage.width() - 188) / 2
    let top = this.board.stage.y()
    Object.assign(input.style, {
      position: 'absolute',
      display: 'inline-block',
      left: `${left}px`,
      top: `${top}px`,
      width: `168px`,
      maxHeight: `90px`,
      fontSize: `16px`,
      border: 'none',
      padding: `10px`,
      margin: `0px`,
      overflow: 'auto',
      background: 'rgba(0,0,0,0.85)',
      borderRadius: `10px`,
      outline: 'none',
      resize: 'none',
      transformOrigin: 'left top',
      textAlign: this.textPathNode.getAttr('align'),
      color: '#fff'
    })
    if (isBrowser()) {
      input.addEventListener('keyup', this.onKeyUp.bind(this))
    }

    input.addEventListener('blur', (e: Event) => {
      input.parentNode?.removeChild(input)

      this.board.setActiveDrawing(null)

      const newText = convertHtmlToText((<HTMLSpanElement>e.target).innerHTML)

      // if (newText !== textBeforeEdit) {
      //   this.board.history.create(this.board.layer, [], {
      //     undo: () => this.changeText(textBeforeEdit),
      //     redo: () => this.changeText(newText)
      //   })
      // }

      // update label's text
      // this.node.text(newText)
      // this.node.show()

      this.updateText({
        draggable: false,
        text: newText,
        orgText: newText
      })
      if (this.referShape) {
        this.referShape.setOrgText(newText)
      }

      // select node
      this.board.selection.add(this)

      this.board.events.emit('textSvg:dblclickend', {
        shapes: [this]
      })
    })
  }

  /**
   * Changes the text value of the label
   *
   * @param value The text value
   */
  private changeText(value: string) {
    this.board.events.emit('textSvg:update-text', {
      shapes: [this],
      data: {
        text: value
      }
    })
  }

  /**
   * Focuses on the input to start editing that
   *
   * @param input The [[HTMLSpanElement]]
   */
  private async setInputFocus(input: HTMLSpanElement) {
    await new Promise(resolve => setTimeout(resolve, 50))

    const range = document.createRange()
    range.selectNodeContents(input)
    range.collapse(false)

    const selection = window.getSelection()!
    selection.removeAllRanges()
    selection.addRange(range)
  }

  /**
   * Handles global keyboard events
   *
   * @param e The keyboard event
   */
  private onKeyUp(
    e: Event & {
      key: string
      metaKey: boolean
      ctrlKey: boolean
      shiftKey: boolean
    }
  ) {
    // const isSpecialKey = e.metaKey || e.ctrlKey
    // const isShiftKey = e.shiftKey === true
    // const key = e.key.toLowerCase()
    // @ts-ignore
    const newText = convertHtmlToText((<HTMLSpanElement>e.target).innerHTML)
    this.board.events.emit('textSvg:update-text', {
      shapes: [this],
      data: {
        text: newText
      }
    })
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public getWidth() {
    return this.textPathNode.width()
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public getHeight() {
    return this.textPathNode.height()
  }

  /**
   * return fontSize of TextPath
   * @param attributes
   */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public getFontSize(): number {
    const node = this.textPathNode
    const scale = node.getAbsoluteScale()
    let fontSize = Math.ceil(node.fontSize() * scale.x)
    return fontSize
  }

  /**
   * Set fontSize for TextPath by Scale
   * @param fontSize
   */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public setFontSize(fontSize: number) {
    const node = this.textPathNode
    const scale = node.getAbsoluteScale()
    this.updateText({
      fontSize: Math.ceil(fontSize / scale.x)
    })
  }

  /**
   * Update Attributes for TextPath object
   * @param attributes
   */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public updateText(attributes: Partial<Konva.TextPathConfig>) {
    // this.board.history.create(this.board.layer, this.textPathNode)
    this.textPathNode.setAttrs(attributes)
    this.syncReflectPosition()
    this.updateTransformer()
  }

  /**
   * Update Attributes for Tag object
   * @param attributes
   */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public updateTag(attributes: Partial<Konva.TagConfig>) {
    // this.board.history.create(this.board.layer, this.tagNode)
    this.tagNode.setAttrs(attributes)

    this.updateTransformer()
  }

  private _syncAttrs() {
    let textPath = this.textPathNode
    const sRect = textPath.getSelfRect()
    this.node.width(sRect.width)
    this.node.height(sRect.height)
    let tag = this.tagNode
    if (textPath && tag) {
      const textPathAttrs = textPath.getAttrs()
      tag.setAttrs({
        x: sRect.x,
        y: sRect.y,
        width: sRect.width,
        height: sRect.height
      })
      if (this.referShape && !this.referShape.isVisible) {
        try {
          // Sync Position for Label
          this.referShape.updateText({
            fontFamily: textPathAttrs.fontFamily,
            fontSize: textPathAttrs.fontSize,
            fontStyle: textPathAttrs.fontStyle,
            fill: textPathAttrs.fill,
            letterSpacing: textPathAttrs.letterSpacing,
            orgText: textPathAttrs.orgText
          })
        } catch (e) {
          console.log('Error:', e)
        }
      }
    }
  }

  /**
   * updates transformer after changing text
   */
  private updateTransformer() {
    if (this.board.selection.isVisible) {
      this.board.selection.transformer.forceUpdate()
    }
  }

  /**
   * Sync Position after changing every thing
   * @param e
   * @private
   */
  private sync(e: Konva.KonvaEventObject<MouseEvent>) {
    this._syncAttrs()
    this.updateTransformer()
  }

  /**
   * Sync transform after changing every thing
   * @param e
   * @private
   */
  private transform(e: Konva.KonvaEventObject<MouseEvent>) {
    if (this.referShape && !this.referShape.isVisible) {
      this.referShape.node.setAttrs({
        scaleX: this.node.getAbsoluteScale().x,
        scaleY: this.node.getAbsoluteScale().y
      })
    }
    // Sync position for Reflect
    this.syncReflectPosition('TRANSFORM')
    this.updateTransformer()
  }

  /**
   * Sync fontsize after changing every thing
   * @param e
   * @private
   */
  private transformend(e: Konva.KonvaEventObject<MouseEvent>) {
    if (this.referShape && !this.referShape.isVisible) {
      this.referShape.node.setAttrs({
        scaleX: this.node.getAbsoluteScale().x,
        scaleY: this.node.getAbsoluteScale().y
      })
    }
    this.syncPosition()
    this.updateTransformer()
  }

  private textChange(e: Konva.KonvaEventObject<MouseEvent>) {
    this._syncAttrs()
    this.updateTransformer()
  }

  private dragend(e: Konva.KonvaEventObject<MouseEvent>) {
    this.syncPosition()
    this.updateTransformer()
  }

  /**
   * Sync position after changing every thing
   * @param e
   * @private
   */
  private dragmove(e: Konva.KonvaEventObject<MouseEvent>) {
    this.syncReflectPosition()
    this.updateTransformer()
  }

  private tagFillChange(e: Konva.KonvaEventObject<MouseEvent>) {
    let tag = this.tagNode
    if (tag) {
      if (this.referShape && !this.referShape.isVisible) {
        try {
          // Sync Position for Label
          this.referShape.updateTag({
            fill: tag.getAttr('fill')
          })
        } catch (e) {
          console.log('Error:', e)
        }
      }
      if (this.reflectShape) {
        this.reflection.reload()
      }
    }
  }

  /**
   * Sync position between shapes
   * @public
   */
  public syncPosition() {
    if (this.referShape && !this.referShape.isVisible) {
      const rect = this.node.getClientRect()
      const refRect = this.referShape.node.getClientRect()
      const refAttr = this.referShape.node.attrs

      const center = {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2
      }

      const deltaX = Math.abs(refAttr.x - refRect.x)
      const deltaY = Math.abs(refAttr.y - refRect.y)

      this.referShape.node.setAttrs({
        x: center.x - (refRect.width / 2 - deltaX),
        y: center.y - (refRect.height / 2 - deltaY)
      })
    }
    // this.syncReflectPosition()
  }

  /**
   * Sync position between shapes
   * @public
   */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public syncReflectPosition(type: string = 'MOVE') {
    if (this.reflectShape) {
      const rectClient = this.node.getClientRect()
      const attr = this.tagNode.attrs
      const refRect = this.reflectShape.node.getClientRect()
      const refAttr = this.reflectShape.node.attrs
      // Moving
      const center = {
        x: rectClient.x + rectClient.width / 2,
        y: rectClient.y + rectClient.height / 2
      }

      const deltaX = Math.abs(refAttr.x - refRect.x)
      const deltaY = Math.abs(refAttr.y - refRect.y)
      this.reflectShape.node.setPosition({
        x: center.x - (refRect.width / 2 - deltaX),
        y: center.y - (refRect.height / 2 - deltaY)
      })
      // Transform
      if (type === 'TRANSFORM') {
        // const deltaW = Math.abs(refAttr.width - refRect.width)
        // const deltaH = Math.abs(refAttr.height - refRect.height)

        this.reflectShape.node.setAttrs({
          // width: attr.width * this.node.scaleX(),
          // height: attr.height * this.node.scaleY()
          width: attr.width,
          height: attr.height,
          scaleX: this.node.scaleX(),
          scaleY: this.node.scaleX(),
          rotation: this.node.rotation()
        })
      }
    }
  }

  /**
   * Set Label for sync data when TextSvg change anything
   * @param referShape
   */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public setReferLabel(referShape: LabelModel) {
    this.referShape = referShape
  }

  /**
   * Return Label model object
   */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public getReferLabel() {
    return this.referShape
  }

  /**
   * Set Label for sync data when TextSvg change anything
   * @param referShape
   */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public setReferShape(referShape: LabelModel) {
    this.referShape = referShape
  }

  /**
   * Return Label model object
   */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public getReferShape() {
    return this.referShape
  }

  /**
   * Set Label for sync data when ShapeModel change anything
   * @param reflectShape
   */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public setReflectShape(reflectShape: ImageModel) {
    this.reflectShape = reflectShape
    this.reflectShape.deselect()
    this.reflection.setImageToReflect(reflectShape)
    this.initReflectShape()
  }

  /**
   * Return ShapeModel object
   */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public getReflectShape() {
    return this.reflection
  }

  private initReflectShape() {
    if (this.reflectShape) {
      const zIndex = this.node.getZIndex()
      this.reflectShape.node.setZIndex(zIndex)
      this.node.setZIndex(zIndex + 1)
      this.reflectShape.node.setDraggable(false)
      this.reflectShape.deselect()
    }
  }
}
