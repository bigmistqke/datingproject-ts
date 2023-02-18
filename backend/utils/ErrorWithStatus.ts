export default function ErrorWithStatus(message: string, status = 500) {
  const error = new Error(message) as NodeJS.ErrnoException
  error.code = status.toString()
  return error
}

ErrorWithStatus.prototype = Object.create(Error.prototype)
