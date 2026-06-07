import { app, injectWebSocket } from "./src/app.js"
import { serve } from "@hono/node-server"

const server = serve(app, (info) => {
  console.log(`Server listening at http://localhost:${info.port}`)
})

injectWebSocket(server)