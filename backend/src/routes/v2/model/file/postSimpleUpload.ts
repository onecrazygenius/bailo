import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/v2/audit/Base.js'
import audit from '../../../../connectors/v2/audit/index.js'
import { FileInterface } from '../../../../models/v2/File.js'
import { uploadFile } from '../../../../services/v2/file.js'
import { fileInterfaceSchema, registerPath } from '../../../../services/v2/specification.js'
import { parse } from '../../../../utils/validate.js'

export const postSimpleUploadSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
  query: z.object({
    name: z.string(),
    mime: z.string().optional().default('application/octet-stream'),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/model/{modelId}/files/upload/simple',
  tags: ['file'],
  description: 'Upload a new file to a model.',
  schema: postSimpleUploadSchema,
  responses: {
    200: {
      description: 'The newly created file instance.',
      content: {
        'application/json': {
          schema: z.object({
            file: fileInterfaceSchema,
          }),
        },
      },
    },
  },
})

interface PostSimpleUpload {
  file: FileInterface
}

export const postSimpleUpload = [
  async (req: Request, res: Response<PostSimpleUpload>) => {
    req.audit = AuditInfo.CreateFile
    // Does user have permission to upload a file?
    const {
      params: { modelId },
      query: { name, mime },
    } = parse(req, postSimpleUploadSchema)

    // The `putObjectStream` function takes in a `StreamingBlobPayloadInputTypes`.  This type
    // includes the 'ReadableStream' interface for handling streaming payloads, but a request
    // is not by default assignable to this type.
    //
    // In practice, it is fine, as the only reason this assignment is not possible is due
    // to a missing `.locked` parameter which is not a required field for our uploads.
    const file = await uploadFile(req.user, modelId, name, mime, req as unknown as ReadableStream)
    await audit.onCreateFile(req, file)

    return res.json({
      file,
    })
  },
]
