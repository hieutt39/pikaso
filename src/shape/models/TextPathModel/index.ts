import Konva from 'konva'

import { rotateAroundCenter } from '../../../utils/rotate-around-center'
import { ShapeModel } from '../../ShapeModel'

export class TextPathModel extends ShapeModel<Konva.TextPath, Konva.TextPathConfig> {
  /**
   * @inheritdoc
   */
  public get type(): string {
    return 'textPath'
  }

  /**
   * @inheritdoc
   * @override
   */
  public rotate(theta: number) {
    rotateAroundCenter(this.node, theta)

    this.board.events.emit('shape:rotate', {
      shapes: [this]
    })
  }
}
