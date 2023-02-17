// exported this to an npm-module called `qquuee`

type Task<T> = {
  func: () => T
  resolve: (result: T) => void
}

export default class Q {
  queue: Task<any>[] = []
  inProcess = false

  private process = async () => {
    this.inProcess = true

    try {
      let result = await this.queue[0].func()
      this.queue[0].resolve(result)
    } catch (err) {
      console.error('ERROR in Q.process : ', err)
    }

    this.queue.splice(0, 1)

    if (this.queue.length != 0) this.process()
    else this.inProcess = false
  }

  add = async <T extends any>(func: () => T) =>
    new Promise<T>(resolve => {
      if (!func) {
        console.error('func is undefined')
      } else {
        const task: Task<T> = { func, resolve }
        this.queue.push(task)
        if (!this.inProcess) this.process()
      }
    })
}
