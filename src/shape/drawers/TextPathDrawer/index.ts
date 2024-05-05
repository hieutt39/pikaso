import Konva from 'konva'

import { Board } from '../../../Board'

import { ShapeDrawer } from '../../ShapeDrawer'

import { DrawType } from '../../../types'
import { TextPathModel } from '../../models/TextPathModel'

export class TextPathDrawer extends ShapeDrawer<Konva.TextPath, Konva.TextPathConfig> {
  /**
   * Demonstrates the text shape that is being created
   */
  public node: Konva.TextPath

  /**
   * Creates a new text builder component
   *
   * @param board The [[Board]]
   */
  constructor(board: Board) {
    super(board, DrawType.TextPath)
  }

  /**
   * @inheritdoc
   * @override
   */
  public insert(config: Konva.TextPathConfig): TextPathModel {
    return super.insert(config)
  }

  /**
   * @inheritdoc
   * @override
   */
  public draw(config: Partial<Konva.TextPathConfig> = {}) {
    super.draw(config)
  }

  /**
   * @inheritdoc
   * @override
   */
  protected createShape(config: Konva.TextPathConfig): TextPathModel {
    this.node = new Konva.TextPath(config)

    return new TextPathModel(this.board, this.node)
  }

  /**
   * Starts drawing a text shape
   */
  protected onStartDrawing() {
    super.onStartDrawing()

    if (!this.isDrawing) {
      return
    }

    this.createShape({
      x: this.startPoint.x,
      y: this.startPoint.y,
      ...this.config
    })
  }

  /**
   * Continues drawing the text by changing its radius
   */
  protected onDrawing(e: Konva.KonvaEventObject<MouseEvent>) {
    super.onDrawing(e)
  }
}
