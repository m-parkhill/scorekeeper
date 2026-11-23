// `next start` fails when its port is taken (unlike `next dev`, which moves on).
// Find the first free port from $PORT (default 3000) and start there.
import { spawn } from 'node:child_process'
import net from 'node:net'

const isFree = (port) =>
  new Promise((resolve) => {
    const srv = net.createServer()
    srv.once('error', () => resolve(false))
    srv.once('listening', () => srv.close(() => resolve(true)))
    srv.listen(port)
  })

const base = Number(process.env.PORT) || 3000
let port = base
while (!(await isFree(port))) port++
if (port !== base) console.warn(`⚠ Port ${base} is in use, using available port ${port} instead.`)

const child = spawn('next', ['start', '-p', String(port), ...process.argv.slice(2)], { stdio: 'inherit', shell: true })
child.on('exit', (code) => process.exit(code ?? 0))
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig))
