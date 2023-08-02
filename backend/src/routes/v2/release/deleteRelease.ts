import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { parse } from '../../../middleware/validate.js'

export const deleteReleaseSchema = z.object({
  params: z.object({
    modelId: z.string(),
    semver: z.string(),
  }),
})

interface DeleteReleaseResponse {
  data: {
    message: string
  }
}

export const deleteRelease = [
  bodyParser.json(),
  async (req: Request, res: Response<DeleteReleaseResponse>) => {
    const _ = parse(req, deleteReleaseSchema)

    return res.json({
      data: {
        message: 'Successfully removed release.',
      },
    })
  },
]