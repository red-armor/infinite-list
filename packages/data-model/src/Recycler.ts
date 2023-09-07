import FixedBuffer from "./FixedBuffer"
import { RecyclerProps } from './types'

class Recycler {
  private _queue: Array<FixedBuffer> = []
  /**
   * buffer size, the oversize node will run into recycle strategy
   */
  private _size = 10;
  /**
   * start index
   */
  private _thresholdIndexValue = 0;

  constructor(props: RecyclerProps) {
    const { recyclerTypes = [] } = props
    recyclerTypes.forEach(type => this.addBuffer(type))
  }

  addBuffer(type: string) {
    const index = this._queue.findIndex(buffer => buffer.recyclerType === type)
    if (index !== -1) return false
    const buffer = new FixedBuffer({
      size: this._size,
      thresholdIndexValue: this._thresholdIndexValue,
      recyclerType: type,
    })
    this._queue.push(buffer)
    return true
  }
}

export default Recycler